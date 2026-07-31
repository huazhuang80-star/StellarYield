import { useMemo, useState } from 'react'
import { Bar, Card, Sheet } from '../components/ui'
import { EDU_ARTICLES } from '../data/education'
import { WATER_GOAL } from '../data/nutrition'
import { todayKey } from '../lib/date'
import { checkinStreak, companionStage, levelOf, nextMilestone, pendingMilestones, stageProgress } from '../lib/progress'
import { formatWindow, inWindow, predictRiskWindow } from '../lib/risk'
import { checkinReward } from '../lib/rewards'
import { SLOT_LABELS, buildDailyTasks, currentSlot } from '../lib/tasks'
import { useStore } from '../state/store'
import type { Tab } from '../App'

export function Home({ go }: { go: (tab: Tab) => void }) {
  const { state, dispatch, days } = useStore()
  const [reward, setReward] = useState<ReturnType<typeof checkinReward> | null>(null)
  const [article, setArticle] = useState(() => {
    const top = state.assessment?.triggers[0]?.id
    return EDU_ARTICLES.find((a) => top && a.relevantTo?.includes(top)) ?? EDU_ARTICLES[0]
  })
  const [showArticle, setShowArticle] = useState(false)

  const level = levelOf(days)
  const tasks = useMemo(() => buildDailyTasks({ assessment: state.assessment, level, unlocked: state.unlocked }), [state.assessment, level, state.unlocked])
  const log = state.logs[todayKey()]
  const doneCount = tasks.filter((t) => log?.tasks[t.id]).length
  const perfect = doneCount === tasks.length
  const risk = useMemo(
    () => predictRiskWindow({ relapses: state.relapses, urgeEvents: state.urgeEvents, assessment: state.assessment }),
    [state.relapses, state.urgeEvents, state.assessment],
  )
  const stage = companionStage(days)
  const pending = pendingMilestones(days, state.claimedMilestones)
  const next = nextMilestone(days)
  const slot = currentSlot()
  const slotTasks = tasks.filter((t) => t.slot === slot)

  function doCheckin() {
    const streak = checkinStreak(state.logs) + 1
    setReward(checkinReward({ streak, perfect, earlyRise: new Date().getHours() === 6, earlySleep: Boolean(log?.earlySleep) }))
    dispatch({ type: 'checkin', perfect, taskIds: tasks.map((t) => t.id) })
  }

  return (
    <div className="screen">
      <div className="hero">
        <div className="greet">你好，{state.name}</div>
        <p className="days">
          今日已坚守 第<em>{days}</em>天 🔥
        </p>
        <div className="avatar" onClick={() => go('companion')}>
          {stage.emoji}
        </div>
        <p className="center small muted" style={{ marginTop: 0 }}>
          {state.companion.name} · {stage.name} · Level {level}
        </p>
      </div>

      {pending.length > 0 && (
        <Card tone="jade">
          <div className="card-title">🎉 里程碑达成：{pending[0].name}</div>
          <p className="small muted" style={{ marginTop: 0 }}>
            {pending[0].visual} · 奖励：{pending[0].reward}
          </p>
          <button className="btn amber" onClick={() => dispatch({ type: 'claim-milestone', id: pending[0].id })}>
            领取 +{pending[0].coins} 金币
          </button>
        </Card>
      )}

      <Card tone="warn">
        <div className="card-title">⚠️ 冲动风险预警</div>
        <p className="small" style={{ marginTop: 0 }}>
          {inWindow(risk) ? '你正处于历史高风险时段。' : `今晚 ${formatWindow(risk)} 是你的高风险时段。`}
          <br />
          <span className="muted">
            {risk.reason} · 置信度 {Math.round(risk.confidence * 100)}%
          </span>
        </p>
        <button className="btn" onClick={() => go('panic')}>
          设置今晚防护 →
        </button>
      </Card>

      <h2>{SLOT_LABELS[slot]}</h2>
      <div className="grid">
        {(slotTasks.length > 0 ? slotTasks : tasks).slice(0, 3).map((t) => {
          const done = Boolean(log?.tasks[t.id])
          return (
            <div key={t.id} className="stat" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22 }}>{t.icon}</div>
              <div className="k" style={{ margin: '4px 0 8px' }}>
                {t.label}
              </div>
              {t.goal ? (
                <button className="btn small" style={{ padding: '7px 8px', fontSize: 12 }} onClick={() => dispatch({ type: 'add-water', goal: WATER_GOAL })}>
                  {log?.water ?? 0}/{t.goal} 杯
                </button>
              ) : (
                <button
                  className={`btn${done ? '' : ' primary'}`}
                  style={{ padding: '7px 8px', fontSize: 12 }}
                  onClick={() => dispatch({ type: 'toggle-task', taskId: t.id })}
                >
                  {done ? '已完成' : '开始'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <Card>
        <div className="row">
          <span className="small muted">今日任务进度</span>
          <span className="small">
            {doneCount}/{tasks.length}
          </span>
        </div>
        <Bar value={tasks.length ? doneCount / tasks.length : 0} />
        <button className="btn primary" style={{ marginTop: 12 }} disabled={log?.checkedIn} onClick={doCheckin}>
          {log?.checkedIn ? `今日已打卡 · 连续 ${checkinStreak(state.logs)} 天` : perfect ? '打卡（完美日 +50）' : '每日打卡'}
        </button>
        <button className="btn ghost small" style={{ marginTop: 8 }} onClick={() => go('energy')}>
          查看全部 {tasks.length} 项能量任务 →
        </button>
      </Card>

      <Card onClick={() => setShowArticle(true)}>
        <div className="card-title">📚 今日危害科普</div>
        <p className="small" style={{ margin: '0 0 6px' }}>「{article.title}」</p>
        <span className="link small">阅读 {article.minutes} 分钟 →</span>
      </Card>

      {next && (
        <Card>
          <div className="row">
            <span className="small">
              下一里程碑：{next.emoji} {next.name}（Day {next.day}）
            </span>
            <span className="small muted">还剩 {next.day - days} 天</span>
          </div>
          <Bar value={stageProgress(days)} />
        </Card>
      )}

      {showArticle && (
        <Sheet title={article.title} onClose={() => setShowArticle(false)}>
          <p className="small muted">
            {article.form} · 依据：{article.basis}
          </p>
          {article.body.map((p, i) => (
            <p key={i} className="small">
              {p}
            </p>
          ))}
          <button
            className="btn"
            onClick={() => {
              const pool = EDU_ARTICLES.filter((a) => a.id !== article.id)
              setArticle(pool[Math.floor(days + doneCount) % pool.length])
            }}
          >
            换一篇
          </button>
        </Sheet>
      )}

      {reward && (
        <Sheet title="打卡成功" onClose={() => setReward(null)}>
          <div className="egg">
            <div className="art">{perfect ? '🎆' : '✅'}</div>
            <h1>+{reward.coins} 金币</h1>
          </div>
          {reward.breakdown.map((b) => (
            <div key={b.label} className="row small">
              <span className="muted">{b.label}</span>
              <span>+{b.coins}</span>
            </div>
          ))}
          {reward.box && (
            <p className="small" style={{ color: 'var(--amber)' }}>
              🎁 完美日额外获得 1 个神秘宝箱，去「商城 → 宝箱」免费开启
            </p>
          )}
          <button className="btn primary" style={{ marginTop: 12 }} onClick={() => setReward(null)}>
            继续
          </button>
        </Sheet>
      )}
    </div>
  )
}
