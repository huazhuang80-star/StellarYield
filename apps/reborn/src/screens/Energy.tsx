import { useMemo, useState } from 'react'
import { Bar, Card, Collapse, Sheet } from '../components/ui'
import { CONSTITUTION_ADVICE, CONSTITUTION_LABELS } from '../data/assessment'
import { EXERCISES, PRACTICES } from '../data/exercises'
import { CONSTITUTION_MENU, NUTRITION, WATER_GOAL } from '../data/nutrition'
import { todayKey } from '../lib/date'
import { levelOf } from '../lib/progress'
import { SLOT_LABELS, buildDailyTasks } from '../lib/tasks'
import { useStore } from '../state/store'
import type { TimeSlot } from '../data/exercises'

/** 模块三：综合能量提升模块（PRD 5.3） */
export function Energy() {
  const { state, dispatch, days } = useStore()
  const [tab, setTab] = useState<'tasks' | 'exercises' | 'nutrition'>('tasks')
  const [openEx, setOpenEx] = useState<string | null>(null)

  const level = levelOf(days)
  const tasks = useMemo(() => buildDailyTasks({ assessment: state.assessment, level, unlocked: state.unlocked }), [state.assessment, level, state.unlocked])
  const log = state.logs[todayKey()]
  const doneCount = tasks.filter((t) => log?.tasks[t.id]).length
  const constitution = state.assessment?.constitution ?? 'qi'
  const exercise = EXERCISES.find((e) => e.id === openEx) ?? null

  return (
    <div className="screen">
      <h1>能量提升</h1>
      <p className="small muted">戒只是"止损"，补才是"增益"。</p>

      <div className="chips" style={{ margin: '14px 0' }}>
        {(
          [
            ['tasks', '每日任务'],
            ['exercises', '古法功法库'],
            ['nutrition', '膳食与调理'],
          ] as const
        ).map(([k, label]) => (
          <button key={k} className={`chip${tab === k ? ' on' : ''}`} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'tasks' && (
        <>
          <Card tone="jade">
            <div className="row">
              <span>今日能量任务（Level {level}）</span>
              <span className="small muted">
                {doneCount}/{tasks.length}
              </span>
            </div>
            <Bar value={tasks.length ? doneCount / tasks.length : 0} />
            <p className="small muted" style={{ margin: '10px 0 0' }}>
              完成奖励：+50 能量币 + 1 个神秘宝箱
            </p>
          </Card>

          {(['morning', 'day', 'evening'] as TimeSlot[]).map((slot) => {
            const group = tasks.filter((t) => t.slot === slot)
            if (group.length === 0) return null
            return (
              <Card key={slot}>
                <div className="card-title">{SLOT_LABELS[slot]}</div>
                {group.map((t) => {
                  const done = Boolean(log?.tasks[t.id])
                  return (
                    <div key={t.id} className="task">
                      <button
                        className={`box${done ? ' on' : ''}`}
                        onClick={() => (t.goal ? dispatch({ type: 'add-water', goal: WATER_GOAL }) : dispatch({ type: 'toggle-task', taskId: t.id }))}
                        aria-label={done ? '取消完成' : '标记完成'}
                      >
                        {done ? '✓' : ''}
                      </button>
                      <span className={`label${done ? ' done' : ''}`}>
                        {t.icon} {t.label}
                        {t.goal ? `（已完成 ${log?.water ?? 0}/${t.goal}）` : ''}
                        <br />
                        <span className="muted small">{t.detail}</span>
                      </span>
                    </div>
                  )
                })}
              </Card>
            )
          })}

          <Card>
            <div className="card-title">体质调理项</div>
            {PRACTICES.filter((p) => p.fits.includes(constitution)).map((p) => (
              <Collapse key={p.id} summary={`${p.name} · ${p.detail}`}>
                依据：{p.basis}
                <br />
                交互形式：{p.interaction}
              </Collapse>
            ))}
          </Card>
        </>
      )}

      {tab === 'exercises' && (
        <>
          <p className="small muted">
            早晨推荐「升阳」功法，晚上推荐「收敛」功法。已根据你的体质（{CONSTITUTION_LABELS[constitution]}）排序。
          </p>
          {[...EXERCISES]
            .sort((a, b) => Number(b.fits.includes(constitution)) - Number(a.fits.includes(constitution)))
            .map((e) => {
              const locked = Boolean(e.lockedBy && !state.unlocked.includes(e.lockedBy))
              return (
                <Card key={e.id} onClick={() => (locked ? undefined : setOpenEx(e.id))}>
                  <div className="row">
                    <div className="card-title" style={{ marginBottom: 0 }}>
                      {e.name}
                      {e.fits.includes(constitution) && <span className="tag jade">适合你</span>}
                    </div>
                    <span className="small muted">{'⭐'.repeat(e.difficulty)}</span>
                  </div>
                  <p className="small muted" style={{ margin: '4px 0 0' }}>
                    {e.minutes} 分钟 · {e.effect} · {e.form}
                  </p>
                  {locked && (
                    <p className="small" style={{ color: 'var(--amber)', margin: '6px 0 0' }}>
                      🔒 完成里程碑后解锁（{e.lockedBy === 'course-baduanjin' ? 'Day 7' : e.lockedBy === 'course-zhanzhuang' ? 'Day 14' : 'Day 90'}）
                    </p>
                  )}
                </Card>
              )
            })}
        </>
      )}

      {tab === 'nutrition' && (
        <>
          <Card tone="jade">
            <div className="card-title">中医体质辨识：{CONSTITUTION_LABELS[constitution]}</div>
            <p className="small" style={{ margin: 0 }}>
              {CONSTITUTION_ADVICE[constitution].desc}
              <br />
              建议：{CONSTITUTION_ADVICE[constitution].advice.join('、')}
            </p>
          </Card>

          <Card>
            <div className="card-title">今日推荐</div>
            <p className="small" style={{ margin: 0 }}>
              · 午餐：{CONSTITUTION_MENU[constitution].lunch}
              <br />· 代茶饮：{CONSTITUTION_MENU[constitution].tea}
              <br />· 忌口：{CONSTITUTION_MENU[constitution].avoid}
            </p>
          </Card>

          <Card>
            <div className="row">
              <span className="card-title" style={{ marginBottom: 0 }}>
                💧 补水追踪
              </span>
              <span className="small muted">
                {log?.water ?? 0}/{WATER_GOAL} 杯
              </span>
            </div>
            <Bar value={(log?.water ?? 0) / WATER_GOAL} />
            <button className="btn" style={{ marginTop: 10 }} onClick={() => dispatch({ type: 'add-water', goal: WATER_GOAL })}>
              喝了一杯 +1
            </button>
          </Card>

          {NUTRITION.map((n) => (
            <Card key={n.id}>
              <div className="card-title">{n.direction}</div>
              <div className="chips" style={{ margin: '6px 0' }}>
                {n.foods.map((f) => (
                  <span key={f} className="chip">
                    {f}
                  </span>
                ))}
              </div>
              <p className="small muted" style={{ margin: 0 }}>
                {n.effect} · {n.form}
              </p>
            </Card>
          ))}

          <p className="disclaimer">
            膳食与中医调理内容属传统经验与一般营养常识，非医疗建议。服用补剂、患有慢性病或正在用药者请先咨询医生。
          </p>
        </>
      )}

      {exercise && (
        <Sheet title={exercise.name} onClose={() => setOpenEx(null)}>
          <p className="small muted">
            {exercise.minutes} 分钟 · 难度 {'⭐'.repeat(exercise.difficulty)} · {exercise.effect}
          </p>
          <div className="card-title">动作要点</div>
          <ol className="small muted">
            {exercise.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <div className="card-title">常见错误</div>
          <ul className="small muted">
            {exercise.mistakes.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          <button
            className="btn primary"
            onClick={() => {
              dispatch({ type: 'toggle-task', taskId: `ex-${exercise.id}` })
              setOpenEx(null)
            }}
          >
            开始跟练（标记完成）
          </button>
        </Sheet>
      )}
    </div>
  )
}
