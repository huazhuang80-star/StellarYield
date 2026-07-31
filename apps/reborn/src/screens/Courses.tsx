import { useState } from 'react'
import { Bar, Card, Sheet } from '../components/ui'
import { PageHeader, useToast } from '../components/shell'
import { COURSES, LESSON_KIND_LABELS, type Course } from '../data/courses'
import { useStore } from '../state/store'
import type { Tab } from '../App'

/** 学习中心：把散落的科普与练习组织成有顺序的课程 */
export function Courses({ go }: { go: (tab: Tab) => void }) {
  const { state, dispatch, days } = useStore()
  const toast = useToast()
  const [open, setOpen] = useState<Course | null>(null)

  const doneCount = (c: Course) => c.lessons.filter((l) => state.unlocked.includes(`lesson:${c.id}:${l.id}`)).length
  const totalDone = COURSES.reduce((sum, c) => sum + doneCount(c), 0)
  const totalLessons = COURSES.reduce((sum, c) => sum + c.lessons.length, 0)

  return (
    <div className="screen">
      <PageHeader title="学习中心" subtitle={`${COURSES.length} 门课程 · ${totalLessons} 节`} onBack={() => go('more')} />

      <Card tone="jade">
        <div className="row">
          <span className="small">总进度</span>
          <span className="small muted">
            {totalDone}/{totalLessons} 节
          </span>
        </div>
        <Bar value={totalLessons ? totalDone / totalLessons : 0} />
      </Card>

      {COURSES.map((c) => {
        const locked = days < c.unlockDay
        const done = doneCount(c)
        return (
          <Card key={c.id} onClick={() => (locked ? toast(`Day ${c.unlockDay} 解锁`, 'warn') : setOpen(c))}>
            <div className="row">
              <div className="card-title" style={{ marginBottom: 0 }}>
                {c.name}
                <span className="chip">{c.level}</span>
              </div>
              <span className="small muted">
                {done}/{c.lessons.length}
              </span>
            </div>
            <p className="small muted" style={{ margin: '6px 0 8px' }}>
              {c.desc}
            </p>
            <Bar value={c.lessons.length ? done / c.lessons.length : 0} />
            {locked && (
              <p className="small" style={{ color: 'var(--amber)', margin: '8px 0 0' }}>
                🔒 Day {c.unlockDay} 解锁（还剩 {c.unlockDay - days} 天）
              </p>
            )}
          </Card>
        )
      })}

      {open && (
        <Sheet title={open.name} onClose={() => setOpen(null)}>
          <p className="small muted">{open.desc}</p>
          {open.lessons.map((l) => {
            const key = `lesson:${open.id}:${l.id}`
            const finished = state.unlocked.includes(key)
            return (
              <div key={l.id} className="task">
                <button
                  className={`box${finished ? ' on' : ''}`}
                  aria-label={finished ? '取消完成' : '标记完成'}
                  onClick={() => {
                    if (finished) return
                    dispatch({ type: 'unlock', id: key })
                    dispatch({ type: 'award', key: `lesson-coin:${key}`, coins: 20 })
                    toast(`完成「${l.title}」+20 金币`, 'success')
                  }}
                >
                  {finished ? '✓' : ''}
                </button>
                <span className="label small">
                  <strong>{l.title}</strong>
                  <br />
                  <span className="muted">
                    {LESSON_KIND_LABELS[l.kind]} · {l.minutes} 分钟 · {l.summary}
                  </span>
                </span>
              </div>
            )
          })}
          {open.lessons.some((l) => l.kind === 'read') && (
            <button className="btn" style={{ marginTop: 12 }} onClick={() => go('learn')}>
              去科普中心读原文 →
            </button>
          )}
          {open.lessons.some((l) => l.kind === 'exercise') && (
            <button className="btn" onClick={() => go('energy')}>
              去功法库跟练 →
            </button>
          )}
          {open.lessons.some((l) => l.kind === 'practice') && (
            <button className="btn" onClick={() => go('breathing')}>
              去呼吸训练 →
            </button>
          )}
        </Sheet>
      )}
    </div>
  )
}
