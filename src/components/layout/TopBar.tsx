import React, { useMemo } from 'react'
import { ChevronRight, Home } from 'lucide-react'
import { useFolderStore, BreadcrumbItem } from '@/store/useFolderStore'
import { formatBytes, formatDuration } from '@/lib/utils'

const TopBar: React.FC = () => {
  const { tree, selectedNode, breadcrumbs, scanStatus, progress, setSelectedNode, navigateToPath } = useFolderStore()

  const displayBreadcrumbs = useMemo(() => {
    if (!selectedNode) return []
    const parts = selectedNode.path.split('\\').filter(Boolean)
    const crumbs: BreadcrumbItem[] = []
    let currentPath = ''
    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}\\${part}` : `${part}`
      crumbs.push({ name: part, path: currentPath })
    }
    return crumbs
  }, [selectedNode])

  const summary = useMemo(() => {
    if (!tree) return null
    return {
      size: formatBytes(tree.size),
      files: tree.fileCount.toLocaleString(),
      elapsed: elapsedText(),
    }
  }, [tree])

  function elapsedText(): string {
    if (!progress) return '0 sn'
    return formatDuration(progress.elapsedMs)
  }

  return (
    <div className="flex h-10 items-center justify-between border-b border-border px-4 bg-background">
      <div className="flex items-center gap-1 min-w-0">
        <button
          onClick={() => tree && setSelectedNode(tree)}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Home size={13} />
        </button>
        {displayBreadcrumbs.map((crumb, i) => (
          <React.Fragment key={crumb.path}>
            <ChevronRight size={11} className="text-muted-foreground/50 shrink-0" />
            <button
              onClick={() => navigateToPath(crumb.path)}
              className={`text-xs truncate max-w-[120px] hover:text-foreground transition-colors ${
                i === displayBreadcrumbs.length - 1
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground'
              }`}
            >
              {crumb.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {scanStatus === 'done' && summary && (
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground shrink-0">
          <span>Toplam: <span className="text-foreground/80 font-medium">{summary.size}</span></span>
          <span className="w-px h-3 bg-border" />
          <span>{summary.files} dosya</span>
          <span className="w-px h-3 bg-border" />
          <span>{summary.elapsed}</span>
        </div>
      )}

      {scanStatus === 'scanning' && progress && (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <div className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>{progress.scannedFiles.toLocaleString()} dosya taranıyor...</span>
        </div>
      )}
    </div>
  )
}

export default TopBar
