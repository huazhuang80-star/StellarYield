import { useMemo, useState } from 'react'
import { Sheet } from './components/ui'
import { useTheme } from './components/shell'
import { eggFor } from './lib/eggs'
import { todayKey } from './lib/date'
import { levelOf, perfectDayStreak } from './lib/progress'
import { unreadCount } from './lib/notifications'
import { buildDailyTasks } from './lib/tasks'
import { About } from './screens/About'
import { Breathing } from './screens/Breathing'
import { Buddy } from './screens/Buddy'
import { Coach } from './screens/Coach'
import { Community } from './screens/Community'
import { Companion } from './screens/Companion'
import { Courses } from './screens/Courses'
import { Dashboard } from './screens/Dashboard'
import { Energy } from './screens/Energy'
import { Help } from './screens/Help'
import { Home } from './screens/Home'
import { Journal } from './screens/Journal'
import { Learn } from './screens/Learn'
import { Legal } from './screens/Legal'
import { Membership } from './screens/Membership'
import { More } from './screens/More'
import { Notifications } from './screens/Notifications'
import { Onboarding } from './screens/Onboarding'
import { Panic } from './screens/Panic'
import { Practice } from './screens/Practice'
import { Profile } from './screens/Profile'
import { Search } from './screens/Search'
import { Settings } from './screens/Settings'
import { Shop } from './screens/Shop'
import { useStore } from './state/store'

export type Tab =
  | 'home'
  | 'dashboard'
  | 'companion'
  | 'coach'
  | 'more'
  | 'learn'
  | 'energy'
  | 'panic'
  | 'shop'
  | 'community'
  | 'notifications'
  | 'profile'
  | 'settings'
  | 'about'
  | 'legal'
  | 'help'
  | 'membership'
  | 'courses'
  | 'breathing'
  | 'practice'
  | 'journal'
  | 'buddy'
  | 'search'

const NAV: { tab: Tab; icon: string; label: string }[] = [
  { tab: 'home', icon: '🏠', label: '首页' },
  { tab: 'dashboard', icon: '📊', label: '数据' },
  { tab: 'companion', icon: '🦅', label: '伙伴' },
  { tab: 'coach', icon: '💬', label: '教练' },
  { tab: 'more', icon: '⚙️', label: '更多' },
]

/** 顶栏与底部导航只在这些主页面显示，二级页用自己的返回栏 */
const CHROME_TABS: Tab[] = ['home', 'dashboard', 'companion', 'coach', 'more', 'learn', 'energy', 'shop', 'community']

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
  const [practiceId, setPracticeId] = useState('course-jingang')
  const [eggDismissed, setEggDismissed] = useState(false)

  useTheme(state.settings.theme, state.settings.reduceMotion)

  const taskIds = useMemo(
    () => buildDailyTasks({ assessment: state.assessment, level: levelOf(days), unlocked: state.unlocked }).map((t) => t.id),
    [state.assessment, days, state.unlocked],
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
  const unread = useMemo(() => unreadCount(state), [state])

  /** 支持从功法库跳到播放器：go('practice') 前先记住是哪一套 */
  function go(next: Tab, payload?: string) {
    if (next === 'practice' && payload) setPracticeId(payload)
    setTab(next)
    window.scrollTo({ top: 0 })
  }

  if (!state.onboarded) {
    return (
      <div className="app">
        <Onboarding />
      </div>
    )
  }

  const showChrome = CHROME_TABS.includes(tab)

  return (
    <div className="app">
      {showChrome && (
        <div className="topbar">
          <button className="icon-btn" onClick={() => go('profile')} aria-label="个人资料">
            👤 <span className="small">{state.name}</span>
          </button>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="icon-btn" onClick={() => go('search')} aria-label="搜索">
              🔍
            </button>
            <button className="icon-btn" onClick={() => go('notifications')} aria-label={`通知，${unread} 条未读`}>
              🔔
              {unread > 0 && <span className="badge-count">{unread > 9 ? '9+' : unread}</span>}
            </button>
            <button className="coins" onClick={() => go('shop')} aria-label={`金币 ${state.coins}`}>
              💎 {state.coins}
            </button>
          </span>
        </div>
      )}

      {tab === 'home' && <Home go={go} />}
      {tab === 'dashboard' && <Dashboard />}
      {tab === 'companion' && <Companion />}
      {tab === 'coach' && <Coach />}
      {tab === 'more' && <More go={go} />}
      {tab === 'learn' && <Learn />}
      {tab === 'energy' && <Energy go={go} />}
      {tab === 'shop' && <Shop />}
      {tab === 'community' && <Community />}
      {tab === 'panic' && <Panic go={go} />}
      {tab === 'notifications' && <Notifications go={go} />}
      {tab === 'profile' && <Profile go={go} />}
      {tab === 'settings' && <Settings go={go} />}
      {tab === 'about' && <About go={go} />}
      {tab === 'legal' && <Legal go={go} />}
      {tab === 'help' && <Help go={go} />}
      {tab === 'membership' && <Membership go={go} />}
      {tab === 'courses' && <Courses go={go} />}
      {tab === 'breathing' && <Breathing go={go} />}
      {tab === 'practice' && <Practice exerciseId={practiceId} go={go} />}
      {tab === 'journal' && <Journal go={go} />}
      {tab === 'buddy' && <Buddy go={go} />}
      {tab === 'search' && <Search go={go} />}

      {tab !== 'panic' && (
        <button className="panic-fab" onClick={() => go('panic')}>
          我有冲动
        </button>
      )}

      {showChrome && (
        <nav className="nav" aria-label="主导航">
          {NAV.map((n) => (
            <button key={n.tab} className={tab === n.tab ? 'on' : ''} aria-current={tab === n.tab ? 'page' : undefined} onClick={() => go(n.tab)}>
              <span className="ico" aria-hidden="true">
                {n.icon}
              </span>
              {n.label}
            </button>
          ))}
        </nav>
      )}

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
