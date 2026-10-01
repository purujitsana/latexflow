import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { useEditor } from '@tiptap/react'
import type { editor as MonacoEditorNS } from 'monaco-editor'

import { buildExtensions } from '../editor/extensions'
import { modelToTiptapJson } from '../conversion/tiptapBridge'
import { useDocumentStore } from '../state/documentStore'
import { useSyncStore } from '../state/syncStore'
import { useSettingsStore } from '../state/settingsStore'
import { useUiStore } from '../state/uiStore'
import { useSyncEngine } from '../hooks/useSyncEngine'
import { useCursorSync } from '../hooks/useCursorSync'
import { useAutosave } from '../hooks/useAutosave'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useDocumentActions } from '../hooks/useDocumentActions'
import { useIsDesktop } from '../hooks/useIsDesktop'
import { registerCommands } from '../editor/commands'
import { exportTex, exportMarkdown, exportHtml, exportPlainText } from '../utils/exportUtils'

import { TopBar } from './TopBar'
import { MenuBar } from './MenuBar'
import { Toolbar } from './Toolbar'
import { DocumentEditor } from './DocumentEditor'
import { PreviewPanel } from './PreviewPanel'
import { FileSidebar } from './FileSidebar'
import { StatusBar } from './StatusBar'
import { CommandPalette } from './CommandPalette'
import { SettingsModal } from './SettingsModal'
import { PreamblePanel } from './PreamblePanel'
import { Diagnostics } from './Diagnostics'
import { ResizableSplit } from './ui/ResizableSplit'

// Monaco is the single largest dependency in the bundle; code-splitting it
// keeps the initial document-editor paint fast even though the LaTeX pane
// is visible by default in split view.
const LatexEditor = lazy(() => import('./LatexEditor').then((m) => ({ default: m.LatexEditor })))

function LatexEditorFallback() {
  return (
    <div className="h-full w-full flex items-center justify-center text-sm text-[var(--color-text-muted)]">
      Loading LaTeX editor…
    </div>
  )
}

const MOBILE_TABS: { id: 'document' | 'latex' | 'preview'; label: string }[] = [
  { id: 'document', label: 'Document' },
  { id: 'latex', label: 'LaTeX' },
  { id: 'preview', label: 'Preview' },
]

