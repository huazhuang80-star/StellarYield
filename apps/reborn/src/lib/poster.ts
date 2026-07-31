import type { AppState } from '../types'
import { companionStage, streakDays } from './progress'

export interface PosterData {
  days: number
  title: string
  stageName: string
  emoji: string
  quote: string
  stats: { label: string; value: string }[]
  footer: string
}

const QUOTES = [
  '冲动是暂时的，但你的选择是永恒的。',
  '戒只是止损，补才是增益。',
  '跌倒不等于回到起点。',
  '你重复什么，大脑就加强什么。',
  '不是忍住了，是不再需要了。',
]

/** 成就海报的内容（纯数据，绘制由 Canvas 负责，便于单测） */
export function posterData(state: AppState, now: Date = new Date()): PosterData {
  const days = streakDays(state.streakStart, now)
  const stage = companionStage(days)
  const checkins = Object.values(state.logs).filter((l) => l.checkedIn).length
  const urgeWins = state.urgeEvents.filter((u) => u.resolution !== 'relapse').length
  const practice = Object.values(state.practiceMinutes).reduce((a, b) => a + b, 0)

  return {
    days,
    title: `${state.name} 的第 ${days} 天`,
    stageName: stage.name,
    emoji: stage.emoji,
    quote: QUOTES[days % QUOTES.length],
    stats: [
      { label: '最长记录', value: `${Math.max(state.longestStreak, days)} 天` },
      { label: '累计打卡', value: `${checkins} 天` },
      { label: '度过冲动', value: `${urgeWins} 次` },
      { label: '功法时长', value: `${practice} 分钟` },
    ],
    footer: 'Reborn · 重生',
  }
}

/** 在 Canvas 上绘制海报，返回 dataURL。尺寸按社交平台竖图 1080×1350。 */
export function drawPoster(canvas: HTMLCanvasElement, data: PosterData): string {
  const W = 1080
  const H = 1350
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#0f172a')
  bg.addColorStop(0.55, '#16203a')
  bg.addColorStop(1, '#0b1220')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // 翡翠光晕
  const glow = ctx.createRadialGradient(W / 2, 430, 40, W / 2, 430, 460)
  glow.addColorStop(0, 'rgba(16,185,129,0.36)')
  glow.addColorStop(1, 'rgba(16,185,129,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, 900)

  ctx.textAlign = 'center'
  ctx.fillStyle = '#94a3bc'
  ctx.font = '500 34px "PingFang SC", system-ui, sans-serif'
  ctx.fillText(data.stageName, W / 2, 190)

  ctx.font = '300px "Apple Color Emoji", "Noto Color Emoji", sans-serif'
  ctx.fillText(data.emoji, W / 2, 540)

  ctx.fillStyle = '#e8eefc'
  ctx.font = '700 92px "PingFang SC", system-ui, sans-serif'
  ctx.fillText(`第 ${data.days} 天`, W / 2, 690)

  ctx.fillStyle = '#10b981'
  ctx.font = '500 38px "PingFang SC", system-ui, sans-serif'
  ctx.fillText(data.title, W / 2, 754)

  // 统计卡片
  const cardY = 830
  const cardW = 460
  const cardH = 150
  data.stats.forEach((s, i) => {
    const x = i % 2 === 0 ? 60 : W - 60 - cardW
    const y = cardY + Math.floor(i / 2) * (cardH + 24)
    ctx.fillStyle = 'rgba(148,163,188,0.10)'
    ctx.strokeStyle = 'rgba(148,163,188,0.22)'
    ctx.lineWidth = 2
    roundRect(ctx, x, y, cardW, cardH, 26)
    ctx.fill()
    ctx.stroke()

    ctx.textAlign = 'left'
    ctx.fillStyle = '#f59e0b'
    ctx.font = '700 56px "PingFang SC", system-ui, sans-serif'
    ctx.fillText(s.value, x + 36, y + 78)
    ctx.fillStyle = '#94a3bc'
    ctx.font = '400 28px "PingFang SC", system-ui, sans-serif'
    ctx.fillText(s.label, x + 36, y + 120)
  })

  ctx.textAlign = 'center'
  ctx.fillStyle = '#94a3bc'
  ctx.font = 'italic 400 36px "PingFang SC", system-ui, sans-serif'
  ctx.fillText(`“${data.quote}”`, W / 2, 1215)

  ctx.fillStyle = '#10b981'
  ctx.font = '600 34px "PingFang SC", system-ui, sans-serif'
  ctx.fillText(data.footer, W / 2, 1285)

  return canvas.toDataURL('image/png')
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
