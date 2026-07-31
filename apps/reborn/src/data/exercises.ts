import type { Constitution } from '../types'

export type TimeSlot = 'morning' | 'day' | 'evening'

export interface Exercise {
  id: string
  name: string
  minutes: number
  /** 难度 1-5 */
  difficulty: number
  effect: string
  form: string
  /** 升阳（晨练）/ 收敛（晚练）/ 通用 */
  slot: TimeSlot | 'any'
  /** 适合体质 */
  fits: Constitution[]
  /** 需要里程碑解锁的课程 id */
  lockedBy?: string
  steps: string[]
  mistakes: string[]
}

/** 中医古法锻炼库（PRD 5.3.1） */
export const EXERCISES: Exercise[] = [
  {
    id: 'course-baduanjin',
    name: '八段锦',
    minutes: 12,
    difficulty: 2,
    effect: '疏通经络、提升阳气',
    form: '跟练视频（分节教学）',
    slot: 'morning',
    fits: ['qi', 'yang', 'phlegm'],
    lockedBy: 'course-baduanjin',
    steps: ['双手托天理三焦', '左右开弓似射雕', '调理脾胃须单举', '五劳七伤往后瞧', '摇头摆尾去心火', '两手攀足固肾腰', '攥拳怒目增气力', '背后七颠百病消'],
    mistakes: ['动作过快，失去"缓慢匀长"的要义', '憋气发力，应配合自然呼吸', '膝盖超过脚尖，损伤关节'],
  },
  {
    id: 'course-jingang',
    name: '金刚功',
    minutes: 15,
    difficulty: 3,
    effect: '强身健体、充盈精力',
    form: '跟练视频 + 呼吸指导',
    slot: 'morning',
    fits: ['yang', 'qi'],
    steps: ['双手插顶利三焦', '手足前后固肾腰', '调理脾胃须单举', '左肝右肺如射雕', '官天柱强肾腰'],
    mistakes: ['清晨空腹过度用力导致头晕', '腰部代偿发力，应由髋带动'],
  },
  {
    id: 'course-zhanzhuang',
    name: '站桩',
    minutes: 20,
    difficulty: 2,
    effect: '培养定力、收敛心神',
    form: '音频引导 + 姿势校正图',
    slot: 'evening',
    fits: ['yang', 'qi', 'yin'],
    lockedBy: 'course-zhanzhuang',
    steps: ['两脚平行同肩宽', '膝微屈，臀微坐', '双臂环抱如抱球', '舌抵上腭，目光平视', '自然呼吸，静守 10-30 分钟'],
    mistakes: ['时间贪多导致膝痛，应从 5 分钟递增', '肩部僵硬耸起', '刻意追求"气感"'],
  },
  {
    id: 'course-meditation',
    name: '打坐 / 静坐',
    minutes: 15,
    difficulty: 3,
    effect: '静心凝神、提升觉察',
    form: '多种法门（数息 / 观息 / 持咒）',
    slot: 'evening',
    fits: ['yin', 'qi', 'yang', 'phlegm'],
    steps: ['选择数息 / 观息 / 持咒任一法门', '脊背自然挺直，不倚不靠', '注意力回到呼吸，走神即温和带回', '结束前做 3 次深呼吸再起身'],
    mistakes: ['与念头对抗，越压越乱', '追求"空白"，其实觉察即成功'],
  },
  {
    id: 'course-yijinjing',
    name: '易筋经',
    minutes: 20,
    difficulty: 4,
    effect: '强筋健骨、充盈气血',
    form: '进阶课程',
    slot: 'morning',
    fits: ['qi', 'phlegm'],
    lockedBy: 'course-yijinjing',
    steps: ['韦陀献杵三势', '摘星换斗势', '倒拽九牛尾势', '出爪亮翅势', '九鬼拔马刀势'],
    mistakes: ['筋骨未热即强行拉伸', '呼吸与动作脱节'],
  },
  {
    id: 'course-taiji',
    name: '太极拳（简化）',
    minutes: 15,
    difficulty: 3,
    effect: '身心合一、柔中带刚',
    form: '跟练视频',
    slot: 'any',
    fits: ['yin', 'phlegm', 'qi'],
    steps: ['起势', '野马分鬃', '白鹤亮翅', '搂膝拗步', '收势'],
    mistakes: ['上身僵直，未做到"松沉"', '只练手不练腰胯'],
  },
]

export interface EnergyPractice {
  id: string
  name: string
  detail: string
  basis: string
  interaction: string
  slot: TimeSlot
  fits: Constitution[]
}

/** 体质与能量调理（PRD 5.3.2） */
export const PRACTICES: EnergyPractice[] = [
  { id: 'sunlight', name: '晒太阳', detail: '每天 15-30 分钟晨间阳光', basis: '维生素 D 合成、血清素提升', interaction: '打卡 + 天气提醒', slot: 'morning', fits: ['yang', 'qi', 'phlegm'] },
  { id: 'footbath', name: '泡脚', detail: '睡前温水泡脚 15-20 分钟', basis: '促进血液循环、助眠', interaction: '计时器 + 音乐', slot: 'evening', fits: ['yang', 'qi', 'yin'] },
  { id: 'nature', name: '接触自然', detail: '公园散步、草地赤足行走', basis: '接地气（Earthing）研究', interaction: '附近公园推荐', slot: 'day', fits: ['yin', 'phlegm', 'qi', 'yang'] },
  { id: 'coldwater', name: '冷水脸 / 冷水浴', detail: '从冷水洗脸开始，渐进到冷水澡', basis: '提升多巴胺、增强意志力', interaction: '挑战等级系统', slot: 'morning', fits: ['phlegm', 'yin'] },
  { id: 'breathing', name: '腹式呼吸', detail: '每天 3 组，每组 10 次', basis: '激活副交感神经', interaction: '呼吸动画引导', slot: 'day', fits: ['yin', 'qi', 'yang', 'phlegm'] },
  { id: 'earlysleep', name: '早睡打卡', detail: '22:30-23:00 入睡目标', basis: '生长激素分泌窗口', interaction: '睡眠追踪联动', slot: 'evening', fits: ['yang', 'yin', 'qi', 'phlegm'] },
]
