import { describe, expect, it } from 'vitest'
import { COMPANION_STAGES, MILESTONES } from '../../data/milestones'
import { addDays, daysBetween, recentKeys, toKey, todayKey } from '../date'
import {
  checkinStreak,
  companionStage,
  daysSinceLastCheckin,
  isPerfectDay,
  levelOf,
  nextMilestone,
  pendingMilestones,
  perfectDayStreak,
  restartStreak,
  stageProgress,
  streakDays,
} from '../progress'
import { initialState } from '../../state/store'
import type { DayLog } from '../../types'

const NOW = new Date(2026, 5, 20)

function log(date: string, patch: Partial<DayLog> = {}): DayLog {
  return { date, tasks: {}, water: 0, checkedIn: true, ...patch }
}

describe('date 工具', () => {
  it('跨月加减正确', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('daysBetween 与 addDays 互逆', () => {
    expect(daysBetween('2026-01-01', addDays('2026-01-01', 45))).toBe(45)
  })

  it('recentKeys 由旧到新且以今天结尾', () => {
    const keys = recentKeys(7, NOW)
    expect(keys).toHaveLength(7)
    expect(keys.at(-1)).toBe(toKey(NOW))
    expect(keys[0]).toBe(addDays(toKey(NOW), -6))
  })
})

describe('streakDays', () => {
  it('起始日当天为 Day 0', () => {
    expect(streakDays(todayKey(NOW), NOW)).toBe(0)
  })

  it('往前推 N 天即 Day N', () => {
    expect(streakDays(addDays(todayKey(NOW), -12), NOW)).toBe(12)
  })

  it('未来日期不返回负数', () => {
    expect(streakDays(addDays(todayKey(NOW), 3), NOW)).toBe(0)
  })
})

describe('levelOf', () => {
  it('每 15 天一级，上限 6', () => {
    expect(levelOf(0)).toBe(1)
    expect(levelOf(15)).toBe(2)
    expect(levelOf(44)).toBe(3)
    expect(levelOf(900)).toBe(6)
  })
})

describe('companionStage', () => {
  it('按天数落到正确阶段', () => {
    expect(companionStage(0).id).toBe('egg')
    expect(companionStage(7).id).toBe('hatchling')
    expect(companionStage(8).id).toBe('juvenile')
    expect(companionStage(91).id).toBe('mature')
    expect(companionStage(4000).id).toBe('divine')
  })

  it('阶段区间连续无空洞', () => {
    for (let d = 0; d < 400; d += 1) expect(companionStage(d)).toBeDefined()
    COMPANION_STAGES.slice(1).forEach((s, i) => expect(s.from).toBe(COMPANION_STAGES[i].to + 1))
  })

  it('进度在 0-1 之间且神兽期封顶', () => {
    expect(stageProgress(0)).toBeGreaterThanOrEqual(0)
    expect(stageProgress(50)).toBeLessThan(1)
    expect(stageProgress(999)).toBe(1)
  })
})

describe('里程碑', () => {
  it('已达成且未领取的才算待领', () => {
    expect(pendingMilestones(7, []).map((m) => m.id)).toEqual(['ms-1', 'ms-7'])
    expect(pendingMilestones(7, ['ms-1'])).toHaveLength(1)
    expect(pendingMilestones(0, [])).toHaveLength(0)
  })

  it('nextMilestone 严格大于当前天数', () => {
    expect(nextMilestone(7)?.day).toBe(14)
    expect(nextMilestone(365)).toBeNull()
  })

  it('里程碑按天数升序定义', () => {
    MILESTONES.slice(1).forEach((m, i) => expect(m.day).toBeGreaterThan(MILESTONES[i].day))
  })
})

describe('checkinStreak', () => {
  const today = todayKey(NOW)

  it('今天打卡后连续计数含今天', () => {
    const logs = { [today]: log(today), [addDays(today, -1)]: log(addDays(today, -1)) }
    expect(checkinStreak(logs, NOW)).toBe(2)
  })

  it('今天还没打卡时从昨天往前数', () => {
    const logs = {
      [today]: log(today, { checkedIn: false }),
      [addDays(today, -1)]: log(addDays(today, -1)),
      [addDays(today, -2)]: log(addDays(today, -2)),
    }
    expect(checkinStreak(logs, NOW)).toBe(2)
  })

  it('中间断一天即归零', () => {
    const logs = { [addDays(today, -2)]: log(addDays(today, -2)) }
    expect(checkinStreak(logs, NOW)).toBe(0)
  })

  it('无记录返回 0', () => {
    expect(checkinStreak({}, NOW)).toBe(0)
  })
})

describe('daysSinceLastCheckin', () => {
  const today = todayKey(NOW)

  it('从未打卡返回 null，而不是把新用户当成失联', () => {
    expect(daysSinceLastCheckin({}, NOW)).toBeNull()
    expect(daysSinceLastCheckin({ [today]: log(today, { checkedIn: false }) }, NOW)).toBeNull()
  })

  it('今天打过卡返回 0', () => {
    expect(daysSinceLastCheckin({ [today]: log(today) }, NOW)).toBe(0)
  })

  it('取最近一次打卡计算间隔', () => {
    const logs = { [addDays(today, -9)]: log(addDays(today, -9)), [addDays(today, -4)]: log(addDays(today, -4)) }
    expect(daysSinceLastCheckin(logs, NOW)).toBe(4)
  })
})

describe('完美日', () => {
  const today = todayKey(NOW)

  it('全部任务完成才算完美日', () => {
    expect(isPerfectDay(log(today, { tasks: { a: true, b: true } }), ['a', 'b'])).toBe(true)
    expect(isPerfectDay(log(today, { tasks: { a: true } }), ['a', 'b'])).toBe(false)
    expect(isPerfectDay(undefined, ['a'])).toBe(false)
  })

  it('任务列表为空时不算完美日（避免刷奖励）', () => {
    expect(isPerfectDay(log(today), [])).toBe(false)
  })

  it('连续完美日从今天往前数', () => {
    const ids = ['a']
    const logs = {
      [today]: log(today, { tasks: { a: true } }),
      [addDays(today, -1)]: log(addDays(today, -1), { tasks: { a: true } }),
      [addDays(today, -2)]: log(addDays(today, -2), { tasks: { a: false } }),
    }
    expect(perfectDayStreak(logs, () => ids, NOW)).toBe(2)
  })
})

describe('restartStreak', () => {
  it('复发后保留历史最长记录并重置起始日', () => {
    const state = { ...initialState(NOW), streakStart: addDays(todayKey(NOW), -40), longestStreak: 12 }
    const next = restartStreak(state, NOW)
    expect(next.streakStart).toBe(todayKey(NOW))
    expect(next.longestStreak).toBe(40)
  })

  it('新纪录不如旧纪录时不覆盖', () => {
    const state = { ...initialState(NOW), streakStart: addDays(todayKey(NOW), -5), longestStreak: 90 }
    expect(restartStreak(state, NOW).longestStreak).toBe(90)
  })
})
