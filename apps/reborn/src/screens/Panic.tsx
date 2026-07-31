import { useEffect, useState } from 'react'
import { Bar, Card, Sheet, useCountdown } from '../components/ui'
import { TRIGGER_LABELS } from '../data/assessment'
import { CALM_SECONDS, ENERGY_TRANSFER_OPTIONS, GROUNDING_STEPS, REALITY_CHECK, URGE_LEVELS, URGE_WINDOW_SECONDS } from '../data/urge'
import { formatClock } from '../lib/date'
import { useStore } from '../state/store'
import type { TriggerId, UrgeEvent } from '../types'
import type { Tab } from '../App'

type Phase = 'calm' | 'menu' | 'grounding' | 'reality' | 'energy' | 'lock' | 'relapse'

/** 冲动急救中心（PRD 5.2.3 Panic Button + 5.2.4 视觉管理） */
export function Panic({ go }: { go: (tab: Tab) => void }) {
  const { state, dispatch } = useStore()
  const [phase, setPhase] = useState<Phase>('calm')
  const [intensity, setIntensity] = useState(6)
  const [groundStep, setGroundStep] = useState(0)
  const [checkIdx, setCheckIdx] = useState(0)
  const [done, setDone] = useState<string | null>(null)

  const calmLeft = useCountdown(CALM_SECONDS, phase === 'calm')
  const [windowStart] = useState(() => Date.now())
  const [windowLeft, setWindowLeft] = useState(URGE_WINDOW_SECONDS)

  useEffect(() => {
    const id = setInterval(() => setWindowLeft(Math.max(0, URGE_WINDOW_SECONDS - Math.round((Date.now() - windowStart) / 1000))), 500)
    return () => clearInterval(id)
  }, [windowStart])

  useEffect(() => {
    if (phase === 'calm' && calmLeft === 0) setPhase('menu')
  }, [phase, calmLeft])

  const lockLeftMs = state.settings.delayLockUntil ? state.settings.delayLockUntil - Date.now() : 0

  function resolve(resolution: UrgeEvent['resolution']) {
    dispatch({ type: 'log-urge', event: { intensity, resolution } })
    setDone(resolution)
  }

  // 结果页优先于各阶段视图：任一阶段完成后都应落到这里
  if (done) {
    return (
      <div className="screen">
        <div className="egg" style={{ paddingTop: 30 }}>
          <div className="art">{done === 'relapse' ? '🌱' : '🏆'}</div>
          <h1>{done === 'relapse' ? '已记录，明天继续' : '你刚刚赢了一次'}</h1>
          <p className="muted small">
            {done === 'relapse'
              ? '跌倒不可怕，重要的是站起来。你的历史最长记录已保留在数据里。'
              : '每一次不按旧回路行动，新的连接就强化一分（+15 金币）。'}
          </p>
        </div>
        <button className="btn primary" onClick={() => go('home')}>
          回到首页
        </button>
        {done !== 'relapse' && (
          <button className="btn ghost" onClick={() => go('coach')}>
            和 AI 教练聊聊刚才发生了什么
          </button>
        )}
      </div>
    )
  }

  if (phase === 'calm') {
    return (
      <div className="screen">
        <h1 className="center">⚠️ 冲动急救中心</h1>
        <p className="quote">“冲动是暂时的，但你的选择是永恒的。”</p>
        <div className="countdown">{calmLeft}</div>
        <p className="center small muted">冷静期 · 先什么都不做，只是呼吸</p>
        <Card>
          <div className="card-title">现在的冲动强度</div>
          <input type="range" min={1} max={10} value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} />
          <div className="row small muted">
            <span>1 轻微</span>
            <span style={{ color: 'var(--amber)' }}>{intensity}/10</span>
            <span>10 极强</span>
          </div>
        </Card>
        <button className="btn ghost" onClick={() => setPhase('menu')}>
          跳过冷静期
        </button>
      </div>
    )
  }

  if (phase === 'grounding') {
    const step = GROUNDING_STEPS[groundStep]
    return (
      <div className="screen">
        <h1>🧊 身体接地法</h1>
        <p className="small muted">5-4-3-2-1 感官练习 · 迷走神经刺激</p>
        <Bar value={(groundStep + 1) / GROUNDING_STEPS.length} />
        <Card tone="jade">
          <div className="countdown" style={{ fontSize: 60 }}>
            {step.count}
          </div>
          <p className="center" style={{ marginBottom: 0 }}>
            {step.prompt}
          </p>
        </Card>
        <button
          className="btn primary"
          onClick={() => {
            if (groundStep + 1 < GROUNDING_STEPS.length) setGroundStep(groundStep + 1)
            else resolve('grounding')
          }}
        >
          {groundStep + 1 < GROUNDING_STEPS.length ? '下一步' : '完成练习'}
        </button>
        <button className="btn ghost" onClick={() => setPhase('menu')}>
          返回急救菜单
        </button>
      </div>
    )
  }

  if (phase === 'reality') {
    return (
      <div className="screen">
        <h1>🔍 真相核查</h1>
        <p className="small muted">Level 1 认知重构 · CBT · 3 分钟</p>
        <Card>
          <p style={{ fontSize: 17, lineHeight: 1.7 }}>{REALITY_CHECK[checkIdx]}</p>
          <p className="small muted">不用回答给任何人，只要在心里说完整的一句话。</p>
        </Card>
        <button
          className="btn primary"
          onClick={() => {
            if (checkIdx + 1 < REALITY_CHECK.length) setCheckIdx(checkIdx + 1)
            else resolve('passed')
          }}
        >
          {checkIdx + 1 < REALITY_CHECK.length ? `下一问（${checkIdx + 1}/${REALITY_CHECK.length}）` : '我看清了，这不是真需求'}
        </button>
        <button className="btn ghost" onClick={() => setPhase('menu')}>
          返回
        </button>
      </div>
    )
  }

  if (phase === 'energy') {
    return (
      <div className="screen">
        <h1>💪 能量转移</h1>
        <p className="small muted">运动释放内啡肽替代多巴胺 · 立刻做，不要想</p>
        {ENERGY_TRANSFER_OPTIONS.map((opt) => (
          <button key={opt} className="option" onClick={() => resolve('energy')}>
            {opt} · 我已做完 →
          </button>
        ))}
        <button className="btn ghost" onClick={() => setPhase('menu')}>
          返回
        </button>
      </div>
    )
  }

  if (phase === 'lock') {
    const left = Math.max(0, Math.round(lockLeftMs / 1000))
    return (
      <div className="screen">
        <h1 className="center">⏳ 15 分钟延迟锁</h1>
        <div className="countdown">{formatClock(left)}</div>
        <p className="quote">
          你没有被禁止做任何事，只是把决定推迟了 15 分钟。
          <br />
          研究显示：多数冲动会在这个窗口内明显减弱。
        </p>
        <Card>
          <div className="card-title">这 15 分钟可以做的事</div>
          <p className="small muted" style={{ marginBottom: 0 }}>
            · 下楼走一圈，哪怕只是到门口
            <br />· 洗个冷水脸
            <br />· 把今天的一件小事写下来
          </p>
        </Card>
        {left === 0 ? (
          <>
            <p className="center small muted">锁已解除。现在你可以重新选择。</p>
            <button className="btn primary" onClick={() => setPhase('menu')}>
              我想再试一次
            </button>
            <button className="btn danger" onClick={() => setPhase('relapse')}>
              记录一次复发
            </button>
          </>
        ) : (
          <button className="btn" onClick={() => setPhase('grounding')}>
            等待期间做接地练习
          </button>
        )}
      </div>
    )
  }

  if (phase === 'relapse') {
    return <RelapseForm onDone={() => setDone('relapse')} />
  }

  return (
    <div className="screen">
      <h1 className="center">⚠️ 冲动急救中心</h1>
      <p className="quote">“冲动是暂时的，但你的选择是永恒的。”</p>
      <div className="countdown">{formatClock(windowLeft)} ⏱️</div>
      <p className="center small muted">15 分钟后冲动通常会消退</p>

      <Card>
        <div className="card-title">上次冲动之后，你感觉如何？</div>
        <p className="small muted" style={{ marginBottom: 0 }}>
          {state.urgeEvents.length > 0
            ? `你已经成功度过 ${state.urgeEvents.filter((u) => u.resolution !== 'relapse').length} 次冲动。理性的你知道答案。`
            : '回想最近一次结束后的 30 分钟——那是真实的反馈，不是此刻的预期。'}
        </p>
      </Card>

      <Card tone="jade" onClick={() => setPhase('grounding')}>
        <div className="card-title">🧊 身体接地法</div>
        <p className="small muted" style={{ margin: 0 }}>
          5-4-3-2-1 感官练习 · 开始 3 分钟练习 →
        </p>
      </Card>

      <Card onClick={() => setPhase('reality')}>
        <div className="card-title">🔍 真相核查</div>
        <p className="small muted" style={{ margin: 0 }}>
          Level 1 认知重构 · 这是真需求还是多巴胺在骗我 →
        </p>
      </Card>

      <Card onClick={() => setPhase('energy')}>
        <div className="card-title">💪 能量转移</div>
        <p className="small muted" style={{ margin: 0 }}>
          20 个俯卧撑 / 30 秒冲刺 · 我已做完 →
        </p>
      </Card>

      <Card onClick={() => go('coach')}>
        <div className="card-title">🤖 和 AI 教练聊聊</div>
        <p className="small muted" style={{ margin: 0 }}>
          “我现在感觉…” · 开始对话 →
        </p>
      </Card>

      <Card
        onClick={() => {
          dispatch({ type: 'log-urge', event: { intensity, resolution: 'buddy' } })
          setDone('buddy')
        }}
      >
        <div className="card-title">📞 联系问责伙伴</div>
        <p className="small muted" style={{ margin: 0 }}>
          你的伙伴 Mike 在线 · 发送消息 →
        </p>
      </Card>

      <h2>冲动脱敏训练</h2>
      {URGE_LEVELS.map((l) => (
        <div key={l.level} className="task">
          <span className="chip on">L{l.level}</span>
          <span className="label small">
            {l.name} · {l.content}
            <br />
            <span className="muted">{l.theory} · {l.minutes} 分钟</span>
          </span>
        </div>
      ))}

      <button
        className="btn danger"
        style={{ marginTop: 18 }}
        onClick={() => {
          dispatch({ type: 'start-delay-lock', minutes: 15 })
          dispatch({ type: 'log-urge', event: { intensity, resolution: 'delay-lock' } })
          setPhase('lock')
        }}
      >
        我还是想做
      </button>
      <p className="small muted center">选择后将启动 15 分钟延迟锁，不做评判。</p>
    </div>
  )
}

