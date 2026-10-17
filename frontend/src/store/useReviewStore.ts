import { create } from 'zustand'

export type ThemeMode = 'light' | 'dark'

interface ReviewStoreState {
  theme: ThemeMode
  selectedProductId: string
  activeFilter: 'all' | 'needs_review' | 'approved' | 'flagged'
  searchQuery: string
  isOffline: boolean
  showShortcutsModal: boolean
  showCommandPalette: boolean
  showDiffView: boolean
  zoomEnabled: boolean
  lastAction: { type: 'approve' | 'reset'; productId: string; previousData: any } | null

  // Actions
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
  setSelectedProductId: (id: string) => void
  setActiveFilter: (filter: 'all' | 'needs_review' | 'approved' | 'flagged') => void
  setSearchQuery: (query: string) => void
  setIsOffline: (offline: boolean) => void
  setShowShortcutsModal: (show: boolean) => void
  setShowCommandPalette: (show: boolean) => void
  setShowDiffView: (show: boolean) => void
  setZoomEnabled: (zoom: boolean) => void
  setLastAction: (action: { type: 'approve' | 'reset'; productId: string; previousData: any } | null) => void
}

function getInitialTheme(): ThemeMode {
  try {
    const stored = typeof localStorage !== 'undefined' ? (localStorage.getItem('altlume-theme') as ThemeMode) : null
    if (stored === 'light' || stored === 'dark') return stored
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'dark'
  } catch {
    return 'dark'
  }
}

export const useReviewStore = create<ReviewStoreState>((set) => ({
  theme: getInitialTheme(),
  selectedProductId: 'P01',
  activeFilter: 'all',
  searchQuery: '',
  isOffline: false,
  showShortcutsModal: false,
  showCommandPalette: false,
  showDiffView: false,
  zoomEnabled: false,
  lastAction: null,

  setTheme: (theme) => {
    localStorage.setItem('altlume-theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
    set({ theme })
  },

  toggleTheme: () => {
    set((state) => {
      const nextTheme = state.theme === 'light' ? 'dark' : 'light'
      localStorage.setItem('altlume-theme', nextTheme)
      document.documentElement.setAttribute('data-theme', nextTheme)
      return { theme: nextTheme }
    })
  },

  setSelectedProductId: (id) => set({ selectedProductId: id }),
  setActiveFilter: (activeFilter) => set({ activeFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setIsOffline: (isOffline) => set({ isOffline }),
  setShowShortcutsModal: (showShortcutsModal) => set({ showShortcutsModal }),
  setShowCommandPalette: (showCommandPalette) => set({ showCommandPalette }),
  setShowDiffView: (showDiffView) => set({ showDiffView }),
  setZoomEnabled: (zoomEnabled) => set({ zoomEnabled }),
  setLastAction: (lastAction) => set({ lastAction }),
}))
