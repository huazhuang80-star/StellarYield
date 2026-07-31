/** 问责伙伴：邀请码生成与匹配度计算（PRD 6.2 互助匹配） */

import type { AppState } from '../types'
import { predictRiskWindow } from './risk'
import { streakDays } from './progress'
import { todayKey } from './date'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 去掉易混淆的 I O 0 1

/** 由外部注入随机数，保持纯函数可测 */
export function generateCode(rolls: number[]): string {
  return rolls
    .slice(0, 6)
    .map((r) => ALPHABET[Math.min(ALPHABET.length - 1, Math.max(0, Math.floor(r * ALPHABET.length)))])
    .join('')
}

export function isValidCode(code: string): boolean {
  return /^[A-HJ-NP-Z2-9]{6}$/.test(code.trim().toUpperCase())
}

export interface BuddyProfile {
  name: string
  days: number
  timezone: string
  /** 高风险时段重叠度 0-1 */
  overlap: number
  status: 'online' | 'offline'
}

/** 示意用的伙伴数据；正式版由后端匹配 */
export const SAMPLE_BUDDIES: BuddyProfile[] = [
  { name: 'Mike', days: 41, timezone: 'UTC+8', overlap: 0.78, status: 'online' },
  { name: '阿哲', days: 128, timezone: 'UTC+8', overlap: 0.52, status: 'offline' },
  { name: 'Kenji', days: 9, timezone: 'UTC+9', overlap: 0.64, status: 'online' },
]

export const BUDDY_RULES = [
  '每天互相看到对方是否打卡，不需要解释原因',
  '冲动时可以一键呼叫，对方收到的是"需要说说话"，不是"我破戒了"',
  '不评判、不说教、不追问细节',
  '连续 3 天未打卡时，伙伴会收到提醒，可以主动问一句',
]

/** 给伙伴看的最小状态卡：只暴露天数与打卡，不暴露复发细节 */
export function shareCard(state: AppState, now: Date = new Date()) {
  const risk = predictRiskWindow({ relapses: state.relapses, urgeEvents: state.urgeEvents, assessment: state.assessment })
  return {
    name: state.name,
    days: streakDays(state.streakStart, now),
    checkedInToday: Boolean(state.logs[todayKey(now)]?.checkedIn),
    riskWindow: risk,
  }
}
