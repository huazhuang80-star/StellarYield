import { Card, Collapse } from '../components/ui'
import { PageHeader } from '../components/shell'
import { APP_INFO, CHANGELOG, CONTACT, CONTENT_SOURCES, CREDITS } from '../data/about'
import { COURSES } from '../data/courses'
import { EDU_ARTICLES } from '../data/education'
import { EXERCISES } from '../data/exercises'
import { MILESTONES } from '../data/milestones'
import { QUESTIONS } from '../data/assessment'
import { useStore } from '../state/store'
import type { Tab } from '../App'

export function About({ go }: { go: (tab: Tab) => void }) {
  const { state } = useStore()
  const lessons = COURSES.reduce((sum, c) => sum + c.lessons.length, 0)

  return (
    <div className="screen">
      <PageHeader title="关于 Reborn" subtitle={`${APP_INFO.version} · ${APP_INFO.stage}`} onBack={() => go('more')} />

      <Card tone="jade">
        <div className="center" style={{ padding: '8px 0' }}>
          <div style={{ fontSize: 44 }} aria-hidden="true">
            🔱
          </div>
          <h1 style={{ fontSize: 24, margin: '6px 0 2px' }}>
            {APP_INFO.name} · {APP_INFO.chineseName}
          </h1>
          <p className="small muted" style={{ margin: 0 }}>
            {APP_INFO.tagline}
          </p>
        </div>
      </Card>

      <Card>
        <div className="card-title">我们相信什么</div>
        <p className="small" style={{ margin: 0 }}>
          {APP_INFO.mission}
        </p>
      </Card>

      <h2>版本信息</h2>
      <Card>
        {[
          { k: '版本', v: `${APP_INFO.version}（${APP_INFO.stage}）` },
          { k: '平台', v: APP_INFO.platform },
          { k: '数据存储', v: APP_INFO.storage },
          { k: '存档格式', v: `v${state.version}` },
          { k: '内容规模', v: `${QUESTIONS.length} 道测评题 · ${EDU_ARTICLES.length} 篇科普 · ${EXERCISES.length} 套功法 · ${COURSES.length} 门课程 ${lessons} 节 · ${MILESTONES.length} 个里程碑` },
        ].map((row) => (
          <div key={row.k} className="row small" style={{ alignItems: 'flex-start' }}>
            <span className="muted" style={{ flex: '0 0 88px' }}>
              {row.k}
            </span>
            <span style={{ textAlign: 'right' }}>{row.v}</span>
          </div>
        ))}
      </Card>

      <h2>更新日志</h2>
      <Card>
        {CHANGELOG.map((entry) => (
          <Collapse
            key={entry.version}
            summary={
              <span>
                <strong>{entry.version}</strong> <span className="chip">{entry.date}</span>
                <br />
                <span className="small muted">{entry.title}</span>
              </span>
            }
          >
            <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
              {entry.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </Collapse>
        ))}
      </Card>

      <h2>内容来源</h2>
      <Card>
        {CONTENT_SOURCES.map((s) => (
          <div key={s.area} className="task">
            <span className="label small">
              <strong>{s.area}</strong>
              <br />
              <span className="muted">{s.desc}</span>
            </span>
          </div>
        ))}
      </Card>

      <h2>制作与致谢</h2>
      <Card>
        {CREDITS.map((c) => (
          <div key={c.role} className="row small">
            <span className="muted">{c.role}</span>
            <span style={{ textAlign: 'right' }}>{c.name}</span>
          </div>
        ))}
      </Card>

      <h2>联系我们</h2>
      <Card>
        {CONTACT.map((c) => (
          <div key={c.k} className="row small" style={{ alignItems: 'flex-start' }}>
            <span className="muted" style={{ flex: '0 0 90px' }}>
              {c.k}
            </span>
            <span style={{ textAlign: 'right' }}>{c.v}</span>
          </div>
        ))}
      </Card>

      <div className="list">
        <button className="list-item" onClick={() => go('legal')}>
          <span className="ico">🛡️</span>
          <span className="body">
            <strong>隐私、条款与免责声明</strong>
            <span>以及紧急求助资源</span>
          </span>
          <span className="arrow">›</span>
        </button>
        <button className="list-item" onClick={() => go('help')}>
          <span className="ico">❓</span>
          <span className="body">
            <strong>帮助中心</strong>
            <span>快速上手、常见问题与术语表</span>
          </span>
          <span className="arrow">›</span>
        </button>
      </div>

      <p className="disclaimer">
        Reborn 是一个健康自助工具，不提供医疗诊断或治疗。中医相关内容属传统经验范畴。
        如出现持续的情绪困扰或躯体症状，请寻求专业帮助。
      </p>
    </div>
  )
}
