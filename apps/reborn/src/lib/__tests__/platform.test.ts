import { describe, expect, it } from 'vitest'
import { backupFilename, buildBackup, parseBackup, summarize } from '../backup'
import { buildNotifications, nextFireText, unreadCount } from '../notifications'
import { HOT_QUERIES, INDEX, search } from '../search'
import { posterData } from '../poster'
import { generateCode, isValidCode, shareCard } from '../buddy'
import { initialState, migrate, reducer, type Action } from '../../state/store'
import { addDays, todayKey } from '../date'
import { COURSES } from '../../data/courses'
import { FAQ } from '../../data/help'
import { CRISIS_LINES } from '../../data/legal'
import { FEATURE_MATRIX, PLANS, TIER_LABELS, isPro } from '../../data/membership'
import { BREATH_PATTERNS } from '../../data/breathing'
import type { AppState } from '../../types'

const NOW = new Date(2026, 4, 12, 21, 0)

function onboarded(daysAgo = 12): AppState {
  return reducer(initialState(NOW), { type: 'onboard', name: 'Alex', answers: { freq: 5, 'trigger-night': 9 }, startedDaysAgo: daysAgo }, NOW)
}

function run(state: AppState, actions: Action[], now = NOW): AppState {
  return actions.reduce((s, a) => reducer(s, a, now), state)
}

describe('存档迁移', () => {
  it('v1 存档保留天数与打卡，补齐新字段', () => {
    const v1 = {
      version: 1,
      onboarded: true,
      name: 'Old',
      streakStart: '2026-01-01',
      longestStreak: 40,
      logs: { '2026-01-02': { date: '2026-01-02', tasks: {}, water: 3, checkedIn: true } },
      coins: 250,
      settings: { delayLockUntil: null, grayscaleTip: false, secularMode: true },
    }
    const s = migrate(v1, NOW)
    expect(s.version).toBe(2)
    expect(s.name).toBe('Old')
    expect(s.streakStart).toBe('2026-01-01')
    expect(s.longestStreak).toBe(40)
    expect(s.coins).toBe(250)
    expect(s.logs['2026-01-02'].water).toBe(3)
    // 新字段有默认值而不是 undefined
    expect(s.settings.theme).toBe('dark')
    expect(s.settings.reminders.morningTime).toBe('07:00')
    expect(s.awards).toEqual([])
    expect(s.membership).toBe('free')
  })

  it('v1 的 secularMode=false 映射为非世俗模式', () => {
    expect(migrate({ streakStart: '2026-01-01', settings: { secularMode: false } }, NOW).settings.beliefMode).toBe('buddhist')
    expect(migrate({ streakStart: '2026-01-01', settings: { secularMode: true } }, NOW).settings.beliefMode).toBe('secular')
  })

  it('垃圾输入回退到初始状态而不是崩溃', () => {
    expect(migrate(null, NOW).onboarded).toBe(false)
    expect(migrate('nonsense', NOW).onboarded).toBe(false)
    expect(migrate(42, NOW).version).toBe(2)
  })
})

describe('备份导出与导入', () => {
  it('导出包带上应用标识与版本', () => {
    const b = buildBackup(onboarded(), NOW)
    expect(b.app).toBe('reborn')
    expect(b.stateVersion).toBe(2)
    expect(b.exportedAt).toContain('2026')
  })

  it('文件名含日期与最长记录', () => {
    expect(backupFilename({ ...onboarded(), longestStreak: 66 }, NOW)).toBe('reborn-backup-2026-05-12-day66.json')
  })

  it('完整备份包可以往返', () => {
    const state = run(onboarded(), [{ type: 'checkin', perfect: false, taskIds: [] }])
    const text = JSON.stringify(buildBackup(state, NOW))
    const parsed = parseBackup(text)
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.state.coins).toBe(state.coins)
  })

  it('也接受裸 state 对象', () => {
    expect(parseBackup(JSON.stringify(onboarded())).ok).toBe(true)
  })

  it('拒绝坏数据并说明原因', () => {
    expect(parseBackup('not json')).toEqual({ ok: false, error: '不是有效的 JSON 文件' })
    expect(parseBackup('123')).toMatchObject({ ok: false })
    expect(parseBackup(JSON.stringify({ foo: 1 }))).toMatchObject({ ok: false })
    expect(parseBackup(JSON.stringify({ streakStart: '不是日期' }))).toMatchObject({ ok: false })
    expect(parseBackup(JSON.stringify({ streakStart: '2026-01-01', logs: [] }))).toMatchObject({ ok: false })
    expect(parseBackup(JSON.stringify({ streakStart: '2026-01-01', coins: 'x' }))).toMatchObject({ ok: false })
  })

  it('导入摘要覆盖用户最关心的字段', () => {
    const keys = summarize(onboarded()).map((r) => r.k)
    expect(keys).toContain('起始日')
    expect(keys).toContain('最长记录')
    expect(keys).toContain('打卡天数')
  })

  it('导入走迁移，缺字段的旧备份也能用', () => {
    const s = run(initialState(NOW), [{ type: 'import', state: { streakStart: '2026-03-01', coins: 12 } as unknown as AppState }])
    expect(s.version).toBe(2)
    expect(s.coins).toBe(12)
    expect(s.settings.reminders.risk).toBe(true)
  })
})

