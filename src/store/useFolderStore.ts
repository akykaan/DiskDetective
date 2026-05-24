import { create } from 'zustand'

export interface BreadcrumbItem {
  name: string
  path: string
}

export type ScanStatus = 'idle' | 'scanning' | 'done' | 'error'

interface ProgressInfo {
  scannedFiles: number
  currentPath: string
  totalSize: number
  elapsedMs: number
}

interface FolderStore {
  rootPath: string | null
  tree: FileNode | null
  selectedNode: FileNode | null
  selectedPath: string | null
  expandedPaths: Set<string>
  scanStatus: ScanStatus
  progress: ProgressInfo | null
  error: string | null
  breadcrumbs: BreadcrumbItem[]
  theme: string
  fontSize: number
  panelsOpen: boolean

  setRootPath: (path: string | null) => void
  setTree: (node: FileNode | null) => void
  setSelectedNode: (node: FileNode | null) => void
  setSelectedPath: (path: string | null) => void
  toggleExpanded: (path: string) => void
  setExpanded: (path: string, expanded: boolean) => void
  setScanStatus: (status: ScanStatus) => void
  setProgress: (progress: ProgressInfo | null) => void
  setError: (error: string | null) => void
  setBreadcrumbs: (crumbs: BreadcrumbItem[]) => void
  setTheme: (theme: string) => void
  setFontSize: (size: number) => void
  togglePanels: () => void

  selectFolder: () => Promise<void>
  scanFolder: (path: string) => Promise<void>
  navigateTo: (node: FileNode) => void
  navigateToPath: (filePath: string) => void
}

export const useFolderStore = create<FolderStore>((set, get) => ({
  rootPath: null,
  tree: null,
  selectedNode: null,
  selectedPath: null,
  expandedPaths: new Set(),
  scanStatus: 'idle',
  progress: null,
  error: null,
  breadcrumbs: [],
  theme: 'dark',
  fontSize: 14,
  panelsOpen: true,

  setRootPath: (path) => set({ rootPath: path }),
  setTree: (node) => set({ tree: node }),
  setSelectedNode: (node) => set({ selectedNode: node }),
  setSelectedPath: (path) => set({ selectedPath: path }),
  toggleExpanded: (path) =>
    set((state) => {
      const next = new Set(state.expandedPaths)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return { expandedPaths: next }
    }),
  setExpanded: (path, expanded) =>
    set((state) => {
      const next = new Set(state.expandedPaths)
      if (expanded) {
        next.add(path)
      } else {
        next.delete(path)
      }
      return { expandedPaths: next }
    }),
  setScanStatus: (status) => set({ scanStatus: status }),
  setProgress: (progress) => set({ progress }),
  setError: (error) => set({ error }),
  setBreadcrumbs: (crumbs) => set({ breadcrumbs: crumbs }),
  setTheme: (theme) => set({ theme }),
  setFontSize: (size) => set({ fontSize: size }),
  togglePanels: () => set((state) => ({ panelsOpen: !state.panelsOpen })),

  selectFolder: async () => {
    try {
      const folderPath = await window.electronAPI.selectFolder()
      if (!folderPath) return
      set({ rootPath: folderPath })
      await get().scanFolder(folderPath)
    } catch {
      set({ error: 'Klasör seçilirken hata oluştu' })
    }
  },

  scanFolder: async (folderPath: string) => {
    set({ scanStatus: 'scanning', error: null, progress: null })

    const cleanup = window.electronAPI.onScanProgress((data) => {
      set({ progress: data })
    })

    try {
      const tree = await window.electronAPI.scanFolder(folderPath)
      cleanup()
      set({
        tree,
        scanStatus: 'done',
        selectedNode: tree,
        selectedPath: tree.path,
      })
    } catch (err) {
      cleanup()
      set({
        scanStatus: 'error',
        error: err instanceof Error ? err.message : 'Tarama sırasında hata oluştu',
        progress: null,
      })
    }
  },

  navigateTo: (node: FileNode) => {
    set({ selectedNode: node, selectedPath: node.path })
  },

  navigateToPath: (filePath: string) => {
    const { tree } = get()
    if (!tree) return

    function dfs(node: FileNode): FileNode | null {
      if (node.path === filePath) return node
      for (const child of node.children) {
        const found = dfs(child)
        if (found) return found
      }
      return null
    }

    const node = dfs(tree)
    if (node) set({ selectedNode: node, selectedPath: node.path })
  },
}))
