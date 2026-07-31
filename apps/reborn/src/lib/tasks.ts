import { EXERCISES, PRACTICES, type TimeSlot } from '../data/exercises'
import { CONSTITUTION_MENU, WATER_GOAL } from '../data/nutrition'
import type { AssessmentResult, Constitution } from '../types'

export interface DailyTask {
  id: string
  label: string
  detail: string
  slot: TimeSlot
  icon: string
  /** 需要计数的任务（如喝水），完成条件为达到 goal */
  goal?: number
}

/** 早晨推荐"升阳"功法，晚上推荐"收敛"功法 */
function pickExercise(constitution: Constitution, slot: 'morning' | 'evening', unlocked: string[]) {
  const candidates = EXERCISES.filter(
    (e) => (e.slot === slot || e.slot === 'any') && e.fits.includes(constitution) && (!e.lockedBy || unlocked.includes(e.lockedBy)),
  )
  if (candidates.length === 0) {
    // 未解锁任何进阶功法时，晨练回退到腹式呼吸 / 晚课回退到打坐
    return EXERCISES.find((e) => e.id === (slot === 'morning' ? 'course-jingang' : 'course-meditation')) ?? EXERCISES[0]
  }
  // 难度随解锁进度提升：取符合体质中难度最高的一个
  return candidates.reduce((best, e) => (e.difficulty > best.difficulty ? e : best), candidates[0])
}

/**
 * 每日能量任务系统（PRD 5.3.4）
 * 任务数量随等级增长，内容随体质与测评诱因调整。
 */
export function buildDailyTasks(opts: { assessment: AssessmentResult | null; level: number; unlocked: string[] }): DailyTask[] {
  const constitution = opts.assessment?.constitution ?? 'qi'
  const morning = pickExercise(constitution, 'morning', opts.unlocked)
  const evening = pickExercise(constitution, 'evening', opts.unlocked)
  const menu = CONSTITUTION_MENU[constitution]

  const tasks: DailyTask[] = [
    { id: `ex-${morning.id}`, label: `${morning.name} ${morning.minutes} 分钟`, detail: morning.effect, slot: 'morning', icon: '🌅' },
    { id: 'water', label: `喝水 ${WATER_GOAL} 杯`, detail: '代谢排毒', slot: 'day', icon: '💧', goal: WATER_GOAL },
    { id: 'meal', label: '营养午餐', detail: `推荐：${menu.lunch}`, slot: 'day', icon: '🍎' },
    { id: 'early-sleep', label: '22:30 前入睡', detail: '生长激素分泌窗口', slot: 'evening', icon: '🌙' },
  ]

  // Level 1 起就有的调理项：按体质匹配
  const fitting = PRACTICES.filter((p) => p.fits.includes(constitution))
  const sunlight = fitting.find((p) => p.id === 'sunlight')
  if (sunlight) tasks.splice(1, 0, { id: sunlight.id, label: `${sunlight.name} 20 分钟`, detail: sunlight.basis, slot: 'morning', icon: '☀️' })

  if (opts.level >= 2) {
    const footbath = PRACTICES.find((p) => p.id === 'footbath')
    if (footbath) tasks.push({ id: footbath.id, label: '泡脚 15 分钟', detail: footbath.basis, slot: 'evening', icon: '🛁' })
  }
  if (opts.level >= 3) {
    tasks.push({ id: `ex-${evening.id}`, label: `${evening.name} ${evening.minutes} 分钟`, detail: evening.effect, slot: 'evening', icon: '🧘' })
  }
  if (opts.level >= 4) {
    tasks.push({ id: 'breathing', label: '腹式呼吸 3 组', detail: '激活副交感神经', slot: 'day', icon: '🌬️' })
  }
  if (opts.level >= 5) {
    tasks.push({ id: 'coldwater', label: '冷水挑战', detail: '提升多巴胺、增强意志力', slot: 'morning', icon: '🧊' })
  }
  if (opts.level >= 6) {
    tasks.push({ id: 'journal', label: '晚间复盘 5 分钟', detail: '记录今日得失', slot: 'evening', icon: '📓' })
  }

  return tasks
}

export const SLOT_LABELS: Record<TimeSlot, string> = {
  morning: '☀️ 晨间（6:00-8:00）',
  day: '🌤️ 白天',
  evening: '🌙 晚间',
}

export function currentSlot(now: Date = new Date()): TimeSlot {
  const h = now.getHours()
  if (h < 11) return 'morning'
  if (h < 18) return 'day'
  return 'evening'
}
