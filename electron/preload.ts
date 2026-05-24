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

export interface ElectronAPI {
  selectFolder: () => Promise<string | null>
  scanFolder: (path: string) => Promise<FileNode>
  getSystemPath: (name: string) => Promise<string | null>
  onScanProgress: (callback: (data: ProgressPayload) => void) => () => void
  openInExplorer: (path: string) => void
  windowControl: (action: 'minimize' | 'maximize' | 'close') => void
}

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  scanFolder: (folderPath: string) => ipcRenderer.invoke('scan-folder', folderPath),
  getSystemPath: (name: string) => ipcRenderer.invoke('get-system-path', name),
  onScanProgress: (callback: (data: ProgressPayload) => void) => {
    const handler = (_event: IpcRendererEvent, data: ProgressPayload) => callback(data)
    ipcRenderer.on('scan-progress', handler)
    return () => {
      ipcRenderer.removeListener('scan-progress', handler)
    }
  },
  openInExplorer: (itemPath: string) => ipcRenderer.invoke('open-in-explorer', itemPath),
  windowControl: (action: 'minimize' | 'maximize' | 'close') => {
    ipcRenderer.send('window-control', action)
  },
})
