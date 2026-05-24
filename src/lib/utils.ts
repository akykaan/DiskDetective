import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const size = bytes / Math.pow(k, i)
  return `${size.toFixed(i === 0 ? 0 : 2)} ${units[i]}`
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Bugün'
  if (days === 1) return 'Dün'
  if (days < 7) return `${days} gün önce`

  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`
  const seconds = ms / 1000
  if (seconds < 60) return `${seconds.toFixed(1)} sn`
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${minutes} dk ${secs} sn`
}

export function getFileIcon(name: string, isDirectory: boolean, extension: string): string {
  if (isDirectory) return '📁'
  const ext = extension.toLowerCase()
  const iconMap: Record<string, string> = {
    image: '🖼️',
    video: '🎬',
    audio: '🎵',
    archive: '📦',
    code: '📄',
    document: '📝',
    executable: '⚙️',
    font: '🔤',
    pdf: '📕',
    txt: '📄',
  }
  return iconMap[ext] || iconMap[extension] || '📄'
}
