import { useRef, useState } from 'react'
import { Card, Sheet } from '../components/ui'
import { PageHeader, Segmented, Toggle, useToast } from '../components/shell'
import { backupFilename, buildBackup, parseBackup, summarize } from '../lib/backup'
import { addDays, todayKey } from '../lib/date'
import { streakDays } from '../lib/progress'
import { useStore } from '../state/store'
import type { AppState, BeliefMode, ThemePref } from '../types'
import type { Tab } from '../App'

const BELIEF_OPTIONS: { value: BeliefMode; label: string; desc: string }[] = [
  { value: 'secular', label: '世俗模式', desc: '纯科学与传统养生表述，不含任何宗教内容' },
  { value: 'buddhist', label: '佛教', desc: '冥想引导可采用观息、慈心等表述' },
  { value: 'christian', label: '基督教', desc: '可加入祷告与团契相关的鼓励语' },
  { value: 'muslim', label: '伊斯兰', desc: '可结合斋戒与礼拜节律安排任务' },
]

/** 完整设置页（PRD 风险表：宗教敏感问题 → 提供世俗模式与多宗教模式自选） */
export function Settings({ go }: { go: (tab: Tab) => void }) {
  const { state, dispatch, days } = useStore()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [fixDate, setFixDate] = useState(false)
  const [pendingImport, setPendingImport] = useState<AppState | null>(null)
  const [draftDays, setDraftDays] = useState(days)
  const s = state.settings

  function exportData() {
    const blob = new Blob([JSON.stringify(buildBackup(state), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = backupFilename(state)
    a.click()
    URL.revokeObjectURL(url)
    toast('备份已导出', 'success')
  }

  function onFile(file: File) {
    file
      .text()
      .then((text) => {
        const result = parseBackup(text)
        if (!result.ok) {
          toast(result.error, 'warn')
          return
        }
        setPendingImport(result.state)
      })
      .catch(() => toast('读取文件失败', 'warn'))
  }

  return (
    <div className="screen">
      <PageHeader title="设置" subtitle="所有设置都保存在本机" onBack={() => go('more')} />

      <h2>外观</h2>
      <Card>
        <div className="card-title">主题</div>
        <Segmented<ThemePref>
          label="主题"
          value={s.theme}
          onChange={(theme) => dispatch({ type: 'update-settings', patch: { theme } })}
          options={[
            { value: 'dark', label: '深色' },
            { value: 'light', label: '浅色' },
            { value: 'system', label: '跟随系统' },
          ]}
        />
        <Toggle
          label="减少动效"
          desc="关闭浮动、烟花与过渡动画"
          checked={s.reduceMotion}
          onChange={(reduceMotion) => dispatch({ type: 'update-settings', patch: { reduceMotion } })}
        />
        <Toggle
          label="灰度模式提示"
          desc="在高风险时段提醒你把手机切成黑白屏"
          checked={s.grayscaleTip}
          onChange={(grayscaleTip) => dispatch({ type: 'update-settings', patch: { grayscaleTip } })}
        />
      </Card>

      <h2>提醒</h2>
      <Card>
        <Toggle label="晨间诊断提醒" checked={s.reminders.morning} onChange={(morning) => dispatch({ type: 'update-reminders', patch: { morning } })} />
        {s.reminders.morning && (
          <input
            type="time"
            value={s.reminders.morningTime}
            onChange={(e) => dispatch({ type: 'update-reminders', patch: { morningTime: e.target.value } })}
            aria-label="晨间提醒时间"
          />
        )}
        <Toggle label="晚间复盘提醒" checked={s.reminders.evening} onChange={(evening) => dispatch({ type: 'update-reminders', patch: { evening } })} />
        {s.reminders.evening && (
          <input
            type="time"
            value={s.reminders.eveningTime}
            onChange={(e) => dispatch({ type: 'update-reminders', patch: { eveningTime: e.target.value } })}
            aria-label="晚间提醒时间"
          />
        )}
        <Toggle
          label="高风险时段预警"
          desc="在你的历史高风险时段前 30 分钟提醒"
          checked={s.reminders.risk}
          onChange={(risk) => dispatch({ type: 'update-reminders', patch: { risk } })}
        />
        <Toggle label="补水提醒" checked={s.reminders.water} onChange={(water) => dispatch({ type: 'update-reminders', patch: { water } })} />
        <p className="small muted" style={{ marginBottom: 0 }}>
          当前版本的提醒只在打开 App 时呈现；系统级推送需要原生权限，正式版接入后这些开关直接生效。
        </p>
      </Card>

      <h2>内容偏好</h2>
      <Card>
        <div className="card-title">信仰模式</div>
        <p className="small muted" style={{ marginTop: 0 }}>
          决定冥想引导与鼓励文案的用词。默认世俗模式，不含任何宗教内容。
        </p>
        {BELIEF_OPTIONS.map((o) => (
          <button
            key={o.value}
            className={`option${s.beliefMode === o.value ? ' on' : ''}`}
            onClick={() => dispatch({ type: 'update-settings', patch: { beliefMode: o.value } })}
          >
            <strong>{o.label}</strong>
            <br />
            <span className="small muted">{o.desc}</span>
          </button>
        ))}
      </Card>

      <h2>账号与数据</h2>
      <Card>
        <div className="row">
          <span className="small">昵称</span>
          <button className="link small" onClick={() => go('profile')}>
            {state.name} ›
          </button>
        </div>
        <div className="row">
          <span className="small">会员状态</span>
          <button className="link small" onClick={() => go('membership')}>
            {state.membership === 'free' ? '免费版' : 'Pro'} ›
          </button>
        </div>
        <div className="row">
          <span className="small">起始日</span>
          <button className="link small" onClick={() => setFixDate(true)}>
            {state.streakStart}（Day {days}）›
          </button>
        </div>
        <div className="row">
          <span className="small">数据存储</span>
          <span className="small muted">本机 localStorage</span>
        </div>
      </Card>

      <Card>
        <div className="card-title">数据备份</div>
        <p className="small muted" style={{ marginTop: 0 }}>
          导出为 JSON 文件，换设备时导入即可恢复。文件是明文，请妥善保管。
        </p>
        <div className="btn-row">
          <button className="btn" onClick={exportData}>
            导出备份
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            导入备份
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onFile(f)
            e.target.value = ''
          }}
        />
      </Card>

      <Card>
        <div className="card-title">危险操作</div>
        <button className="btn danger" onClick={() => setConfirmReset(true)}>
          清空本地数据
        </button>
      </Card>

      <div className="list" style={{ marginTop: 12 }}>
        <button className="list-item" onClick={() => go('legal')}>
          <span className="ico">🛡️</span>
          <span className="body">
            <strong>隐私、条款与免责声明</strong>
            <span>含紧急求助资源</span>
          </span>
          <span className="arrow">›</span>
        </button>
        <button className="list-item" onClick={() => go('about')}>
          <span className="ico">ℹ️</span>
          <span className="body">
            <strong>关于 Reborn</strong>
            <span>版本、更新日志与内容来源</span>
          </span>
          <span className="arrow">›</span>
        </button>
      </div>

      {fixDate && (
        <Sheet title="修正起始日" onClose={() => setFixDate(false)}>
          <p className="small muted">填错了天数可以在这里改。修正不会影响你的历史最长记录（{state.longestStreak} 天）。</p>
          <div className="card-title">已坚持天数</div>
          <input type="number" min={0} max={3650} value={draftDays} onChange={(e) => setDraftDays(Math.max(0, Number(e.target.value) || 0))} />
          <p className="small muted">新的起始日：{addDays(todayKey(), -draftDays)}</p>
          <button
            className="btn primary"
            onClick={() => {
              const next: AppState = { ...state, streakStart: addDays(todayKey(), -draftDays) }
              dispatch({ type: 'import', state: { ...next, longestStreak: Math.max(state.longestStreak, streakDays(next.streakStart)) } })
              setFixDate(false)
              toast('起始日已更新', 'success')
            }}
          >
            保存
          </button>
        </Sheet>
      )}

      {pendingImport && (
        <Sheet title="确认导入？" onClose={() => setPendingImport(null)}>
          <p className="small muted">导入会覆盖当前设备上的全部记录。请先确认这份备份是你要的：</p>
          <Card>
            {summarize(pendingImport).map((row) => (
              <div key={row.k} className="row small">
                <span className="muted">{row.k}</span>
                <span>{row.v}</span>
              </div>
            ))}
          </Card>
          <button
            className="btn primary"
            onClick={() => {
              dispatch({ type: 'import', state: pendingImport })
              setPendingImport(null)
              toast('已恢复备份', 'success')
            }}
          >
            覆盖并恢复
          </button>
          <button className="btn ghost" onClick={() => setPendingImport(null)}>
            取消
          </button>
        </Sheet>
      )}

      {confirmReset && (
        <Sheet title="确认清空？" onClose={() => setConfirmReset(false)}>
          <p className="small muted">
            这会删除本机上的全部记录：天数、打卡、金币、伙伴状态、测评报告与对话。此操作不可恢复。
            建议先导出一份备份。
          </p>
          <button className="btn" onClick={exportData}>
            先导出备份
          </button>
          <button
            className="btn danger"
            style={{ marginTop: 8 }}
            onClick={() => {
              dispatch({ type: 'reset' })
              setConfirmReset(false)
              toast('数据已清空')
            }}
          >
            我确认，清空
          </button>
          <button className="btn ghost" onClick={() => setConfirmReset(false)}>
            取消
          </button>
        </Sheet>
      )}
    </div>
  )
}
