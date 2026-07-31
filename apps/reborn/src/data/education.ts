import type { TriggerId } from '../types'

export type EduDimension = 'body' | 'mind' | 'relation' | 'brain'

export interface EduArticle {
  id: string
  dimension: EduDimension
  title: string
  form: string
  /** 科学依据 / 核心信息 */
  basis: string
  minutes: number
  /** 摘要 —— 用科学数据说话，不恐吓、不贩卖焦虑 */
  body: string[]
  /** 与哪些诱因相关，用于「与你相关」个性化排序 */
  relevantTo?: TriggerId[]
}

/**
 * 多维度危害科普库（PRD 5.2.2）
 * 内容原则：不恐吓、可视化、个性化。所有生理机制表述均标注研究领域，
 * 不作诊断，不替代医疗建议。
 */
export const EDU_ARTICLES: EduArticle[] = [
  {
    id: 'body-dopamine',
    dimension: 'body',
    title: '成瘾如何劫持大脑的奖赏回路',
    form: '3D 动画 + 图解',
    basis: '神经科学研究（中脑多巴胺通路）',
    minutes: 3,
    relevantTo: ['visual-feed', 'night-boredom'],
    body: [
      '多巴胺不是"快乐分子"，而是"想要分子"——它负责驱动你去追逐，而不是让你满足。',
      '高强度、可无限翻页的新奇刺激会让奖赏回路持续放电，大脑随后下调多巴胺受体密度以自我保护。',
      '结果是：同样的刺激带来的愉悦递减，而现实生活里的正常快乐（阳光、运动、聊天）变得"不够味"。',
      '好消息：受体密度是可逆的，多数研究观察到数周到数月的基线恢复过程。',
    ],
  },
  {
    id: 'body-pfc',
    dimension: 'body',
    title: '前额叶皮层：决策力与专注力是怎么被磨损的',
    form: '信息图',
    basis: 'fMRI 影像研究',
    minutes: 4,
    body: [
      '前额叶负责"刹车"：延迟满足、抑制冲动、长期规划。',
      '影像研究发现，成瘾行为模式与前额叶—纹状体连接的功能性减弱相关。',
      '表现形式很日常：明明决定不做，手却已经解锁了手机。',
      '训练"刹车"的方式不是意志力硬扛，而是减少决策次数——把环境改造成默认安全。',
    ],
  },
  {
    id: 'body-hormone',
    dimension: 'body',
    title: '荷尔蒙失衡：睾酮波动与皮质醇升高',
    form: '视频',
    basis: '内分泌学研究',
    minutes: 5,
    body: [
      '睡眠剥夺 + 高频刺激会推高皮质醇（压力激素），而皮质醇长期偏高与睾酮水平呈负相关。',
      '这不是"一次就毁了"，而是作息与压力的复合结果。',
      '可干预点非常明确：22:30-23:00 入睡、晨间光照、抗阻训练。',
    ],
  },
  {
    id: 'body-repro',
    dimension: 'body',
    title: '生殖系统：前列腺健康与精子质量',
    form: '科普文',
    basis: '泌尿医学文献',
    minutes: 4,
    body: [
      '过度频繁会导致盆底肌持续紧张，部分人出现久坐后的会阴不适。',
      '文献对精子质量的结论与禁欲天数呈非线性关系，2-7 天为多数研究的观察窗口。',
      '如出现持续疼痛、排尿异常，请就医——App 不做诊断。',
    ],
  },
  {
    id: 'body-fitness',
    dimension: 'body',
    title: '体能衰退：数据对比',
    form: '对比图',
    basis: '运动医学统计',
    minutes: 3,
    body: [
      '影响体能的直接变量是睡眠时长、蛋白质摄入与训练频率。',
      '把注意力放在这三项上，两周内静息心率与晨起精力通常有可感变化。',
    ],
  },
  {
    id: 'mind-anxiety',
    dimension: 'mind',
    title: '"我因为成瘾回避了所有社交"',
    form: '真实用户故事（匿名）',
    basis: '用户访谈',
    minutes: 4,
    relevantTo: ['loneliness', 'weekend-alone'],
    body: [
      '一位 27 岁用户的记录：先是不想参加聚会，后来连电话都不想接。',
      '回避带来短期缓解，长期强化恐惧——这是焦虑的经典维持机制。',
      '破解方式是小步暴露：本周只做一件事，给一个朋友发条语音。',
    ],
  },
  {
    id: 'mind-depression',
    dimension: 'mind',
    title: '成瘾 → 内疚 → 抑郁 → 再成瘾的恶性循环',
    form: '交互式图表',
    basis: '临床心理学模型',
    minutes: 3,
    relevantTo: ['stress-reward'],
    body: [
      '循环的燃料是羞耻感，而不是行为本身。',
      '研究一致显示：自我批评越强，复发概率越高；自我关怀（self-compassion）显著降低复发。',
      '所以本 App 在复发后不打分、不扣分，只做复盘。',
    ],
  },
  {
    id: 'mind-esteem',
    dimension: 'mind',
    title: '自尊心侵蚀：你的自我评价是多少？',
    form: '心理测试',
    basis: 'Rosenberg 自尊量表（简化）',
    minutes: 5,
    body: [
      '自尊不是"觉得自己很棒"，而是"即使失误也认为自己值得被善待"。',
      '每完成一次承诺（哪怕只是喝够水），自我效能就增加一点，这是可积累的。',
    ],
  },
  {
    id: 'mind-focus',
    dimension: 'mind',
    title: '注意力碎片化：测测你的持续专注时间',
    form: '专注力测试',
    basis: '注意力持续性实验范式',
    minutes: 6,
    relevantTo: ['visual-feed'],
    body: [
      '碎片化的根源是"间歇性奖励"：不确定的滑动回报最容易形成习惯回路。',
      '恢复方法：单任务 + 25 分钟计时 + 手机在另一个房间。',
    ],
  },
  {
    id: 'relation-intimacy',
    dimension: 'relation',
    title: '亲密关系里发生了什么',
    form: '伴侣访谈（动画化保护隐私）',
    basis: '关系心理学访谈',
    minutes: 5,
    body: [
      '伴侣最常提到的不是行为本身，而是"隐瞒"带来的信任裂缝。',
      '恢复信任的顺序：坦诚 → 一致性 → 时间，没有捷径。',
    ],
  },
  {
    id: 'relation-social',
    dimension: 'relation',
    title: '社交能量仪表盘：能力是会退化的',
    form: '可视化仪表盘',
    basis: '社交技能练习理论',
    minutes: 3,
    relevantTo: ['weekend-alone'],
    body: ['社交像肌肉，两周不用就明显生疏。', '每天一次 5 分钟的真实对话，就是最低有效剂量。'],
  },
  {
    id: 'relation-career',
    dimension: 'relation',
    title: '因精力不济错失晋升',
    form: '真实案例',
    basis: '用户访谈',
    minutes: 4,
    relevantTo: ['night-boredom'],
    body: ['熬夜 → 上午低效 → 晚上补工作 → 继续熬夜，闭环一旦形成，能力再强也难以输出。', '打断点在最容易的一环：睡前 60 分钟不看手机。'],
  },
  {
    id: 'brain-baseline',
    dimension: 'brain',
    title: '多巴胺基线重置：为什么"越看越刺激，现实越无聊"',
    form: '交互动画',
    basis: '奖赏预测误差理论',
    minutes: 4,
    relevantTo: ['visual-feed', 'night-boredom'],
    body: [
      '基线被抬高后，日常刺激都落在"低于预期"区间，于是一切都显得寡淡。',
      '重置的方式是主动降低刺激密度（无手机散步、单任务工作），让基线慢慢回落。',
    ],
  },
  {
    id: 'brain-deltafosb',
    dimension: 'brain',
    title: 'ΔFosB：成瘾记忆的分子印记（简化科普）',
    form: '科普图解',
    basis: '分子神经科学（动物模型）',
    minutes: 5,
    body: [
      'ΔFosB 是一种在反复刺激下累积的转录因子，被认为与"渴求记忆"的稳固相关。',
      '它半衰期较长，这解释了为什么戒断数周后仍会突然出现强烈冲动。',
      '关键认知：突然的冲动是旧回路在放电，不是"你又不行了"。',
    ],
  },
  {
    id: 'brain-plasticity',
    dimension: 'brain',
    title: '神经可塑性：大脑真的可以恢复',
    form: '希望篇',
    basis: '神经可塑性研究',
    minutes: 3,
    body: [
      '大脑终身保有重塑能力：你重复什么，它就加强什么。',
      '所以本 App 的重点不是"忍住"，而是给你足够多值得重复的新行为。',
    ],
  },
]

export const EDU_DIMENSION_LABELS: Record<EduDimension, string> = {
  body: '身体维度',
  mind: '心理维度',
  relation: '关系维度',
  brain: '大脑维度',
}

/** 视觉管理工具（PRD 5.2.4） */
export const VISUAL_TOOLS = [
  { id: 'purify', name: '社交媒体净化指南', desc: '逐步清理 Instagram / TikTok 关注列表，取消关注触发型账号' },
  { id: 'safe-browse', name: '安全浏览模式', desc: '与 BlockerX 等拦截器集成，或启用内置基础拦截' },
  { id: 'alt-feed', name: '替代视觉 feed', desc: '推送自然风景、健身激励、知识科普内容替代算法推荐' },
  { id: 'grayscale', name: '灰度模式', desc: '一键把手机变为黑白屏，降低视觉刺激（iOS / Android 快捷指令）' },
]
