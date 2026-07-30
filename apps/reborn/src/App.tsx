import { useMemo, useState } from 'react'
import { Sheet } from './components/ui'
import { eggFor } from './lib/eggs'
import { todayKey } from './lib/date'
import { levelOf, perfectDayStreak } from './lib/progress'
import { buildDailyTasks } from './lib/tasks'
import { Coach } from './screens/Coach'
import { Community } from './screens/Community'
import { Companion } from './screens/Companion'
import { Dashboard } from './screens/Dashboard'
import { Energy } from './screens/Energy'
import { Home } from './screens/Home'
import { Learn } from './screens/Learn'
import { More } from './screens/More'
import { Onboarding } from './screens/Onboarding'
import { Panic } from './screens/Panic'
import { Shop } from './screens/Shop'
import { useStore } from './state/store'

export type Tab = 'home' | 'dashboard' | 'companion' | 'coach' | 'more' | 'learn' | 'energy' | 'panic' | 'shop' | 'community'

const NAV: { tab: Tab; icon: string; label: string }[] = [
  { tab: 'home', icon: '🏠', label: '首页' },
  { tab: 'dashboard', icon: '📊', label: '数据' },
  { tab: 'companion', icon: '🦅', label: '伙伴' },
  { tab: 'coach', icon: '💬', label: '教练' },
  { tab: 'more', icon: '⚙️', label: '更多' },
]

const EGG_ART: Record<string, string> = {
  progress: '🌱',
  cake: '🎂',
  meet: '🤝',
  fireworks: '🎆',
  sunrise: '🌅',
  stars: '🌌',
}

export function App() {
  const { state, dispatch, days } = useStore()
  const [tab, setTab] = useState<Tab>('home')
  const [eggDismissed, setEggDismissed] = useState(false)

  const level = levelOf(days)
  const taskIds = useMemo(
    () => buildDailyTasks({ assessment: state.assessment, level, unlocked: state.unlocked }).map((t) => t.id),
    [state.assessment, level, state.unlocked],
  )

  const egg = useMemo(() => {
    if (!state.onboarded) return null
    const today = todayKey()
    const lastRelapse = state.relapses.at(-1)
    return eggFor({
      hour: new Date().getHours(),
      afterRelapse: Boolean(lastRelapse && lastRelapse.at.slice(0, 10) === today && !state.logs[today]?.checkedIn),
      perfectStreak: perfectDayStreak(state.logs, () => taskIds),
      isBirthday: false,
      firstInvite: false,
    })
  }, [state.onboarded, state.relapses, state.logs, taskIds])

  const showEgg = egg && !eggDismissed && !state.seenEggs.includes(`${todayKey()}:${egg.id}`)

  if (!state.onboarded) {
    return (
      <div className="app">
        <Onboarding />
      </div>
    )
  }

  return (
    <div className="app">
      <div className="topbar">
        <span>Reborn</span>
        <span>
          🔔 <span className="coins">💎 {state.coins}</span>
        </span>
      </div>

      {tab === 'home' && <Home go={setTab} />}
      {tab === 'dashboard' && <Dashboard />}
      {tab === 'companion' && <Companion />}
      {tab === 'coach' && <Coach />}
      {tab === 'more' && <More go={setTab} />}
      {tab === 'learn' && <Learn />}
      {tab === 'energy' && <Energy />}
      {tab === 'shop' && <Shop />}
      {tab === 'community' && <Community />}
      {tab === 'panic' && <Panic go={setTab} />}

      {tab !== 'panic' && (
        <button className="panic-fab" onClick={() => setTab('panic')}>
          我有冲动
        </button>
      )}

      <nav className="nav">
        {NAV.map((n) => (
          <button key={n.tab} className={tab === n.tab ? 'on' : ''} onClick={() => setTab(n.tab)}>
            <span className="ico">{n.icon}</span>
            {n.label}
          </button>
        ))}
      </nav>

      {showEgg && (
        <Sheet
          title="🎁 彩蛋"
          onClose={() => {
            dispatch({ type: 'see-egg', id: egg.id })
            setEggDismissed(true)
          }}
        >
          <div className="egg">
            <div className="art">{EGG_ART[egg.visual] ?? '✨'}</div>
            <h1>{egg.title}</h1>
            <p className="muted small">{egg.text}</p>
          </div>
          <button
            className="btn primary"
            onClick={() => {
              dispatch({ type: 'see-egg', id: egg.id })
              setEggDismissed(true)
            }}
          >
            知道了
          </button>
        </Sheet>
      )}
    </div>
  )
}
