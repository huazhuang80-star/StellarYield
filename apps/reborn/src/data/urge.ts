/** 冲动脱敏训练系统（PRD 5.2.3）—— 不压抑冲动，而是降低冲动强度 */

export interface UrgeLevel {
  level: number
  name: string
  content: string
  theory: string
  minutes: number
}

export const URGE_LEVELS: UrgeLevel[] = [
  { level: 1, name: '认知重构', content: '冲动来临时完成 3 分钟"真相核查"：这是真的需求，还是多巴胺在骗我？', theory: 'CBT 认知行为疗法', minutes: 3 },
  { level: 2, name: '身体接地', content: '5-4-3-2-1 感官 grounding 练习 + 冷水洗脸', theory: '迷走神经刺激', minutes: 4 },
  { level: 3, name: '能量转移', content: '10 个俯卧撑 / 30 秒冲刺 / 冷水澡', theory: '运动释放内啡肽替代多巴胺', minutes: 2 },
  { level: 4, name: '渐进暴露', content: '在受控环境下接触轻度触发，练习"观看但不反应"', theory: '暴露疗法', minutes: 6 },
  { level: 5, name: '正念观察', content: '把冲动看作一朵飘过的云，观察但不评判', theory: '正念减压 MBSR', minutes: 8 },
]

/** 5-4-3-2-1 感官接地脚本 */
export const GROUNDING_STEPS = [
  { count: 5, sense: '看见', prompt: '说出你现在能看见的 5 样东西' },
  { count: 4, sense: '听到', prompt: '说出你能听到的 4 种声音' },
  { count: 3, sense: '触摸', prompt: '感受 3 个接触点：脚掌、后背、指尖' },
  { count: 2, sense: '闻到', prompt: '找出 2 种气味' },
  { count: 1, sense: '尝到', prompt: '喝一口水，专注这 1 种味道' },
]

/** 真相核查问句（Level 1 认知重构） */
export const REALITY_CHECK = [
  '现在驱动我的是身体的需要，还是屏幕给的预期？',
  '上一次这样做之后的 30 分钟，我的真实感受是什么？',
  '如果 15 分钟后这股冲动会自然减弱，我愿意等吗？',
  '我真正缺的是什么——休息、连接，还是逃避某件事？',
]

/** 冲动急救倒计时（秒）：15 秒冷静期 + 15 分钟冲动消退窗口 */
export const CALM_SECONDS = 15
export const URGE_WINDOW_SECONDS = 15 * 60

export const ENERGY_TRANSFER_OPTIONS = ['20 个俯卧撑', '30 秒原地高抬腿冲刺', '冷水洗脸 30 秒', '下楼快走 5 分钟']
