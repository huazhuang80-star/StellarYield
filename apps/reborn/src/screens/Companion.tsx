import { Bar, Card, Meter } from '../components/ui'
import { COMPANION_STAGES } from '../data/milestones'
import { todayKey } from '../lib/date'
import { companionStage, nextStage, stageProgress } from '../lib/progress'
import { useStore } from '../state/store'

const INTERACTIONS = [
  { kind: 'feed', label: '喂食', gain: '+25 饥饿' },
  { kind: 'play', label: '玩耍', gain: '+15 心情' },
  { kind: 'train', label: '训练', gain: '+15 能量' },
  { kind: 'groom', label: '梳理', gain: '+8 亲密' },
] as const

/** 动物头像成长系统（PRD 5.4.4） */
export function Companion() {
  const { state, dispatch, days } = useStore()
  const stage = companionStage(days)
  const next = nextStage(days)
  const c = state.companion
  const doneToday = c.lastInteractionDate === todayKey() ? c.interactionsToday : []

  return (
    <div className="screen">
      <h1 className="center">
        {stage.emoji} 你的伙伴：{c.name}
      </h1>
      <p className="center small muted">
        当前阶段：{stage.name}（Day {days}）· {stage.meaning}
      </p>

      <div className="avatar" style={{ fontSize: 96 }}>
        {stage.emoji}
      </div>

      <Card>
        <Meter label="饥饿度" value={c.hunger} />
        <Meter label="心情值" value={c.mood} />
        <Meter label="能量值" value={c.energy} />
        <Meter label="亲密度" value={c.intimacy} />
        {c.mood < 40 && (
          <p className="small" style={{ color: 'var(--amber)', marginBottom: 0 }}>
            {c.name} 看起来有些萎靡不振 —— 它在等你回来完成今天的任务。
          </p>
        )}
      </Card>

      <div className="grid-2">
        {INTERACTIONS.map((i) => (
          <button
            key={i.kind}
            className={`btn${doneToday.includes(i.kind) ? '' : ' primary'}`}
            disabled={doneToday.includes(i.kind)}
            onClick={() => dispatch({ type: 'companion-interact', kind: i.kind })}
          >
            {i.label} {doneToday.includes(i.kind) ? '✓' : i.gain}
          </button>
        ))}
      </div>

      {next && (
        <Card>
          <div className="row">
            <span className="small">
              下一进化：{next.emoji} {next.name}（Day {next.from}）
            </span>
            <span className="small muted">{Math.round(stageProgress(days) * 100)}%</span>
          </div>
          <Bar value={stageProgress(days)} />
        </Card>
      )}

      <h2>成长图谱</h2>
      <Card>
        {COMPANION_STAGES.map((s) => {
          const reached = days >= s.from
          return (
            <div key={s.id} className="task">
              <span style={{ fontSize: 22, filter: reached ? 'none' : 'grayscale(1) opacity(0.4)' }}>{s.emoji}</span>
              <span className="label small" style={reached ? undefined : { color: 'var(--text-dim)' }}>
                {s.name} · Day {s.from}
                {Number.isFinite(s.to) ? `-${s.to}` : '+'}
                <br />
                <span className="muted">{s.meaning}</span>
              </span>
              {reached && <span className="tag jade">已达成</span>}
            </div>
          )
        })}
      </Card>

      <h2>装扮</h2>
      <Card>
        <div className="chips">
          {c.ownedSkins.map((skin) => (
            <button
              key={skin}
              className={`chip${c.activeSkin === skin ? ' on' : ''}`}
              onClick={() => dispatch({ type: 'set-skin', skin })}
            >
              {skin === 'default' ? '原始形态' : skin.replace('skin-', '')}
            </button>
          ))}
        </div>
        <p className="small muted" style={{ marginBottom: 0 }}>
          更多皮肤与栖息地装饰可在商城用金币兑换。
        </p>
      </Card>

      <Card>
        <div className="card-title">给伙伴改名</div>
        <input type="text" defaultValue={c.name} onBlur={(e) => dispatch({ type: 'rename-companion', name: e.target.value })} />
      </Card>
    </div>
  )
}
