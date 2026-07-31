import { useEffect, useState } from 'react'
import { Bar, Card } from '../components/ui'
import { PageHeader, useToast } from '../components/shell'
import { EXERCISES } from '../data/exercises'
import { formatClock } from '../lib/date'
import { useStore } from '../state/store'
import type { Tab } from '../App'

/**
 * 功法播放器：分节步骤 + 计时器。
 * 正式版这里是视频播放器，原型用「步骤 + 节拍」保证动作顺序与时长是真的可跟练的。
 */
export function Practice({ exerciseId, go }: { exerciseId: string; go: (tab: Tab) => void }) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const exercise = EXERCISES.find((e) => e.id === exerciseId) ?? EXERCISES[0]
  const perStep = Math.max(30, Math.round((exercise.minutes * 60) / exercise.steps.length))

  const [step, setStep] = useState(0)
  const [left, setLeft] = useState(perStep)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    if (!running || finished) return
    const id = setInterval(() => {
      setLeft((prev) => {
        if (prev > 1) return prev - 1
        setStep((s) => {
          if (s + 1 >= exercise.steps.length) {
            setFinished(true)
            setRunning(false)
            return s
          }
          return s + 1
        })
        return perStep
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running, finished, perStep, exercise.steps.length])

  const totalDone = state.practiceMinutes[exercise.id] ?? 0

  if (finished) {
    return (
      <div className="screen">
        <div className="egg" style={{ paddingTop: 40 }}>
          <div className="art">🧘</div>
          <h1>{exercise.name} 完成</h1>
          <p className="muted small">
            {exercise.minutes} 分钟 · {exercise.effect}
          </p>
        </div>
        <button
          className="btn primary"
          onClick={() => {
            dispatch({ type: 'log-practice', exerciseId: exercise.id, minutes: exercise.minutes })
            dispatch({ type: 'award', key: `practice:${exercise.id}:${new Date().toDateString()}`, coins: 20 })
            toast(`+${exercise.minutes} 分钟练习记录，+20 金币`, 'success')
            go('energy')
          }}
        >
          记录并返回
        </button>
        <button className="btn ghost" onClick={() => { setStep(0); setLeft(perStep); setFinished(false) }}>
          再练一遍
        </button>
      </div>
    )
  }

  return (
    <div className="screen">
      <PageHeader
        title={exercise.name}
        subtitle={`${exercise.minutes} 分钟 · 难度 ${'⭐'.repeat(exercise.difficulty)} · ${exercise.effect}`}
        onBack={() => go('energy')}
      />

      <Card tone="jade">
        <div className="row">
          <span className="small muted">
            第 {step + 1}/{exercise.steps.length} 节
          </span>
          <span className="small muted">本节剩余</span>
        </div>
        <div className="countdown">{formatClock(left)}</div>
        <p className="center" style={{ fontSize: 17, margin: '4px 0 12px' }}>
          {exercise.steps[step]}
        </p>
        <Bar value={(step + (perStep - left) / perStep) / exercise.steps.length} />
      </Card>

      <div className="btn-row">
        <button className="btn" onClick={() => setRunning(!running)}>
          {running ? '暂停' : '开始跟练'}
        </button>
        <button
          className="btn"
          onClick={() => {
            if (step + 1 >= exercise.steps.length) setFinished(true)
            else {
              setStep(step + 1)
              setLeft(perStep)
            }
          }}
        >
          下一节 ›
        </button>
      </div>

      <h2>全部动作</h2>
      <Card>
        {exercise.steps.map((s, i) => (
          <div key={s} className="task">
            <span className={`chip${i === step ? ' on' : ''}`}>{i + 1}</span>
            <span className="label small" style={i < step ? { color: 'var(--text-dim)' } : undefined}>
              {s}
            </span>
          </div>
        ))}
      </Card>

      <h2>常见错误</h2>
      <Card>
        {exercise.mistakes.map((m) => (
          <p key={m} className="small muted" style={{ margin: '4px 0' }}>
            · {m}
          </p>
        ))}
      </Card>

      <Card>
        <div className="row small">
          <span className="muted">累计练习</span>
          <span>{totalDone} 分钟</span>
        </div>
      </Card>

      <p className="disclaimer">
        练习中如出现头晕、胸闷、关节疼痛请立即停止。功法属传统养生经验，孕期、术后或有慢性病者请先咨询医生。
      </p>
    </div>
  )
}
