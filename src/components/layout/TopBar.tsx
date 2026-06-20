import React, { useMemo } from 'react'
import { ChevronRight, Home, Download } from 'lucide-react'
import { useFolderStore, BreadcrumbItem } from '@/store/useFolderStore'
import { useI18nStore } from '@/store/useI18nStore'
import { formatBytes, formatDuration } from '@/lib/utils'

function exportToCsv(root: FileNode, t: any, lang: string): string {
  const headers = lang === 'tr' 
    ? ['Dosya Yolu', 'Dosya Adı', 'Boyut (Bayt)', 'Tür', 'Değiştirilme Tarihi']
    : ['File Path', 'File Name', 'Size (Bytes)', 'Type', 'Modified Date']
  const rows = [headers]
  
  function traverse(node: FileNode) {
    if (!node.isDirectory) {
      rows.push([
        node.path,
        node.name,
        node.size.toString(),
        node.extension,
        node.modifiedAt
      ])
    } else if (node.children) {
      node.children.forEach(traverse)
    }
  }
  
  traverse(root)
  return rows.map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')
}

const TopBar: React.FC = () => {
  const { tree, selectedNode, breadcrumbs, scanStatus, progress, setSelectedNode, navigateToPath } = useFolderStore()
  const { t, language } = useI18nStore()

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

  async function handleExportCSV() {
    if (!selectedNode) return
    const csvContent = '\ufeff' + exportToCsv(selectedNode, t, language)
    const defaultName = language === 'tr' 
      ? `${selectedNode.name}_analiz_raporu.csv` 
      : `${selectedNode.name}_analysis_report.csv`
    const success = await window.electronAPI.exportData(csvContent, defaultName)
    if (success) {
      alert(t('csv_exported'))
    }
  }

  async function handleExportJSON() {
    if (!selectedNode) return
    const jsonContent = JSON.stringify(selectedNode, null, 2)
    const defaultName = language === 'tr'
      ? `${selectedNode.name}_analiz_agaci.json`
      : `${selectedNode.name}_analysis_tree.json`
    const success = await window.electronAPI.exportData(jsonContent, defaultName)
    if (success) {
      alert(t('json_exported'))
    }
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
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground shrink-0 font-mono">
          <span>{t('total')}: <span className="text-foreground/80 font-medium">{summary.size}</span></span>
          <span className="w-px h-3 bg-border" />
          <span>{summary.files} {t('files_scanned_count')}</span>
          <span className="w-px h-3 bg-border" />
          <span>{summary.elapsed}</span>
          <span className="w-px h-3 bg-border" />
          <div className="flex items-center gap-1">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground border border-border rounded px-2 py-0.5 hover:bg-accent transition-colors font-sans font-medium"
              title={t('export_csv')}
            >
              <Download size={10} />
              CSV
            </button>
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground border border-border rounded px-2 py-0.5 hover:bg-accent transition-colors font-sans font-medium"
              title={t('export_json')}
            >
              <Download size={10} />
              JSON
            </button>
          </div>
        </div>
      )}

      {scanStatus === 'scanning' && progress && (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <div className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>{progress.scannedFiles.toLocaleString()} {t('files_scanned')}</span>
        </div>
      )}
    </div>
  )
}

export default TopBar
