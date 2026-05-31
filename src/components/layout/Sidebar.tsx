import React, { useState, useMemo } from 'react'
import { FolderOpen, HardDrive, Home, FileText, Download, Image, Music, Video, ChevronRight, GitCompareArrows } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFolderStore } from '@/store/useFolderStore'
import { useCompareStore } from '@/store/useCompareStore'
import { formatBytes } from '@/lib/utils'

const quickAccessItems = [
  { label: 'Masaüstü', path: 'desktop', icon: Home },
  { label: 'Belgeler', path: 'documents', icon: FileText },
  { label: 'İndirilenler', path: 'downloads', icon: Download },
  { label: 'Resimler', path: 'pictures', icon: Image },
  { label: 'Müzik', path: 'music', icon: Music },
  { label: 'Videolar', path: 'videos', icon: Video },
]

const Sidebar: React.FC = () => {
  const { tree, scanStatus, progress, selectFolder, theme, setTheme, fontSize, setFontSize } = useFolderStore()
  const [quickAccessOpen, setQuickAccessOpen] = useState(true)

  const diskUsage = useMemo(() => {
    if (!tree) return 0
    const totalDisk = 500 * 1024 * 1024 * 1024
    const usage = tree.size / totalDisk
    return Math.min(usage, 1)
  }, [tree])



  async function handleQuickAccess(name: string) {
    const folderPath = await window.electronAPI.getSystemPath(name)
    if (folderPath) {
      useFolderStore.getState().scanFolder(folderPath)
    }
  }

  return (
    <div className="flex h-full w-[220px] flex-col bg-sidebar border-r border-border">
      <div className="flex items-center gap-2 px-4 py-3">
        <HardDrive size={16} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">Disk Analiz</span>
      </div>

      <div className="px-3 pb-3 space-y-2">
        <Button
          onClick={selectFolder}
          className="w-full gap-2 text-xs"
          size="sm"
        >
          <FolderOpen size={14} />
          Klasör Seç
        </Button>
        <Button
          onClick={() => useCompareStore.getState().setCompareMode(true)}
          variant="outline"
          className="w-full gap-2 text-xs"
          size="sm"
        >
          <GitCompareArrows size={14} />
          Klasör Karşılaştır
        </Button>
      </div>

      {tree && (
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Yerel Disk (C:)
            </span>
          </div>
          <div className="relative h-1.5 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${diskUsage * 100}%`,
                background: `linear-gradient(to right, hsl(var(--disk-free)), hsl(var(--disk-warning)), hsl(var(--disk-full)))`,
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-muted-foreground">
              {formatBytes(tree.size)}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {tree.fileCount.toLocaleString()} dosya
            </span>
          </div>
        </div>
      )}

      <div className="px-3 mb-1">
        <button
          onClick={() => setQuickAccessOpen(!quickAccessOpen)}
          className="flex w-full items-center gap-1.5 py-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
        >
          <ChevronRight
            size={12}
            className={`transition-transform ${quickAccessOpen ? 'rotate-90' : ''}`}
          />
          Hızlı Erişim
        </button>
      </div>

      {quickAccessOpen && (
        <div className="px-2 pb-2 space-y-0.5">
          {quickAccessItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleQuickAccess(item.path)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-sidebar-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <item.icon size={14} />
              {item.label}
            </button>
          ))}
        </div>
      )}

      {scanStatus === 'scanning' && progress && (
        <div className="mt-auto px-4 py-3 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Taranıyor...</span>
          </div>
          <div className="mt-1 text-[10px] text-muted-foreground">
            {progress.scannedFiles.toLocaleString()} dosya
          </div>
        </div>
      )}

      <div className="mt-auto px-4 py-3 border-t border-border space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground w-10 shrink-0">Tema</span>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="flex-1 text-[11px] text-foreground border border-border rounded px-1.5 py-1 outline-none focus:border-primary"
          >
            <option value="dark">Koyu</option>
            <option value="light">Açık</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground w-10 shrink-0">Font</span>
          <select
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="flex-1 text-[11px] text-foreground border border-border rounded px-1.5 py-1 outline-none focus:border-primary"
          >
            <option value="11">11px</option>
            <option value="12">12px</option>
            <option value="13">13px</option>
            <option value="14">14px</option>
            <option value="15">15px</option>
            <option value="16">16px</option>
            <option value="17">17px</option>
            <option value="18">18px</option>
          </select>
        </div>
        <button onClick={() => setFontSize(fontSize + 1)}
          className='w-full text-xs text-foreground border border-border rounded px-1.5 py-1 outline-none focus:border-primary'>
          A+
        </button>
        <button onClick={() => setFontSize(fontSize - 1)}
          className='w-full text-xs text-foreground border border-border rounded px-1.5 py-1 outline-none focus:border-primary'>
          A-
        </button>
      </div>
    </div>
  )
}

export default Sidebar
