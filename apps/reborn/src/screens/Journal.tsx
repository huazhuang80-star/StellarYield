import { useMemo, useState } from 'react'
import { Bar, Card, Sheet } from '../components/ui'
import { EmptyState, PageHeader, Segmented } from '../components/shell'
import { TRIGGER_LABELS } from '../data/assessment'
import { addDays, recentKeys, todayKey } from '../lib/date'
import { levelOf } from '../lib/progress'
import { buildDailyTasks } from '../lib/tasks'
import { useStore } from '../state/store'
import type { Tab } from '../App'

type View = 'timeline' | 'weekly' | 'events'

/** 日记与历史：把打卡、情绪、冲动与复发放在同一条时间线上 */
export function Journal({ go }: { go: (tab: Tab) => void }) {
  const { state, days } = useStore()
  const [view, setView] = useState<View>('timeline')
  const [openDate, setOpenDate] = useState<string | null>(null)

  const tasks = useMemo(
    () => buildDailyTasks({ assessment: state.assessment, level: levelOf(days), unlocked: state.unlocked }),
    [state.assessment, days, state.unlocked],
  )
  const last30 = recentKeys(30).reverse()
  const detail = openDate ? state.logs[openDate] : null

  const weeks = useMemo(() => {
    const out: { label: string; checkins: number; perfect: number; mood: number | null; urges: number; relapses: number }[] = []
    for (let w = 0; w < 4; w += 1) {
      const keys = Array.from({ length: 7 }, (_, i) => addDays(todayKey(), -(w * 7 + i)))
      const logs = keys.map((k) => state.logs[k]).filter(Boolean)
      const moods = logs.map((l) => l?.mood).filter((m): m is number => typeof m === 'number')
      out.push({
        label: w === 0 ? '本周' : `${w} 周前`,
        checkins: logs.filter((l) => l?.checkedIn).length,
        perfect: logs.filter((l) => l && tasks.every((t) => l.tasks[t.id])).length,
        mood: moods.length ? Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10 : null,
        urges: state.urgeEvents.filter((u) => keys.includes(u.at.slice(0, 10))).length,
        relapses: state.relapses.filter((r) => keys.includes(r.at.slice(0, 10))).length,
      })
    }
    return out
  }, [state.logs, state.urgeEvents, state.relapses, tasks])

  const events = useMemo(
    () =>
      [
        ...state.urgeEvents.map((u) => ({ at: u.at, kind: 'urge' as const, text: `冲动强度 ${u.intensity}/10 · ${RESOLUTION_LABELS[u.resolution]}` })),
        ...state.relapses.map((r) => ({ at: r.at, kind: 'relapse' as const, text: `复发 · ${TRIGGER_LABELS[r.trigger]} · 情绪：${r.feeling}` })),
      ].sort((a, b) => b.at.localeCompare(a.at)),
    [state.urgeEvents, state.relapses],
  )

  return (
    <div className="screen">
      <PageHeader title="日记与历史" subtitle="打卡、情绪、冲动与复发的完整记录" onBack={() => go('more')} />

      <Segmented<View>
        label="视图"
        value={view}
        onChange={setView}
        options={[
          { value: 'timeline', label: '时间线' },
          { value: 'weekly', label: '周报' },
          { value: 'events', label: '事件' },
        ]}
      />

      {view === 'timeline' &&
        (Object.keys(state.logs).length === 0 ? (
          <EmptyState icon="📓" title="还没有记录" desc="完成一次打卡或晚间复盘，这里就会出现你的第一条时间线。" action={<button className="btn primary" onClick={() => go('home')}>去首页打卡</button>} />
        ) : (
          <Card>
            {last30.map((k) => {
              const log = state.logs[k]
              const done = log ? tasks.filter((t) => log.tasks[t.id]).length : 0
              const relapsed = state.relapses.some((r) => r.at.slice(0, 10) === k)
              return (
                <button key={k} className="notif" onClick={() => log && setOpenDate(k)}>
                  <span className="small muted" style={{ flex: '0 0 74px' }}>
                    {k.slice(5)}
                  </span>
                  <span style={{ flex: 1 }}>
                    {log ? (
                      <>
                        <span className="small">
                          {log.checkedIn ? '✅ 已打卡' : '○ 未打卡'} · 任务 {done}/{tasks.length}
                          {typeof log.mood === 'number' && ` · 情绪 ${log.mood}/10`}
                          {relapsed && ' · 🌱 复发已记录'}
                        </span>
                        <Bar value={tasks.length ? done / tasks.length : 0} />
                      </>
                    ) : (
                      <span className="small muted">无记录</span>
                    )}
                  </span>
                </button>
              )
            })}
          </Card>
        ))}

      {view === 'weekly' &&
        weeks.map((w) => (
          <Card key={w.label}>
            <div className="row">
              <strong>{w.label}</strong>
              <span className="small muted">打卡 {w.checkins}/7</span>
            </div>
            <Bar value={w.checkins / 7} />
            <p className="small muted" style={{ margin: '8px 0 0' }}>
              完美日 {w.perfect} 天 · 平均情绪 {w.mood ?? '无记录'} · 冲动 {w.urges} 次 · 复发 {w.relapses} 次
            </p>
          </Card>
        ))}

      {view === 'events' &&
        (events.length === 0 ? (
          <EmptyState icon="🧊" title="还没有冲动记录" desc="用一次急救按钮后，这里会记录强度与你的应对方式 —— 它们是风险时段预测的原料。" />
        ) : (
          <Card>
            {events.map((e, i) => (
              <div key={`${e.at}-${i}`} className="task">
                <span className="chip">{e.at.slice(5, 10)}</span>
                <span className="label small" style={e.kind === 'relapse' ? { color: 'var(--amber)' } : undefined}>
                  {e.text}
                </span>
              </div>
            ))}
          </Card>
        ))}

      {detail && openDate && (
        <Sheet title={openDate} onClose={() => setOpenDate(null)}>
          <div className="row small">
            <span className="muted">打卡</span>
            <span>{detail.checkedIn ? '已完成' : '未打卡'}</span>
          </div>
          <div className="row small">
            <span className="muted">喝水</span>
            <span>{detail.water} 杯</span>
          </div>
          {typeof detail.mood === 'number' && (
            <div className="row small">
              <span className="muted">情绪 / 焦虑</span>
              <span>
                {detail.mood}/10 · {detail.anxiety ?? '—'}/10
              </span>
            </div>
          )}
          <div className="card-title" style={{ marginTop: 12 }}>
            当日任务
          </div>
          {tasks.map((t) => (
            <div key={t.id} className="row small">
              <span className="muted">
                {t.icon} {t.label}
              </span>
              <span>{detail.tasks[t.id] ? '✓' : '—'}</span>
            </div>
          ))}
          {detail.note && (
            <>
              <div className="card-title" style={{ marginTop: 12 }}>
                复盘
              </div>
              <p className="small muted">{detail.note}</p>
            </>
          )}
        </Sheet>
      )}
    </div>
  )
}

const RESOLUTION_LABELS: Record<string, string> = {
  grounding: '接地练习',
  energy: '能量转移',
  coach: 'AI 教练',
  buddy: '联系伙伴',
  'delay-lock': '延迟锁',
  passed: '自行度过',
  relapse: '复发',
}
