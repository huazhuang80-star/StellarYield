import { useMemo, useState } from 'react'
import { CONSTITUTION_ADVICE, CONSTITUTION_LABELS, QUESTIONS } from '../data/assessment'
import { AVOIDANCE_LABELS, SEVERITY_LABELS, scoreAssessment } from '../lib/assessment'
import { Bar, Card } from '../components/ui'
import { useStore } from '../state/store'

type Step = 'intro' | 'quiz' | 'report'

/** 模块一：智能测评与个性化诊断（PRD 5.1） */
export function Onboarding() {
  const { dispatch } = useStore()
  const [step, setStep] = useState<Step>('intro')
  const [name, setName] = useState('')
  const [startedDaysAgo, setStartedDaysAgo] = useState(0)
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})

  const q = QUESTIONS[idx]
  const report = useMemo(() => (step === 'report' ? scoreAssessment(answers) : null), [step, answers])

  if (step === 'intro') {
    return (
      <div className="screen">
        <div className="center" style={{ padding: '40px 0 10px' }}>
          <div className="avatar">🥚</div>
          <h1>Reborn · 重生</h1>
          <p className="muted small">
            戒只是止损，补才是增益。
            <br />
            先用 3 分钟做一次多维测评，我们据此生成属于你的方案。
          </p>
        </div>

        <Card>
          <div className="card-title">怎么称呼你？</div>
          <input type="text" value={name} placeholder="昵称（本地保存，不上传）" onChange={(e) => setName(e.target.value)} />
          <div className="card-title" style={{ marginTop: 16 }}>
            你已经坚持了几天？
          </div>
          <input
            type="number"
            min={0}
            max={3650}
            value={startedDaysAgo}
            onChange={(e) => setStartedDaysAgo(Math.max(0, Number(e.target.value) || 0))}
          />
          <p className="small muted" style={{ marginBottom: 0 }}>
            刚开始就填 0。今天即是 Day 0，明天是 Day 1。
          </p>
        </Card>

        <button className="btn primary" onClick={() => setStep('quiz')}>
          开始测评
        </button>
        <p className="disclaimer">
          本 App 提供健康自助与生活方式建议，不构成医疗诊断或治疗方案。其中的中医内容属传统经验范畴，非医疗建议。
          如出现持续的抑郁、自伤念头或躯体症状，请及时联系专业医疗机构。
        </p>
      </div>
    )
  }

  if (step === 'quiz') {
    return (
      <div className="screen">
        <div className="row" style={{ marginBottom: 12 }}>
          <span className="small muted">
            第 {idx + 1} / {QUESTIONS.length} 题
          </span>
          <button className="link" onClick={() => (idx === 0 ? setStep('intro') : setIdx(idx - 1))}>
            上一题
          </button>
        </div>
        <Bar value={(idx + 1) / QUESTIONS.length} />

        <h1 style={{ fontSize: 19, marginTop: 22 }}>{q.title}</h1>
        {q.hint && (
          <p className="small muted" style={{ marginTop: 0 }}>
            {q.hint}
          </p>
        )}

        <div style={{ marginTop: 14 }}>
          {q.options.map((opt) => (
            <button
              key={opt.label}
              className={`option${answers[q.id] === opt.value ? ' on' : ''}`}
              onClick={() => {
                setAnswers({ ...answers, [q.id]: opt.value })
                if (idx + 1 < QUESTIONS.length) setIdx(idx + 1)
                else setStep('report')
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (!report) return null
  const advice = CONSTITUTION_ADVICE[report.constitution]

  return (
    <div className="screen">
      <h1>你的康复诊断报告</h1>
      <p className="small muted">基于 {QUESTIONS.length} 项作答生成 · 每 7 天可复评一次</p>

      <Card>
        <div className="card-title">【成瘾程度】</div>
        <p style={{ margin: 0 }}>
          <span className="tag">{SEVERITY_LABELS[report.severity]}</span>{' '}
          <span className="muted small">每周约 {report.physical.frequencyPerWeek} 次</span>
        </p>
      </Card>

      <Card>
        <div className="card-title">【生理维度】</div>
        <div className="grid">
          <div className="stat">
            <div className="n">{report.physical.energy}</div>
            <div className="k">精力指数 /10</div>
          </div>
          <div className="stat">
            <div className="n">{report.physical.sleep}</div>
            <div className="k">睡眠质量 /10</div>
          </div>
          <div className="stat">
            <div className="n">{CONSTITUTION_LABELS[report.constitution]}</div>
            <div className="k">中医体质</div>
          </div>
        </div>
        <p className="small muted" style={{ marginBottom: 0 }}>
          {advice.desc}：{advice.advice.join('、')}
        </p>
      </Card>

      <Card tone={report.psych.anxiety >= 6 ? 'warn' : 'plain'}>
        <div className="card-title">【心理维度】{report.psych.anxiety >= 6 && <span className="tag">⚠️ 需重点关注</span>}</div>
        <p className="small" style={{ margin: 0 }}>
          · 焦虑指数：{report.psych.anxiety}/10
          <br />· 社交回避：{AVOIDANCE_LABELS[report.psych.avoidance]}
          <br />· 自我评价：{report.psych.selfEsteem}/10
        </p>
      </Card>

      <Card tone="jade">
        <div className="card-title">【核心诱因】🔍 识别完成</div>
        {report.triggers.map((t, i) => (
          <div key={t.id} style={{ margin: '8px 0' }}>
            <div className="row small">
              <span>
                {i + 1}. {t.label}
              </span>
              <span className="muted">占比 {t.share}%</span>
            </div>
            <Bar value={t.share / 100} />
          </div>
        ))}
      </Card>

      <Card>
        <div className="card-title">【康复周期预估】</div>
        <p style={{ margin: '0 0 10px' }}>
          {report.recoveryDays[0]}-{report.recoveryDays[1]} 天
        </p>
        <div className="card-title">【推荐方案】</div>
        <div className="chips">
          {report.plan.map((p) => (
            <span key={p} className="chip on">
              {p}
            </span>
          ))}
        </div>
      </Card>

      <button className="btn primary" onClick={() => dispatch({ type: 'onboard', name, answers, startedDaysAgo })}>
        进入 Reborn，开始 Day {startedDaysAgo}
      </button>
      <p className="disclaimer">
        报告由本地规则引擎生成，仅用于自我认知与方案推荐，不构成医学诊断。中医体质辨识属传统经验分类。
      </p>
    </div>
  )
}
