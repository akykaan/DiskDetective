/// <reference types="vite/client" />

interface ElectronAPI {
  selectFolder: () => Promise<string | null>
  scanFolder: (path: string) => Promise<FileNode>
  getSystemPath: (name: string) => Promise<string | null>
  onScanProgress: (callback: (data: ProgressPayload) => void) => () => void
  openInExplorer: (path: string) => void
  windowControl: (action: 'minimize' | 'maximize' | 'close') => void
}

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

interface Window {
  electronAPI: ElectronAPI
}