describe('通知中心', () => {
  it('里程碑待领时排在最前', () => {
    const list = buildNotifications(onboarded(12), NOW)
    expect(list[0].kind).toBe('milestone')
  })

  it('领取后该条通知消失（不是过期残留）', () => {
    const claimed = run(onboarded(12), [
      { type: 'claim-milestone', id: 'ms-1' },
      { type: 'claim-milestone', id: 'ms-7' },
    ])
    expect(buildNotifications(claimed, NOW).some((n) => n.kind === 'milestone')).toBe(false)
  })

  it('关闭风险提醒后不再生成该通知', () => {
    const off = run(onboarded(), [{ type: 'update-reminders', patch: { risk: false } }])
    expect(buildNotifications(off, NOW).some((n) => n.kind === 'risk')).toBe(false)
  })

  it('未读数随已读标记递减', () => {
    const state = onboarded(12)
    const before = unreadCount(state, NOW)
    expect(before).toBeGreaterThan(0)
    const ids = buildNotifications(state, NOW).map((n) => n.id)
    const after = run(state, [{ type: 'read-notifications', ids }])
    expect(unreadCount(after, NOW)).toBe(0)
  })

  it('提醒时间换算成"多久之后"', () => {
    expect(nextFireText('22:00', new Date(2026, 0, 1, 21, 30))).toBe('30 分钟后')
    expect(nextFireText('07:00', new Date(2026, 0, 1, 21, 0))).toBe('10 小时 0 分钟后')
    expect(nextFireText('乱写', NOW)).toBe('时间格式无效')
  })
})

describe('全局搜索', () => {
  it('索引覆盖全部内容类型', () => {
    const kinds = new Set(INDEX.map((i) => i.kind))
    expect(kinds).toContain('科普')
    expect(kinds).toContain('功法')
    expect(kinds).toContain('课程')
    expect(kinds).toContain('帮助')
    expect(INDEX.length).toBeGreaterThan(50)
  })

  it('中文子串可命中，标题命中排前面', () => {
    const results = search('多巴胺')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].title).toContain('多巴胺')
  })

  it('多关键词是 AND 关系', () => {
    expect(search('八段锦 呼吸').every((r) => r.title.length > 0)).toBe(true)
    expect(search('八段锦 完全不存在的词')).toHaveLength(0)
  })

  it('空查询返回空而不是全部', () => {
    expect(search('')).toHaveLength(0)
    expect(search('   ')).toHaveLength(0)
  })

  it('热门词都能搜到结果', () => {
    HOT_QUERIES.forEach((q) => expect(search(q).length, `热门词「${q}」搜不到结果`).toBeGreaterThan(0))
  })

  it('结果的跳转目标都是有效页面名', () => {
    const valid = new Set(['learn', 'energy', 'breathing', 'courses', 'panic', 'help'])
    INDEX.forEach((i) => expect(valid.has(i.target), `未知目标 ${i.target}`).toBe(true))
  })
})

describe('成就海报', () => {
  it('统计数字与状态一致', () => {
    const state = run(onboarded(30), [
      { type: 'checkin', perfect: false, taskIds: [] },
      { type: 'log-practice', exerciseId: 'course-baduanjin', minutes: 12 },
      { type: 'log-urge', event: { intensity: 7, resolution: 'grounding' } },
    ])
    const p = posterData(state, NOW)
    expect(p.days).toBe(30)
    expect(p.title).toContain('Alex')
    expect(p.stats.find((s) => s.label === '功法时长')?.value).toBe('12 分钟')
    expect(p.stats.find((s) => s.label === '度过冲动')?.value).toBe('1 次')
  })

  it('金句按天数轮换但始终有值', () => {
    for (let d = 0; d < 12; d += 1) {
      const s = { ...initialState(NOW), streakStart: addDays(todayKey(NOW), -d) }
      expect(posterData(s, NOW).quote.length).toBeGreaterThan(0)
    }
  })
})

