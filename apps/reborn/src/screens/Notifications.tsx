import { useEffect, useMemo } from 'react'
import { EmptyState, PageHeader } from '../components/shell'
import { buildNotifications, iconFor } from '../lib/notifications'
import { useStore } from '../state/store'
import type { Tab } from '../App'

/** 通知中心：内容由当前状态推导，不会出现过期通知 */
export function Notifications({ go }: { go: (tab: Tab) => void }) {
  const { state, dispatch } = useStore()
  const items = useMemo(() => buildNotifications(state), [state])
  const unreadIds = items.filter((n) => !state.readNotifications.includes(n.id)).map((n) => n.id)

  // 进入页面即视为看过，退出时统一标记，避免每条都触发一次写盘
  useEffect(() => {
    return () => {
      if (unreadIds.length > 0) dispatch({ type: 'read-notifications', ids: unreadIds })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="screen">
      <PageHeader title="通知" subtitle={`${items.length} 条 · ${unreadIds.length} 条未读`} onBack={() => go('home')} />

      {items.length === 0 ? (
        <EmptyState icon="🔕" title="暂时没有通知" desc="里程碑、风险时段提醒和伙伴动态会出现在这里。" />
      ) : (
        <div className="card">
          {items.map((n) => {
            const read = state.readNotifications.includes(n.id)
            return (
              <button key={n.id} className={`notif${read ? ' read' : ''}`} onClick={() => n.target && go(n.target as Tab)}>
                <span className="dot" aria-hidden="true" />
                <span className="ico" aria-hidden="true" style={{ fontSize: 19 }}>
                  {iconFor(n.kind)}
                </span>
                <span style={{ flex: 1 }}>
                  <strong>{n.title}</strong>
                  <br />
                  <span className="small muted">{n.body}</span>
                </span>
                {n.target && <span className="arrow">›</span>}
              </button>
            )
          })}
        </div>
      )}

      {unreadIds.length > 0 && (
        <button className="btn" onClick={() => dispatch({ type: 'read-notifications', ids: unreadIds })}>
          全部标记为已读
        </button>
      )}

      <p className="disclaimer">
        当前版本的提醒只在打开 App 时生成。系统级推送（含高风险时段前 30 分钟提醒）需要原生权限，正式版接入 OneSignal 后生效。
      </p>
    </div>
  )
}
