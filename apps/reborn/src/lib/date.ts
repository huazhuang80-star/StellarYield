/** 日期工具 —— 全部按本地时区处理，key 格式 YYYY-MM-DD */

export function toKey(d: Date): string {
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function todayKey(now: Date = new Date()): string {
  return toKey(now)
}

export function addDays(key: string, delta: number): string {
  const d = fromKey(key)
  d.setDate(d.getDate() + delta)
  return toKey(d)
}

/** 相差天数（b - a），忽略时分秒 */
export function daysBetween(a: string, b: string): number {
  const ms = fromKey(b).getTime() - fromKey(a).getTime()
  return Math.round(ms / 86_400_000)
}

/** 最近 n 天的 key，由旧到新 */
export function recentKeys(n: number, now: Date = new Date()): string[] {
  const end = toKey(now)
  return Array.from({ length: n }, (_, i) => addDays(end, i - (n - 1)))
}

export function formatClock(seconds: number): string {
  const m = Math.floor(Math.max(0, seconds) / 60)
  const s = Math.max(0, seconds) % 60
  return `${m}:${`${s}`.padStart(2, '0')}`
}
