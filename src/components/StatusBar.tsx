import type { Editor } from '@tiptap/react'
import { useDocumentStore } from '../state/documentStore'
import { useSyncStore, type SyncMode } from '../state/syncStore'

const MODE_LABEL: Record<SyncMode, string> = {
  doc2latex: 'Document → LaTeX',
  latex2doc: 'LaTeX → Document',
  dual: 'Dual (bidirectional)',
}

function formatSavedAt(iso: string | null): string {
  if (!iso) return 'Not saved yet'
  const d = new Date(iso)
  return `Saved locally · ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
}

export function StatusBar({ editor }: { editor: Editor | null }) {
  const mode = useSyncStore((s) => s.mode)
  const status = useSyncStore((s) => s.status)
  const diagnostics = useSyncStore((s) => s.diagnostics)
  const savedAt = useDocumentStore((s) => s.savedAt)
  const dirty = useDocumentStore((s) => s.dirty)

  const words = editor?.storage.characterCount?.words?.() ?? 0
  const chars = editor?.storage.characterCount?.characters?.() ?? 0
  const errorCount = diagnostics.filter((d) => d.severity === 'error').length

  const statusDot =
    status === 'synced' ? 'bg-[var(--color-success)]' : status === 'updating' ? 'bg-[var(--color-warn)]' : 'bg-[var(--color-danger)]'
  const statusLabel = status === 'synced' ? 'Synced' : status === 'updating' ? 'Updating…' : 'Conversion issue'

  return (
    <div className="flex items-center gap-4 px-3 h-7 border-t border-[var(--color-border)] bg-[var(--color-bg-subtle)] text-[11px] text-[var(--color-text-muted)] shrink-0 overflow-x-auto">
      <span>Words: {words.toLocaleString()}</span>
      <span>Characters: {chars.toLocaleString()}</span>
      <span>LaTeX: {errorCount > 0 ? `${errorCount} issue${errorCount > 1 ? 's' : ''}` : 'Valid'}</span>
      <span>{dirty ? 'Unsaved changes' : formatSavedAt(savedAt)}</span>
      <span className="flex-1" />
      <span>Mode: {MODE_LABEL[mode]}</span>
      <span className="flex items-center gap-1.5">
        <span className={`inline-block w-2 h-2 rounded-full ${statusDot}`} />
        {statusLabel}
      </span>
    </div>
  )
}
