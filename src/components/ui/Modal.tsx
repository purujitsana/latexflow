import { type ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'
import { IconButton } from './Button'

export function Modal({
  open,
  onClose,
  title,
  children,
  width = 560,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  width?: number
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 lf-animate-in"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-2xl max-h-[85vh] flex flex-col"
        style={{ width }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
          <h2 className="text-sm font-semibold">{title}</h2>
          <IconButton onClick={onClose} aria-label="Close">
            <X size={16} />
          </IconButton>
        </div>
        <div className="p-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
