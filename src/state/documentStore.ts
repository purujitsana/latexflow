import { create } from 'zustand'
import type { DocumentModel } from '../types/document'
import { createEmptyDocument } from '../types/document'
import { documentToLatex } from '../conversion/documentToLatex'

interface DocumentState {
  id: string | null
  model: DocumentModel
  latexSource: string
  savedAt: string | null
  dirty: boolean

  setModel: (model: DocumentModel, opts?: { markDirty?: boolean }) => void
  setLatexSource: (src: string, opts?: { markDirty?: boolean }) => void
  setTitle: (title: string) => void
  loadDocument: (id: string | null, model: DocumentModel, latexSource: string) => void
  markSaved: (at: string) => void
  resetToNew: () => void
}

function initialLatex(model: DocumentModel) {
  return documentToLatex(model, { fullDocument: true })
}

const initialModel = createEmptyDocument('Untitled Document')

export const useDocumentStore = create<DocumentState>((set) => ({
  id: null,
  model: initialModel,
  latexSource: initialLatex(initialModel),
  savedAt: null,
  dirty: false,

  setModel: (model, opts) => set({ model, dirty: opts?.markDirty !== false }),
  setLatexSource: (latexSource, opts) => set({ latexSource, dirty: opts?.markDirty !== false }),
  setTitle: (title) =>
    set((s) => ({ model: { ...s.model, metadata: { ...s.model.metadata, title } }, dirty: true })),
  loadDocument: (id, model, latexSource) => set({ id, model, latexSource, dirty: false, savedAt: new Date().toISOString() }),
  markSaved: (at) => set({ savedAt: at, dirty: false }),
  resetToNew: () => {
    const model = createEmptyDocument('Untitled Document')
    set({ id: null, model, latexSource: initialLatex(model), dirty: false, savedAt: null })
  },
}))