describe('问责伙伴', () => {
  it('邀请码 6 位且不含易混淆字符', () => {
    const code = generateCode([0, 0.1, 0.3, 0.5, 0.7, 0.99])
    expect(code).toHaveLength(6)
    expect(code).not.toMatch(/[IO01]/)
    expect(isValidCode(code)).toBe(true)
  })

  it('校验拒绝错误格式', () => {
    expect(isValidCode('ABC')).toBe(false)
    expect(isValidCode('ABCDEFG')).toBe(false)
    expect(isValidCode('ABCDE0')).toBe(false)
  })

  it('共享卡不含复发与日记内容', () => {
    const state = run(onboarded(20), [{ type: 'relapse', record: { trigger: 'night-boredom', feeling: '很累', regret: 8 } }])
    const card = shareCard(state, NOW)
    expect(Object.keys(card)).toEqual(['name', 'days', 'checkedInToday', 'riskWindow'])
    expect(JSON.stringify(card)).not.toContain('很累')
  })
})

describe('奖励幂等', () => {
  it('同一 key 只发放一次', () => {
    const once = run(initialState(NOW), [{ type: 'award', key: 'poster:2026-05-12', coins: 50 }])
    const twice = run(once, [{ type: 'award', key: 'poster:2026-05-12', coins: 50 }])
    expect(once.coins).toBe(50)
    expect(twice.coins).toBe(50)
  })

  it('不同 key 各自发放', () => {
    const s = run(initialState(NOW), [
      { type: 'award', key: 'a', coins: 20 },
      { type: 'award', key: 'b', coins: 30 },
    ])
    expect(s.coins).toBe(50)
  })
})

describe('设置与练习记录', () => {
  it('设置补丁只改动指定字段', () => {
    const s = run(initialState(NOW), [{ type: 'update-settings', patch: { theme: 'light' } }])
    expect(s.settings.theme).toBe('light')
    expect(s.settings.beliefMode).toBe('secular')
    expect(s.settings.reminders.morning).toBe(true)
  })

  it('提醒补丁不覆盖其他提醒项', () => {
    const s = run(initialState(NOW), [{ type: 'update-reminders', patch: { morning: false } }])
    expect(s.settings.reminders.morning).toBe(false)
    expect(s.settings.reminders.eveningTime).toBe('22:00')
  })

  it('练习记录累加并同时勾上当日任务', () => {
    const s = run(initialState(NOW), [
      { type: 'log-practice', exerciseId: 'course-baduanjin', minutes: 12 },
      { type: 'log-practice', exerciseId: 'course-baduanjin', minutes: 12 },
    ])
    expect(s.practiceMinutes['course-baduanjin']).toBe(24)
    expect(s.logs[todayKey(NOW)].tasks['ex-course-baduanjin']).toBe(true)
  })
})

describe('内容数据完整性', () => {
  it('课程节次 id 在课程内唯一', () => {
    COURSES.forEach((c) => expect(new Set(c.lessons.map((l) => l.id)).size).toBe(c.lessons.length))
  })

  it('课程解锁天数递增，入门课立即可用', () => {
    expect(COURSES[0].unlockDay).toBe(0)
    COURSES.slice(1).forEach((c, i) => expect(c.unlockDay).toBeGreaterThanOrEqual(COURSES[i].unlockDay))
  })

  it('FAQ 覆盖全部分类且无空答案', () => {
    const categories = new Set(FAQ.map((f) => f.category))
    expect(categories.size).toBe(5)
    FAQ.forEach((f) => expect(f.a.length).toBeGreaterThan(10))
  })

  it('危机资源含中国大陆、美国与国际渠道', () => {
    const regions = new Set(CRISIS_LINES.map((l) => l.region))
    expect(regions).toContain('中国大陆')
    expect(regions).toContain('美国')
    expect(regions).toContain('国际')
  })

  it('套餐 id 与展示标签一一对应', () => {
    PLANS.forEach((p) => expect(TIER_LABELS[p.id]).toBeTruthy())
    expect(isPro('free')).toBe(false)
    expect(isPro('lifetime')).toBe(true)
  })

  it('权益对比表每行都填了两栏', () => {
    FEATURE_MATRIX.forEach((r) => {
      expect(r.free.length).toBeGreaterThan(0)
      expect(r.pro.length).toBeGreaterThan(0)
    })
  })

  it('呼吸法的阶段时长与轮数为正数', () => {
    BREATH_PATTERNS.forEach((p) => {
      expect(p.rounds).toBeGreaterThan(0)
      p.phases.forEach((ph) => {
        expect(ph.seconds).toBeGreaterThan(0)
        expect(ph.scale).toBeGreaterThan(0)
      })
    })
  })
})
