import { useEffect, useRef, useState, type ReactNode } from 'react'

export function Card({
  children,
  tone = 'plain',
  onClick,
}: {
  children: ReactNode
  tone?: 'plain' | 'warn' | 'jade'
  onClick?: () => void
}) {
  return (
    <div className={`card${tone === 'plain' ? '' : ` ${tone}`}`} onClick={onClick} role={onClick ? 'button' : undefined}>
      {children}
    </div>
  )
}

export function Bar({ value }: { value: number }) {
  return (
    <div className="bar">
      <i style={{ width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` }} />
    </div>
  )
}

export function Meter({ label, value }: { label: string; value: number }) {
  const filled = Math.round((Math.min(100, Math.max(0, value)) / 100) * 10)
  return (
    <>
      <div className="meter-label">
        <span>{label}</span>
        <span className="ascii-bar">
          {'█'.repeat(filled)}
          {'░'.repeat(10 - filled)} {Math.round(value)}%
        </span>
      </div>
    </>
  )
}

export function Sheet({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ marginBottom: 12 }}>
          <strong>{title}</strong>
          <button className="link" onClick={onClose}>
            关闭
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Stat({ n, k }: { n: ReactNode; k: string }) {
  return (
    <div className="stat">
      <div className="n">{n}</div>
      <div className="k">{k}</div>
    </div>
  )
}

/** 折叠区块：科普长文、功法详情用 */
export function Collapse({ summary, children }: { summary: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: '1px dashed var(--line)', padding: '10px 0' }}>
      <button className="row" style={{ width: '100%', background: 'none', border: 0, textAlign: 'left' }} onClick={() => setOpen(!open)}>
        <span style={{ flex: 1 }}>{summary}</span>
        <span className="muted small">{open ? '收起' : '展开'}</span>
      </button>
      {open && <div className="small muted" style={{ marginTop: 8 }}>{children}</div>}
    </div>
  )
}

/** 每秒滴答的倒计时，返回剩余秒数 */
export function useCountdown(seconds: number, running = true): number {
  const [left, setLeft] = useState(seconds)
  const target = useRef(Date.now() + seconds * 1000)

  useEffect(() => {
    target.current = Date.now() + seconds * 1000
    setLeft(seconds)
  }, [seconds])

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setLeft(Math.max(0, Math.round((target.current - Date.now()) / 1000)))
    }, 250)
    return () => clearInterval(id)
  }, [running])

  return left
}
