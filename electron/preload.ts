import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

export interface ProgressPayload {
  scannedFiles: number
  currentPath: string
  totalSize: number
  elapsedMs: number
}

export interface FileNode {
  name: string
  path: string
  size: number
  isDirectory: boolean
  modifiedAt: string
  children: FileNode[]
  fileCount: number
  extension: string
}

export interface CompareProgress {
  phase: 'scanning-left' | 'scanning-right' | 'comparing'
  scannedFiles: number
  totalFiles: number
  currentPath: string
  totalSize: number
  elapsedMs: number
}

export interface DiffEntry {
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

export interface CompareSummary {
  onlyLeft: number
  onlyRight: number
  sizeDiff: number
  identical: number
  totalFiles: number
  onlyLeftSize: number
  onlyRightSize: number
  sizeDiffSize: number
}

export interface CompareResult {
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

export interface ElectronAPI {
  selectFolder: () => Promise<string | null>
  scanFolder: (path: string) => Promise<FileNode>
  compareFolders: (leftPath: string, rightPath: string) => Promise<CompareResult>
  getSystemPath: (name: string) => Promise<string | null>
  onScanProgress: (callback: (data: ProgressPayload) => void) => () => void
  onCompareProgress: (callback: (data: CompareProgress) => void) => () => void
  openInExplorer: (path: string) => void
  windowControl: (action: 'minimize' | 'maximize' | 'close') => void
}

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  scanFolder: (folderPath: string) => ipcRenderer.invoke('scan-folder', folderPath),
  compareFolders: (leftPath: string, rightPath: string, ignoreUnnecessary: boolean) =>
    ipcRenderer.invoke('compare-folders', leftPath, rightPath, ignoreUnnecessary),
  cancelCompare: () => ipcRenderer.send('cancel-compare'),
  getSystemPath: (name: string) => ipcRenderer.invoke('get-system-path', name),
  onScanProgress: (callback: (data: ProgressPayload) => void) => {
    const handler = (_event: IpcRendererEvent, data: ProgressPayload) => callback(data)
    ipcRenderer.on('scan-progress', handler)
    return () => {
      ipcRenderer.removeListener('scan-progress', handler)
    }
  },
  onCompareProgress: (callback: (data: CompareProgress) => void) => {
    const handler = (_event: IpcRendererEvent, data: CompareProgress) => callback(data)
    ipcRenderer.on('compare-progress', handler)
    return () => {
      ipcRenderer.removeListener('compare-progress', handler)
    }
  },
  openInExplorer: (paths: string | string[]) => ipcRenderer.invoke('open-in-explorer', paths),
  windowControl: (action: 'minimize' | 'maximize' | 'close') => {
    ipcRenderer.send('window-control', action)
  },
})
