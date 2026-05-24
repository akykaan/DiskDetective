import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'path'
import { scanFolder } from './scanner'

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
  return result
})

ipcMain.handle('open-in-explorer', async (_event, itemPath: string) => {
  await shell.openPath(itemPath)
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
