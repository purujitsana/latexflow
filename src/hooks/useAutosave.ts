import { useEffect, useRef } from 'react'
import { useDocumentStore } from '../state/documentStore'
import { putDocument, isStorageAvailable, type StoredDocument } from '../storage/db'

function generateId() {
  return `doc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

/** Debounced autosave to IndexedDB. Assigns a fresh id on first save. */
export function useAutosave(intervalMs = 2000) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isStorageAvailable()) return
    const unsub = useDocumentStore.subscribe((state, prev) => {
      if (state.model === prev.model && state.latexSource === prev.latexSource) return
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(async () => {
        const s = useDocumentStore.getState()
        const id = s.id ?? generateId()
        const now = new Date().toISOString()
        const stored: StoredDocument = {
          id,
          name: s.model.metadata.title || 'Untitled Document',
          model: s.model,
          latexSource: s.latexSource,
          createdAt: s.model.metadata.createdAt,
          updatedAt: now,
        }
        await putDocument(stored)
        useDocumentStore.setState({ id })
        useDocumentStore.getState().markSaved(now)
      }, intervalMs)
    })
    return () => {
      unsub()
      if (timer.current) clearTimeout(timer.current)
    }
  }, [intervalMs])
}