/** Relapse 后自动触发的复盘问卷（PRD 5.1.3） */
function RelapseForm({ onDone }: { onDone: () => void }) {
  const { dispatch } = useStore()
  const [trigger, setTrigger] = useState<TriggerId>('night-boredom')
  const [feeling, setFeeling] = useState('')
  const [regret, setRegret] = useState(5)
  const [open, setOpen] = useState(true)

  if (!open) return null

  return (
    <Sheet
      title="复盘问卷"
      onClose={() => {
        setOpen(false)
        onDone()
      }}
    >
      <p className="small muted">这份问卷不打分、不惩罚。它只用来找出模式，让下一次更容易。</p>

      <div className="card-title">这次的触发因素是？</div>
      {(Object.keys(TRIGGER_LABELS) as TriggerId[]).map((id) => (
        <button key={id} className={`option${trigger === id ? ' on' : ''}`} onClick={() => setTrigger(id)}>
          {TRIGGER_LABELS[id]}
        </button>
      ))}

      <div className="card-title" style={{ marginTop: 14 }}>
        当时的情绪？
      </div>
      <input type="text" value={feeling} placeholder="例如：累、烦、空虚、想逃避工作" onChange={(e) => setFeeling(e.target.value)} />

      <div className="card-title" style={{ marginTop: 14 }}>
        事后感受（1 平静 - 10 很糟）：{regret}
      </div>
      <input type="range" min={1} max={10} value={regret} onChange={(e) => setRegret(Number(e.target.value))} />

      <button
        className="btn primary"
        style={{ marginTop: 14 }}
        onClick={() => {
          dispatch({ type: 'relapse', record: { trigger, feeling: feeling.trim() || '未填写', regret } })
          dispatch({ type: 'log-urge', event: { intensity: 10, resolution: 'relapse' } })
          setOpen(false)
          onDone()
        }}
      >
        提交并重启计时
      </button>
    </Sheet>
  )
}
