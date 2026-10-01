import { useRef } from 'react'
import type { Editor } from '@tiptap/react'
import { useDocumentStore } from '../state/documentStore'
import { putDocument } from '../storage/db'
import { modelToTiptapJson } from '../conversion/tiptapBridge'
import { documentToLatex } from '../conversion/documentToLatex'
import { createEmptyDocument } from '../types/document'
import { readFileAsText, importFile } from '../utils/importUtils'
import { useSyncStore } from '../state/syncStore'

/** Document-level actions (new/open/save/import) shared by the TopBar,
 * MenuBar, and Command Palette so each doesn't reimplement its own copy. */
export function useDocumentActions(editor: Editor | null) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const doSave = async () => {
    const s = useDocumentStore.getState()
    const id = s.id ?? `doc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
    const now = new Date().toISOString()
    await putDocument({
      id,
      name: s.model.metadata.title || 'Untitled Document',
      model: s.model,
      latexSource: s.latexSource,
      createdAt: s.model.metadata.createdAt,
      updatedAt: now,
    })
    useDocumentStore.setState({ id })
    useDocumentStore.getState().markSaved(now)
  }

  const doNew = () => {
    if (useDocumentStore.getState().dirty && !window.confirm('Discard unsaved changes and start a new document?')) return
    const model = createEmptyDocument('Untitled Document')
    useDocumentStore.getState().resetToNew()
    editor?.commands.setContent(modelToTiptapJson(model), { emitUpdate: false })
  }

  const doOpen = () => fileInputRef.current?.click()

  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const text = await readFileAsText(file)
    const result = importFile(file.name, text)
    const latexSource = result.latexSource || documentToLatex(result.doc, { fullDocument: true })
    useDocumentStore.getState().loadDocument(null, result.doc, latexSource)
    editor?.commands.setContent(modelToTiptapJson(result.doc), { emitUpdate: false })
    useSyncStore.getState().setDiagnostics(result.diagnostics)
  }

  return { fileInputRef, doSave, doNew, doOpen, handleFileChosen }
}
