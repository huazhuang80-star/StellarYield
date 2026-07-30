import { Card } from '../components/ui'
import { companionStage } from '../lib/progress'
import { useStore } from '../state/store'

/** 社区系统（PRD 6.2）—— 原型内容为示意数据，不含真实用户内容 */
const POSTS = [
  { id: 'p1', anon: '匿名 · Day 34', text: '今天第一次在冲动来的时候先去洗了个冷水脸，然后真的就过去了。原来 15 分钟真的有用。', likes: 42, group: '30 天组' },
  { id: 'p2', anon: '匿名 · Day 7', text: '八段锦解锁了，早上练完出汗但很清爽。之前一整年没有过这种感觉。', likes: 28, group: '30 天组' },
  { id: 'p3', anon: '匿名 · Day 91', text: '90 天了。最大的变化不是"戒掉了"，而是我又开始约朋友吃饭了。', likes: 156, group: '90 天组' },
  { id: 'p4', anon: '匿名 · Day 3', text: '昨晚破戒了，但这次没有骂自己。填了复盘问卷，发现全都是睡前刷手机。今天手机放客厅。', likes: 67, group: '新手组' },
]

const MENTORS = [
  { id: 'm1', name: '林医师', role: '中医内科 · 12 年', topic: '阳虚体质如何调理精力' },
  { id: 'm2', name: 'Dr. Chen', role: '临床心理咨询师', topic: 'CBT 如何应用于冲动管理' },
  { id: 'm3', name: '阿哲', role: '康复 2 年 · 用户导师', topic: '第 30-60 天的平台期怎么过' },
]

export function Community() {
  const { state, days } = useStore()
  const stage = companionStage(days)
  const group = days >= 90 ? '90 天组' : days >= 30 ? '30 天组' : '新手组'

  return (
    <div className="screen">
      <h1>社区</h1>
      <p className="small muted">匿名广场 · 分组互助 · 导师问答</p>

      <Card tone="jade">
        <div className="row">
          <div>
            <div className="card-title" style={{ marginBottom: 2 }}>
              你的小组：{group}
            </div>
            <p className="small muted" style={{ margin: 0 }}>
              {state.companion.name}（{stage.name}）可在社区中散步，与其他伙伴互动
            </p>
          </div>
          <div style={{ fontSize: 34 }}>{stage.emoji}</div>
        </div>
      </Card>

      <Card>
        <div className="card-title">🤝 互助匹配</div>
        <p className="small muted" style={{ marginTop: 0 }}>
          问责伙伴 Mike · Day 41 · 时区相近，冲动高峰重叠度 78%
        </p>
        <button className="btn">发送消息</button>
      </Card>

      <h2>匿名广场</h2>
      {POSTS.map((p) => (
        <Card key={p.id}>
          <div className="row small muted">
            <span>{p.anon}</span>
            <span className="chip">{p.group}</span>
          </div>
          <p className="small" style={{ margin: '8px 0' }}>
            {p.text}
          </p>
          <div className="row small muted">
            <span>❤️ {p.likes}</span>
            <span className="link">回应（+30 金币）</span>
          </div>
        </Card>
      ))}

      <h2>导师问答</h2>
      {MENTORS.map((m) => (
        <Card key={m.id}>
          <div className="card-title">
            {m.name} <span className="chip">{m.role}</span>
          </div>
          <p className="small muted" style={{ margin: 0 }}>
            本周主题：{m.topic}
          </p>
        </Card>
      ))}

      <p className="disclaimer">
        以上为原型示意内容，非真实用户发言。正式版社区将做匿名化处理与内容审核，医师问答不替代线下就诊。
      </p>
    </div>
  )
}
