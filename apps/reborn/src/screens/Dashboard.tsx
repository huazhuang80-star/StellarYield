import { useMemo } from 'react'
import { Bar, Card, Stat } from '../components/ui'
import { TRIGGER_LABELS } from '../data/assessment'
import { MILESTONES } from '../data/milestones'
import { recentKeys } from '../lib/date'
import { checkinStreak, companionStage, levelOf } from '../lib/progress'
import { formatWindow, predictRiskWindow } from '../lib/risk'
import { buildDailyTasks } from '../lib/tasks'
import { SEVERITY_LABELS } from '../lib/assessment'
import { useStore } from '../state/store'
import type { TriggerId } from '../types'

/** 数据仪表盘（PRD 6.3）+ 个人成瘾模式图谱（PRD 5.1.3） */
export function Dashboard() {
  const { state, days } = useStore()
  const level = levelOf(days)
  const tasks = useMemo(() => buildDailyTasks({ assessment: state.assessment, level, unlocked: state.unlocked }), [state.assessment, level, state.unlocked])
  const last14 = recentKeys(14)
  const risk = predictRiskWindow({ relapses: state.relapses, urgeEvents: state.urgeEvents, assessment: state.assessment })

  const completion = last14.map((k) => {
    const log = state.logs[k]
    if (!log) return 0
    const done = tasks.filter((t) => log.tasks[t.id]).length
    return tasks.length ? done / tasks.length : 0
  })

  const moodSeries = last14.map((k) => state.logs[k]?.mood ?? null)
  const urgeWins = state.urgeEvents.filter((u) => u.resolution !== 'relapse').length
  const practiceMinutes = Object.values(state.logs).reduce(
    (sum, log) => sum + Object.keys(log.tasks).filter((id) => id.startsWith('ex-') && log.tasks[id]).length * 15,
    0,
  )

  // 个人成瘾模式图谱：复发记录按诱因聚合
  const patternMap = useMemo(() => {
    const map = new Map<TriggerId, number>()
    state.relapses.forEach((r) => map.set(r.trigger, (map.get(r.trigger) ?? 0) + 1))
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [state.relapses])

  return (
    <div className="screen">
      <h1>数据仪表盘</h1>
      <p className="small muted">时间 · 身体 · 心理 · 能量 · 成就，五维追踪</p>

      <div className="grid" style={{ marginTop: 14 }}>
        <Stat n={days} k="当前天数" />
        <Stat n={Math.max(state.longestStreak, days)} k="最长记录" />
        <Stat n={checkinStreak(state.logs)} k="连续打卡" />
      </div>
      <div className="grid" style={{ marginTop: 10 }}>
        <Stat n={state.coins} k="金币余额" />
        <Stat n={urgeWins} k="度过冲动" />
        <Stat n={`${practiceMinutes}′`} k="功法时长" />
      </div>

      <h2>任务完成率（近 14 天）</h2>
      <Card>
        <div className="spark">
          {completion.map((v, i) => (
            <i key={last14[i]} className={v === 0 ? 'miss' : undefined} style={{ height: `${Math.max(4, v * 100)}%` }} title={`${last14[i]} · ${Math.round(v * 100)}%`} />
          ))}
        </div>
        <p className="small muted" style={{ marginBottom: 0 }}>
          灰色柱代表当天没有记录 —— 断链不扣分，只是提醒。
        </p>
      </Card>

      <h2>情绪与焦虑趋势</h2>
      <Card>
        {moodSeries.every((m) => m === null) ? (
          <p className="small muted" style={{ margin: 0 }}>
            还没有情绪记录。在「教练 → 晚间复盘」里记录一次，这里就会出现趋势线。
          </p>
        ) : (
          <div className="spark">
            {moodSeries.map((m, i) => (
              <i key={last14[i]} className={m === null ? 'miss' : undefined} style={{ height: `${Math.max(4, ((m ?? 0) / 10) * 100)}%` }} title={`${last14[i]} · ${m ?? '无记录'}`} />
            ))}
          </div>
        )}
      </Card>

      <h2>成瘾模式图谱</h2>
      <Card>
        {state.assessment && (
          <>
            <p className="small" style={{ marginTop: 0 }}>
              测评结论：<span className="tag">{SEVERITY_LABELS[state.assessment.severity]}</span> · 高风险时段{' '}
              <span className="tag jade">{formatWindow(risk)}</span>
            </p>
            {state.assessment.triggers.map((t) => (
              <div key={t.id} style={{ margin: '8px 0' }}>
                <div className="row small">
                  <span>{t.label}</span>
                  <span className="muted">{t.share}%</span>
                </div>
                <Bar value={t.share / 100} />
              </div>
            ))}
          </>
        )}
        {patternMap.length > 0 && (
          <>
            <div className="card-title" style={{ marginTop: 14 }}>
              实际复发归因（{state.relapses.length} 次）
            </div>
            {patternMap.map(([id, n]) => (
              <div key={id} className="row small">
                <span className="muted">{TRIGGER_LABELS[id]}</span>
                <span>{n} 次</span>
              </div>
            ))}
            <p className="small muted" style={{ marginBottom: 0 }}>
              测评预测与实际归因的差异，会在每 7 天复评时用于调整方案。
            </p>
          </>
        )}
      </Card>

      <h2>勋章墙</h2>
      <div className="badge-wall">
        {MILESTONES.map((m) => (
          <div key={m.id} className={`badge${days >= m.day ? '' : ' locked'}`} title={`${m.name} · Day ${m.day}`}>
            {m.emoji}
          </div>
        ))}
      </div>
      <p className="small muted center" style={{ marginTop: 8 }}>
        {companionStage(days).name} · 已解锁 {state.unlocked.length} 项内容
      </p>
    </div>
  )
}
