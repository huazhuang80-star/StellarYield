import { useState } from 'react'
import { Card } from '../components/ui'
import { PageHeader, useToast } from '../components/shell'
import { BUDDY_RULES, SAMPLE_BUDDIES, generateCode, isValidCode, shareCard } from '../lib/buddy'
import { formatWindow } from '../lib/risk'
import { useStore } from '../state/store'
import type { Tab } from '../App'

/** 问责伙伴与邀请（PRD 6.2 互助匹配 + 5.4.5 邀请好友 +100） */
export function Buddy({ go }: { go: (tab: Tab) => void }) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [input, setInput] = useState('')
  const card = shareCard(state)

  function ensureCode() {
    if (state.buddyCode) return state.buddyCode
    const code = generateCode(Array.from({ length: 6 }, () => Math.random()))
    dispatch({ type: 'set-buddy-code', code })
    return code
  }

  return (
    <div className="screen">
      <PageHeader title="问责伙伴" subtitle="被看见比被监督更有用" onBack={() => go('more')} />

      <Card tone="jade">
        <div className="card-title">你的邀请码</div>
        <p style={{ fontSize: 30, letterSpacing: 6, fontWeight: 700, margin: '6px 0', fontVariantNumeric: 'tabular-nums' }}>
          {state.buddyCode || '— — — — — —'}
        </p>
        <div className="btn-row">
          <button
            className="btn primary"
            onClick={() => {
              const code = ensureCode()
              navigator.clipboard?.writeText(code).catch(() => undefined)
              toast('邀请码已生成并复制', 'success')
            }}
          >
            {state.buddyCode ? '复制邀请码' : '生成邀请码'}
          </button>
          <button
            className="btn"
            onClick={() => {
              dispatch({ type: 'award', key: 'invite-first', coins: 100 })
              toast('邀请成功奖励 +100 金币（演示）', 'success')
            }}
          >
            邀请奖励
          </button>
        </div>
      </Card>

      <Card>
        <div className="card-title">绑定伙伴</div>
        <input
          type="text"
          value={input}
          maxLength={6}
          placeholder="输入对方的 6 位邀请码"
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          aria-label="伙伴邀请码"
        />
        <button
          className="btn"
          style={{ marginTop: 10 }}
          disabled={!input}
          onClick={() => {
            if (!isValidCode(input)) {
              toast('邀请码格式不对：6 位大写字母或数字', 'warn')
              return
            }
            toast('原型阶段没有后端，绑定流程仅作演示', 'warn')
          }}
        >
          绑定
        </button>
      </Card>

      <h2>对方能看到什么</h2>
      <Card>
        <p className="small muted" style={{ marginTop: 0 }}>
          只有下面这三项。复发细节、日记、对话记录都不会共享。
        </p>
        <div className="row small">
          <span className="muted">昵称</span>
          <span>{card.name}</span>
        </div>
        <div className="row small">
          <span className="muted">坚持天数</span>
          <span>{card.days} 天</span>
        </div>
        <div className="row small">
          <span className="muted">今日是否打卡</span>
          <span>{card.checkedInToday ? '已打卡' : '未打卡'}</span>
        </div>
        <div className="row small">
          <span className="muted">高风险时段（用于匹配）</span>
          <span>{formatWindow(card.riskWindow)}</span>
        </div>
      </Card>

      <h2>推荐匹配</h2>
      {SAMPLE_BUDDIES.map((b) => (
        <Card key={b.name}>
          <div className="row">
            <div>
              <strong>{b.name}</strong>
              <span className="chip" style={{ marginLeft: 8 }}>
                {b.status === 'online' ? '在线' : '离线'}
              </span>
              <p className="small muted" style={{ margin: '4px 0 0' }}>
                Day {b.days} · {b.timezone} · 风险时段重叠 {Math.round(b.overlap * 100)}%
              </p>
            </div>
            <button className="btn" style={{ width: 88 }} onClick={() => toast('原型阶段为示意数据', 'warn')}>
              申请
            </button>
          </div>
        </Card>
      ))}

      <h2>伙伴守则</h2>
      <Card>
        {BUDDY_RULES.map((r) => (
          <p key={r} className="small muted" style={{ margin: '6px 0' }}>
            · {r}
          </p>
        ))}
      </Card>

      <p className="disclaimer">推荐匹配为示意数据，非真实用户。正式版会做双向确认与举报机制。</p>
    </div>
  )
}
