import { useMemo, useRef, useState } from 'react'
import { Bar, Card, Sheet, Stat } from '../components/ui'
import { PageHeader, useToast } from '../components/shell'
import { MILESTONES } from '../data/milestones'
import { TIER_LABELS } from '../data/membership'
import { CONSTITUTION_LABELS } from '../data/assessment'
import { SEVERITY_LABELS } from '../lib/assessment'
import { todayKey } from '../lib/date'
import { checkinStreak, companionStage, levelOf, nextMilestone, stageProgress } from '../lib/progress'
import { drawPoster, posterData } from '../lib/poster'
import { useStore } from '../state/store'
import type { Tab } from '../App'

/** 个人资料：身份、统计、勋章与成就海报 */
export function Profile({ go }: { go: (tab: Tab) => void }) {
  const { state, dispatch, days } = useStore()
  const toast = useToast()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [poster, setPoster] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(state.name)

  const stage = companionStage(days)
  const data = useMemo(() => posterData(state), [state])
  const earned = MILESTONES.filter((m) => days >= m.day)
  const next = nextMilestone(days)
  const checkins = Object.values(state.logs).filter((l) => l.checkedIn).length
  const practice = Object.values(state.practiceMinutes).reduce((a, b) => a + b, 0)

  function makePoster() {
    const canvas = canvasRef.current
    if (!canvas) return
    const url = drawPoster(canvas, data)
    if (!url) {
      toast('这个浏览器不支持画布导出', 'warn')
      return
    }
    setPoster(url)
    // 分享成就海报 +50（PRD 5.4.5），同一天只发一次
    dispatch({ type: 'award', key: `poster:${todayKey()}`, coins: 50 })
  }

  return (
    <div className="screen">
      <PageHeader title="我的" subtitle={`加入 Reborn 第 ${days} 天`} onBack={() => go('home')} />

      <Card>
        <div className="row">
          <div style={{ fontSize: 46 }} aria-hidden="true">
            {stage.emoji}
          </div>
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: 17 }}>{state.name}</strong>
            <br />
            <span className="small muted">
              {stage.name} · Level {levelOf(days)} · {TIER_LABELS[state.membership]}
            </span>
          </div>
          <button className="link small" onClick={() => setEditing(true)}>
            编辑
          </button>
        </div>
        <div className="row small muted" style={{ marginTop: 12 }}>
          <span>
            下一阶段：{next ? `${next.emoji} ${next.name}（Day ${next.day}）` : '已达最高里程碑'}
          </span>
          <span>{Math.round(stageProgress(days) * 100)}%</span>
        </div>
        <Bar value={stageProgress(days)} />
      </Card>

      <div className="grid">
        <Stat n={days} k="当前天数" />
        <Stat n={Math.max(state.longestStreak, days)} k="最长记录" />
        <Stat n={checkinStreak(state.logs)} k="连续打卡" />
      </div>
      <div className="grid" style={{ marginTop: 10 }}>
        <Stat n={checkins} k="累计打卡" />
        <Stat n={state.urgeEvents.filter((u) => u.resolution !== 'relapse').length} k="度过冲动" />
        <Stat n={`${practice}′`} k="功法时长" />
      </div>

      {state.assessment && (
        <Card>
          <div className="card-title">测评档案</div>
          <p className="small" style={{ margin: 0 }}>
            · 成瘾程度：{SEVERITY_LABELS[state.assessment.severity]}
            <br />· 中医体质：{CONSTITUTION_LABELS[state.assessment.constitution]}
            <br />· 首要诱因：{state.assessment.triggers[0]?.label ?? '未识别'}
            <br />· 测评日期：{state.assessment.completedAt}
          </p>
          <button className="btn ghost small" style={{ marginTop: 10 }} onClick={() => go('more')}>
            去复评 →
          </button>
        </Card>
      )}

      <h2>勋章墙（{earned.length}/{MILESTONES.length}）</h2>
      <div className="badge-wall">
        {MILESTONES.map((m) => (
          <div key={m.id} className={`badge${days >= m.day ? '' : ' locked'}`} title={`${m.name} · Day ${m.day}`}>
            {m.emoji}
          </div>
        ))}
      </div>

      <h2>成就海报</h2>
      <Card>
        <p className="small muted" style={{ marginTop: 0 }}>
          生成一张 1080×1350 的竖图，只包含天数与练习统计，不含任何敏感信息，可以放心分享。
        </p>
        <button className="btn primary" onClick={makePoster}>
          生成海报（+50 金币）
        </button>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </Card>

      {editing && (
        <Sheet title="编辑资料" onClose={() => setEditing(false)}>
          <div className="card-title">昵称</div>
          <input type="text" value={draftName} maxLength={20} onChange={(e) => setDraftName(e.target.value)} />
          <div className="card-title" style={{ marginTop: 14 }}>
            伙伴名字
          </div>
          <input
            type="text"
            defaultValue={state.companion.name}
            maxLength={12}
            onBlur={(e) => dispatch({ type: 'rename-companion', name: e.target.value })}
          />
          <button
            className="btn primary"
            style={{ marginTop: 14 }}
            onClick={() => {
              dispatch({ type: 'rename', name: draftName })
              setEditing(false)
              toast('资料已更新', 'success')
            }}
          >
            保存
          </button>
        </Sheet>
      )}

      {poster && (
        <Sheet title="成就海报" onClose={() => setPoster(null)}>
          <img src={poster} alt={`第 ${days} 天成就海报`} style={{ width: '100%', borderRadius: 14 }} />
          <a className="btn primary" href={poster} download={`reborn-day${days}.png`} style={{ display: 'block', textAlign: 'center', marginTop: 12, textDecoration: 'none' }}>
            保存图片
          </a>
          <p className="small muted center">长按图片也可以直接保存或转发。</p>
        </Sheet>
      )}
    </div>
  )
}
