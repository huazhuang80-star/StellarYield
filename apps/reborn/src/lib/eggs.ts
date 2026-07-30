/** 惊喜彩蛋系统（PRD 5.4.6） */

export interface EasterEgg {
  id: string
  title: string
  text: string
  visual: string
}

export interface EggContext {
  hour: number
  /** 今日是否是复发后首次打开 */
  afterRelapse: boolean
  perfectStreak: number
  isBirthday: boolean
  firstInvite: boolean
}

export function eggFor(ctx: EggContext): EasterEgg | null {
  if (ctx.afterRelapse) {
    return {
      id: 'egg-restart',
      title: '跌倒了不可怕',
      text: '重要的是站起来。看看你已经走了多远——那些天数没有消失，它们变成了你的经验。',
      visual: 'progress',
    }
  }
  if (ctx.isBirthday) {
    return { id: 'egg-birthday', title: '生日快乐', text: '今年的你，比去年更清醒。这是最好的礼物。', visual: 'cake' }
  }
  if (ctx.firstInvite) {
    return { id: 'egg-invite', title: '你们的伙伴碰面了', text: '双倍金币已到账。互相看见，是最强的问责机制。', visual: 'meet' }
  }
  if (ctx.perfectStreak >= 7) {
    return { id: 'egg-fireworks', title: '连续 7 天完美日', text: '全屏烟花为你而放，隐藏动物皮肤已解锁。', visual: 'fireworks' }
  }
  if (ctx.hour === 5) {
    return { id: 'egg-sunrise', title: '早起的人拥有世界', text: '5 点的天光只属于极少数人。今天你是其中一个。', visual: 'sunrise' }
  }
  if (ctx.hour >= 23 || ctx.hour < 2) {
    return { id: 'egg-latenight', title: '这么晚还不睡？', text: '来一段 4-7-8 助眠呼吸吧，三轮就够。星空会一直在这里。', visual: 'stars' }
  }
  return null
}
