import { useUiStore } from '../state/uiStore'
import { useDocumentStore } from '../state/documentStore'
import { Modal } from './ui/Modal'

export function PreamblePanel() {
  const open = useUiStore((s) => s.preambleOpen)
  const setOpen = useUiStore((s) => s.togglePreamble)
  const preamble = useDocumentStore((s) => s.model.preamble)

  const update = (partial: Partial<typeof preamble>) => {
    useDocumentStore.getState().setModel(
      { ...useDocumentStore.getState().model, preamble: { ...preamble, ...partial } },
      { markDirty: true },
    )
  }

  return (
    <Modal open={open} onClose={setOpen} title="LaTeX Preamble" width={520}>
      <p className="text-xs text-[var(--color-warn)] mb-3">
        Advanced: changing the preamble affects how the exported .tex file compiles, but not the parsed document
        content itself.
      </p>
      <label className="block text-xs text-[var(--color-text-muted)] mb-1">Document class</label>
      <input
        className="w-full bg-[var(--color-bg-inset)] rounded px-2 py-1.5 text-sm mb-3 outline-none"
        value={preamble.documentClass}
        onChange={(e) => update({ documentClass: e.target.value })}
      />
      <label className="block text-xs text-[var(--color-text-muted)] mb-1">Class options</label>
      <input
        className="w-full bg-[var(--color-bg-inset)] rounded px-2 py-1.5 text-sm mb-3 outline-none"
        value={preamble.documentClassOptions ?? ''}
        onChange={(e) => update({ documentClassOptions: e.target.value })}
      />
      <label className="block text-xs text-[var(--color-text-muted)] mb-1">Packages (comma-separated)</label>
      <input
        className="w-full bg-[var(--color-bg-inset)] rounded px-2 py-1.5 text-sm mb-3 outline-none"
        value={preamble.packages.join(', ')}
        onChange={(e) => update({ packages: e.target.value.split(',').map((p) => p.trim()).filter(Boolean) })}
      />
      <label className="block text-xs text-[var(--color-text-muted)] mb-1">Extra preamble commands</label>
      <textarea
        className="w-full bg-[var(--color-bg-inset)] rounded px-2 py-1.5 text-sm font-mono outline-none resize-y"
        rows={4}
        value={preamble.extra ?? ''}
        onChange={(e) => update({ extra: e.target.value })}
      />
    </Modal>
  )
}
