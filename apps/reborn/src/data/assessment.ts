import type { TriggerId } from '../types'

export type Dimension = 'behavior' | 'physical' | 'psych' | 'trigger' | 'constitution'

export interface Question {
  id: string
  dimension: Dimension
  title: string
  hint?: string
  /** 诱因题绑定的触发因素 */
  trigger?: TriggerId
  /** 体质题绑定的体质倾向 */
  constitution?: 'yang' | 'yin' | 'qi' | 'phlegm'
  options: { label: string; value: number }[]
}

const FREQ_OPTIONS = [
  { label: '几乎没有', value: 0 },
  { label: '每周 1 次左右', value: 1 },
  { label: '每周 2-3 次', value: 3 },
  { label: '每周 4-6 次', value: 5 },
  { label: '每天 1 次以上', value: 8 },
]

const SCALE = [
  { label: '完全没有', value: 0 },
  { label: '偶尔', value: 3 },
  { label: '经常', value: 6 },
  { label: '几乎每天', value: 9 },
]

/** 多维度测评题库（PRD 5.1.1）—— 顺序即问卷顺序 */
export const QUESTIONS: Question[] = [
  {
    id: 'freq',
    dimension: 'behavior',
    title: '最近一个月，你的行为频率大约是？',
    hint: '诚实作答，这份问卷只属于你，不会上传到任何服务器。',
    options: FREQ_OPTIONS,
  },
  {
    id: 'duration',
    dimension: 'behavior',
    title: '这种模式持续了多久？',
    options: [
      { label: '不到半年', value: 1 },
      { label: '半年到 2 年', value: 3 },
      { label: '2 到 5 年', value: 5 },
      { label: '5 年以上', value: 8 },
    ],
  },
  {
    id: 'control',
    dimension: 'behavior',
    title: '你尝试停止过吗？最长坚持多久？',
    options: [
      { label: '从没认真尝试', value: 6 },
      { label: '几天就回到原样', value: 8 },
      { label: '坚持过 2-4 周', value: 4 },
      { label: '坚持过 1 个月以上', value: 2 },
    ],
  },
  {
    id: 'energy',
    dimension: 'physical',
    title: '白天的精力状态如何？',
    options: [
      { label: '充沛，很少疲惫', value: 0 },
      { label: '中午后明显下降', value: 4 },
      { label: '全天疲惫，靠咖啡撑着', value: 7 },
      { label: '严重乏力，难以专注', value: 9 },
    ],
  },
  {
    id: 'sleep',
    dimension: 'physical',
    title: '睡眠质量与作息？',
    options: [
      { label: '23:00 前入睡，睡得踏实', value: 0 },
      { label: '偶尔熬夜，容易醒', value: 4 },
      { label: '经常 1 点后睡', value: 7 },
      { label: '昼夜颠倒，睡不解乏', value: 9 },
    ],
  },
  {
    id: 'fitness',
    dimension: 'physical',
    title: '体能与运动情况？',
    options: [
      { label: '每周规律运动 3 次以上', value: 0 },
      { label: '偶尔运动', value: 3 },
      { label: '几乎不运动', value: 6 },
      { label: '爬两层楼就气喘', value: 9 },
    ],
  },
  {
    id: 'anxiety',
    dimension: 'psych',
    title: '过去两周，你感到紧张、焦虑或坐立不安的频率？',
    options: SCALE,
  },
  {
    id: 'avoidance',
    dimension: 'psych',
    title: '你会回避社交场合（聚会、面对面交流）吗？',
    options: SCALE,
  },
  {
    id: 'esteem',
    dimension: 'psych',
    title: '事后你如何评价自己？',
    options: [
      { label: '基本平静，不太自责', value: 1 },
      { label: '有些懊悔', value: 4 },
      { label: '强烈的羞耻和自我厌恶', value: 7 },
      { label: '觉得自己没救了', value: 9 },
    ],
  },
  {
    id: 'focus',
    dimension: 'psych',
    title: '你能持续专注做一件事多久？',
    options: [
      { label: '1 小时以上', value: 0 },
      { label: '30 分钟左右', value: 3 },
      { label: '10 分钟就想摸手机', value: 6 },
      { label: '几乎无法专注', value: 9 },
    ],
  },
  {
    id: 'trigger-night',
    dimension: 'trigger',
    trigger: 'night-boredom',
    title: '睡前躺床上刷手机，然后失控 —— 这种情况多常见？',
    options: SCALE,
  },
  {
    id: 'trigger-stress',
    dimension: 'trigger',
    trigger: 'stress-reward',
    title: '工作/学习压力大之后，把它当作"奖励自己"？',
    options: SCALE,
  },
  {
    id: 'trigger-weekend',
    dimension: 'trigger',
    trigger: 'weekend-alone',
    title: '周末或假期独处时间过长时更容易发生？',
    options: SCALE,
  },
  {
    id: 'trigger-visual',
    dimension: 'trigger',
    trigger: 'visual-feed',
    title: '被短视频 / 社交媒体推送内容点燃冲动？',
    options: SCALE,
  },
  {
    id: 'trigger-lonely',
    dimension: 'trigger',
    trigger: 'loneliness',
    title: '在孤独、被拒绝或情绪低落时更容易发生？',
    options: SCALE,
  },
  {
    id: 'const-yang',
    dimension: 'constitution',
    constitution: 'yang',
    title: '你是否怕冷、手脚发凉、容易疲劳？',
    options: SCALE,
  },
  {
    id: 'const-yin',
    dimension: 'constitution',
    constitution: 'yin',
    title: '你是否口干舌燥、夜间燥热、入睡困难？',
    options: SCALE,
  },
  {
    id: 'const-qi',
    dimension: 'constitution',
    constitution: 'qi',
    title: '你是否气短乏力、说话没劲、容易出汗？',
    options: SCALE,
  },
  {
    id: 'const-phlegm',
    dimension: 'constitution',
    constitution: 'phlegm',
    title: '你是否体重偏高、头身困重、痰多黏腻？',
    options: SCALE,
  },
]

export const TRIGGER_LABELS: Record<TriggerId, string> = {
  'night-boredom': '睡前无聊 + 刷手机',
  'stress-reward': '压力后的"奖励"',
  'weekend-alone': '周末独处时间过长',
  'visual-feed': '算法推送的视觉刺激',
  loneliness: '孤独与情绪低落',
}

export const CONSTITUTION_LABELS = {
  yang: '阳虚体质',
  yin: '阴虚体质',
  qi: '气虚体质',
  phlegm: '痰湿体质',
} as const

export const CONSTITUTION_ADVICE = {
  yang: { desc: '怕冷、疲劳，阳气不足', advice: ['晨间晒太阳 20-30 分钟', '睡前温水泡脚', '温补饮食：山药、羊肉、生姜'] },
  yin: { desc: '口干、失眠，阴液偏少', advice: ['静坐收敛心神', '滋阴饮食：桑葚、银耳、枸杞', '避免辛辣与熬夜'] },
  qi: { desc: '气短、懒言，中气不足', advice: ['八段锦每日一遍', '黄芪泡水代茶饮', '忌过度剧烈运动'] },
  phlegm: { desc: '肥胖、困倦，水湿内停', advice: ['有氧运动 30 分钟', '清淡饮食、少糖少油', '薏米赤小豆粥'] },
} as const
