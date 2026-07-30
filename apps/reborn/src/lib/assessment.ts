import { QUESTIONS, TRIGGER_LABELS } from '../data/assessment'
import type { AssessmentResult, Constitution, Severity, TriggerId, TriggerShare } from '../types'
import { todayKey } from './date'

type Answers = Record<string, number>

function get(answers: Answers, id: string): number {
  return answers[id] ?? 0
}

/** 0-9 原始分 → 0-10 展示分 */
function toTen(raw: number): number {
  return Math.round(Math.min(10, Math.max(0, (raw / 9) * 10)))
}

/** 分数越高越糟的题目 → 越高越好的指数 */
function invert(raw: number): number {
  return 10 - toTen(raw)
}

export function severityOf(answers: Answers): Severity {
  const behavior = get(answers, 'freq') + get(answers, 'duration') / 2 + get(answers, 'control') / 2
  if (behavior >= 11) return 'severe'
  if (behavior >= 6) return 'moderate'
  return 'mild'
}

export function avoidanceOf(raw: number): AssessmentResult['psych']['avoidance'] {
  if (raw >= 9) return 'severe'
  if (raw >= 6) return 'obvious'
  if (raw >= 3) return 'mild'
  return 'none'
}

/**
 * 触发因素占比：把各诱因题的原始分归一化为整数百分比，合计恒为 100。
 * 全 0 时回退为均分，避免出现"无诱因"的空结果。
 */
export function triggerShares(answers: Answers): TriggerShare[] {
  const items = QUESTIONS.filter((q) => q.dimension === 'trigger' && q.trigger).map((q) => ({
    id: q.trigger as TriggerId,
    raw: get(answers, q.id),
  }))
  const total = items.reduce((sum, it) => sum + it.raw, 0)
  const weights = total > 0 ? items.map((it) => it.raw / total) : items.map(() => 1 / items.length)

  const shares = weights.map((w) => Math.floor(w * 100))
  // 把因取整丢掉的百分点补给权重最大的诱因
  let remainder = 100 - shares.reduce((a, b) => a + b, 0)
  const order = weights.map((w, i) => ({ w, i })).sort((a, b) => b.w - a.w)
  for (let k = 0; remainder > 0; k = (k + 1) % order.length) {
    shares[order[k].i] += 1
    remainder -= 1
  }

  return items
    .map((it, i) => ({ id: it.id, label: TRIGGER_LABELS[it.id], share: shares[i] }))
    .filter((t) => t.share > 0)
    .sort((a, b) => b.share - a.share)
}

export function constitutionOf(answers: Answers): Constitution {
  const scores: Record<Constitution, number> = {
    yang: get(answers, 'const-yang'),
    yin: get(answers, 'const-yin'),
    qi: get(answers, 'const-qi'),
    phlegm: get(answers, 'const-phlegm'),
  }
  // 并列时按 阳虚 > 气虚 > 阴虚 > 痰湿 的优先级取，保证结果稳定可复现
  const priority: Constitution[] = ['yang', 'qi', 'yin', 'phlegm']
  return priority.reduce((best, key) => (scores[key] > scores[best] ? key : best), priority[0])
}

/** 康复周期预估（天）：基础区间按严重度，再按心理负担加权 */
export function recoveryWindow(severity: Severity, anxiety: number): [number, number] {
  const base: Record<Severity, [number, number]> = {
    mild: [60, 90],
    moderate: [90, 120],
    severe: [120, 180],
  }
  const [lo, hi] = base[severity]
  const bump = anxiety >= 7 ? 30 : anxiety >= 5 ? 15 : 0
  return [lo + bump, hi + bump]
}

function planFor(triggers: TriggerShare[], constitution: Constitution, anxiety: number): string[] {
  const plan: string[] = ['能量提升']
  const top = triggers[0]?.id
  if (top === 'night-boredom' || top === 'visual-feed') plan.push('睡前替代方案')
  if (top === 'stress-reward') plan.push('压力管理训练')
  if (top === 'weekend-alone' || top === 'loneliness') plan.push('问责伙伴')
  if (anxiety >= 6) plan.push('焦虑干预（CBT）')
  if (constitution === 'yang') plan.push('温阳调理')
  if (constitution === 'phlegm') plan.push('有氧减重')
  return Array.from(new Set(plan)).slice(0, 4)
}

/** 测评主入口：纯函数，同样的答案永远得到同样的报告 */
export function scoreAssessment(answers: Answers, now: Date = new Date()): AssessmentResult {
  const severity = severityOf(answers)
  const anxiety = toTen(get(answers, 'anxiety'))
  const triggers = triggerShares(answers)
  const constitution = constitutionOf(answers)

  return {
    completedAt: todayKey(now),
    answers,
    physical: {
      frequencyPerWeek: get(answers, 'freq'),
      energy: invert(get(answers, 'energy')),
      sleep: invert(get(answers, 'sleep')),
    },
    psych: {
      anxiety,
      avoidance: avoidanceOf(get(answers, 'avoidance')),
      selfEsteem: invert(get(answers, 'esteem')),
    },
    severity,
    triggers,
    constitution,
    recoveryDays: recoveryWindow(severity, anxiety),
    plan: planFor(triggers, constitution, anxiety),
  }
}

export const SEVERITY_LABELS: Record<Severity, string> = {
  mild: '轻度',
  moderate: '中度',
  severe: '重度',
}

export const AVOIDANCE_LABELS: Record<AssessmentResult['psych']['avoidance'], string> = {
  none: '无明显回避',
  mild: '轻微',
  obvious: '明显',
  severe: '严重',
}
