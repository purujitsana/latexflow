import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react'
import { useSyncStore } from '../state/syncStore'
import { useUiStore } from '../state/uiStore'

const ICONS = {
  error: <AlertCircle size={13} className="text-[var(--color-danger)]" />,
  warning: <AlertTriangle size={13} className="text-[var(--color-warn)]" />,
  info: <Info size={13} className="text-[var(--color-accent)]" />,
}

export function Diagnostics({ onJump }: { onJump: (line: number) => void }) {
  const diagnostics = useSyncStore((s) => s.diagnostics)
  const open = useUiStore((s) => s.diagnosticsOpen)
  const toggle = useUiStore((s) => s.toggleDiagnostics)

  if (diagnostics.length === 0) return null

  if (!open) {
    return (
      <button
        className="absolute bottom-8 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-[var(--color-bg)] border border-[var(--color-border)] shadow"
        onClick={toggle}
      >
        {ICONS.warning}
        {diagnostics.length} diagnostic{diagnostics.length > 1 ? 's' : ''}
      </button>
    )
  }

  return (
    <div className="absolute bottom-8 right-3 z-10 w-80 max-h-64 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] shadow-xl lf-animate-in">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]">
        <span className="text-xs font-semibold">LaTeX Diagnostics</span>
        <button onClick={toggle} aria-label="Close diagnostics">
          <X size={14} />
        </button>
      </div>
      <div className="divide-y divide-[var(--color-border)]">
        {diagnostics.map((d, i) => (
          <button
            key={i}
            className="w-full flex items-start gap-2 px-3 py-2 text-left text-xs hover:bg-[var(--color-bg-inset)]"
            onClick={() => onJump(d.line)}
          >
            {ICONS[d.severity]}
            <span>
              <div className="text-[var(--color-text-muted)]">Line {d.line}</div>
              {d.message}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
