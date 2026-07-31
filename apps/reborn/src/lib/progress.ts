import { COMPANION_STAGES, MILESTONES, type CompanionStage, type Milestone } from '../data/milestones'
import type { AppState, DayLog } from '../types'
import { addDays, daysBetween, todayKey } from './date'

/** 当前连续戒断天数：起始日当天记为 Day 0，次日 Day 1 */
export function streakDays(streakStart: string, now: Date = new Date()): number {
  return Math.max(0, daysBetween(streakStart, todayKey(now)))
}

/** 用户等级：每 15 天一级，上限 6 级，用于任务难度调整 */
export function levelOf(days: number): number {
  return Math.min(6, Math.floor(days / 15) + 1)
}

export function companionStage(days: number): CompanionStage {
  return COMPANION_STAGES.find((s) => days >= s.from && days <= s.to) ?? COMPANION_STAGES[0]
}

export function nextStage(days: number): CompanionStage | null {
  const current = companionStage(days)
  const idx = COMPANION_STAGES.indexOf(current)
  return COMPANION_STAGES[idx + 1] ?? null
}

/** 距离下一进化的进度（0-1） */
export function stageProgress(days: number): number {
  const next = nextStage(days)
  if (!next) return 1
  const current = companionStage(days)
  const span = next.from - current.from
  if (span <= 0) return 1
  return Math.min(1, Math.max(0, (days - current.from) / span))
}

/** 已达成但尚未发放奖励的里程碑 */
export function pendingMilestones(days: number, claimed: string[]): Milestone[] {
  return MILESTONES.filter((m) => days >= m.day && !claimed.includes(m.id))
}

export function nextMilestone(days: number): Milestone | null {
  return MILESTONES.find((m) => m.day > days) ?? null
}

/** 连续打卡天数（Streak）：从今天或昨天往前数，遇到未打卡即断 */
export function checkinStreak(logs: Record<string, DayLog>, now: Date = new Date()): number {
  const today = todayKey(now)
  let cursor = logs[today]?.checkedIn ? today : addDays(today, -1)
  let count = 0
  while (logs[cursor]?.checkedIn) {
    count += 1
    cursor = addDays(cursor, -1)
  }
  return count
}

/**
 * 距上次打卡的天数。从未打卡过返回 null —— 新用户不该被当成"失联用户"。
 */
export function daysSinceLastCheckin(logs: Record<string, DayLog>, now: Date = new Date()): number | null {
  const keys = Object.keys(logs)
    .filter((k) => logs[k]?.checkedIn)
    .sort()
  const last = keys.at(-1)
  return last ? Math.max(0, daysBetween(last, todayKey(now))) : null
}

/** 完美日：当日全部推荐任务完成 */
export function isPerfectDay(log: DayLog | undefined, taskIds: string[]): boolean {
  if (!log || taskIds.length === 0) return false
  return taskIds.every((id) => log.tasks[id])
}

/** 连续完美日数量，用于「连续 7 天完美日」彩蛋 */
export function perfectDayStreak(logs: Record<string, DayLog>, taskIdsFor: (date: string) => string[], now: Date = new Date()): number {
  let cursor = todayKey(now)
  let count = 0
  while (isPerfectDay(logs[cursor], taskIdsFor(cursor))) {
    count += 1
    cursor = addDays(cursor, -1)
  }
  return count
}

/** 复发后重启：保留历史最长记录，起始日重置为今天 */
export function restartStreak(state: AppState, now: Date = new Date()): Pick<AppState, 'streakStart' | 'longestStreak'> {
  const days = streakDays(state.streakStart, now)
  return {
    streakStart: todayKey(now),
    longestStreak: Math.max(state.longestStreak, days),
  }
}
