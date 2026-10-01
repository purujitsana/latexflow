import { useEffect, useRef } from 'react'
import Editor, { type Monaco, type OnMount } from '@monaco-editor/react'
import type { editor as MonacoEditorNS } from 'monaco-editor'
import { registerLatexLanguage, LATEX_LANGUAGE_ID } from '../utils/latexLanguage'
import { useSettingsStore } from '../state/settingsStore'
import type { Diagnostic } from '../types/document'

export function LatexEditor({
  value,
  onChange,
  readOnly,
  diagnostics,
  theme,
  onCursorLine,
  onEditorMount,
}: {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  diagnostics: Diagnostic[]
  theme: 'light' | 'dark'
  onCursorLine?: (line: number) => void
  onEditorMount?: (editor: MonacoEditorNS.IStandaloneCodeEditor) => void
}) {
  const editorRef = useRef<MonacoEditorNS.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const tabSize = useSettingsStore((s) => s.tabSize)
  const wordWrap = useSettingsStore((s) => s.wordWrap)
  const fontSize = useSettingsStore((s) => s.fontSize)

  const handleMount: OnMount = (editorInstance, monaco) => {
    editorRef.current = editorInstance
    monacoRef.current = monaco
    registerLatexLanguage(monaco)
    monaco.editor.setModelLanguage(editorInstance.getModel()!, LATEX_LANGUAGE_ID)
    editorInstance.onDidChangeCursorPosition((e) => onCursorLine?.(e.position.lineNumber))
    applyMarkers(monaco, editorInstance, diagnostics)
    onEditorMount?.(editorInstance)
  }

  function applyMarkers(monaco: Monaco, ed: MonacoEditorNS.IStandaloneCodeEditor, diags: Diagnostic[]) {
    const model = ed.getModel()
    if (!model) return
    monaco.editor.setModelMarkers(
      model,
      'latexflow',
      diags.map((d) => ({
        startLineNumber: d.line,
        endLineNumber: d.line,
        startColumn: 1,
        endColumn: model.getLineMaxColumn(Math.min(d.line, model.getLineCount())),
        message: d.message,
        severity:
          d.severity === 'error'
            ? monaco.MarkerSeverity.Error
            : d.severity === 'warning'
              ? monaco.MarkerSeverity.Warning
              : monaco.MarkerSeverity.Info,
      })),
    )
  }

  // Re-apply markers whenever diagnostics change (editor instance persists).
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      applyMarkers(monacoRef.current, editorRef.current, diagnostics)
    }
  }, [diagnostics])

  return (
    <div className="h-full w-full">
      <Editor
        language={LATEX_LANGUAGE_ID}
        value={value}
        theme={theme === 'dark' ? 'vs-dark' : 'vs'}
        onMount={handleMount}
        onChange={(v) => onChange(v ?? '')}
        options={{
          readOnly,
          fontSize,
          tabSize,
          wordWrap: wordWrap ? 'on' : 'off',
          minimap: { enabled: true },
          automaticLayout: true,
          scrollBeyondLastLine: false,
          bracketPairColorization: { enabled: true },
          folding: true,
          renderLineHighlight: 'all',
          padding: { top: 12 },
        }}
      />
    </div>
  )
}

export function jumpToLine(editor: MonacoEditorNS.IStandaloneCodeEditor | null, line: number) {
  if (!editor) return
  editor.revealLineInCenter(line)
  editor.setPosition({ lineNumber: line, column: 1 })
  editor.focus()
}
