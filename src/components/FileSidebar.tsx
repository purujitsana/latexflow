import { useEffect, useState } from 'react'
import { FileText, Plus, Search, Copy, Trash2, Pencil } from 'lucide-react'
import { useUiStore } from '../state/uiStore'
import { useDocumentStore } from '../state/documentStore'
import { deleteDocument, listDocuments, putDocument, type StoredDocument } from '../storage/db'
import { modelToTiptapJson } from '../conversion/tiptapBridge'
import { createEmptyDocument } from '../types/document'
import type { Editor } from '@tiptap/react'
import { IconButton } from './ui/Button'

export function FileSidebar({ editor }: { editor: Editor | null }) {
  const open = useUiStore((s) => s.sidebarOpen)
  const [docs, setDocs] = useState<StoredDocument[]>([])
  const [query, setQuery] = useState('')
  const currentId = useDocumentStore((s) => s.id)

  const refresh = async () => setDocs(await listDocuments())

  useEffect(() => {
    refresh()
    const unsub = useDocumentStore.subscribe((s, prev) => {
      if (s.savedAt !== prev.savedAt) refresh()
    })
    return unsub
  }, [])

  if (!open) return null

  const filtered = docs.filter((d) => d.name.toLowerCase().includes(query.toLowerCase()))

  const openDoc = (d: StoredDocument) => {
    useDocumentStore.getState().loadDocument(d.id, d.model, d.latexSource)
    editor?.commands.setContent(modelToTiptapJson(d.model), { emitUpdate: false })
  }

  const createNew = () => {
    const model = createEmptyDocument('Untitled Document')
    useDocumentStore.getState().resetToNew()
    editor?.commands.setContent(modelToTiptapJson(model), { emitUpdate: false })
  }

  const rename = async (d: StoredDocument) => {
    const name = window.prompt('Rename document', d.name)
    if (!name) return
    const updated = { ...d, name, model: { ...d.model, metadata: { ...d.model.metadata, title: name } } }
    await putDocument(updated)
    if (currentId === d.id) useDocumentStore.getState().setModel(updated.model, { markDirty: false })
    refresh()
  }

  const duplicate = async (d: StoredDocument) => {
    const id = `doc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
    await putDocument({ ...d, id, name: `${d.name} (copy)`, updatedAt: new Date().toISOString() })
    refresh()
  }

  const remove = async (d: StoredDocument) => {
    if (!window.confirm(`Delete "${d.name}"? This cannot be undone.`)) return
    await deleteDocument(d.id)
    if (currentId === d.id) createNew()
    refresh()
  }

  return (
    <aside className="w-56 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-bg-subtle)] flex flex-col h-full">
      <div className="p-2.5 flex items-center gap-1.5">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents"
            className="w-full pl-6 pr-2 py-1 text-xs rounded-md bg-[var(--color-bg-inset)] outline-none"
          />
        </div>
        <IconButton aria-label="New document" onClick={createNew}>
          <Plus size={15} />
        </IconButton>
      </div>
      <div className="px-3 pb-1 text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">My Documents</div>
      <div className="flex-1 overflow-y-auto px-1.5 pb-2 space-y-0.5">
        {filtered.length === 0 && <div className="px-2 py-3 text-xs text-[var(--color-text-muted)]">No documents yet.</div>}
        {filtered.map((d) => (
          <div
            key={d.id}
            className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer text-sm ${
              currentId === d.id ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]' : 'hover:bg-[var(--color-bg-inset)]'
            }`}
            onClick={() => openDoc(d)}
          >
            <FileText size={14} className="shrink-0" />
            <span className="truncate flex-1">{d.name}</span>
            <div className="hidden group-hover:flex items-center gap-0.5">
              <button
                aria-label="Rename"
                className="p-1 hover:text-[var(--color-accent)]"
                onClick={(e) => {
                  e.stopPropagation()
                  rename(d)
                }}
              >
                <Pencil size={12} />
              </button>
              <button
                aria-label="Duplicate"
                className="p-1 hover:text-[var(--color-accent)]"
                onClick={(e) => {
                  e.stopPropagation()
                  duplicate(d)
                }}
              >
                <Copy size={12} />
              </button>
              <button
                aria-label="Delete"
                className="p-1 hover:text-[var(--color-danger)]"
                onClick={(e) => {
                  e.stopPropagation()
                  remove(d)
                }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
