import { useEffect } from 'react'
import { useUiStore } from '../state/uiStore'
import { useDocumentStore } from '../state/documentStore'
import { putDocument } from '../storage/db'

function isMac() {
  return typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
}

export function useKeyboardShortcuts() {
  const setCommandPaletteOpen = useUiStore((s) => s.setCommandPaletteOpen)
  const setSettingsOpen = useUiStore((s) => s.setSettingsOpen)

  useEffect(() => {
    async function onKeyDown(e: KeyboardEvent) {
      const mod = isMac() ? e.metaKey : e.ctrlKey
      if (!mod) return

      if (mod && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        useUiStore.getState().setCommandPaletteOpen(!useUiStore.getState().commandPaletteOpen)
        return
      }

      if (mod && !e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault()
        const s = useDocumentStore.getState()
        const id = s.id ?? `doc_${Date.now().toString(36)}`
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
        return
      }

      if (mod && e.key === ',') {
        e.preventDefault()
        setSettingsOpen(true)
      }
    }

    function onEscape(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      if (useUiStore.getState().commandPaletteOpen) setCommandPaletteOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keydown', onEscape)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keydown', onEscape)
    }
  }, [setCommandPaletteOpen, setSettingsOpen])
}
