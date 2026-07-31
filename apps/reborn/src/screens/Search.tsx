import { useMemo, useState } from 'react'
import { Card } from '../components/ui'
import { EmptyState, PageHeader } from '../components/shell'
import { HOT_QUERIES, INDEX, search } from '../lib/search'
import type { Tab } from '../App'

/** 全局搜索：科普、功法、调理、营养、呼吸、冥想、课程、训练、帮助、术语 */
export function Search({ go }: { go: (tab: Tab) => void }) {
  const [query, setQuery] = useState('')
  const results = useMemo(() => search(query), [query])

  return (
    <div className="screen">
      <PageHeader title="搜索" subtitle={`已索引 ${INDEX.length} 条内容`} onBack={() => go('home')} />

      <input
        type="search"
        value={query}
        autoFocus
        placeholder="搜索内容、功法、问题…"
        onChange={(e) => setQuery(e.target.value)}
        aria-label="搜索"
      />

      {query.trim() === '' && (
        <>
          <h2>试试这些</h2>
          <div className="chips">
            {HOT_QUERIES.map((q) => (
              <button key={q} className="chip" onClick={() => setQuery(q)}>
                {q}
              </button>
            ))}
          </div>
        </>
      )}

      {query.trim() !== '' && results.length === 0 && (
        <div style={{ marginTop: 16 }}>
          <EmptyState icon="🔍" title={`没有找到「${query}」`} desc="换个关键词试试，或者去帮助中心提交内容建议。" action={<button className="btn" onClick={() => go('help')}>去帮助中心</button>} />
        </div>
      )}

      {results.length > 0 && (
        <>
          <p className="small muted" style={{ marginTop: 14 }}>
            {results.length} 条结果
          </p>
          {results.map((r) => (
            <Card key={`${r.kind}-${r.id}`} onClick={() => go(r.target as Tab)}>
              <div className="row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="card-title" style={{ marginBottom: 2 }}>
                    <span className="chip">{r.kind}</span>
                    {r.title}
                  </div>
                  <p className="small muted" style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {r.snippet}
                  </p>
                </div>
                <span className="arrow muted">›</span>
              </div>
            </Card>
          ))}
        </>
      )}
    </div>
  )
}
