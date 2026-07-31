/** 打卡与金币规则（PRD 5.4.2 / 5.4.5） */

export const DAILY_CHECKIN_COINS = 10
export const PERFECT_DAY_COINS = 50
export const EARLY_RISE_COINS = 20
export const EARLY_SLEEP_COINS = 20
export const STREAK_BONUS_CAP = 50

/** 连续打卡加成：N×5，上限 50 */
export function streakBonus(streak: number): number {
  return Math.min(STREAK_BONUS_CAP, Math.max(0, streak) * 5)
}

export interface CheckinReward {
  coins: number
  breakdown: { label: string; coins: number }[]
  box: boolean
}

/**
 * 结算一次每日打卡。
 * @param streak 含本次在内的连续打卡天数
 */
export function checkinReward(opts: { streak: number; perfect: boolean; earlyRise: boolean; earlySleep: boolean }): CheckinReward {
  const breakdown = [{ label: '每日打卡', coins: DAILY_CHECKIN_COINS }]
  const bonus = streakBonus(opts.streak)
  if (bonus > 0) breakdown.push({ label: `连续 ${opts.streak} 天加成`, coins: bonus })
  if (opts.perfect) breakdown.push({ label: '完美日', coins: PERFECT_DAY_COINS })
  if (opts.earlyRise) breakdown.push({ label: '早起打卡', coins: EARLY_RISE_COINS })
  if (opts.earlySleep) breakdown.push({ label: '早睡打卡', coins: EARLY_SLEEP_COINS })

  return {
    coins: breakdown.reduce((sum, b) => sum + b.coins, 0),
    breakdown,
    box: opts.perfect,
  }
}

/** 6:00-7:00 打开 App 记早起 */
export function isEarlyRise(now: Date = new Date()): boolean {
  return now.getHours() === 6
}

/** 22:30 前标记准备睡觉记早睡 */
export function isEarlySleepTime(now: Date = new Date()): boolean {
  const minutes = now.getHours() * 60 + now.getMinutes()
  return minutes < 22 * 60 + 30 || minutes < 5 * 60
}

/** 开箱：随机数由外部注入，保持纯函数可测 */
export function openBox<T>(pool: T[], roll: number): T {
  const idx = Math.min(pool.length - 1, Math.max(0, Math.floor(roll * pool.length)))
  return pool[idx]
}
