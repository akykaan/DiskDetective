import React, { useState, useMemo, useCallback } from 'react'
import { ChevronRight, ArrowUp, ArrowDown } from 'lucide-react'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { useFolderStore } from '@/store/useFolderStore'
import { formatBytes, formatDate, getFileIcon } from '@/lib/utils'

type SortColumn = 'name' | 'size' | 'fileCount' | 'type' | 'modifiedAt'
type SortDirection = 'asc' | 'desc'

function detectFileType(extension: string): string {
  const typeMap: Record<string, string> = {
    image: 'Resim',
    video: 'Video',
    audio: 'Ses',
    archive: 'Arşiv',
    code: 'Kod',
    document: 'Belge',
    executable: 'Çalıştırılabilir',
    font: 'Font',
  }
  return typeMap[extension] || extension.toUpperCase() || 'Diğer'
}

function getSortValue(node: FileNode, col: SortColumn): string | number {
  switch (col) {
    case 'name': return node.name.toLowerCase()
    case 'size': return node.size
    case 'fileCount': return node.isDirectory ? node.fileCount : -1
    case 'type': return node.isDirectory ? '0' : detectFileType(node.extension)
    case 'modifiedAt': return node.modifiedAt
  }
}

interface TableRowItemProps {
  node: FileNode
  depth?: number
}

const TableRowItem: React.FC<TableRowItemProps> = ({ node, depth = 0 }) => {
  const { expandedPaths, toggleExpanded, selectedNode } = useFolderStore()
  const isExpanded = expandedPaths.has(node.path)
  const isSelected = selectedNode?.path === node.path
  const hasChildren = node.children.length > 0

  return (
    <>
      <TableRow
        className={`table-row-hover cursor-pointer ${isSelected ? 'bg-primary/5' : ''}`}
        onClick={() => {
          if (node.isDirectory) useFolderStore.getState().navigateTo(node)
        }}
      >
        <TableCell className="py-2">
          <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 20}px` }}>
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleExpanded(node.path)
                }}
                className="flex items-center justify-center w-4 h-4 shrink-0"
              >
                <ChevronRight
                  size={12}
                  className={`text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                />
              </button>
            ) : (
              <span className="w-4 shrink-0" />
            )}
            <span className="text-sm shrink-0">{getFileIcon(node.name, node.isDirectory, node.extension)}</span>
            <span className="text-xs truncate max-w-[250px]">{node.name}</span>
          </div>
        </TableCell>
        <TableCell className="py-2 text-xs text-right font-mono tabular-nums w-[100px]">
          {formatBytes(node.size)}
        </TableCell>
        <TableCell className="py-2 text-xs text-muted-foreground w-[70px] text-right">
          {node.isDirectory ? node.fileCount.toLocaleString() : '-'}
        </TableCell>
        <TableCell className="py-2 text-xs text-muted-foreground w-[90px]">
          {node.isDirectory ? 'Klasör' : detectFileType(node.extension)}
        </TableCell>
        <TableCell className="py-2 text-xs text-muted-foreground w-[100px]">
          {formatDate(node.modifiedAt)}
        </TableCell>
      </TableRow>
      {hasChildren && (
        <Collapsible open={isExpanded}>
          <CollapsibleContent>
            {node.children.map((child) => (
              <TableRowItem key={child.path} node={child} depth={depth + 1} />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </>
  )
}

type SortConfig = { column: SortColumn; direction: SortDirection }

const columns: { key: SortColumn; label: string; align?: 'left' | 'right'; width: string }[] = [
  { key: 'name', label: 'İsim', width: 'w-[100px]' },
  { key: 'size', label: 'Boyut', align: 'right', width: 'w-[100px]' },
  { key: 'fileCount', label: 'Dosya', align: 'right', width: 'w-[70px]' },
  { key: 'type', label: 'Tür', width: 'w-[90px]' },
  { key: 'modifiedAt', label: 'Değiştirilme', width: 'w-[100px]' },
]

const FolderTable: React.FC = () => {
  const { selectedNode, scanStatus } = useFolderStore()
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: 'name', direction: 'asc' })

  const handleSort = useCallback((col: SortColumn) => {
    setSortConfig((prev) => ({
      column: col,
      direction: prev.column === col
        ? (prev.direction === 'asc' ? 'desc' : 'asc')
        : 'asc',
    }))
  }, [])

  const { column: sortColumn, direction: sortDirection } = sortConfig

  const sortedChildren = useMemo(() => {
    if (!selectedNode) return []
    const dirs = selectedNode.children.filter((c) => c.isDirectory)
    const files = selectedNode.children.filter((c) => !c.isDirectory)

    const sortFn = (a: FileNode, b: FileNode) => {
      const va = getSortValue(a, sortColumn)
      const vb = getSortValue(b, sortColumn)
      let cmp = 0
      if (typeof va === 'number' && typeof vb === 'number') {
        cmp = va - vb
      } else {
        cmp = String(va).localeCompare(String(vb))
      }
      return sortDirection === 'asc' ? cmp : -cmp
    }

    dirs.sort(sortFn)
    files.sort(sortFn)
    return [...dirs, ...files]
  }, [selectedNode, sortColumn, sortDirection])

  if (scanStatus === 'idle') {
    return (
      <div className="flex items-center justify-center h-40 text-xs text-muted-foreground">
        Henüz bir klasör seçilmedi
      </div>
    )
  }

  if (!selectedNode) return null

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => {
              const isActive = sortColumn === col.key
              const Icon = isActive ? (sortDirection === 'asc' ? ArrowUp : ArrowDown) : ArrowUp
              return (
                <TableHead
                  key={col.key}
                  className={`text-[11px] font-medium cursor-pointer select-none hover:text-foreground transition-colors ${col.align === 'right' ? 'text-right' : ''} ${col.width}`}
                  onClick={() => handleSort(col.key)}
                >
                  <span className={`inline-flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : ''}`}>
                    {col.label}
                    <Icon size={11} className={isActive ? 'text-primary' : 'text-muted-foreground/30'} />
                  </span>
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedChildren.map((child) => (
            <TableRowItem key={child.path} node={child} />
          ))}
        </TableBody>
      </Table>
      {sortedChildren.length === 0 && (
        <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
          Bu klasör boş
        </div>
      )}
    </div>
  )
}

export default FolderTable
