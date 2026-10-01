import { useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { useDocumentActions } from '../hooks/useDocumentActions'
import { useUiStore } from '../state/uiStore'
import { useSettingsStore } from '../state/settingsStore'
import { exportTex, exportMarkdown, exportHtml, exportPlainText } from '../utils/exportUtils'
import { useDocumentStore } from '../state/documentStore'

interface MenuItem {
  label: string
  shortcut?: string
  run: () => void
}

function Menu({ label, items }: { label: string; items: MenuItem[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onDocClick)
    return () => window.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        className={`px-2 py-1 text-xs rounded hover:bg-[var(--color-bg-inset)] ${open ? 'bg-[var(--color-bg-inset)]' : ''}`}
        onClick={() => setOpen((o) => !o)}
      >
        {label}
      </button>
      {open && (
        <div className="absolute top-7 left-0 z-40 w-56 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] shadow-lg py-1 lf-animate-in">
          {items.map((item) => (
            <button
              key={item.label}
              className="w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-[var(--color-bg-inset)]"
              onClick={() => {
                item.run()
                setOpen(false)
              }}
            >
              <span>{item.label}</span>
              {item.shortcut && <kbd className="text-[var(--color-text-muted)]">{item.shortcut}</kbd>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function MenuBar({ editor }: { editor: Editor | null }) {
  const { doNew, doOpen, doSave } = useDocumentActions(editor)
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen)
  const setCommandPaletteOpen = useUiStore((s) => s.setCommandPaletteOpen)
  const togglePreview = useUiStore((s) => s.togglePreview)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const togglePreamble = useUiStore((s) => s.togglePreamble)
  const setSettings = useSettingsStore((s) => s.set)
  const theme = useSettingsStore((s) => s.theme)

  const model = () => useDocumentStore.getState().model

  return (
    <div className="flex items-center gap-0.5 px-2 h-7 border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)]">
      <Menu
        label="File"
        items={[
          { label: 'New', shortcut: '⌘N', run: doNew },
          { label: 'Open…', shortcut: '⌘O', run: doOpen },
          { label: 'Save', shortcut: '⌘S', run: doSave },
          { label: 'Export → LaTeX (.tex)', run: () => exportTex(model()) },
          { label: 'Export → Markdown (.md)', run: () => exportMarkdown(model()) },
          { label: 'Export → HTML', run: () => exportHtml(editor?.getHTML() ?? '', model().metadata.title) },
          { label: 'Export → Plain text', run: () => exportPlainText(editor?.getText() ?? '', model().metadata.title) },
          { label: 'Export → PDF / Print…', run: () => window.print() },
        ]}
      />
      <Menu
        label="Edit"
        items={[
          { label: 'Undo', shortcut: '⌘Z', run: () => editor?.chain().focus().undo().run() },
          { label: 'Redo', shortcut: '⌘⇧Z', run: () => editor?.chain().focus().redo().run() },
          { label: 'Select all', run: () => editor?.chain().focus().selectAll().run() },
        ]}
      />
      <Menu
        label="Insert"
        items={[
          { label: 'Equation (inline)', run: () => editor?.chain().focus().insertContent({ type: 'mathInline', attrs: { latex: 'x^2' } }).run() },
          { label: 'Equation (block)', run: () => editor?.chain().focus().insertContent({ type: 'mathBlock', attrs: { latex: 'F = ma' } }).run() },
          { label: 'Table', run: () => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
          {
            label: 'Image…',
            run: () => {
              const url = window.prompt('Image URL')
              if (url) editor?.chain().focus().setImage({ src: url }).run()
            },
          },
          {
            label: 'Link…',
            run: () => {
              const url = window.prompt('Link URL')
              if (url) editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
            },
          },
          { label: 'Horizontal rule', run: () => editor?.chain().focus().setHorizontalRule().run() },
          { label: 'Page break', run: () => editor?.chain().focus().insertContent({ type: 'pageBreak' }).run() },
          { label: 'Code block', run: () => editor?.chain().focus().toggleCodeBlock().run() },
        ]}
      />
      <Menu
        label="Format"
        items={[
          { label: 'Bold', shortcut: '⌘B', run: () => editor?.chain().focus().toggleBold().run() },
          { label: 'Italic', shortcut: '⌘I', run: () => editor?.chain().focus().toggleItalic().run() },
          { label: 'Underline', shortcut: '⌘U', run: () => editor?.chain().focus().toggleUnderline().run() },
          { label: 'Heading 1', run: () => editor?.chain().focus().toggleHeading({ level: 1 }).run() },
          { label: 'Heading 2', run: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
          { label: 'Clear formatting', run: () => editor?.chain().focus().unsetAllMarks().clearNodes().run() },
        ]}
      />
      <Menu
        label="View"
        items={[
          { label: 'Toggle sidebar', run: toggleSidebar },
          { label: 'Toggle preview', run: togglePreview },
          { label: 'Toggle preamble panel', run: togglePreamble },
          { label: `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`, run: () => setSettings({ theme: theme === 'dark' ? 'light' : 'dark' }) },
          { label: 'Command palette', shortcut: '⌘⇧P', run: () => setCommandPaletteOpen(true) },
        ]}
      />
      <Menu
        label="Help"
        items={[
          { label: 'Settings', run: () => setSettingsOpen(true) },
          {
            label: 'Keyboard shortcuts',
            run: () =>
              window.alert(
                '⌘S Save · ⌘Z Undo · ⌘⇧Z Redo · ⌘B Bold · ⌘I Italic · ⌘U Underline · ⌘⇧P Command palette · ⌘, Settings',
              ),
          },
          { label: 'About LaTeXFlow', run: () => window.alert('LaTeXFlow — a local-first, bidirectional document ↔ LaTeX editor.') },
        ]}
      />
    </div>
  )
}
