import type { AppState } from '../types'
import { todayKey } from './date'

export interface Backup {
  app: 'reborn'
  exportedAt: string
  stateVersion: number
  state: AppState
}

export function buildBackup(state: AppState, now: Date = new Date()): Backup {
  return { app: 'reborn', exportedAt: now.toISOString(), stateVersion: state.version, state }
}

export function backupFilename(state: AppState, now: Date = new Date()): string {
  return `reborn-backup-${todayKey(now)}-day${Math.max(0, state.longestStreak)}.json`
}

export type ParseResult = { ok: true; state: AppState } | { ok: false; error: string }

/**
 * 解析导入文件。宁可拒绝也不要把坏数据写进存档 —— 一次错误导入会毁掉用户几个月的记录。
 * 同时接受两种形态：完整备份包，或直接的 state 对象（方便手工编辑后导入）。
 */
export function parseBackup(text: string): ParseResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: '不是有效的 JSON 文件' }
  }
  if (!raw || typeof raw !== 'object') return { ok: false, error: '文件内容不是一个对象' }

  const candidate = 'state' in (raw as Record<string, unknown>) ? (raw as { state: unknown }).state : raw
  if (!candidate || typeof candidate !== 'object') return { ok: false, error: '找不到存档内容' }

  const s = candidate as Partial<AppState>
  if (typeof s.streakStart !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s.streakStart)) {
    return { ok: false, error: '缺少有效的起始日期（streakStart），可能不是 Reborn 的备份' }
  }
  if (s.logs !== undefined && (typeof s.logs !== 'object' || Array.isArray(s.logs))) {
    return { ok: false, error: '打卡记录（logs）格式不正确' }
  }
  if (s.coins !== undefined && typeof s.coins !== 'number') {
    return { ok: false, error: '金币字段格式不正确' }
  }

  return { ok: true, state: candidate as AppState }
}

/** 导入前给用户看的摘要，让他知道会覆盖成什么 */
export function summarize(state: AppState): { k: string; v: string }[] {
  return [
    { k: '昵称', v: state.name ?? '未命名' },
    { k: '起始日', v: state.streakStart },
    { k: '最长记录', v: `${state.longestStreak ?? 0} 天` },
    { k: '打卡天数', v: `${Object.values(state.logs ?? {}).filter((l) => l.checkedIn).length} 天` },
    { k: '复发记录', v: `${(state.relapses ?? []).length} 次` },
    { k: '金币', v: `${state.coins ?? 0}` },
  ]
}
