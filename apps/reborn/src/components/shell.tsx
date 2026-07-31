import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ThemePref } from '../types'

/* ---------- Toast ---------- */

interface ToastItem {
  id: number
  text: string
  tone: 'info' | 'success' | 'warn'
}

const ToastContext = createContext<((text: string, tone?: ToastItem['tone']) => void) | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const push = useCallback((text: string, tone: ToastItem['tone'] = 'info') => {
    const id = Date.now() + Math.random()
    setItems((prev) => [...prev, { id, text, tone }])
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 2600)
  }, [])

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.tone}`}>
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const push = useContext(ToastContext)
  if (!push) throw new Error('useToast 必须在 ToastProvider 内使用')
  return push
}

/* ---------- 页面头（二级页统一返回栏） ---------- */

export function PageHeader({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack: () => void }) {
  return (
    <div className="page-header">
      <button className="back" onClick={onBack} aria-label="返回">
        ‹ 返回
      </button>
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="small muted">{subtitle}</p>}
      </div>
    </div>
  )
}

/* ---------- 空状态 ---------- */

export function EmptyState({ icon, title, desc, action }: { icon: string; title: string; desc: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-icon" aria-hidden="true">
        {icon}
      </div>
      <strong>{title}</strong>
      <p className="small muted">{desc}</p>
      {action}
    </div>
  )
}

/* ---------- 开关 ---------- */

export function Toggle({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle-row">
      <span className="toggle-text">
        {label}
        {desc && <span className="small muted">{desc}</span>}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="switch" aria-hidden="true" />
    </label>
  )
}

/* ---------- 分段选择器 ---------- */

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  label?: string
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} className={value === o.value ? 'on' : ''} aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ---------- 主题 ---------- */

/**
 * 把主题偏好写到 <html data-theme>，CSS 变量按此切换。
 * 选择"跟随系统"时监听 prefers-color-scheme 的实时变化。
 */
export function useTheme(pref: ThemePref, reduceMotion: boolean) {
  const media = useMemo(() => (typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: light)') : null), [])
  const [systemLight, setSystemLight] = useState(() => media?.matches ?? false)

  useEffect(() => {
    if (!media) return
    const onChange = (e: MediaQueryListEvent) => setSystemLight(e.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [media])

  useEffect(() => {
    const resolved = pref === 'system' ? (systemLight ? 'light' : 'dark') : pref
    document.documentElement.setAttribute('data-theme', resolved)
    document.documentElement.toggleAttribute('data-reduce-motion', reduceMotion)
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', resolved === 'light' ? '#f7f8fb' : '#0F172A')
  }, [pref, systemLight, reduceMotion])
}
