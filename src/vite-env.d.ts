/// <reference types="vite/client" />

interface ProgressPayload {
  scannedFiles: number
  currentPath: string
  totalSize: number
  elapsedMs: number
}

interface FileNode {
  name: string
  path: string
  size: number
  isDirectory: boolean
  modifiedAt: string
  children: FileNode[]
  fileCount: number
  extension: string
}

interface CompareProgress {
  phase: 'scanning-left' | 'scanning-right' | 'comparing'
  scannedFiles: number
  totalFiles: number
  currentPath: string
  totalSize: number
  elapsedMs: number
}

interface DiffEntry {
  relativePath: string
  name: string
  isDirectory: boolean
  status: 'only-left' | 'only-right' | 'size-diff' | 'date-diff' | 'identical'
  leftSize: number | null
  rightSize: number | null
  leftModified: string | null
  rightModified: string | null
  sizeDiff: number
  extension: string
}

interface CompareSummary {
  onlyLeft: number
  onlyRight: number
  sizeDiff: number
  identical: number
  totalFiles: number
  onlyLeftSize: number
  onlyRightSize: number
  sizeDiffSize: number
}

interface CompareResult {
  leftPath: string
  rightPath: string
  totalLeft: number
  totalRight: number
  sizeDifference: number
  entries: DiffEntry[]
  ignoredPaths: string[]
  summary: CompareSummary
  elapsedMs: number
}

interface ElectronAPI {
  selectFolder: () => Promise<string | null>
  scanFolder: (path: string) => Promise<FileNode>
  compareFolders: (leftPath: string, rightPath: string, ignoreUnnecessary: boolean) => Promise<CompareResult | { cancelled: true }>
  cancelCompare: () => void
  getSystemPath: (name: string) => Promise<string | null>
  onScanProgress: (callback: (data: ProgressPayload) => void) => () => void
  onCompareProgress: (callback: (data: CompareProgress) => void) => () => void
  openInExplorer: (paths: string | string[]) => Promise<boolean>
  windowControl: (action: 'minimize' | 'maximize' | 'close') => void
  hashFiles: (paths: string[]) => Promise<Record<string, string>>
  deleteItems: (paths: string[]) => Promise<boolean>
  exportData: (data: string, defaultName: string) => Promise<boolean>
}

interface Window {
  electronAPI: ElectronAPI
}
