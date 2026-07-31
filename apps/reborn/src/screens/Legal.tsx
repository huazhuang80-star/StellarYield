import { useState } from 'react'
import { Card, Collapse } from '../components/ui'
import { PageHeader, Segmented } from '../components/shell'
import { CRISIS_LINES, CRISIS_NOTE, DISCLAIMER, PRIVACY, TERMS } from '../data/legal'
import type { Tab } from '../App'

type Section = 'crisis' | 'disclaimer' | 'privacy' | 'terms'

/** 法律与安全页。危机资源放在第一屏 —— 需要它的人没有耐心翻三级菜单。 */
export function Legal({ go }: { go: (tab: Tab) => void }) {
  const [section, setSection] = useState<Section>('crisis')

  return (
    <div className="screen">
      <PageHeader title="安全与条款" subtitle="紧急求助 · 免责声明 · 隐私 · 用户协议" onBack={() => go('more')} />

      <Segmented<Section>
        label="分区"
        value={section}
        onChange={setSection}
        options={[
          { value: 'crisis', label: '紧急求助' },
          { value: 'disclaimer', label: '免责' },
          { value: 'privacy', label: '隐私' },
          { value: 'terms', label: '条款' },
        ]}
      />

      {section === 'crisis' && (
        <>
          <Card tone="warn">
            <div className="card-title">⚠️ 如果此刻很危险</div>
            <p className="small" style={{ margin: 0 }}>
              {CRISIS_NOTE}
            </p>
          </Card>

          {['中国大陆', '美国', '国际'].map((region) => (
            <Card key={region}>
              <div className="card-title">{region}</div>
              {CRISIS_LINES.filter((l) => l.region === region).map((l) => (
                <div key={l.name} className="task">
                  <span className="label small">
                    <strong>{l.name}</strong>
                    <br />
                    <span className="muted">{l.note}</span>
                  </span>
                  <span className="tag">{l.contact}</span>
                </div>
              ))}
            </Card>
          ))}

          <Card>
            <div className="card-title">还可以做的三件事</div>
            <p className="small muted" style={{ margin: 0 }}>
              1. 告诉一个此刻能联系上的人，哪怕只说"我现在状态不好"
              <br />
              2. 离开独处的空间，去有人的地方待着
              <br />
              3. 把危险物品交给别人保管
            </p>
          </Card>
        </>
      )}

      {section === 'disclaimer' && (
        <>
          <Card tone="warn">
            <p className="small" style={{ margin: 0 }}>
              Reborn 不是医疗器械，也不是心理治疗服务。它提供的是健康教育与自助工具。
            </p>
          </Card>
          {DISCLAIMER.map((d) => (
            <Card key={d.title}>
              <div className="card-title">{d.title}</div>
              <p className="small muted" style={{ margin: 0 }}>
                {d.body}
              </p>
            </Card>
          ))}
        </>
      )}

      {section === 'privacy' && (
        <>
          <Card tone="jade">
            <div className="card-title">一句话版本</div>
            <p className="small" style={{ margin: 0 }}>
              你的数据从未离开这台设备。没有账号、没有服务器、没有埋点。
            </p>
          </Card>
          <Card>
            {PRIVACY.map((row) => (
              <div key={row.k} className="row small" style={{ alignItems: 'flex-start', padding: '6px 0' }}>
                <span className="muted" style={{ flex: '0 0 96px' }}>
                  {row.k}
                </span>
                <span style={{ textAlign: 'right' }}>{row.v}</span>
              </div>
            ))}
          </Card>
          <Card>
            <div className="card-title">关于设备安全</div>
            <p className="small muted" style={{ margin: 0 }}>
              App 内不出现任何露骨内容，图标与文案都是健康 / 自我提升取向。但记录本身是明文存储的：
              如果设备可能被他人使用，请配合系统锁屏，并考虑定期导出后清空本机数据。
            </p>
          </Card>
        </>
      )}

      {section === 'terms' && (
        <Card>
          {TERMS.map((t) => (
            <Collapse key={t.title} summary={<strong>{t.title}</strong>}>
              {t.body}
            </Collapse>
          ))}
        </Card>
      )}

      <p className="disclaimer">
        本页内容为原型阶段的说明性文本，不构成正式法律文件。正式版上线前将由法律与医学顾问审阅定稿。
        热线号码可能变动，请以当地卫生部门最新公告为准。
      </p>
    </div>
  )
}
