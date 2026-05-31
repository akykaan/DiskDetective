import { create } from 'zustand'

export type CompareStatus = 'idle' | 'scanning-left' | 'scanning-right' | 'comparing' | 'done' | 'error'
export type DiffFilter = 'all' | 'only-left' | 'only-right' | 'size-diff' | 'identical'
export type DiffSortColumn = 'name' | 'leftSize' | 'rightSize' | 'sizeDiff' | 'status'
export type SortDirection = 'asc' | 'desc'

interface CompareStore {
  // Mode
  isCompareMode: boolean

  // Paths
  leftPath: string | null
  rightPath: string | null

  // Results
  compareResult: CompareResult | null
  compareStatus: CompareStatus
  compareProgress: CompareProgress | null
  error: string | null

  // Filters
  filter: DiffFilter
  searchQuery: string
  ignoreUnnecessary: boolean

  // Sort
  sortColumn: DiffSortColumn
  sortDirection: SortDirection

  // Actions
  setCompareMode: (on: boolean) => void
  selectLeftFolder: () => Promise<void>
  selectRightFolder: () => Promise<void>
  startCompare: () => Promise<void>
  setFilter: (filter: DiffFilter) => void
  setSearch: (query: string) => void
  setSort: (column: DiffSortColumn) => void
  setIgnoreUnnecessary: (ignore: boolean) => void
  reset: () => void
  cancel: () => void
}

export const useCompareStore = create<CompareStore>((set, get) => ({
  isCompareMode: false,
  leftPath: null,
  rightPath: null,
  compareResult: null,
  compareStatus: 'idle',
  compareProgress: null,
  error: null,
  filter: 'all',
  searchQuery: '',
  ignoreUnnecessary: true,
  sortColumn: 'name',
  sortDirection: 'asc',

  setCompareMode: (on) =>
    set({
      isCompareMode: on,
      // Reset state when entering/leaving compare mode
      compareResult: null,
      compareStatus: 'idle',
      compareProgress: null,
      error: null,
      filter: 'all',
      searchQuery: '',
    }),

  selectLeftFolder: async () => {
    try {
      const folderPath = await window.electronAPI.selectFolder()
      if (folderPath) {
        set({ leftPath: folderPath })
      }
    } catch {
      set({ error: 'Sol klasör seçilirken hata oluştu' })
    }
  },

  selectRightFolder: async () => {
    try {
      const folderPath = await window.electronAPI.selectFolder()
      if (folderPath) {
        set({ rightPath: folderPath })
      }
    } catch {
      set({ error: 'Sağ klasör seçilirken hata oluştu' })
    }
  },

  startCompare: async () => {
    const { leftPath, rightPath, ignoreUnnecessary } = get()
    if (!leftPath || !rightPath) {
      set({ error: 'Lütfen iki klasör de seçin' })
      return
    }

    set({
      compareStatus: 'scanning-left',
      error: null,
      compareProgress: null,
      compareResult: null,
    })

    const cleanup = window.electronAPI.onCompareProgress((data) => {
      set({
        compareProgress: data,
        compareStatus: data.phase,
      })
    })

    try {
      const result = await window.electronAPI.compareFolders(leftPath, rightPath, ignoreUnnecessary)
      cleanup()
      if ('cancelled' in result) {
        set({ compareStatus: 'idle', compareProgress: null })
      } else {
        set({
          compareResult: result,
          compareStatus: 'done',
        })
      }
    } catch (err) {
      cleanup()
      set({
        compareStatus: 'error',
        error: err instanceof Error ? err.message : 'Karşılaştırma sırasında hata oluştu',
        compareProgress: null,
      })
    }
  },

  setFilter: (filter) => set({ filter }),
  setSearch: (query) => set({ searchQuery: query }),
  setIgnoreUnnecessary: (ignoreUnnecessary) => set({ ignoreUnnecessary }),
  setSort: (column) =>
    set((state) => ({
      sortColumn: column,
      sortDirection:
        state.sortColumn === column
          ? state.sortDirection === 'asc'
            ? 'desc'
            : 'asc'
          : 'asc',
    })),

  reset: () =>
    set({
      leftPath: null,
      rightPath: null,
      compareResult: null,
      compareStatus: 'idle',
      compareProgress: null,
      error: null,
      filter: 'all',
      searchQuery: '',
      sortColumn: 'name',
      sortDirection: 'asc',
    }),

  cancel: () => {
    window.electronAPI.cancelCompare()
  },
}))
