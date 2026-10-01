import { useCallback, useEffect, useRef } from 'react'
import type { Editor, JSONContent } from '@tiptap/core'
import { useDocumentStore } from '../state/documentStore'
import { useSyncStore } from '../state/syncStore'
import { useSettingsStore } from '../state/settingsStore'
import { documentToLatexWithRanges } from '../conversion/documentToLatex'
import { parseLatexDocument } from '../conversion/latexParser'
import { tiptapJsonToModel, modelToTiptapJson } from '../conversion/tiptapBridge'

/**
 * Bidirectional sync between the Tiptap document and the LaTeX source.
 *
 * Loop prevention: every programmatic write to "the other side" is preceded
 * by arming a suppress flag for that side. The corresponding change handler
 * checks and clears its own flag before doing any work, so a write we made
 * ourselves never re-triggers a conversion back. Origin metadata + a small
 * debounce keep rapid typing from doing redundant work or fighting the
 * editor's own cursor/undo state.
 */
export function useSyncEngine(editor: Editor | null) {
  const mode = useSyncStore((s) => s.mode)
  const setStatus = useSyncStore((s) => s.setStatus)
  const setOrigin = useSyncStore((s) => s.setOrigin)
  const setDiagnostics = useSyncStore((s) => s.setDiagnostics)
  const setLatexLineRanges = useSyncStore((s) => s.setLatexLineRanges)
  const debounceMs = useSettingsStore((s) => s.debounceMs)

  const suppressLatexRef = useRef(false)
  const docTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latexTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const applyLatexToEditor = useCallback(
    (json: JSONContent) => {
      if (!editor) return
      // emitUpdate: false means onUpdate never fires for this write, so
      // there is nothing for handleDocChange to suppress — the loop is
      // broken at the source rather than by a flag the handler must clear.
      editor.commands.setContent(json, { emitUpdate: false })
    },
    [editor],
  )

  const handleDocChange = useCallback(
    (json: JSONContent) => {
      if (mode !== 'doc2latex' && mode !== 'dual') return

      setOrigin('doc')
      setStatus('updating')
      if (docTimer.current) clearTimeout(docTimer.current)
      docTimer.current = setTimeout(() => {
        try {
          const base = useDocumentStore.getState().model
          const nextModel = tiptapJsonToModel(json, base)
          useDocumentStore.getState().setModel(nextModel, { markDirty: true })
          const { text: latex, ranges } = documentToLatexWithRanges(nextModel, { fullDocument: true })
          setLatexLineRanges(ranges)
          suppressLatexRef.current = true
          useDocumentStore.getState().setLatexSource(latex, { markDirty: true })
          setStatus('synced')
        } catch (err) {
          setStatus('error', err instanceof Error ? err.message : String(err))
        }
      }, debounceMs)
    },
    [mode, debounceMs, setOrigin, setStatus, setLatexLineRanges],
  )

  const handleLatexChange = useCallback(
    (source: string) => {
      if (suppressLatexRef.current) {
        suppressLatexRef.current = false
        useDocumentStore.getState().setLatexSource(source, { markDirty: true })
        return
      }
      if (mode !== 'latex2doc' && mode !== 'dual') {
        useDocumentStore.getState().setLatexSource(source, { markDirty: true })
        return
      }

      useDocumentStore.getState().setLatexSource(source, { markDirty: true })
      setOrigin('latex')
      setStatus('updating')
      if (latexTimer.current) clearTimeout(latexTimer.current)
      latexTimer.current = setTimeout(() => {
        try {
          const { doc, diagnostics, ranges } = parseLatexDocument(source)
          setDiagnostics(diagnostics)
          setLatexLineRanges(ranges)
          useDocumentStore.getState().setModel(doc, { markDirty: true })
          applyLatexToEditor(modelToTiptapJson(doc))
          setStatus(diagnostics.some((d) => d.severity === 'error') ? 'error' : 'synced')
        } catch (err) {
          setStatus('error', err instanceof Error ? err.message : String(err))
        }
      }, debounceMs)
    },
    [mode, debounceMs, applyLatexToEditor, setOrigin, setStatus, setDiagnostics, setLatexLineRanges],
  )

  useEffect(
    () => () => {
      if (docTimer.current) clearTimeout(docTimer.current)
      if (latexTimer.current) clearTimeout(latexTimer.current)
    },
    [],
  )

  return { handleDocChange, handleLatexChange }
}
