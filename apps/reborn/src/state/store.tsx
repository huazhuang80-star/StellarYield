import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { MILESTONES } from '../data/milestones'
import { BOX_POOL, SHOP_ITEMS } from '../data/shop'
import { todayKey } from '../lib/date'
import { checkinStreak, restartStreak, streakDays } from '../lib/progress'
import { checkinReward, openBox } from '../lib/rewards'
import { scoreAssessment } from '../lib/assessment'
import type { AppState, CoachMessage, DayLog, RelapseRecord, UrgeEvent } from '../types'

const STORAGE_KEY = 'reborn:state:v1'
const STATE_VERSION = 1

function emptyLog(date: string): DayLog {
  return { date, tasks: {}, water: 0, checkedIn: false }
}

export function initialState(now: Date = new Date()): AppState {
  return {
    version: STATE_VERSION,
    onboarded: false,
    name: '朋友',
    streakStart: todayKey(now),
    longestStreak: 0,
    assessment: null,
    lastReassessment: null,
    logs: {},
    relapses: [],
    urgeEvents: [],
    coins: 0,
    boxes: 0,
    unlocked: [],
    claimedMilestones: [],
    companion: {
      name: '苍穹',
      hunger: 60,
      mood: 80,
      energy: 50,
      intimacy: 20,
      activeSkin: 'default',
      ownedSkins: ['default'],
      lastInteractionDate: todayKey(now),
      interactionsToday: [],
    },
    coachLog: [],
    seenEggs: [],
    settings: { delayLockUntil: null, grayscaleTip: false, secularMode: true },
  }
}

export type Action =
  | { type: 'onboard'; name: string; answers: Record<string, number>; startedDaysAgo: number }
  | { type: 'reassess'; answers: Record<string, number> }
  | { type: 'toggle-task'; taskId: string }
  | { type: 'add-water'; goal: number }
  | { type: 'checkin'; perfect: boolean; taskIds: string[] }
  | { type: 'mark-early-sleep' }
  | { type: 'log-mood'; mood: number; anxiety: number; note?: string }
  | { type: 'relapse'; record: Omit<RelapseRecord, 'at'> }
  | { type: 'log-urge'; event: Omit<UrgeEvent, 'at'> }
  | { type: 'start-delay-lock'; minutes: number }
  | { type: 'claim-milestone'; id: string }
  | { type: 'buy'; itemId: string }
  | { type: 'open-box'; roll: number; free: boolean }
  | { type: 'companion-interact'; kind: 'feed' | 'play' | 'train' | 'groom' }
  | { type: 'rename-companion'; name: string }
  | { type: 'set-skin'; skin: string }
  | { type: 'coach-send'; message: CoachMessage }
  | { type: 'see-egg'; id: string }
  | { type: 'unlock'; id: string }
  | { type: 'reset' }
  | { type: 'seed-demo'; state: AppState }

function withLog(state: AppState, date: string, patch: (log: DayLog) => DayLog): AppState {
  const log = state.logs[date] ?? emptyLog(date)
  return { ...state, logs: { ...state.logs, [date]: patch(log) } }
}

function clamp(n: number): number {
  return Math.min(100, Math.max(0, n))
}

