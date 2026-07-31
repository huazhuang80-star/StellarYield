/** 呼吸与冥想训练 —— 对应 PRD 5.3.2「腹式呼吸 · 呼吸动画引导」与 5.2.3 Level 5 正念 */

export interface BreathPhase {
  label: string
  seconds: number
  /** 圆环在该阶段的缩放目标 */
  scale: number
}

export interface BreathPattern {
  id: string
  name: string
  subtitle: string
  purpose: string
  rounds: number
  phases: BreathPhase[]
  /** 适用场景 */
  when: string
}

export const BREATH_PATTERNS: BreathPattern[] = [
  {
    id: 'breath-belly',
    name: '腹式呼吸',
    subtitle: '4 拍吸 · 6 拍呼',
    purpose: '激活副交感神经，降低心率',
    rounds: 10,
    when: '每天 3 组，或任何需要稳住的时候',
    phases: [
      { label: '吸气，让腹部鼓起', seconds: 4, scale: 1 },
      { label: '缓缓呼出', seconds: 6, scale: 0.55 },
    ],
  },
  {
    id: 'breath-478',
    name: '4-7-8 助眠呼吸',
    subtitle: '4 吸 · 7 屏 · 8 呼',
    purpose: '延长呼气相，帮助入睡',
    rounds: 4,
    when: '躺下后做 4 轮，深夜彩蛋也会推荐它',
    phases: [
      { label: '用鼻吸气', seconds: 4, scale: 1 },
      { label: '屏住', seconds: 7, scale: 1 },
      { label: '用口呼出，发出声音', seconds: 8, scale: 0.5 },
    ],
  },
  {
    id: 'breath-box',
    name: '箱式呼吸',
    subtitle: '4-4-4-4',
    purpose: '压力峰值时快速回到基线',
    rounds: 6,
    when: '冲动或焦虑强度 7 分以上时',
    phases: [
      { label: '吸气', seconds: 4, scale: 1 },
      { label: '屏住', seconds: 4, scale: 1 },
      { label: '呼气', seconds: 4, scale: 0.5 },
      { label: '屏住', seconds: 4, scale: 0.5 },
    ],
  },
  {
    id: 'breath-fire',
    name: '提气呼吸',
    subtitle: '快吸快呼 · 30 次',
    purpose: '提神醒脑，替代咖啡因',
    rounds: 3,
    when: '晨起或午后困倦时；高血压与孕期不宜',
    phases: [
      { label: '快速吸气', seconds: 1, scale: 1 },
      { label: '快速呼气', seconds: 1, scale: 0.6 },
    ],
  },
]

export interface MeditationTrack {
  id: string
  name: string
  minutes: number
  method: string
  guide: string[]
}

export const MEDITATIONS: MeditationTrack[] = [
  {
    id: 'med-breath-count',
    name: '数息',
    minutes: 10,
    method: '入门法门',
    guide: ['自然呼吸，不控制节奏', '呼气时在心里数 1，再呼数 2，数到 10 回到 1', '数丢了就从 1 重来 —— 发现自己数丢了，本身就是觉察'],
  },
  {
    id: 'med-observe',
    name: '观息',
    minutes: 15,
    method: '进阶法门',
    guide: ['不数数，只观察气息进出鼻端的触感', '念头来了，标记一下"想"，再回到呼吸', '不评判、不追随、不压制'],
  },
  {
    id: 'med-cloud',
    name: '冲动观察（passing cloud）',
    minutes: 8,
    method: '正念减压 MBSR',
    guide: ['把冲动想象成一朵飘过的云，你是天空不是云', '观察它的强度曲线：升起、峰值、消退', '不需要赶走它，只需要看着它走完'],
  },
  {
    id: 'med-body',
    name: '身体扫描',
    minutes: 12,
    method: '睡前收敛',
    guide: ['从脚趾开始，逐段把注意力移到头顶', '每到一处，允许那里松一点', '睡着了也没关系，这不是考试'],
  },
]
