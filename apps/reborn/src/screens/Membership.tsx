import { useState } from 'react'
import { Card, Collapse, Sheet } from '../components/ui'
import { PageHeader, useToast } from '../components/shell'
import { FEATURE_MATRIX, MEMBERSHIP_FAQ, PLANS, TIER_LABELS, isPro } from '../data/membership'
import { useStore } from '../state/store'
import type { MembershipTier } from '../types'
import type { Tab } from '../App'

/** 会员方案（PRD 9.1）。原型不接支付，选择只在本地生效，用于预览 Pro 权益。 */
export function Membership({ go }: { go: (tab: Tab) => void }) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [confirm, setConfirm] = useState<MembershipTier | null>(null)

  return (
    <div className="screen">
      <PageHeader title="会员" subtitle={`当前：${TIER_LABELS[state.membership]}`} onBack={() => go('more')} />

      <Card tone="warn">
        <p className="small" style={{ margin: 0 }}>
          原型说明：本页不接入任何支付渠道，点击不会产生费用。选择套餐只是在本机预览对应权益。
        </p>
      </Card>

      {PLANS.filter((p) => p.id !== 'free').map((p) => (
        <div key={p.id} className={`plan${p.badge?.includes('最受欢迎') ? ' featured' : ''}`}>
          <div className="row">
            <div>
              <strong>{p.name}</strong>
              {p.badge && <span className="tag" style={{ marginLeft: 8 }}>{p.badge}</span>}
              <p className="small muted" style={{ margin: '4px 0 0' }}>
                {p.desc}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="price">{p.price}</div>
              <div className="small muted">{p.period}</div>
            </div>
          </div>
          <button
            className={`btn${state.membership === p.id ? '' : ' primary'}`}
            style={{ marginTop: 12 }}
            disabled={state.membership === p.id}
            onClick={() => setConfirm(p.id)}
          >
            {state.membership === p.id ? '当前方案' : '选择这个方案'}
          </button>
        </div>
      ))}

      {isPro(state.membership) && (
        <button className="btn ghost" onClick={() => dispatch({ type: 'set-membership', tier: 'free' })}>
          恢复为免费版
        </button>
      )}

      <h2>权益对比</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>功能</th>
              <th>Free</th>
              <th>Pro</th>
            </tr>
          </thead>
          <tbody>
            {FEATURE_MATRIX.map((row) => (
              <tr key={row.feature}>
                <td>{row.feature}</td>
                <td className="muted">{row.free}</td>
                <td style={{ color: 'var(--jade)' }}>{row.pro}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>常见问题</h2>
      <Card>
        {MEMBERSHIP_FAQ.map((f) => (
          <Collapse key={f.q} summary={f.q}>
            {f.a}
          </Collapse>
        ))}
      </Card>

      <Card tone="jade">
        <div className="card-title">买不起也不该被挡在门外</div>
        <p className="small muted" style={{ margin: 0 }}>
          正式版会提供资助名额：写一封说明信即可申请免费 Pro，不需要提供任何证明材料。
          康复不该是一件按支付能力分配的事。
        </p>
      </Card>

      {confirm && (
        <Sheet title="确认切换" onClose={() => setConfirm(null)}>
          <p className="small muted">
            将把本机的会员状态设为「{TIER_LABELS[confirm]}」用于预览 Pro 权益。不会产生任何费用，也不会联网。
          </p>
          <button
            className="btn primary"
            onClick={() => {
              dispatch({ type: 'set-membership', tier: confirm })
              setConfirm(null)
              toast(`已切换为 ${TIER_LABELS[confirm]}（预览）`, 'success')
            }}
          >
            确认
          </button>
          <button className="btn ghost" onClick={() => setConfirm(null)}>
            取消
          </button>
        </Sheet>
      )}
    </div>
  )
}
