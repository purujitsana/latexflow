import { create } from 'zustand'
import type { Diagnostic } from '../types/document'
import type { BlockLineRange } from '../conversion/documentToLatex'

export type SyncMode = 'doc2latex' | 'latex2doc' | 'dual'
export type SyncStatus = 'synced' | 'updating' | 'error'
export type SyncOrigin = 'doc' | 'latex' | null

interface SyncState {
  mode: SyncMode
  status: SyncStatus
  /** Which side last produced a change, used to suppress feedback loops. */
  origin: SyncOrigin
  lastError: string | null
  diagnostics: Diagnostic[]
  /** Line range each `document.model.content[i]` occupies in the current
   * `latexSource`, kept fresh by useSyncEngine after every conversion —
   * drives the cursor-position highlight between the two editors. */
  latexLineRanges: BlockLineRange[]

  setMode: (mode: SyncMode) => void
  setStatus: (status: SyncStatus, error?: string | null) => void
  setOrigin: (origin: SyncOrigin) => void
  setDiagnostics: (diagnostics: Diagnostic[]) => void
  setLatexLineRanges: (ranges: BlockLineRange[]) => void
}

export const useSyncStore = create<SyncState>((set) => ({
  mode: 'dual',
  status: 'synced',
  origin: null,
  lastError: null,
  diagnostics: [],
  latexLineRanges: [],

  setMode: (mode) => set({ mode }),
  setStatus: (status, error = null) => set({ status, lastError: error }),
  setOrigin: (origin) => set({ origin }),
  setDiagnostics: (diagnostics) => set({ diagnostics }),
  setLatexLineRanges: (latexLineRanges) => set({ latexLineRanges }),
}))
