import type { AssessmentResult, RelapseRecord, UrgeEvent } from '../types'

export interface RiskWindow {
  startHour: number
  endHour: number
  /** 置信度 0-1，样本越多越高 */
  confidence: number
  reason: string
}

const DEFAULT_WINDOW: RiskWindow = {
  startHour: 23,
  endHour: 1,
  confidence: 0.3,
  reason: '尚无个人数据，采用普遍高风险时段（深夜）',
}

function hourOf(iso: string): number | null {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d.getHours()
}

/**
 * 冲动风险预警：用历史复发与冲动记录的小时分布，找出 3 小时滑动窗口峰值。
 * 数据不足时回退到测评诱因推断的时段。
 */
export function predictRiskWindow(opts: {
  relapses: RelapseRecord[]
  urgeEvents: UrgeEvent[]
  assessment: AssessmentResult | null
}): RiskWindow {
  const hours = [
    ...opts.relapses.map((r) => hourOf(r.at)),
    ...opts.urgeEvents.map((u) => hourOf(u.at)),
  ].filter((h): h is number => h !== null)

  if (hours.length < 3) {
    const top = opts.assessment?.triggers[0]?.id
    if (top === 'night-boredom' || top === 'visual-feed') {
      return { ...DEFAULT_WINDOW, reason: '基于你的测评：睡前刷手机是首要诱因', confidence: 0.4 }
    }
    if (top === 'stress-reward') {
      return { startHour: 18, endHour: 20, confidence: 0.4, reason: '基于你的测评：下班后的"奖励时刻"风险最高' }
    }
    if (top === 'weekend-alone' || top === 'loneliness') {
      return { startHour: 14, endHour: 17, confidence: 0.4, reason: '基于你的测评：独处的午后是薄弱环节' }
    }
    return DEFAULT_WINDOW
  }

  const counts = new Array(24).fill(0) as number[]
  hours.forEach((h) => {
    counts[h] += 1
  })

  let bestStart = 23
  let bestScore = -1
  for (let start = 0; start < 24; start += 1) {
    const score = counts[start] + counts[(start + 1) % 24] + counts[(start + 2) % 24]
    if (score > bestScore) {
      bestScore = score
      bestStart = start
    }
  }

  return {
    startHour: bestStart,
    endHour: (bestStart + 3) % 24,
    confidence: Math.min(0.95, 0.3 + hours.length * 0.05),
    reason: `基于你 ${hours.length} 条历史记录的时间分布`,
  }
}

export function formatWindow(w: RiskWindow): string {
  const pad = (h: number) => `${`${h}`.padStart(2, '0')}:00`
  return `${pad(w.startHour)}-${pad(w.endHour)}`
}

/** 当前是否处于高风险时段（跨零点窗口也能正确判断） */
export function inWindow(w: RiskWindow, now: Date = new Date()): boolean {
  const h = now.getHours()
  return w.startHour <= w.endHour ? h >= w.startHour && h < w.endHour : h >= w.startHour || h < w.endHour
}
