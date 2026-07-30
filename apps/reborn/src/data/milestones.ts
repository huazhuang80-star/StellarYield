export interface Milestone {
  id: string
  day: number
  name: string
  /** 视觉反馈描述（原型用 emoji + CSS 动画代替正式动画资源） */
  visual: string
  emoji: string
  coins: number
  /** 解锁的课程 / 勋章 id */
  unlocks: string[]
  reward: string
}

/** 里程碑系统（PRD 5.4.3） */
export const MILESTONES: Milestone[] = [
  { id: 'ms-1', day: 1, name: '觉醒者', visual: '破壳而出的蛋', emoji: '🥚', coins: 100, unlocks: [], reward: '新手礼包（100 金币）' },
  { id: 'ms-7', day: 7, name: '初行者', visual: '幼苗破土', emoji: '🌱', coins: 50, unlocks: ['course-baduanjin'], reward: '解锁「八段锦」课程' },
  { id: 'ms-14', day: 14, name: '坚守者', visual: '小树成长', emoji: '🌳', coins: 80, unlocks: ['course-zhanzhuang'], reward: '解锁「站桩」课程' },
  { id: 'ms-30', day: 30, name: '蜕变者', visual: '蝴蝶破茧', emoji: '🦋', coins: 300, unlocks: ['badge-silver'], reward: '银质勋章 + 300 金币' },
  { id: 'ms-66', day: 66, name: '习惯之主', visual: '金光闪耀（UCL 研究：66 天成习惯）', emoji: '✨', coins: 400, unlocks: ['badge-gold', 'skin-mystery'], reward: '金质勋章 + 神秘动物头像' },
  { id: 'ms-90', day: 90, name: '重生者', visual: '凤凰涅槃', emoji: '🔥', coins: 600, unlocks: ['badge-diamond', 'course-yijinjing'], reward: '钻石勋章 + 高级课程' },
  { id: 'ms-180', day: 180, name: '半载真人', visual: '龙形化现', emoji: '🐉', coins: 1000, unlocks: ['badge-dragon', 'merch-eligible'], reward: '实体奖励资格（T恤 / 手环）' },
  { id: 'ms-365', day: 365, name: '周年宗师', visual: '星空成神', emoji: '🌌', coins: 3650, unlocks: ['badge-master', 'pro-lifetime'], reward: '终身 Pro 会员 + 名人堂' },
]

export interface CompanionStage {
  id: string
  from: number
  to: number
  name: string
  emoji: string
  meaning: string
}

/** 动物头像成长系统（PRD 5.4.4） */
export const COMPANION_STAGES: CompanionStage[] = [
  { id: 'egg', from: 0, to: 0, name: '蛋期', emoji: '🥚', meaning: '觉醒前夜' },
  { id: 'hatchling', from: 1, to: 7, name: '雏鸟期', emoji: '🐣', meaning: '脆弱但充满希望' },
  { id: 'juvenile', from: 8, to: 30, name: '幼兽期', emoji: '🐤', meaning: '开始学会独立' },
  { id: 'growing', from: 31, to: 90, name: '成长期', emoji: '🦅', meaning: '力量逐渐显现' },
  { id: 'mature', from: 91, to: 180, name: '成熟期', emoji: '🦁', meaning: '王者之气初现' },
  { id: 'divine', from: 181, to: Number.POSITIVE_INFINITY, name: '神兽期', emoji: '🐉', meaning: '完全蜕变，超凡入圣' },
]