export function reducer(state: AppState, action: Action, now: Date = new Date()): AppState {
  const today = todayKey(now)

  switch (action.type) {
    case 'onboard': {
      const start = new Date(now)
      start.setDate(start.getDate() - action.startedDaysAgo)
      return {
        ...state,
        onboarded: true,
        name: action.name.trim() || '朋友',
        streakStart: todayKey(start),
        assessment: scoreAssessment(action.answers, now),
        lastReassessment: today,
      }
    }

    case 'reassess':
      return { ...state, assessment: scoreAssessment(action.answers, now), lastReassessment: today }

    case 'toggle-task':
      return withLog(state, today, (log) => ({ ...log, tasks: { ...log.tasks, [action.taskId]: !log.tasks[action.taskId] } }))

    case 'add-water':
      return withLog(state, today, (log) => {
        const water = Math.min(action.goal, log.water + 1)
        return { ...log, water, tasks: { ...log.tasks, water: water >= action.goal } }
      })

    case 'mark-early-sleep':
      return withLog(state, today, (log) => ({ ...log, earlySleep: true, tasks: { ...log.tasks, 'early-sleep': true } }))

    case 'log-mood':
      return withLog(state, today, (log) => ({ ...log, mood: action.mood, anxiety: action.anxiety, note: action.note ?? log.note }))

    case 'checkin': {
      if (state.logs[today]?.checkedIn) return state
      const streak = checkinStreak(state.logs, now) + 1
      const reward = checkinReward({
        streak,
        perfect: action.perfect,
        earlyRise: now.getHours() === 6,
        earlySleep: Boolean(state.logs[today]?.earlySleep),
      })
      const next = withLog(state, today, (log) => ({ ...log, checkedIn: true }))
      return {
        ...next,
        coins: next.coins + reward.coins,
        boxes: next.boxes + (reward.box ? 1 : 0),
        companion: {
          ...next.companion,
          hunger: clamp(next.companion.hunger + 15),
          mood: clamp(next.companion.mood + 10),
          energy: clamp(next.companion.energy + 10),
        },
      }
    }

    case 'relapse': {
      const restarted = restartStreak(state, now)
      return {
        ...state,
        ...restarted,
        relapses: [...state.relapses, { ...action.record, at: now.toISOString() }],
        companion: { ...state.companion, mood: clamp(state.companion.mood - 25), energy: clamp(state.companion.energy - 15) },
      }
    }

    case 'log-urge':
      return {
        ...state,
        urgeEvents: [...state.urgeEvents, { ...action.event, at: now.toISOString() }],
        // 成功度过一次冲动同样值得奖励：意志力练习是核心行为
        coins: action.event.resolution === 'relapse' ? state.coins : state.coins + 15,
        companion:
          action.event.resolution === 'relapse'
            ? state.companion
            : { ...state.companion, intimacy: clamp(state.companion.intimacy + 5), energy: clamp(state.companion.energy + 5) },
      }

    case 'start-delay-lock':
      return { ...state, settings: { ...state.settings, delayLockUntil: now.getTime() + action.minutes * 60_000 } }

    case 'claim-milestone': {
      const ms = MILESTONES.find((m) => m.id === action.id)
      if (!ms || state.claimedMilestones.includes(ms.id)) return state
      if (streakDays(state.streakStart, now) < ms.day) return state
      return {
        ...state,
        coins: state.coins + ms.coins,
        claimedMilestones: [...state.claimedMilestones, ms.id],
        unlocked: Array.from(new Set([...state.unlocked, ...ms.unlocks])),
      }
    }

    case 'open-box': {
      const price = SHOP_ITEMS.find((i) => i.category === 'box')?.price ?? 50
      if (action.free ? state.boxes < 1 : state.coins < price) return state
      const prize = openBox(BOX_POOL, action.roll)
      return {
        ...state,
        boxes: state.boxes - (action.free ? 1 : 0),
        coins: state.coins - (action.free ? 0 : price) + prize.coins,
        unlocked: Array.from(new Set([...state.unlocked, prize.id])),
        companion: prize.id.startsWith('skin-')
          ? { ...state.companion, ownedSkins: Array.from(new Set([...state.companion.ownedSkins, prize.id])) }
          : state.companion,
      }
    }

    case 'buy': {
      const item = SHOP_ITEMS.find((i) => i.id === action.itemId)
      if (!item || item.category === 'box' || state.coins < item.price) return state
      return {
        ...state,
        coins: state.coins - item.price,
        unlocked: Array.from(new Set([...state.unlocked, item.id])),
        companion:
          item.category === 'skin'
            ? { ...state.companion, ownedSkins: Array.from(new Set([...state.companion.ownedSkins, item.id])), activeSkin: item.id }
            : state.companion,
      }
    }

    case 'companion-interact': {
      const fresh = state.companion.lastInteractionDate === today ? state.companion.interactionsToday : []
      if (fresh.includes(action.kind)) return state
      const deltas = {
        feed: { hunger: 25, mood: 5, energy: 5, intimacy: 2 },
        play: { hunger: -5, mood: 15, energy: -5, intimacy: 5 },
        train: { hunger: -10, mood: 5, energy: 15, intimacy: 3 },
        groom: { hunger: 0, mood: 8, energy: 0, intimacy: 8 },
      }[action.kind]
      return {
        ...state,
        companion: {
          ...state.companion,
          hunger: clamp(state.companion.hunger + deltas.hunger),
          mood: clamp(state.companion.mood + deltas.mood),
          energy: clamp(state.companion.energy + deltas.energy),
          intimacy: clamp(state.companion.intimacy + deltas.intimacy),
          lastInteractionDate: today,
          interactionsToday: [...fresh, action.kind],
        },
      }
    }

    case 'set-skin':
      if (!state.companion.ownedSkins.includes(action.skin)) return state
      return { ...state, companion: { ...state.companion, activeSkin: action.skin } }

    case 'rename-companion':
      return { ...state, companion: { ...state.companion, name: action.name.trim() || state.companion.name } }

    case 'coach-send':
      return { ...state, coachLog: [...state.coachLog, action.message] }

    case 'see-egg':
      return { ...state, seenEggs: Array.from(new Set([...state.seenEggs, `${today}:${action.id}`])) }

    case 'unlock':
      return { ...state, unlocked: Array.from(new Set([...state.unlocked, action.id])) }

    case 'seed-demo':
      return action.state

    case 'reset':
      return initialState(now)

    default:
      return state
  }
}

function load(): AppState {
  if (typeof localStorage === 'undefined') return initialState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState()
    const parsed = JSON.parse(raw) as AppState
    if (parsed.version !== STATE_VERSION) return initialState()
    return { ...initialState(), ...parsed }
  } catch {
    return initialState()
  }
}

interface Store {
  state: AppState
  dispatch: (action: Action) => void
  days: number
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer((s: AppState, a: Action) => reducer(s, a), undefined, load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // 隐私模式下 localStorage 可能不可写，原型允许静默降级为内存态
    }
  }, [state])

  const value = useMemo<Store>(() => ({ state, dispatch, days: streakDays(state.streakStart) }), [state])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore 必须在 StoreProvider 内使用')
  return ctx
}
