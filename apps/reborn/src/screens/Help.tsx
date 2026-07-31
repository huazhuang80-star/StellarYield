import { useMemo, useState } from 'react'
import { Card, Collapse, Sheet } from '../components/ui'
import { EmptyState, PageHeader, Segmented, useToast } from '../components/shell'
import { FAQ, GLOSSARY, QUICK_START, type FaqItem } from '../data/help'
import type { Tab } from '../App'

type Tab2 = 'start' | 'faq' | 'glossary'
const CATEGORIES: FaqItem['category'][] = ['入门', '功能', '康复', '数据与隐私', '会员']

export function Help({ go }: { go: (tab: Tab) => void }) {
  const toast = useToast()
  const [tab, setTab] = useState<Tab2>('start')
  const [category, setCategory] = useState<FaqItem['category'] | '全部'>('全部')
  const [query, setQuery] = useState('')
  const [feedback, setFeedback] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')

  const faqs = useMemo(() => {
    const byCategory = category === '全部' ? FAQ : FAQ.filter((f) => f.category === category)
    const q = query.trim().toLowerCase()
    return q ? byCategory.filter((f) => (f.q + f.a).toLowerCase().includes(q)) : byCategory
  }, [category, query])

  return (
    <div className="screen">
      <PageHeader title="帮助中心" subtitle="快速上手 · 常见问题 · 术语表" onBack={() => go('more')} />

      <Segmented<Tab2>
        label="分区"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'start', label: '快速上手' },
          { value: 'faq', label: '常见问题' },
          { value: 'glossary', label: '术语表' },
        ]}
      />

      {tab === 'start' && (
        <>
          {QUICK_START.map((s) => (
            <Card key={s.step}>
              <div className="card-title">
                <span className="chip on">{s.step}</span> {s.title}
              </div>
              <p className="small muted" style={{ margin: 0 }}>
                {s.desc}
              </p>
            </Card>
          ))}
          <Card tone="jade">
            <div className="card-title">如果只能记住一句</div>
            <p className="small" style={{ margin: 0 }}>
              少而稳定胜过多而崩盘。累的时候把标准降到两项，保持不断链比刷满进度条重要得多。
            </p>
          </Card>
        </>
      )}

      {tab === 'faq' && (
        <>
          <input type="text" value={query} placeholder="搜索问题…" onChange={(e) => setQuery(e.target.value)} aria-label="搜索常见问题" />
          <div className="chips" style={{ margin: '10px 0' }}>
            <button className={`chip${category === '全部' ? ' on' : ''}`} onClick={() => setCategory('全部')}>
              全部
            </button>
            {CATEGORIES.map((c) => (
              <button key={c} className={`chip${category === c ? ' on' : ''}`} onClick={() => setCategory(c)}>
                {c}
              </button>
            ))}
          </div>

          {faqs.length === 0 ? (
            <EmptyState icon="🔍" title="没有找到相关问题" desc="换个说法试试，或者直接给我们提交反馈。" />
          ) : (
            <Card>
              {faqs.map((f) => (
                <Collapse
                  key={f.id}
                  summary={
                    <span>
                      <span className="chip">{f.category}</span> {f.q}
                    </span>
                  }
                >
                  {f.a}
                </Collapse>
              ))}
            </Card>
          )}
        </>
      )}

      {tab === 'glossary' && (
        <Card>
          {GLOSSARY.map((g) => (
            <div key={g.term} className="task">
              <span className="label small">
                <strong>{g.term}</strong>
                <br />
                <span className="muted">{g.desc}</span>
              </span>
            </div>
          ))}
        </Card>
      )}

      <div className="list" style={{ marginTop: 14 }}>
        <button className="list-item" onClick={() => setFeedback(true)}>
          <span className="ico">✉️</span>
          <span className="body">
            <strong>提交反馈</strong>
            <span>功能建议、内容纠错、体验问题</span>
          </span>
          <span className="arrow">›</span>
        </button>
        <button className="list-item" onClick={() => go('legal')}>
          <span className="ico">🆘</span>
          <span className="body">
            <strong>紧急求助资源</strong>
            <span>心理危机热线与就医建议</span>
          </span>
          <span className="arrow">›</span>
        </button>
      </div>

      {feedback && (
        <Sheet title="提交反馈" onClose={() => setFeedback(false)}>
          <p className="small muted">
            原型阶段没有后端，反馈会存在本机的日志里，方便你自己整理后一次性发给我们。内容纠错尤其欢迎。
          </p>
          <textarea rows={5} value={feedbackText} placeholder="你遇到了什么？期望是什么？" onChange={(e) => setFeedbackText(e.target.value)} />
          <button
            className="btn primary"
            style={{ marginTop: 10 }}
            disabled={!feedbackText.trim()}
            onClick={() => {
              try {
                const key = 'reborn:feedback'
                const prev = JSON.parse(localStorage.getItem(key) ?? '[]') as unknown[]
                localStorage.setItem(key, JSON.stringify([...prev, { at: new Date().toISOString(), text: feedbackText }]))
              } catch {
                // 隐私模式下写入失败不影响主流程
              }
              setFeedbackText('')
              setFeedback(false)
              toast('已记录，感谢你的反馈', 'success')
            }}
          >
            提交
          </button>
        </Sheet>
      )}
    </div>
  )
}
