import type { Editor } from '@tiptap/react'
import {
  FilePlus,
  FolderOpen,
  Save,
  Download,
  Undo2,
  Redo2,
  Settings,
  Sun,
  Moon,
  PanelLeft,
  Columns2,
  Rows2,
  FileText as DocOnlyIcon,
  Code2,
  Sigma,
} from 'lucide-react'
import { useState } from 'react'
import { IconButton, Button } from './ui/Button'
import { useSyncStore, type SyncMode } from '../state/syncStore'
import { useSettingsStore, type LayoutMode } from '../state/settingsStore'
import { useUiStore } from '../state/uiStore'
import { useDocumentStore } from '../state/documentStore'
import { exportTex, exportMarkdown, exportHtml, exportPlainText } from '../utils/exportUtils'
import { useDocumentActions } from '../hooks/useDocumentActions'

const LAYOUTS: { value: LayoutMode; icon: React.ReactNode; label: string }[] = [
  { value: 'split', icon: <Columns2 size={15} />, label: 'Split view' },
  { value: 'stacked', icon: <Rows2 size={15} />, label: 'Stacked view' },
  { value: 'doc-only', icon: <DocOnlyIcon size={15} />, label: 'Document only' },
  { value: 'latex-only', icon: <Code2 size={15} />, label: 'LaTeX only' },
]

export function TopBar({ editor }: { editor: Editor | null }) {
  const mode = useSyncStore((s) => s.mode)
  const setMode = useSyncStore((s) => s.setMode)
  const layout = useSettingsStore((s) => s.layout)
  const theme = useSettingsStore((s) => s.theme)
  const setSettings = useSettingsStore((s) => s.set)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen)
  const togglePreview = useUiStore((s) => s.togglePreview)
  const previewOpen = useUiStore((s) => s.previewOpen)
  const [exportOpen, setExportOpen] = useState(false)
  const { fileInputRef, doSave, doNew, doOpen, handleFileChosen } = useDocumentActions(editor)

  return (
    <div className="flex items-center gap-2 px-3 h-12 border-b border-[var(--color-border)] bg-[var(--color-bg)] shrink-0">
      <input ref={fileInputRef} type="file" accept=".tex,.md,.markdown,.txt" className="hidden" onChange={handleFileChosen} />

      <IconButton aria-label="Toggle sidebar" onClick={toggleSidebar}>
        <PanelLeft size={17} />
      </IconButton>

      <div className="flex items-center gap-1.5 font-semibold text-[15px] mr-2 select-none">
        <Sigma size={18} className="text-[var(--color-accent)]" />
        LaTeXFlow
      </div>

      <IconButton aria-label="New document" onClick={doNew}>
        <FilePlus size={16} />
      </IconButton>
      <IconButton aria-label="Open document" onClick={doOpen}>
        <FolderOpen size={16} />
      </IconButton>
      <IconButton aria-label="Save" onClick={doSave}>
        <Save size={16} />
      </IconButton>

      <div className="relative">
        <IconButton aria-label="Export" onClick={() => setExportOpen((o) => !o)}>
          <Download size={16} />
        </IconButton>
        {exportOpen && (
          <div
            className="absolute top-9 left-0 z-30 w-52 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] shadow-lg py-1 lf-animate-in"
            onMouseLeave={() => setExportOpen(false)}
          >
            {[
              { label: 'LaTeX (.tex)', run: () => exportTex(useDocumentStore.getState().model) },
              { label: 'Markdown (.md)', run: () => exportMarkdown(useDocumentStore.getState().model) },
              {
                label: 'HTML',
                run: () => exportHtml(editor?.getHTML() ?? '', useDocumentStore.getState().model.metadata.title),
              },
              {
                label: 'Plain text (.txt)',
                run: () => exportPlainText(editor?.getText() ?? '', useDocumentStore.getState().model.metadata.title),
              },
              { label: 'PDF / Print…', run: () => window.print() },
            ].map((item) => (
              <button
                key={item.label}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-[var(--color-bg-inset)]"
                onClick={() => {
                  item.run()
                  setExportOpen(false)
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-px self-stretch bg-[var(--color-border)] mx-1" />

      <IconButton aria-label="Undo" onClick={() => editor?.chain().focus().undo().run()} disabled={!editor?.can().undo()}>
        <Undo2 size={16} />
      </IconButton>
      <IconButton aria-label="Redo" onClick={() => editor?.chain().focus().redo().run()} disabled={!editor?.can().redo()}>
        <Redo2 size={16} />
      </IconButton>

      <div className="flex-1" />

      <div className="flex items-center gap-0.5 bg-[var(--color-bg-inset)] rounded-lg p-0.5" role="radiogroup" aria-label="Sync mode">
        {(
          [
            ['doc2latex', 'Document → LaTeX'],
            ['dual', 'Dual'],
            ['latex2doc', 'LaTeX → Document'],
          ] as [SyncMode, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            role="radio"
            aria-checked={mode === value}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              mode === value ? 'bg-[var(--color-accent)] text-[var(--color-accent-contrast)]' : 'text-[var(--color-text-muted)]'
            }`}
            onClick={() => setMode(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-0.5 bg-[var(--color-bg-inset)] rounded-lg p-0.5 ml-2">
        {LAYOUTS.map((l) => (
          <IconButton key={l.value} aria-label={l.label} active={layout === l.value} onClick={() => setSettings({ layout: l.value })}>
            {l.icon}
          </IconButton>
        ))}
      </div>

      <Button variant={previewOpen ? 'primary' : 'ghost'} onClick={togglePreview} className="ml-1">
        Preview
      </Button>

      <IconButton
        aria-label="Toggle theme"
        onClick={() => setSettings({ theme: theme === 'dark' ? 'light' : 'dark' })}
        className="ml-1"
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </IconButton>
      <IconButton aria-label="Settings" onClick={() => setSettingsOpen(true)}>
        <Settings size={16} />
      </IconButton>
    </div>
  )
}
