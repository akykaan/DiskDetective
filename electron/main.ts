import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { scanFolder } from './scanner'
import { compareFolders } from './comparator'

app.disableHardwareAcceleration()

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

ipcMain.handle('get-system-path', async (_event, name: string) => {
  const validNames = ['desktop', 'documents', 'downloads', 'pictures', 'music', 'videos']
  if (!validNames.includes(name)) return null
  return app.getPath(name as any)
})

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
  })
  if (result.canceled || result.filePaths.length === 0) {
    return null
  }
  return result.filePaths[0]
})

ipcMain.handle('scan-folder', async (_event, folderPath: string) => {
  const result = await scanFolder(folderPath, (progress) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('scan-progress', progress)
    }
  })
  return result.tree
})

let isCompareCancelled = false

ipcMain.handle('compare-folders', async (_event, leftPath: string, rightPath: string, ignoreUnnecessary: boolean = true) => {
  isCompareCancelled = false
  try {
    const result = await compareFolders(leftPath, rightPath, (progress) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('compare-progress', progress)
      }
    }, {
      ignoreUnnecessary,
      checkCancel: () => isCompareCancelled
    })
    return result
  } catch (err: any) {
    if (err.message === 'Cancelled') {
      return { cancelled: true }
    }
    throw err
  }
})

ipcMain.on('cancel-compare', () => {
  isCompareCancelled = true
})

ipcMain.handle('open-in-explorer', async (_event, itemPaths: string | string[]) => {
  const paths = Array.isArray(itemPaths) ? itemPaths : [itemPaths]
  for (const p of paths) {
    if (fs.existsSync(p)) {
      shell.showItemInFolder(p)
      return true
    }
  }
  return false
})

ipcMain.handle('hash-files', async (_event, filePaths: string[]) => {
  const hashes: Record<string, string> = {}
  
  const computeHash = (p: string): Promise<string> => {
    return new Promise((resolve) => {
      const hash = crypto.createHash('md5')
      const stream = fs.createReadStream(p)
      stream.on('data', (data) => hash.update(data))
      stream.on('end', () => resolve(hash.digest('hex')))
      stream.on('error', () => resolve(''))
    })
  }

  const chunkSize = 5
  for (let i = 0; i < filePaths.length; i += chunkSize) {
    const chunk = filePaths.slice(i, i + chunkSize)
    const results = await Promise.all(chunk.map(async (p) => {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        try {
          const h = await computeHash(p)
          return { path: p, hash: h }
        } catch {
          return { path: p, hash: '' }
        }
      }
      return { path: p, hash: '' }
    }))
    for (const r of results) {
      if (r.hash) {
        hashes[r.path] = r.hash
      }
    }
  }

  return hashes
})

ipcMain.handle('delete-items', async (_event, paths: string[]) => {
  let successCount = 0
  for (const p of paths) {
    if (fs.existsSync(p)) {
      try {
        await shell.trashItem(p)
        successCount++
      } catch (err) {
        console.error(`Failed to trash item ${p}:`, err)
      }
    }
  }
  return successCount === paths.length
})

ipcMain.handle('export-data', async (_event, data: string, defaultName: string) => {
  const extension = path.extname(defaultName).replace('.', '')
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: defaultName,
    filters: [
      { name: extension.toUpperCase(), extensions: [extension] },
      { name: 'Tüm Dosyalar', extensions: ['*'] }
    ]
  })
  if (result.canceled || !result.filePath) {
    return false
  }
  try {
    await fs.promises.writeFile(result.filePath, data, 'utf-8')
    return true
  } catch (err) {
    console.error('Failed to export data:', err)
    return false
  }
})

ipcMain.on('window-control', (_event, action: 'minimize' | 'maximize' | 'close') => {
  if (!mainWindow) return
  switch (action) {
    case 'minimize':
      mainWindow.minimize()
      break
    case 'maximize':
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize()
      } else {
        mainWindow.maximize()
      }
      break
    case 'close':
      mainWindow.close()
      break
  }
})