export function AppShell() {
  const [initialModel] = useState(() => useDocumentStore.getState().model)
  const monacoEditorRef = useRef<MonacoEditorNS.IStandaloneCodeEditor | null>(null)

  const mode = useSyncStore((s) => s.mode)
  const diagnostics = useSyncStore((s) => s.diagnostics)
  const latexLineRanges = useSyncStore((s) => s.latexLineRanges)
  const model = useDocumentStore((s) => s.model)
  const latexSource = useDocumentStore((s) => s.latexSource)
  const theme = useSettingsStore((s) => s.theme)
  const layout = useSettingsStore((s) => s.layout)
  const editorWidth = useSettingsStore((s) => s.editorWidth)
  const previewOpen = useUiStore((s) => s.previewOpen)
  const mobileTab = useUiStore((s) => s.mobileTab)
  const setMobileTab = useUiStore((s) => s.setMobileTab)
  const isDesktop = useIsDesktop()

  const editor = useEditor({
    extensions: buildExtensions(),
    content: modelToTiptapJson(initialModel),
    editorProps: { attributes: { class: 'lf-doc-editor' } },
    onUpdate: ({ editor: ed }) => handleDocChangeRef.current(ed.getJSON()),
  })

  const { handleDocChange, handleLatexChange } = useSyncEngine(editor)
  const { latexHighlight, handleLatexCursorLine } = useCursorSync(editor, latexLineRanges)
  // onUpdate is bound once at editor creation, but the handler identity can
  // change across renders (debounce/mode deps) — route through a ref so the
  // editor always calls the latest version without needing to be recreated.
  const handleDocChangeRef = useRef(handleDocChange)
  useEffect(() => {
    handleDocChangeRef.current = handleDocChange
  }, [handleDocChange])

  useAutosave()
  useKeyboardShortcuts()
  const { fileInputRef, doNew, doOpen, doSave, handleFileChosen } = useDocumentActions(editor)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    editor?.setEditable(mode !== 'latex2doc')
  }, [editor, mode])

  useEffect(() => {
    registerCommands([
      { id: 'file.new', label: 'New Document', group: 'File', shortcut: '⌘N', run: doNew },
      { id: 'file.open', label: 'Open Document', group: 'File', shortcut: '⌘O', run: doOpen },
      { id: 'file.save', label: 'Save', group: 'File', shortcut: '⌘S', run: doSave },
      { id: 'file.export.tex', label: 'Export LaTeX (.tex)', group: 'File', run: () => exportTex(useDocumentStore.getState().model) },
      { id: 'file.export.md', label: 'Export Markdown (.md)', group: 'File', run: () => exportMarkdown(useDocumentStore.getState().model) },
      {
        id: 'file.export.html',
        label: 'Export HTML',
        group: 'File',
        run: () => exportHtml(editor?.getHTML() ?? '', useDocumentStore.getState().model.metadata.title),
      },
      {
        id: 'file.export.txt',
        label: 'Export Plain Text',
        group: 'File',
        run: () => exportPlainText(editor?.getText() ?? '', useDocumentStore.getState().model.metadata.title),
      },
      { id: 'file.export.pdf', label: 'Export PDF / Print', group: 'File', run: () => window.print() },
      { id: 'insert.equation.inline', label: 'Insert Equation (inline)', group: 'Insert', run: () => editor?.chain().focus().insertContent({ type: 'mathInline', attrs: { latex: 'x^2' } }).run() },
      { id: 'insert.equation.block', label: 'Insert Equation (block)', group: 'Insert', run: () => editor?.chain().focus().insertContent({ type: 'mathBlock', attrs: { latex: 'F = ma' } }).run() },
      { id: 'insert.table', label: 'Insert Table', group: 'Insert', run: () => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
      {
        id: 'insert.image',
        label: 'Insert Image',
        group: 'Insert',
        run: () => {
          const url = window.prompt('Image URL')
          if (url) editor?.chain().focus().setImage({ src: url }).run()
        },
      },
      { id: 'view.toggleLayout.split', label: 'Toggle Layout: Split', group: 'View', run: () => useSettingsStore.getState().set({ layout: 'split' }) },
      { id: 'view.toggleLayout.stacked', label: 'Toggle Layout: Stacked', group: 'View', run: () => useSettingsStore.getState().set({ layout: 'stacked' }) },
      {
        id: 'view.toggleDarkMode',
        label: 'Toggle Dark Mode',
        group: 'View',
        run: () => useSettingsStore.getState().set({ theme: useSettingsStore.getState().theme === 'dark' ? 'light' : 'dark' }),
      },
      { id: 'view.preview', label: 'Toggle Preview', group: 'View', run: () => useUiStore.getState().togglePreview() },
      { id: 'view.preamble', label: 'Show Preamble', group: 'View', run: () => useUiStore.getState().togglePreamble() },
      { id: 'view.sidebar', label: 'Toggle Sidebar', group: 'View', run: () => useUiStore.getState().toggleSidebar() },
      { id: 'help.settings', label: 'Settings', group: 'Help', run: () => useUiStore.getState().setSettingsOpen(true) },
      { id: 'sync.doc2latex', label: 'Convert to LaTeX (Document → LaTeX mode)', group: 'Edit', run: () => useSyncStore.getState().setMode('doc2latex') },
      { id: 'sync.latex2doc', label: 'Convert from LaTeX (LaTeX → Document mode)', group: 'Edit', run: () => useSyncStore.getState().setMode('latex2doc') },
    ])
  }, [editor, doNew, doOpen, doSave])

  const docPane = <DocumentEditor editor={editor} />
  const latexPane = (
    <Suspense fallback={<LatexEditorFallback />}>
      <LatexEditor
        value={latexSource}
        onChange={handleLatexChange}
        readOnly={mode === 'doc2latex'}
        diagnostics={diagnostics}
        theme={theme}
        onCursorLine={handleLatexCursorLine}
        highlightRange={latexHighlight}
        onEditorMount={(ed) => {
          monacoEditorRef.current = ed
        }}
      />
    </Suspense>
  )
  const previewPane = <PreviewPanel doc={model} />

  function renderDesktopLayout() {
    if (layout === 'doc-only') return previewOpen ? <ResizableSplit first={docPane} second={previewPane} /> : docPane
    if (layout === 'latex-only') return previewOpen ? <ResizableSplit first={latexPane} second={previewPane} /> : latexPane
    const mainSplit = (
      <ResizableSplit direction={layout === 'stacked' ? 'vertical' : 'horizontal'} first={docPane} second={latexPane} />
    )
    return previewOpen ? <ResizableSplit direction="horizontal" first={mainSplit} second={previewPane} initialRatio={0.66} /> : mainSplit
  }

  function renderMobileLayout() {
    return (
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex border-b border-[var(--color-border)]">
          {MOBILE_TABS.map((t) => (
            <button
              key={t.id}
              className={`flex-1 py-2 text-xs font-medium ${
                mobileTab === t.id ? 'text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'
              }`}
              onClick={() => setMobileTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 min-h-0">
          {mobileTab === 'document' && docPane}
          {mobileTab === 'latex' && latexPane}
          {mobileTab === 'preview' && previewPane}
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ ['--editor-max-width' as string]: `${editorWidth}px` }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".tex,.md,.markdown,.txt"
        className="hidden"
        onChange={handleFileChosen}
      />
      <TopBar editor={editor} />
      <MenuBar editor={editor} />
      <Toolbar editor={editor} />

      <div className="flex-1 flex min-h-0">
        <FileSidebar editor={editor} />

        {/* Exactly one of these mounts at a time (JS-decided, not CSS-hidden) —
            docPane/latexPane each wrap the one shared editor instance, and
            ProseMirror doesn't support that editor having two simultaneous
            DOM mounts (editor.view.nodeDOM, used by the cursor-sync
            highlight, would resolve against whichever mounted second). */}
        {isDesktop ? <div className="flex-1 min-w-0 relative">{renderDesktopLayout()}</div> : renderMobileLayout()}

        <Diagnostics onJump={(line) => jumpMonacoToLine(monacoEditorRef.current, line)} />
      </div>

      <StatusBar editor={editor} />
      <CommandPalette />
      <SettingsModal />
      <PreamblePanel />
    </div>
  )
}

function jumpMonacoToLine(ed: MonacoEditorNS.IStandaloneCodeEditor | null, line: number) {
  if (!ed) return
  ed.revealLineInCenter(line)
  ed.setPosition({ lineNumber: line, column: 1 })
  ed.focus()
}
