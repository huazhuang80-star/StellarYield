/**
 * AI 康复教练（PRD 6.1）
 * 原型阶段用规则引擎实现 CBT 风格回应；生产环境会替换为 LLM 调用，
 * 保留同样的 `reply(input, context)` 接口即可无缝切换。
 */

import type { AssessmentResult } from '../types'

export interface CoachContext {
  days: number
  anxiety: number
  topTrigger?: string
  assessment: AssessmentResult | null
}

interface Rule {
  id: string
  test: RegExp
  reply: (ctx: CoachContext) => string
}

const RULES: Rule[] = [
  {
    id: 'urge',
    test: /冲动|想看|忍不住|受不了|urge/i,
    reply: (ctx) =>
      `先做一件事：把手机放到手臂伸不到的地方，然后跟我一起数 4 拍吸气、6 拍呼气，做 5 轮。\n` +
      `你已经坚持了 ${ctx.days} 天，这股冲动的强度通常在 15 分钟内降到一半。它不是命令，只是一次放电。\n` +
      `如果现在很难安静，直接去做 20 个俯卧撑——身体动起来比说服自己更快。`,
  },
  {
    id: 'relapse',
    test: /破戒|失败|又犯|复发|relapse|完了/i,
    reply: (ctx) =>
      `跌倒不等于回到起点。你已经积累的认知和体感变化不会因为一次失误清零。\n` +
      `我们只做一件事：找出这次的触发点。是环境（手机、时间点），还是情绪（累、孤独、压力）？\n` +
      `${ctx.days > 0 ? `你此前连续 ${ctx.days} 天的记录说明你有能力做到。` : ''}明天从最小的一步开始：22:30 手机离床。`,
  },
  {
    id: 'anxious',
    test: /焦虑|紧张|睡不着|压力|难受|anxious/i,
    reply: () =>
      `焦虑常常是身体在提示"资源不足"——睡眠、食物或安全感。\n` +
      `现在做 5-4-3-2-1 接地练习：5 样看见的、4 种听到的、3 处触感、2 种气味、1 口水的味道。\n` +
      `做完告诉我数值从几降到几，我们据此调整今晚的任务量。`,
  },
  {
    id: 'lonely',
    test: /孤独|没人|朋友|社交|回避|lonely/i,
    reply: () =>
      `社交回避会短期缓解、长期加重，这是焦虑的维持机制。\n` +
      `本周只给你一个动作：给一位朋友发 15 秒语音，内容随意。完成后来告诉我。`,
  },
  {
    id: 'why',
    test: /为什么|原理|多巴胺|大脑|why/i,
    reply: () =>
      `简版机制：高新奇度刺激推高多巴胺基线，大脑随后下调受体密度自保，于是"越刺激越无聊"。\n` +
      `恢复靠两件事：降低刺激密度、提高自然奖赏（阳光、运动、真实社交）。\n` +
      `想看详细版本，去「危害认知 → 大脑维度 → 多巴胺基线重置」。`,
  },
  {
    id: 'plan',
    test: /计划|怎么做|方案|任务|开始/i,
    reply: (ctx) =>
      `按你的测评，优先级是：${ctx.assessment?.plan.join(' → ') ?? '能量提升 → 睡前替代 → 问责伙伴'}。\n` +
      `今天只需完成晨间功法和早睡两项，其余是加分项。少而稳定胜过多而崩盘。`,
  },
  {
    id: 'tired',
    test: /累|没精力|疲惫|乏|困/i,
    reply: () =>
      `疲惫期不要加练。今天把标准降到：晒太阳 10 分钟 + 22:30 上床，其他全部跳过。\n` +
      `恢复期的目标是不断链，不是刷满进度条。`,
  },
]

const FALLBACKS = [
  '我在听。可以多说一点吗——是身体的感受，还是某个具体念头把你带到这里的？',
  '把它拆细一点：现在最难的是"想做"这件事本身，还是想做背后的那个情绪？',
  '记下这个时刻。稍后在数据里我们会看到它属于哪个模式。你现在最想先处理什么？',
]

export function coachReply(input: string, ctx: CoachContext, seed = 0): string {
  const rule = RULES.find((r) => r.test.test(input))
  if (rule) return rule.reply(ctx)
  return FALLBACKS[Math.abs(seed) % FALLBACKS.length]
}

/** 晨间诊断三问（PRD 6.1） */
export const MORNING_QUESTIONS = [
  { id: 'sleep', text: '昨晚睡得怎么样？（1-10）' },
  { id: 'energy', text: '现在的精力值？（1-10）' },
  { id: 'risk', text: '今天有什么可预见的压力事件吗？' },
]

/** 晚间复盘三问 */
export const EVENING_QUESTIONS = [
  { id: 'win', text: '今天最小的一个胜利是什么？' },
  { id: 'trigger', text: '今天有没有出现过冲动？发生在什么场景？' },
  { id: 'tomorrow', text: '明天想改动的一件事？' },
]

/** 危机关怀：连续 N 天未打卡触发 */
export function careMessage(missedDays: number, name: string): string | null {
  if (missedDays < 3) return null
  return `${name}，三天没见到你了。不管这几天发生了什么，这里都没有记分板在等着惩罚你。\n回来看看你的伙伴就好——它一直在。`
}
