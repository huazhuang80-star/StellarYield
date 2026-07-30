import { useEffect, useRef, useState } from 'react'
import { Card } from '../components/ui'
import { EVENING_QUESTIONS, MORNING_QUESTIONS, careMessage, coachReply } from '../lib/coach'
import { recentKeys, todayKey } from '../lib/date'
import { daysSinceLastCheckin } from '../lib/progress'
import { currentSlot } from '../lib/tasks'
import { useStore } from '../state/store'

/** AI 康复教练（PRD 6.1）—— 原型用规则引擎，接口与 LLM 版本一致 */
export function Coach() {
  const { state, dispatch, days } = useStore()
  const [input, setInput] = useState('')
  const [mood, setMood] = useState(6)
  const [anxiety, setAnxiety] = useState(5)
  const [note, setNote] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  const slot = currentSlot()
  const questions = slot === 'morning' ? MORNING_QUESTIONS : EVENING_QUESTIONS
  const care = careMessage(daysSinceLastCheckin(state.logs) ?? 0, state.name)
  const todayLog = state.logs[todayKey()]

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.coachLog.length])

  function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    const at = new Date().toISOString()
    dispatch({ type: 'coach-send', message: { role: 'user', text: trimmed, at } })
    const reply = coachReply(
      trimmed,
      { days, anxiety: state.assessment?.psych.anxiety ?? 5, topTrigger: state.assessment?.triggers[0]?.label, assessment: state.assessment },
      state.coachLog.length,
    )
    dispatch({ type: 'coach-send', message: { role: 'coach', text: reply, at } })
    setInput('')
  }

  return (
    <div className="screen">
      <h1>AI 康复教练</h1>
      <p className="small muted">原型阶段为本地规则引擎（CBT 话术），不上传任何对话内容。</p>

      {care && (
        <Card tone="warn">
          <div className="card-title">💛 危机关怀</div>
          <p className="small" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {care}
          </p>
        </Card>
      )}

      <Card tone="jade">
        <div className="card-title">{slot === 'morning' ? '☀️ 晨间诊断' : '🌙 晚间复盘'}</div>
        {questions.map((q) => (
          <p key={q.id} className="small muted" style={{ margin: '4px 0' }}>
            · {q.text}
          </p>
        ))}
        <div className="meter-label">
          <span>情绪 {mood}/10</span>
          <span>焦虑 {anxiety}/10</span>
        </div>
        <input type="range" min={1} max={10} value={mood} onChange={(e) => setMood(Number(e.target.value))} />
        <input type="range" min={1} max={10} value={anxiety} onChange={(e) => setAnxiety(Number(e.target.value))} />
        <textarea rows={2} value={note} placeholder="今天最小的一个胜利…" onChange={(e) => setNote(e.target.value)} />
        <button
          className="btn primary"
          style={{ marginTop: 10 }}
          onClick={() => {
            dispatch({ type: 'log-mood', mood, anxiety, note })
            send(note || `今天情绪 ${mood}，焦虑 ${anxiety}`)
            setNote('')
          }}
        >
          {todayLog?.mood ? '更新今日记录' : '记录并生成建议'}
        </button>
      </Card>

      <h2>对话</h2>
      {state.coachLog.length === 0 && (
        <Card>
          <p className="small muted" style={{ margin: 0 }}>
            试着说：「我现在有冲动」「昨晚破戒了」「为什么我会这样」「今天很累」。
          </p>
        </Card>
      )}
      {state.coachLog.map((m, i) => (
        <div key={`${m.at}-${i}`} className={`msg ${m.role}`}>
          {m.text}
        </div>
      ))}
      <div ref={endRef} />

      <div className="btn-row" style={{ marginTop: 12 }}>
        <input
          type="text"
          value={input}
          placeholder="我现在感觉…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send(input)
          }}
        />
        <button className="btn primary" style={{ width: 84 }} onClick={() => send(input)}>
          发送
        </button>
      </div>

      <h2>本周报告</h2>
      <Card>
        <p className="small" style={{ marginTop: 0 }}>
          · 坚守天数：{days} 天
          <br />· 本周打卡：{recentKeys(7).filter((k) => state.logs[k]?.checkedIn).length}/7 天
          <br />· 度过冲动：{state.urgeEvents.filter((u) => u.resolution !== 'relapse').length} 次
          <br />· 复发：{state.relapses.length} 次
        </p>
        <p className="small muted" style={{ marginBottom: 0 }}>
          {state.lastReassessment && `上次复评：${state.lastReassessment}。`}每 7 天建议复评一次，方案会随之调整。
        </p>
      </Card>

      <p className="disclaimer">
        AI 教练不是心理治疗，也不能处理紧急情况。若出现自伤或伤害他人的念头，请立即联系当地紧急服务或专业心理危机热线。
      </p>
    </div>
  )
}
