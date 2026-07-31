import { useState } from 'react'
import { Card, Sheet } from '../components/ui'
import { useToast } from '../components/shell'
import { QUESTIONS } from '../data/assessment'
import { APP_INFO } from '../data/about'
import { TIER_LABELS } from '../data/membership'
import { daysBetween, todayKey } from '../lib/date'
import { companionStage } from '../lib/progress'
import { useStore } from '../state/store'
import type { Tab } from '../App'

interface Entry {
  tab: Tab
  icon: string
  label: string
  desc: string
}

const LEARN_ENTRIES: Entry[] = [
  { tab: 'learn', icon: '📚', label: '危害认知中心', desc: '身体 / 心理 / 关系 / 大脑 四维科普 + 脱敏训练' },
  { tab: 'courses', icon: '🎓', label: '学习中心', desc: '5 门课程 20 节，按顺序带你走完前 90 天' },
  { tab: 'search', icon: '🔍', label: '搜索', desc: '在全部内容里找答案' },
]

const PRACTICE_ENTRIES: Entry[] = [
  { tab: 'energy', icon: '🌿', label: '能量提升', desc: '每日任务 · 古法功法库 · 膳食调理' },
  { tab: 'breathing', icon: '🌬️', label: '呼吸与冥想', desc: '4 种呼吸法 + 4 种冥想引导' },
  { tab: 'journal', icon: '📓', label: '日记与历史', desc: '时间线、周报与冲动事件记录' },
]

const SOCIAL_ENTRIES: Entry[] = [
  { tab: 'community', icon: '👥', label: '社区', desc: '匿名广场 · 分组互助 · 导师问答' },
  { tab: 'buddy', icon: '🤝', label: '问责伙伴', desc: '邀请码、匹配与共享范围' },
  { tab: 'shop', icon: '🛍️', label: '商城', desc: '皮肤、栖息地、宝箱、实体周边' },
]

export function More({ go }: { go: (tab: Tab) => void }) {
  const { state, dispatch, days } = useStore()
  const toast = useToast()
  const [reassessing, setReassessing] = useState(false)
  const [answers, setAnswers] = useState<Record<string, number>>(state.assessment?.answers ?? {})

  const sinceReassessment = state.lastReassessment ? daysBetween(state.lastReassessment, todayKey()) : null
  const canReassess = sinceReassessment === null || sinceReassessment >= 7
  const stage = companionStage(days)

  const section = (title: string, entries: Entry[]) => (
    <>
      <h2>{title}</h2>
      <div className="list">
        {entries.map((e) => (
          <button key={e.tab} className="list-item" onClick={() => go(e.tab)}>
            <span className="ico" aria-hidden="true">
              {e.icon}
            </span>
            <span className="body">
              <strong>{e.label}</strong>
              <span>{e.desc}</span>
            </span>
            <span className="arrow">›</span>
          </button>
        ))}
      </div>
    </>
  )

  return (
    <div className="screen">
      <h1>更多</h1>

      <Card onClick={() => go('profile')}>
        <div className="row">
          <div style={{ fontSize: 38 }} aria-hidden="true">
            {stage.emoji}
          </div>
          <div style={{ flex: 1 }}>
            <strong>{state.name}</strong>
            <br />
            <span className="small muted">
              Day {days} · {stage.name} · {TIER_LABELS[state.membership]}
            </span>
          </div>
          <span className="arrow muted">›</span>
        </div>
      </Card>

      {section('学习', LEARN_ENTRIES)}
      {section('练习与记录', PRACTICE_ENTRIES)}
      {section('社交与奖励', SOCIAL_ENTRIES)}

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

      <h2>账号与支持</h2>
      <div className="list">
        <button className="list-item" onClick={() => go('membership')}>
          <span className="ico">💎</span>
          <span className="body">
            <strong>会员</strong>
            <span>当前：{TIER_LABELS[state.membership]} · 查看权益对比</span>
          </span>
          <span className="arrow">›</span>
        </button>
        <button className="list-item" onClick={() => go('settings')}>
          <span className="ico">⚙️</span>
          <span className="body">
            <strong>设置</strong>
            <span>主题、提醒、信仰模式、数据备份</span>
          </span>
          <span className="arrow">›</span>
        </button>
        <button className="list-item" onClick={() => go('help')}>
          <span className="ico">❓</span>
          <span className="body">
            <strong>帮助中心</strong>
            <span>快速上手、15 条常见问题、术语表</span>
          </span>
          <span className="arrow">›</span>
        </button>
        <button className="list-item" onClick={() => go('legal')}>
          <span className="ico">🛡️</span>
          <span className="body">
            <strong>安全与条款</strong>
            <span>紧急求助资源、免责声明、隐私</span>
          </span>
          <span className="arrow">›</span>
        </button>
        <button className="list-item" onClick={() => go('about')}>
          <span className="ico">ℹ️</span>
          <span className="body">
            <strong>关于 Reborn</strong>
            <span>
              {APP_INFO.version} · {APP_INFO.stage}
            </span>
          </span>
          <span className="arrow">›</span>
        </button>
      </div>

      <p className="disclaimer">
        Reborn 提供健康自助内容，不构成医疗诊断或治疗建议；中医相关内容属传统经验范畴。
        数据保存在本机，不含账号系统与网络请求。
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
              toast('方案已更新', 'success')
            }}
          >
            生成新方案
          </button>
        </Sheet>
      )}
    </div>
  )
}
