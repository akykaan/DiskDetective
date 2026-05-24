import fs from 'fs/promises'
import path from 'path'
import { FileNode, ProgressPayload } from './preload'

const THROTTLE_MS = 300

const fileTypeExtensions: Record<string, string[]> = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'avif'],
  video: ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v'],
  audio: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a'],
  archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'iso'],
  code: ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rs', 'rb', 'php', 'swift', 'kt', 'html', 'css', 'scss', 'json', 'xml', 'yaml', 'yml', 'toml', 'sh', 'bat', 'ps1'],
  document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md', 'csv'],
  executable: ['exe', 'msi', 'dll', 'app', 'bin', 'deb', 'rpm'],
  font: ['ttf', 'otf', 'woff', 'woff2', 'eot'],
}

function detectExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase().replace('.', '')
  if (!ext) return 'other'
  for (const [category, exts] of Object.entries(fileTypeExtensions)) {
    if (exts.includes(ext)) return category
  }
  return ext
}

export async function scanFolder(
  folderPath: string,
  onProgress: (progress: ProgressPayload) => void
): Promise<FileNode> {
  const startTime = Date.now()
  let scannedFiles = 0
  let totalScannedSize = 0
  let lastThrottleTime = 0

  const rootName = path.basename(folderPath) || folderPath

  function trySendProgress(currentPath: string) {
    const now = Date.now()
    if (now - lastThrottleTime >= THROTTLE_MS) {
      lastThrottleTime = now
      onProgress({
        scannedFiles,
        currentPath,
        totalSize: totalScannedSize,
        elapsedMs: now - startTime,
      })
    }
  }

  async function scanRecursive(dirPath: string): Promise<FileNode> {
    let localSize = 0
    let fileCount = 0
    const children: FileNode[] = []

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })

      const tasks = entries.map(async (entry) => {
        const fullPath = path.join(dirPath, entry.name)

        try {
          if (entry.isDirectory()) {
            const child = await scanRecursive(fullPath)
            children.push(child)
            localSize += child.size
            fileCount += child.fileCount
          } else if (entry.isFile()) {
            const stats = await fs.stat(fullPath)
            localSize += stats.size
            totalScannedSize += stats.size
            fileCount++
            scannedFiles++

            children.push({
              name: entry.name,
              path: fullPath,
              size: stats.size,
              isDirectory: false,
              modifiedAt: stats.mtime.toISOString(),
              children: [],
              fileCount: 0,
              extension: detectExtension(entry.name),
            })

            trySendProgress(dirPath)
          }
        } catch {
          scannedFiles++
        }
      })

      await Promise.all(tasks)

      trySendProgress(dirPath)
    } catch {
      // Permission denied etc
    }

    return {
      name: path.basename(dirPath),
      path: dirPath,
      size: localSize,
      isDirectory: true,
      modifiedAt: new Date().toISOString(),
      children,
      fileCount,
      extension: '',
    }
  }

  const root = await scanRecursive(folderPath)
  root.name = rootName

  const elapsed = Date.now() - startTime
  onProgress({
    scannedFiles,
    currentPath: folderPath,
    totalSize: totalScannedSize,
    elapsedMs: elapsed,
  })

  return root
}
