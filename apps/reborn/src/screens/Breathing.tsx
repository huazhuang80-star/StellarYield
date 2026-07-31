import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, Sheet } from '../components/ui'
import { PageHeader, Segmented, useToast } from '../components/shell'
import { BREATH_PATTERNS, MEDITATIONS, type BreathPattern } from '../data/breathing'
import { formatClock } from '../lib/date'
import { useStore } from '../state/store'
import type { Tab } from '../App'

/** 呼吸与冥想训练：动画圆环按阶段缩放，节奏完全由数据驱动 */
export function Breathing({ go }: { go: (tab: Tab) => void }) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [tab, setTab] = useState<'breath' | 'meditate'>('breath')
  const [active, setActive] = useState<BreathPattern | null>(null)
  const [meditation, setMeditation] = useState<string | null>(null)

  const track = MEDITATIONS.find((m) => m.id === meditation) ?? null

  return (
    <div className="screen">
      <PageHeader title="呼吸与冥想" subtitle="随时可用的调节工具" onBack={() => go('more')} />

      <Segmented
        label="类型"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'breath', label: '呼吸训练' },
          { value: 'meditate', label: '冥想引导' },
        ]}
      />

      {tab === 'breath' &&
        BREATH_PATTERNS.map((p) => (
          <Card key={p.id} onClick={() => setActive(p)}>
            <div className="row">
              <div className="card-title" style={{ marginBottom: 0 }}>
                {p.name}
                <span className="chip">{p.subtitle}</span>
              </div>
              <span className="small muted">{p.rounds} 轮</span>
            </div>
            <p className="small muted" style={{ margin: '6px 0 0' }}>
              {p.purpose} · {p.when}
            </p>
          </Card>
        ))}

      {tab === 'meditate' && (
        <>
          {MEDITATIONS.map((m) => (
            <Card key={m.id} onClick={() => setMeditation(m.id)}>
              <div className="row">
                <div className="card-title" style={{ marginBottom: 0 }}>
                  {m.name}
                  <span className="chip">{m.method}</span>
                </div>
                <span className="small muted">{m.minutes} 分钟</span>
              </div>
            </Card>
          ))}
          {state.settings.beliefMode !== 'secular' && (
            <Card tone="jade">
              <p className="small" style={{ margin: 0 }}>
                你选择了非世俗模式，冥想引导会保留你所属传统的表述。可在「设置 → 内容偏好」随时改回。
              </p>
            </Card>
          )}
        </>
      )}

      {active && (
        <BreathSession
          pattern={active}
          onClose={() => setActive(null)}
          onDone={() => {
            dispatch({ type: 'toggle-task', taskId: 'breathing' })
            dispatch({ type: 'award', key: `breath:${active.id}:${new Date().toDateString()}`, coins: 10 })
            toast(`完成 ${active.name}`, 'success')
            setActive(null)
          }}
        />
      )}

      {track && (
        <Sheet title={track.name} onClose={() => setMeditation(null)}>
          <p className="small muted">
            {track.method} · 建议 {track.minutes} 分钟
          </p>
          <ol className="small" style={{ paddingLeft: 18 }}>
            {track.guide.map((g) => (
              <li key={g} style={{ marginBottom: 6 }}>
                {g}
              </li>
            ))}
          </ol>
          <MeditationTimer minutes={track.minutes} onDone={() => toast('冥想完成', 'success')} />
        </Sheet>
      )}
    </div>
  )
}

/** 呼吸会话：按阶段推进，圆环缩放与阶段时长严格对应 */
function BreathSession({ pattern, onClose, onDone }: { pattern: BreathPattern; onClose: () => void; onDone: () => void }) {
  const [round, setRound] = useState(1)
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [left, setLeft] = useState(pattern.phases[0].seconds)
  const [running, setRunning] = useState(true)
  const phase = pattern.phases[phaseIdx]

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setLeft((prev) => {
        if (prev > 1) return prev - 1
        // 阶段结束：切下一阶段，最后一阶段则进入下一轮
        setPhaseIdx((pi) => {
          const nextIdx = (pi + 1) % pattern.phases.length
          if (nextIdx === 0) setRound((r) => r + 1)
          return nextIdx
        })
        return 0
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running, pattern.phases.length])

  useEffect(() => {
    setLeft(pattern.phases[phaseIdx].seconds)
  }, [phaseIdx, pattern.phases])

  useEffect(() => {
    if (round > pattern.rounds) onDone()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round])

  return (
    <Sheet title={`${pattern.name} · 第 ${Math.min(round, pattern.rounds)}/${pattern.rounds} 轮`} onClose={onClose}>
      <div className="breath-stage">
        <div
          className="breath-circle"
          style={{ transform: `scale(${phase.scale})`, transitionDuration: `${phase.seconds}s` }}
        >
          <div>
            <div style={{ fontSize: 26, fontWeight: 700 }}>{left}</div>
            <div className="small">{phase.label}</div>
          </div>
        </div>
      </div>
      <p className="center small muted">{pattern.purpose}</p>
      <div className="btn-row">
        <button className="btn" onClick={() => setRunning(!running)}>
          {running ? '暂停' : '继续'}
        </button>
        <button className="btn primary" onClick={onDone}>
          结束并记录
        </button>
      </div>
    </Sheet>
  )
}

function MeditationTimer({ minutes, onDone }: { minutes: number; onDone: () => void }) {
  const total = minutes * 60
  const [left, setLeft] = useState(total)
  const [running, setRunning] = useState(false)
  const doneRef = useRef(false)
  const pct = useMemo(() => 1 - left / total, [left, total])

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setLeft((p) => Math.max(0, p - 1)), 1000)
    return () => clearInterval(id)
  }, [running])

  useEffect(() => {
    if (left === 0 && !doneRef.current) {
      doneRef.current = true
      setRunning(false)
      onDone()
    }
  }, [left, onDone])

  return (
    <>
      <div className="countdown">{formatClock(left)}</div>
      <div className="bar">
        <i style={{ width: `${pct * 100}%` }} />
      </div>
      <div className="btn-row" style={{ marginTop: 12 }}>
        <button className="btn" onClick={() => setRunning(!running)}>
          {running ? '暂停' : left === total ? '开始' : '继续'}
        </button>
        <button
          className="btn ghost"
          onClick={() => {
            setLeft(total)
            setRunning(false)
            doneRef.current = false
          }}
        >
          重置
        </button>
      </div>
    </>
  )
}
