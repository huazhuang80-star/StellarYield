import { useMemo, useState } from 'react'
import { Card, Collapse, Sheet } from '../components/ui'
import { EDU_ARTICLES, EDU_DIMENSION_LABELS, VISUAL_TOOLS, type EduDimension } from '../data/education'
import { URGE_LEVELS } from '../data/urge'
import { useStore } from '../state/store'

/** 模块二：危害认知与警示教育中心（PRD 5.2） */
export function Learn() {
  const { state } = useStore()
  const [dim, setDim] = useState<EduDimension | 'mine'>('mine')
  const [openId, setOpenId] = useState<string | null>(null)

  const topTriggers = state.assessment?.triggers.map((t) => t.id) ?? []
  const list = useMemo(() => {
    if (dim === 'mine') {
      const mine = EDU_ARTICLES.filter((a) => a.relevantTo?.some((t) => topTriggers.includes(t)))
      return mine.length > 0 ? mine : EDU_ARTICLES.slice(0, 4)
    }
    return EDU_ARTICLES.filter((a) => a.dimension === dim)
  }, [dim, topTriggers])

  const article = EDU_ARTICLES.find((a) => a.id === openId) ?? null

  return (
    <div className="screen">
      <h1>危害认知中心</h1>
      <p className="small muted">不恐吓，不贩卖焦虑 —— 用科学数据说话。</p>

      <div className="chips" style={{ margin: '14px 0' }}>
        <button className={`chip${dim === 'mine' ? ' on' : ''}`} onClick={() => setDim('mine')}>
          与你相关
        </button>
        {(Object.keys(EDU_DIMENSION_LABELS) as EduDimension[]).map((d) => (
          <button key={d} className={`chip${dim === d ? ' on' : ''}`} onClick={() => setDim(d)}>
            {EDU_DIMENSION_LABELS[d]}
          </button>
        ))}
      </div>

      {list.map((a) => (
        <Card key={a.id} onClick={() => setOpenId(a.id)}>
          <div className="card-title">{a.title}</div>
          <p className="small muted" style={{ margin: 0 }}>
            {a.form} · {a.minutes} 分钟 · {EDU_DIMENSION_LABELS[a.dimension]}
          </p>
        </Card>
      ))}

      <h2>冲动脱敏训练系统</h2>
      <Card>
        {URGE_LEVELS.map((l) => (
          <Collapse
            key={l.level}
            summary={
              <span>
                <span className="chip on">Level {l.level}</span> {l.name}
              </span>
            }
          >
            {l.content}
            <br />
            原理：{l.theory} · 建议时长 {l.minutes} 分钟
          </Collapse>
        ))}
      </Card>

      <h2>视觉管理工具</h2>
      {VISUAL_TOOLS.map((t) => (
        <Card key={t.id}>
          <div className="card-title">{t.name}</div>
          <p className="small muted" style={{ margin: 0 }}>
            {t.desc}
          </p>
        </Card>
      ))}

      <p className="disclaimer">
        科普内容整理自公开研究领域的共识性结论，用于健康教育，不构成医学诊断或治疗建议。个体差异较大，
        涉及躯体症状请咨询医生。
      </p>

      {article && (
        <Sheet title={article.title} onClose={() => setOpenId(null)}>
          <p className="small muted">
            {article.form} · 依据：{article.basis} · {article.minutes} 分钟
          </p>
          {article.body.map((p, i) => (
            <p key={i} className="small">
              {p}
            </p>
          ))}
          <button className="btn primary" onClick={() => setOpenId(null)}>
            读完了
          </button>
        </Sheet>
      )}
    </div>
  )
}
