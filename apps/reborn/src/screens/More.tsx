import { useState } from 'react'
import { Card, Sheet } from '../components/ui'
import { QUESTIONS } from '../data/assessment'
import { VISUAL_TOOLS } from '../data/education'
import { daysBetween, todayKey } from '../lib/date'
import { useStore } from '../state/store'
import type { Tab } from '../App'

const ENTRIES: { tab: Tab; icon: string; label: string; desc: string }[] = [
  { tab: 'learn', icon: '📚', label: '危害认知中心', desc: '身体 / 心理 / 关系 / 大脑 四维科普 + 脱敏训练' },
  { tab: 'energy', icon: '🌿', label: '能量提升', desc: '每日任务 · 古法功法库 · 膳食调理' },
  { tab: 'shop', icon: '🛍️', label: '商城', desc: '皮肤、栖息地、宝箱、实体周边' },
  { tab: 'community', icon: '👥', label: '社区', desc: '匿名广场 · 分组互助 · 导师问答' },
]

export function More({ go }: { go: (tab: Tab) => void }) {
  const { state, dispatch } = useStore()
  const [reassessing, setReassessing] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [answers, setAnswers] = useState<Record<string, number>>(state.assessment?.answers ?? {})

  const sinceReassessment = state.lastReassessment ? daysBetween(state.lastReassessment, todayKey()) : null
  const canReassess = sinceReassessment === null || sinceReassessment >= 7

  return (
    <div className="screen">
      <h1>更多</h1>

      {ENTRIES.map((e) => (
        <Card key={e.tab} onClick={() => go(e.tab)}>
          <div className="row">
            <div>
              <div className="card-title" style={{ marginBottom: 2 }}>
                {e.icon} {e.label}
              </div>
              <p className="small muted" style={{ margin: 0 }}>
                {e.desc}
              </p>
            </div>
            <span className="muted">→</span>
          </div>
        </Card>
      ))}

      <h2>动态调整</h2>
      <Card>
        <div className="card-title">每 7 天复评一次</div>
        <p className="small muted" style={{ marginTop: 0 }}>
          {sinceReassessment === null
            ? '尚未做过复评。'
            : canReassess
              ? `距上次复评已 ${sinceReassessment} 天，建议现在复评。`
              : `距上次复评 ${sinceReassessment} 天，${7 - sinceReassessment} 天后可再次复评。`}
        </p>
        <button className="btn primary" disabled={!canReassess} onClick={() => setReassessing(true)}>
          开始复评
        </button>
      </Card>

      <h2>视觉管理</h2>
      <Card>
        {VISUAL_TOOLS.map((t) => (
          <div key={t.id} className="task">
            <span className="label small">
              {t.name}
              <br />
              <span className="muted">{t.desc}</span>
            </span>
          </div>
        ))}
      </Card>

      <h2>设置</h2>
      <Card>
        <div className="row">
          <span className="small">昵称</span>
          <span className="small muted">{state.name}</span>
        </div>
        <div className="row">
          <span className="small">伙伴名字</span>
          <span className="small muted">{state.companion.name}</span>
        </div>
        <div className="row">
          <span className="small">数据存储</span>
          <span className="small muted">仅本机 localStorage</span>
        </div>
        <div className="row">
          <span className="small">世俗模式</span>
          <span className="small muted">{state.settings.secularMode ? '开启（不含宗教内容）' : '关闭'}</span>
        </div>
        <button className="btn danger" style={{ marginTop: 12 }} onClick={() => setConfirmReset(true)}>
          清空本地数据
        </button>
      </Card>

      <p className="disclaimer">
        Reborn 原型 · 所有数据保存在本机浏览器，不含账号系统与网络请求。
        本 App 提供健康自助内容，不构成医疗诊断或治疗建议；中医相关内容属传统经验范畴。
      </p>

      {reassessing && (
        <Sheet title="7 天复评" onClose={() => setReassessing(false)}>
          <p className="small muted">只需重答关键维度，方案与高风险时段会同步更新。</p>
          {QUESTIONS.filter((q) => ['freq', 'energy', 'sleep', 'anxiety', 'avoidance'].includes(q.id)).map((q) => (
            <div key={q.id} style={{ marginBottom: 14 }}>
              <div className="card-title">{q.title}</div>
              <div className="chips">
                {q.options.map((o) => (
                  <button
                    key={o.label}
                    className={`chip${answers[q.id] === o.value ? ' on' : ''}`}
                    onClick={() => setAnswers({ ...answers, [q.id]: o.value })}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button
            className="btn primary"
            onClick={() => {
              dispatch({ type: 'reassess', answers })
              setReassessing(false)
            }}
          >
            生成新方案
          </button>
        </Sheet>
      )}

      {confirmReset && (
        <Sheet title="确认清空？" onClose={() => setConfirmReset(false)}>
          <p className="small muted">
            这会删除本机上的全部记录：天数、打卡、金币、伙伴状态与测评报告。此操作不可恢复。
          </p>
          <button
            className="btn danger"
            onClick={() => {
              dispatch({ type: 'reset' })
              setConfirmReset(false)
            }}
          >
            我确认，清空
          </button>
          <button className="btn ghost" onClick={() => setConfirmReset(false)}>
            取消
          </button>
        </Sheet>
      )}
    </div>
  )
}
