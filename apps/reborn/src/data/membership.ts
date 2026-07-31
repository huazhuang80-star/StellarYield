import type { MembershipTier } from '../types'

/** 定价策略（PRD 9.1）—— 原型内仅演示权益对比，不接入支付 */

export interface Plan {
  id: MembershipTier
  name: string
  price: string
  period: string
  badge?: string
  desc: string
}

export const PLANS: Plan[] = [
  { id: 'free', name: 'Free', price: '$0', period: '永久', desc: '基础测评 + 7 天科普 + 基础打卡' },
  { id: 'pro-monthly', name: 'Pro 月付', price: '$6.99', period: '每月', desc: '全部功能，随时取消' },
  { id: 'pro-yearly', name: 'Pro 年付', price: '$39.99', period: '每年', badge: '4.8 折 · 最受欢迎', desc: '全部功能 + 相当于赠送 2 个月' },
  { id: 'lifetime', name: 'Lifetime', price: '$99.99', period: '一次性', badge: '终身更新', desc: '一次付费，后续版本全含' },
  { id: 'family', name: 'Family', price: '$9.99', period: '每月', desc: '最多 5 人共享，适合家庭或互助小组' },
]

export interface FeatureRow {
  feature: string
  free: string
  pro: string
}

export const FEATURE_MATRIX: FeatureRow[] = [
  { feature: '多维测评与诊断报告', free: '✓', pro: '✓' },
  { feature: '7 天复评与方案调整', free: '—', pro: '✓' },
  { feature: '危害科普库', free: '7 天内容', pro: '全部 15 篇 + 持续更新' },
  { feature: '冲动急救按钮', free: '✓', pro: '✓' },
  { feature: '冲动脱敏训练', free: 'Level 1-2', pro: 'Level 1-5' },
  { feature: '古法功法库', free: '金刚功 / 打坐', pro: '全部 6 套 + 进阶课程' },
  { feature: '呼吸与冥想训练', free: '腹式呼吸', pro: '全部 4 种法门' },
  { feature: 'AI 康复教练', free: '每日 3 次', pro: '无限次 + 晨间诊断 / 晚间复盘' },
  { feature: '数据仪表盘', free: '近 7 天', pro: '全历史 + 成瘾模式图谱' },
  { feature: '动物成长与皮肤', free: '基础形态', pro: '全部阶段 + 专属皮肤' },
  { feature: '问责伙伴匹配', free: '—', pro: '✓' },
  { feature: '实体奖励资格', free: '—', pro: 'Day 180 起' },
  { feature: '数据导出', free: '✓', pro: '✓' },
]

export const MEMBERSHIP_FAQ = [
  { q: '可以随时取消吗？', a: '可以。月付与年付都可在系统订阅管理中随时取消，取消后当前周期内仍可使用。' },
  { q: '免费版会有广告吗？', a: '不会。这是一个关于注意力的产品，用广告换收入自相矛盾。' },
  { q: '学生或经济困难怎么办？', a: '正式版会提供资助名额：写一封说明信即可申请免费 Pro，不需要证明材料。' },
  { q: '退款政策？', a: '按 App Store / Google Play 各自的退款规则处理，我们不额外设限。' },
]

export const TIER_LABELS: Record<MembershipTier, string> = {
  free: 'Free',
  'pro-monthly': 'Pro 月付',
  'pro-yearly': 'Pro 年付',
  lifetime: 'Lifetime',
  family: 'Family',
}

export function isPro(tier: MembershipTier): boolean {
  return tier !== 'free'
}
