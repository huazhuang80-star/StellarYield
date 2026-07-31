import type { AppState } from '../types'
import { daysBetween, todayKey } from './date'
import { daysSinceLastCheckin, nextMilestone, pendingMilestones, streakDays } from './progress'
import { formatWindow, predictRiskWindow } from './risk'

export type NotificationKind = 'milestone' | 'care' | 'risk' | 'companion' | 'system' | 'reassess'

export interface Notification {
  id: string
  kind: NotificationKind
  title: string
  body: string
  /** 点击后跳转的页面 */
  target?: string
  /** 排序权重，越大越靠前 */
  weight: number
}

const ICONS: Record<NotificationKind, string> = {
  milestone: '🏆',
  care: '💛',
  risk: '⚠️',
  companion: '🐣',
  system: '📣',
  reassess: '🔄',
}

export function iconFor(kind: NotificationKind): string {
  return ICONS[kind]
}

/**
 * 通知中心的内容是从当前状态推导出来的，不单独存储 ——
 * 这样不会出现"已经完成的事还在催"的过期通知。
 */
export function buildNotifications(state: AppState, now: Date = new Date()): Notification[] {
  const list: Notification[] = []
  const days = streakDays(state.streakStart, now)
  const today = todayKey(now)

  pendingMilestones(days, state.claimedMilestones).forEach((m) => {
    list.push({
      id: `ms-${m.id}`,
      kind: 'milestone',
      title: `里程碑达成：${m.name}`,
      body: `${m.visual} · 奖励 ${m.reward} 待领取`,
      target: 'home',
      weight: 100,
    })
  })

  const missed = daysSinceLastCheckin(state.logs, now)
  if (missed !== null && missed >= 3) {
    list.push({
      id: `care-${today}`,
      kind: 'care',
      title: `${missed} 天没见到你了`,
      body: '不管这几天发生了什么，这里都没有记分板在等着惩罚你。回来看看你的伙伴就好。',
      target: 'coach',
      weight: 90,
    })
  }

  if (state.settings.reminders.risk) {
    const risk = predictRiskWindow({ relapses: state.relapses, urgeEvents: state.urgeEvents, assessment: state.assessment })
    list.push({
      id: `risk-${today}`,
      kind: 'risk',
      title: `今日高风险时段 ${formatWindow(risk)}`,
      body: `${risk.reason}。提前把手机放到客厅，比到点再靠意志力容易得多。`,
      target: 'panic',
      weight: 70,
    })
  }

  if (state.companion.mood < 40 || state.companion.hunger < 30) {
    list.push({
      id: `companion-${today}`,
      kind: 'companion',
      title: `${state.companion.name} 有点萎靡`,
      body: '完成今天的任务就能让它恢复精神。',
      target: 'companion',
      weight: 60,
    })
  }

  const sinceReassessment = state.lastReassessment ? daysBetween(state.lastReassessment, today) : null
  if (sinceReassessment !== null && sinceReassessment >= 7) {
    list.push({
      id: `reassess-${state.lastReassessment}`,
      kind: 'reassess',
      title: '该复评了',
      body: `距上次复评已 ${sinceReassessment} 天。重答 5 道题，方案与高风险时段会同步更新。`,
      target: 'more',
      weight: 80,
    })
  }

  const next = nextMilestone(days)
  if (next && next.day - days <= 3) {
    list.push({
      id: `soon-${next.id}`,
      kind: 'system',
      title: `还差 ${next.day - days} 天到「${next.name}」`,
      body: `坚持到 Day ${next.day} 即可解锁：${next.reward}`,
      target: 'dashboard',
      weight: 50,
    })
  }

  return list.sort((a, b) => b.weight - a.weight)
}

export function unreadCount(state: AppState, now: Date = new Date()): number {
  return buildNotifications(state, now).filter((n) => !state.readNotifications.includes(n.id)).length
}

/** 把 HH:MM 转成"距现在还有多久"的可读文案，用于提醒设置页 */
export function nextFireText(hhmm: string, now: Date = new Date()): string {
  const [h, m] = hhmm.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return '时间格式无效'
  const target = new Date(now)
  target.setHours(h, m, 0, 0)
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1)
  const mins = Math.round((target.getTime() - now.getTime()) / 60_000)
  const hours = Math.floor(mins / 60)
  return hours > 0 ? `${hours} 小时 ${mins % 60} 分钟后` : `${mins} 分钟后`
}
