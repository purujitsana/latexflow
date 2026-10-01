import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark'
export type LayoutMode = 'top-bottom' | 'split' | 'stacked' | 'doc-only' | 'latex-only'

interface SettingsState {
  // Editor
  fontSize: number
  lineSpacing: number
  editorWidth: number
  tabSize: number
  wordWrap: boolean

  // Synchronization
  debounceMs: number
  autoSync: boolean
  conversionWarnings: boolean

  // LaTeX
  documentClass: string
  packages: string[]
  latexIndent: number

  // Appearance
  theme: Theme
  layout: LayoutMode

  set: (partial: Partial<SettingsState>) => void
  resetDefaults: () => void
}

const DEFAULTS: Omit<SettingsState, 'set' | 'resetDefaults'> = {
  fontSize: 16,
  lineSpacing: 1.7,
  editorWidth: 780,
  tabSize: 2,
  wordWrap: true,
  debounceMs: 200,
  autoSync: true,
  conversionWarnings: true,
  documentClass: 'article',
  packages: ['amsmath', 'amssymb', 'graphicx', 'hyperref'],
  latexIndent: 4,
  theme: 'light',
  layout: 'split',
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      set: (partial) => set(partial),
      resetDefaults: () => set(DEFAULTS),
    }),
    { name: 'latexflow-settings' },
  ),
)
