/** 领域模型 —— 对应 PRD 第五章各模块的数据结构 */

export type Constitution = 'yang' | 'yin' | 'qi' | 'phlegm'

export type Severity = 'mild' | 'moderate' | 'severe'

export type TriggerId = 'night-boredom' | 'stress-reward' | 'weekend-alone' | 'visual-feed' | 'loneliness'

export interface TriggerShare {
  id: TriggerId
  label: string
  /** 占比，0-100，整数，同一测评内合计 100 */
  share: number
}

export interface AssessmentResult {
  completedAt: string
  answers: Record<string, number>
  /** 生理维度 */
  physical: {
    /** 每周频次估算 */
    frequencyPerWeek: number
    /** 精力指数 0-10 */
    energy: number
    /** 睡眠质量 0-10 */
    sleep: number
  }
  /** 心理维度 */
  psych: {
    /** 焦虑指数 0-10 */
    anxiety: number
    /** 社交回避程度 */
    avoidance: 'none' | 'mild' | 'obvious' | 'severe'
    /** 自评自尊 0-10 */
    selfEsteem: number
  }
  severity: Severity
  triggers: TriggerShare[]
  constitution: Constitution
  /** 康复周期预估（天），[下限, 上限] */
  recoveryDays: [number, number]
  /** 推荐方案关键词 */
  plan: string[]
}

export interface DayLog {
  /** YYYY-MM-DD（本地时区） */
  date: string
  /** taskId -> 是否完成 */
  tasks: Record<string, boolean>
  water: number
  checkedIn: boolean
  /** 情绪自评 1-10 */
  mood?: number
  /** 焦虑自评 1-10 */
  anxiety?: number
  /** 是否 22:30 前入睡 */
  earlySleep?: boolean
  /** 晚间复盘文字 */
  note?: string
}

export interface RelapseRecord {
  at: string
  /** 复盘问卷：触发因素 */
  trigger: TriggerId
  /** 复盘问卷：当时情绪 */
  feeling: string
  /** 事后感受 1-10（越高越糟） */
  regret: number
}

export interface UrgeEvent {
  at: string
  /** 强度 1-10 */
  intensity: number
  /** 用户最终选择的应对方式 */
  resolution: 'grounding' | 'energy' | 'coach' | 'buddy' | 'delay-lock' | 'passed' | 'relapse'
}

export interface Companion {
  name: string
  hunger: number
  mood: number
  energy: number
  intimacy: number
  activeSkin: string
  ownedSkins: string[]
  /** 今日互动记录 */
  lastInteractionDate: string
  interactionsToday: string[]
}

export interface CoachMessage {
  role: 'coach' | 'user'
  text: string
  at: string
}

export interface AppState {
  version: number
  onboarded: boolean
  name: string
  /** 当前连续戒断起始日（YYYY-MM-DD） */
  streakStart: string
  longestStreak: number
  assessment: AssessmentResult | null
  /** 上次复评时间，用于 7 天动态调整 */
  lastReassessment: string | null
  logs: Record<string, DayLog>
  relapses: RelapseRecord[]
  urgeEvents: UrgeEvent[]
  coins: number
  /** 未开启的神秘宝箱数量（完美日奖励） */
  boxes: number
  /** 已解锁的里程碑 / 课程 / 皮肤 id */
  unlocked: string[]
  /** 已领取奖励的里程碑，避免重复发放 */
  claimedMilestones: string[]
  companion: Companion
  coachLog: CoachMessage[]
  /** 已展示过的彩蛋 id（部分彩蛋每天可重复） */
  seenEggs: string[]
  settings: {
    /** 15 分钟延迟锁到期时间戳 */
    delayLockUntil: number | null
    grayscaleTip: boolean
    secularMode: boolean
  }
}
