import { create } from 'zustand'

export type MobileTab = 'document' | 'latex' | 'preview'

interface UiState {
  sidebarOpen: boolean
  commandPaletteOpen: boolean
  settingsOpen: boolean
  previewOpen: boolean
  preambleOpen: boolean
  diagnosticsOpen: boolean
  mobileTab: MobileTab
  activeEditor: 'document' | 'latex'

  toggleSidebar: () => void
  setCommandPaletteOpen: (open: boolean) => void
  setSettingsOpen: (open: boolean) => void
  togglePreview: () => void
  togglePreamble: () => void
  toggleDiagnostics: () => void
  setMobileTab: (tab: MobileTab) => void
  setActiveEditor: (editor: 'document' | 'latex') => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  commandPaletteOpen: false,
  settingsOpen: false,
  previewOpen: false,
  preambleOpen: false,
  diagnosticsOpen: false,
  mobileTab: 'document',
  activeEditor: 'document',

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  togglePreview: () => set((s) => ({ previewOpen: !s.previewOpen })),
  togglePreamble: () => set((s) => ({ preambleOpen: !s.preambleOpen })),
  toggleDiagnostics: () => set((s) => ({ diagnosticsOpen: !s.diagnosticsOpen })),
  setMobileTab: (mobileTab) => set({ mobileTab }),
  setActiveEditor: (activeEditor) => set({ activeEditor }),
}))
