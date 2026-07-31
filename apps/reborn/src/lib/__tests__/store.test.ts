import { describe, expect, it } from 'vitest'
import { initialState, reducer, type Action } from '../../state/store'
import { addDays, todayKey } from '../date'
import { buildDailyTasks, currentSlot } from '../tasks'
import { eggFor } from '../eggs'
import { careMessage, coachReply } from '../coach'
import type { AppState } from '../../types'

const NOW = new Date(2026, 4, 12, 21, 0)

function run(state: AppState, actions: Action[], now = NOW): AppState {
  return actions.reduce((s, a) => reducer(s, a, now), state)
}

const ANSWERS = { freq: 5, duration: 5, control: 8, energy: 7, sleep: 7, anxiety: 6, 'trigger-night': 9, 'const-yang': 9 }

describe('onboard', () => {
  it('按"已坚持天数"回填起始日', () => {
    const s = run(initialState(NOW), [{ type: 'onboard', name: 'Alex', answers: ANSWERS, startedDaysAgo: 12 }])
    expect(s.onboarded).toBe(true)
    expect(s.name).toBe('Alex')
    expect(s.streakStart).toBe(addDays(todayKey(NOW), -12))
    expect(s.assessment?.constitution).toBe('yang')
  })

  it('空昵称回退默认值', () => {
    const s = run(initialState(NOW), [{ type: 'onboard', name: '   ', answers: ANSWERS, startedDaysAgo: 0 }])
    expect(s.name).toBe('朋友')
  })
})

describe('打卡', () => {
  const base = run(initialState(NOW), [{ type: 'onboard', name: 'Alex', answers: ANSWERS, startedDaysAgo: 3 }])

  it('首次打卡发放金币并标记当日', () => {
    const s = run(base, [{ type: 'checkin', perfect: false, taskIds: [] }])
    expect(s.logs[todayKey(NOW)].checkedIn).toBe(true)
    expect(s.coins).toBe(15) // 10 + 连续 1 天加成 5
  })

  it('重复打卡不重复发奖', () => {
    const once = run(base, [{ type: 'checkin', perfect: false, taskIds: [] }])
    const twice = run(once, [{ type: 'checkin', perfect: false, taskIds: [] }])
    expect(twice.coins).toBe(once.coins)
  })

  it('完美日额外发放宝箱', () => {
    const s = run(base, [{ type: 'checkin', perfect: true, taskIds: [] }])
    expect(s.boxes).toBe(1)
  })
})

describe('任务与喝水', () => {
  it('喝水累加到目标后自动完成任务', () => {
    let s = initialState(NOW)
    for (let i = 0; i < 8; i += 1) s = reducer(s, { type: 'add-water', goal: 8 }, NOW)
    expect(s.logs[todayKey(NOW)].water).toBe(8)
    expect(s.logs[todayKey(NOW)].tasks.water).toBe(true)
  })

  it('不超过目标上限', () => {
    let s = initialState(NOW)
    for (let i = 0; i < 20; i += 1) s = reducer(s, { type: 'add-water', goal: 8 }, NOW)
    expect(s.logs[todayKey(NOW)].water).toBe(8)
  })

  it('任务可反复切换', () => {
    const s = run(initialState(NOW), [
      { type: 'toggle-task', taskId: 'meal' },
      { type: 'toggle-task', taskId: 'meal' },
    ])
    expect(s.logs[todayKey(NOW)].tasks.meal).toBe(false)
  })
})

describe('复发处理', () => {
  it('重置计时、保留最长记录、不扣金币', () => {
    const base = run(initialState(NOW), [{ type: 'onboard', name: 'A', answers: ANSWERS, startedDaysAgo: 30 }])
    const withCoins = { ...base, coins: 200 }
    const s = run(withCoins, [{ type: 'relapse', record: { trigger: 'night-boredom', feeling: '累', regret: 7 } }])
    expect(s.streakStart).toBe(todayKey(NOW))
    expect(s.longestStreak).toBe(30)
    expect(s.coins).toBe(200)
    expect(s.relapses).toHaveLength(1)
  })
})

describe('冲动记录', () => {
  it('成功度过冲动给 15 金币', () => {
    const s = run(initialState(NOW), [{ type: 'log-urge', event: { intensity: 8, resolution: 'grounding' } }])
    expect(s.coins).toBe(15)
    expect(s.urgeEvents).toHaveLength(1)
  })

  it('以复发结束不发奖励', () => {
    const s = run(initialState(NOW), [{ type: 'log-urge', event: { intensity: 10, resolution: 'relapse' } }])
    expect(s.coins).toBe(0)
  })
})

describe('里程碑领取', () => {
  it('达成才可领取，且只能领一次', () => {
    const base = run(initialState(NOW), [{ type: 'onboard', name: 'A', answers: ANSWERS, startedDaysAgo: 7 }])
    const once = run(base, [{ type: 'claim-milestone', id: 'ms-7' }])
    expect(once.coins).toBe(50)
    expect(once.unlocked).toContain('course-baduanjin')
    const twice = run(once, [{ type: 'claim-milestone', id: 'ms-7' }])
    expect(twice.coins).toBe(50)
  })

  it('未达成的里程碑领不到', () => {
    const base = run(initialState(NOW), [{ type: 'onboard', name: 'A', answers: ANSWERS, startedDaysAgo: 2 }])
    expect(run(base, [{ type: 'claim-milestone', id: 'ms-30' }]).coins).toBe(0)
  })
})

