/** 学习中心：把散落的科普与功法组织成有顺序的课程体系 */

export interface Lesson {
  id: string
  title: string
  minutes: number
  kind: 'read' | 'practice' | 'exercise' | 'reflect'
  /** 关联的科普文章 id 或功法 id */
  ref?: string
  summary: string
}

export interface Course {
  id: string
  name: string
  level: '入门' | '进阶' | '大师'
  desc: string
  /** 解锁所需天数 */
  unlockDay: number
  lessons: Lesson[]
}

export const COURSES: Course[] = [
  {
    id: 'c-foundation',
    name: '第一周：先把地基稳住',
    level: '入门',
    unlockDay: 0,
    desc: '不谈意志力，先改环境和作息。这一周只要求两件事：手机离床、晨间见光。',
    lessons: [
      { id: 'l1', title: '你的大脑发生了什么', minutes: 3, kind: 'read', ref: 'body-dopamine', summary: '多巴胺不是快乐分子，是"想要"分子。' },
      { id: 'l2', title: '把决定次数降到最低', minutes: 4, kind: 'read', ref: 'body-pfc', summary: '前额叶是刹车，别指望它一直踩住。' },
      { id: 'l3', title: '腹式呼吸 3 组', minutes: 5, kind: 'practice', ref: 'breath-belly', summary: '激活副交感神经，给身体一个"安全"的信号。' },
      { id: 'l4', title: '晨间见光 20 分钟', minutes: 20, kind: 'exercise', ref: 'sunlight', summary: '把生物钟拉回来，晚上才睡得着。' },
      { id: 'l5', title: '写下你的三个高风险场景', minutes: 5, kind: 'reflect', summary: '具体到时间、地点、设备，越细越好用。' },
    ],
  },
  {
    id: 'c-urge',
    name: '冲动管理实战',
    level: '入门',
    unlockDay: 3,
    desc: '把「忍」换成一套可执行的动作序列。冲动来时你不需要思考，只需要按顺序做。',
    lessons: [
      { id: 'l6', title: '冲动的形状：它会自己消退', minutes: 4, kind: 'read', ref: 'brain-baseline', summary: '15 分钟窗口是真实存在的。' },
      { id: 'l7', title: '5-4-3-2-1 接地练习', minutes: 4, kind: 'practice', ref: 'grounding', summary: '用外部感官把注意力从内部拉出来。' },
      { id: 'l8', title: '真相核查四问', minutes: 3, kind: 'reflect', summary: '这是真的需求，还是多巴胺在骗我？' },
      { id: 'l9', title: '能量转移：先动身体', minutes: 2, kind: 'exercise', summary: '20 个俯卧撑比 20 分钟自我说服有效。' },
    ],
  },
  {
    id: 'c-energy',
    name: '能量补充：从止损到增益',
    level: '进阶',
    unlockDay: 7,
    desc: '光靠戒会让人越来越空。这门课把注意力转向"补"：功法、睡眠、饮食。',
    lessons: [
      { id: 'l10', title: '八段锦分节教学', minutes: 12, kind: 'exercise', ref: 'course-baduanjin', summary: '八式逐一拆解，配合呼吸。' },
      { id: 'l11', title: '睾酮、皮质醇与睡眠', minutes: 5, kind: 'read', ref: 'body-hormone', summary: '可干预点很明确：睡眠、光照、抗阻训练。' },
      { id: 'l12', title: '按体质吃饭', minutes: 6, kind: 'read', summary: '阳虚温补、阴虚滋阴、气虚健脾、痰湿清淡。' },
      { id: 'l13', title: '箱式呼吸 4-4-4-4', minutes: 5, kind: 'practice', ref: 'breath-box', summary: '压力峰值时最好用的一种。' },
    ],
  },
  {
    id: 'c-mind',
    name: '心理重建：羞耻感拆解',
    level: '进阶',
    unlockDay: 14,
    desc: '复发的燃料是羞耻，不是行为本身。这门课处理内疚循环与社交回避。',
    lessons: [
      { id: 'l14', title: '内疚 → 抑郁 → 再成瘾', minutes: 3, kind: 'read', ref: 'mind-depression', summary: '自我关怀显著降低复发率。' },
      { id: 'l15', title: '社交能力是会退化的肌肉', minutes: 3, kind: 'read', ref: 'relation-social', summary: '每天 5 分钟真实对话就是最低有效剂量。' },
      { id: 'l16', title: '给一个人发条语音', minutes: 2, kind: 'reflect', summary: '本周唯一的社交作业。' },
      { id: 'l17', title: '站桩 20 分钟', minutes: 20, kind: 'exercise', ref: 'course-zhanzhuang', summary: '在不舒服里待着，但不逃跑。' },
    ],
  },
  {
    id: 'c-master',
    name: '长期主义：90 天之后',
    level: '大师',
    unlockDay: 90,
    desc: '过了 90 天，问题从「怎么戒」变成「怎么活」。这门课谈身份认同与长期结构。',
    lessons: [
      { id: 'l18', title: '神经可塑性：你重复什么就成为什么', minutes: 3, kind: 'read', ref: 'brain-plasticity', summary: '重点不是忍住，是有值得重复的新行为。' },
      { id: 'l19', title: '易筋经进阶', minutes: 20, kind: 'exercise', ref: 'course-yijinjing', summary: '强筋健骨，气血充盈。' },
      { id: 'l20', title: '写给 Day 1 的自己', minutes: 10, kind: 'reflect', summary: '这封信也会成为别人的入口。' },
    ],
  },
]

export const LESSON_KIND_LABELS = {
  read: '📖 阅读',
  practice: '🌬️ 练习',
  exercise: '🧘 功法',
  reflect: '✍️ 反思',
} as const
