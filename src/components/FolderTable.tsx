import React, { useState, useMemo, useCallback } from 'react'
import { ChevronRight, ArrowUp, ArrowDown, Eye, Trash2 } from 'lucide-react'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { useFolderStore } from '@/store/useFolderStore'
import { useI18nStore } from '@/store/useI18nStore'
import { formatBytes, formatDate, getFileIcon } from '@/lib/utils'

type SortColumn = 'name' | 'size' | 'fileCount' | 'type' | 'modifiedAt'
type SortDirection = 'asc' | 'desc'

function detectFileType(extension: string, t: any): string {
  const label = t(`file_type_map.${extension}`)
  if (label !== `file_type_map.${extension}`) return label
  return extension.toUpperCase() || t('file_type_map.other')
}

function getSortValue(node: FileNode, col: SortColumn, t: any): string | number {
  switch (col) {
    case 'name': return node.name.toLowerCase()
    case 'size': return node.size
    case 'fileCount': return node.isDirectory ? node.fileCount : -1
    case 'type': return node.isDirectory ? '0' : detectFileType(node.extension, t)
    case 'modifiedAt': return node.modifiedAt
  }
}

interface TableRowItemProps {
  node: FileNode
  depth?: number
}

const TableRowItem: React.FC<TableRowItemProps> = ({ node, depth = 0 }) => {
  const { expandedPaths, toggleExpanded, selectedNode } = useFolderStore()
  const { t } = useI18nStore()
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
        <TableCell className="py-2 text-xs text-muted-foreground w-[70px] text-right font-mono">
          {node.isDirectory ? node.fileCount.toLocaleString() : '-'}
        </TableCell>
        <TableCell className="py-2 text-xs text-muted-foreground w-[90px]">
          {node.isDirectory ? t('folder') : detectFileType(node.extension, t)}
        </TableCell>
        <TableCell className="py-2 text-xs text-muted-foreground w-[100px]">
          {formatDate(node.modifiedAt)}
        </TableCell>
        <TableCell className="py-2 text-center w-[80px]" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() => window.electronAPI.openInExplorer(node.path)}
              className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
              title={t('show_in_explorer')}
            >
              <Eye size={12} />
            </button>
            <button
              onClick={async () => {
                const message = t('delete_confirm', {
                  name: node.name,
                  type: node.isDirectory ? t('folder') : t('file_lower')
                })
                if (confirm(message)) {
                  const success = await window.electronAPI.deleteItems([node.path])
                  if (success) {
                    useFolderStore.getState().deleteNode(node.path)
                  }
                }
              }}
              className="p-1 hover:bg-destructive/15 rounded text-muted-foreground hover:text-destructive transition-colors"
              title={t('delete')}
            >
              <Trash2 size={12} />
            </button>
          </div>
        </TableCell>
      </TableRow>
      {hasChildren && isExpanded && (
        <>
          {node.children.map((child) => (
            <TableRowItem key={child.path} node={child} depth={depth + 1} />
          ))}
        </>
      )}
    </>
  )
}

type SortConfig = { column: SortColumn; direction: SortDirection }

const columns: { key: SortColumn | 'actions'; labelKey: string; align?: 'left' | 'right' | 'center'; width: string }[] = [
  { key: 'name', labelKey: 'name', width: 'w-[100px]' },
  { key: 'size', labelKey: 'size', align: 'right', width: 'w-[100px]' },
  { key: 'fileCount', labelKey: 'file', align: 'right', width: 'w-[70px]' },
  { key: 'type', labelKey: 'type', width: 'w-[90px]' },
  { key: 'modifiedAt', labelKey: 'modified', width: 'w-[100px]' },
  { key: 'actions', labelKey: 'actions', align: 'center', width: 'w-[80px]' },
]

const FolderTable: React.FC = () => {
  const { selectedNode, scanStatus } = useFolderStore()
  const { t } = useI18nStore()
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
      const va = getSortValue(a, sortColumn, t)
      const vb = getSortValue(b, sortColumn, t)
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
  }, [selectedNode, sortColumn, sortDirection, t])

  if (scanStatus === 'idle') {
    return (
      <div className="flex items-center justify-center h-40 text-xs text-muted-foreground">
        {t('not_selected')}
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
              const isActions = col.key === 'actions'
              return (
                <TableHead
                  key={col.key}
                  className={`text-[11px] font-medium select-none transition-colors ${isActions ? 'text-center' : 'cursor-pointer hover:text-foreground'} ${col.align === 'right' ? 'text-right' : ''} ${col.align === 'center' ? 'text-center' : ''} ${col.width}`}
                  onClick={() => !isActions && handleSort(col.key as SortColumn)}
                >
                  <span className={`inline-flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : ''} ${col.align === 'center' ? 'justify-center' : ''}`}>
                    {t(col.labelKey)}
                    {!isActions && <Icon size={11} className={isActive ? 'text-primary' : 'text-muted-foreground/30'} />}
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
          {t('empty_folder')}
        </div>
      )}
    </div>
  )
}

export default FolderTable