describe('商城', () => {
  it('金币不足买不了', () => {
    const s = run(initialState(NOW), [{ type: 'buy', itemId: 'skin-wuxia' }])
    expect(s.unlocked).not.toContain('skin-wuxia')
  })

  it('买皮肤后自动穿上', () => {
    const rich = { ...initialState(NOW), coins: 500 }
    const s = run(rich, [{ type: 'buy', itemId: 'skin-wuxia' }])
    expect(s.coins).toBe(200)
    expect(s.companion.activeSkin).toBe('skin-wuxia')
  })

  it('免费宝箱消耗 boxes 而非金币', () => {
    const withBox = { ...initialState(NOW), boxes: 1, coins: 0 }
    const s = run(withBox, [{ type: 'open-box', roll: 0, free: true }])
    expect(s.boxes).toBe(0)
    expect(s.coins).toBe(100) // 奖池第一项：100 金币
  })

  it('没有宝箱时免费开箱无效', () => {
    const s = run(initialState(NOW), [{ type: 'open-box', roll: 0, free: true }])
    expect(s.coins).toBe(0)
  })

  it('未拥有的皮肤不能设为当前形态', () => {
    const s = run(initialState(NOW), [{ type: 'set-skin', skin: 'skin-scifi' }])
    expect(s.companion.activeSkin).toBe('default')
  })
})

describe('伙伴互动', () => {
  it('同一种互动每天只算一次', () => {
    const once = run(initialState(NOW), [{ type: 'companion-interact', kind: 'feed' }])
    const twice = run(once, [{ type: 'companion-interact', kind: 'feed' }])
    expect(twice.companion.hunger).toBe(once.companion.hunger)
    expect(twice.companion.interactionsToday).toEqual(['feed'])
  })

  it('属性值被夹在 0-100', () => {
    const s = run({ ...initialState(NOW), companion: { ...initialState(NOW).companion, hunger: 95 } }, [
      { type: 'companion-interact', kind: 'feed' },
    ])
    expect(s.companion.hunger).toBe(100)
  })
})

describe('每日任务生成', () => {
  it('等级越高任务越多', () => {
    const low = buildDailyTasks({ assessment: null, level: 1, unlocked: [] })
    const high = buildDailyTasks({ assessment: null, level: 6, unlocked: [] })
    expect(high.length).toBeGreaterThan(low.length)
  })

  it('任务 id 唯一', () => {
    const tasks = buildDailyTasks({ assessment: null, level: 6, unlocked: ['course-baduanjin', 'course-zhanzhuang'] })
    expect(new Set(tasks.map((t) => t.id)).size).toBe(tasks.length)
  })

  it('未解锁的课程不会出现在任务里', () => {
    const tasks = buildDailyTasks({ assessment: null, level: 6, unlocked: [] })
    expect(tasks.some((t) => t.id === 'ex-course-baduanjin')).toBe(false)
  })

  it('时段划分覆盖三个时间槽', () => {
    expect(currentSlot(new Date(2026, 0, 1, 7))).toBe('morning')
    expect(currentSlot(new Date(2026, 0, 1, 14))).toBe('day')
    expect(currentSlot(new Date(2026, 0, 1, 22))).toBe('evening')
  })
})

describe('彩蛋', () => {
  it('复发后优先展示重启彩蛋', () => {
    expect(eggFor({ hour: 23, afterRelapse: true, perfectStreak: 9, isBirthday: true, firstInvite: true })?.id).toBe('egg-restart')
  })

  it('深夜与凌晨 5 点各有专属彩蛋', () => {
    expect(eggFor({ hour: 5, afterRelapse: false, perfectStreak: 0, isBirthday: false, firstInvite: false })?.id).toBe('egg-sunrise')
    expect(eggFor({ hour: 0, afterRelapse: false, perfectStreak: 0, isBirthday: false, firstInvite: false })?.id).toBe('egg-latenight')
  })

  it('白天且无特殊条件时不弹彩蛋', () => {
    expect(eggFor({ hour: 14, afterRelapse: false, perfectStreak: 2, isBirthday: false, firstInvite: false })).toBeNull()
  })
})

describe('AI 教练', () => {
  const ctx = { days: 12, anxiety: 6, assessment: null }

  it('冲动、复发、焦虑各走不同规则', () => {
    expect(coachReply('我现在有冲动', ctx)).toContain('15 分钟')
    expect(coachReply('昨晚破戒了', ctx)).toContain('跌倒不等于回到起点')
    expect(coachReply('我很焦虑睡不着', ctx)).toContain('5-4-3-2-1')
  })

  it('无匹配时给开放式回应而不是空串', () => {
    expect(coachReply('随便说点什么', ctx).length).toBeGreaterThan(0)
  })

  it('危机关怀满 3 天才触发', () => {
    expect(careMessage(2, 'Alex')).toBeNull()
    expect(careMessage(3, 'Alex')).toContain('Alex')
  })
})

describe('reset', () => {
  it('清空后回到初始态', () => {
    const dirty = run(initialState(NOW), [
      { type: 'onboard', name: 'A', answers: ANSWERS, startedDaysAgo: 9 },
      { type: 'checkin', perfect: true, taskIds: [] },
    ])
    const clean = reducer(dirty, { type: 'reset' }, NOW)
    expect(clean.onboarded).toBe(false)
    expect(clean.coins).toBe(0)
    expect(clean.logs).toEqual({})
  })
})
