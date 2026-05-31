import React, { useMemo, useCallback, useState } from 'react'
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Equal, AlertTriangle, ChevronDown, ChevronRight, Folder } from 'lucide-react'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { useCompareStore, DiffSortColumn } from '@/store/useCompareStore'
import { formatBytes, getFileIcon } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  Status badge                                                       */
/* ------------------------------------------------------------------ */

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string }> = {
  'only-left': {
    label: 'Sadece Sol (A Klasörü)',
    icon: <ArrowLeft size={10} />,
    bg: 'bg-red-500/10',
    text: 'text-red-500',
  },
  'only-right': {
    label: 'Sadece Sağ (B Klasörü)',
    icon: <ArrowRight size={10} />,
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
  },
  'size-diff': {
    label: 'Boyut Farklı',
    icon: <AlertTriangle size={10} />,
    bg: 'bg-amber-500/10',
    text: 'text-amber-500',
  },
  'date-diff': {
    label: 'Tarih Farklı',
    icon: <AlertTriangle size={10} />,
    bg: 'bg-orange-500/10',
    text: 'text-orange-500',
  },
  identical: {
    label: 'Aynı',
    icon: <Equal size={10} />,
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-500',
  },
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.identical
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${config.bg} ${config.text}`}
    >
      {config.icon}
      {config.label}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  Size cell with diff coloring                                       */
/* ------------------------------------------------------------------ */

const SizeCell: React.FC<{ size: number | null }> = ({ size }) => {
  if (size === null) return <span className="text-muted-foreground/40">—</span>
  return <span>{formatBytes(size)}</span>
}

const DiffCell: React.FC<{ diff: number; status: string }> = ({ diff, status }) => {
  if (status === 'identical') return <span className="text-emerald-500">0 B</span>
  if (status === 'only-left') return <span className="text-red-400">+{formatBytes(Math.abs(diff))}</span>
  if (status === 'only-right') return <span className="text-blue-400">-{formatBytes(Math.abs(diff))}</span>

  const color = diff > 0 ? 'text-red-400' : diff < 0 ? 'text-blue-400' : 'text-muted-foreground'
  const sign = diff > 0 ? '+' : ''
  return <span className={color}>{sign}{formatBytes(Math.abs(diff))}</span>
}

function getRowBg(status: string): string {
  switch (status) {
    case 'only-left':
      return 'bg-red-500/[0.03] hover:bg-red-500/[0.07]'
    case 'only-right':
      return 'bg-blue-500/[0.03] hover:bg-blue-500/[0.07]'
    case 'size-diff':
      return 'bg-amber-500/[0.03] hover:bg-amber-500/[0.07]'
    case 'identical':
      return 'hover:bg-muted/50'
    default:
      return 'hover:bg-muted/50'
  }
}

const columns: { key: DiffSortColumn; label: string; align?: 'left' | 'right'; width: string }[] = [
  { key: 'name', label: 'Dosya Yolu', width: 'min-w-[280px]' },
  { key: 'leftSize', label: 'Sol Boyut', align: 'right', width: 'w-[100px]' },
  { key: 'rightSize', label: 'Sağ Boyut', align: 'right', width: 'w-[100px]' },
  { key: 'sizeDiff', label: 'Fark', align: 'right', width: 'w-[100px]' },
  { key: 'status', label: 'Durum', width: 'w-[110px]' },
]

/* ------------------------------------------------------------------ */
/*  Tree Logic                                                         */
/* ------------------------------------------------------------------ */

interface TreeNode {
  name: string
  relativePath: string
  isDirectory: boolean
  childrenMap: Record<string, TreeNode>
  children: TreeNode[]
  leftSize: number
  rightSize: number
  sizeDiff: number
  status: string
  entry?: any
  fileCount: number
}

function getSortValue(node: TreeNode, col: DiffSortColumn): string | number {
  switch (col) {
    case 'name':
      return node.name.toLowerCase()
    case 'leftSize':
      return node.leftSize
    case 'rightSize':
      return node.rightSize
    case 'sizeDiff':
      return Math.abs(node.sizeDiff)
    case 'status': {
      const order: Record<string, number> = {
        'only-left': 0,
        'only-right': 1,
        'size-diff': 2,
        'date-diff': 3,
        identical: 4,
      }
      return order[node.status] ?? 5
    }
  }
}

function buildTree(entries: any[], sortColumn: DiffSortColumn, sortDirection: 'asc' | 'desc'): TreeNode[] {
  const rootMap: Record<string, TreeNode> = {}

  for (const entry of entries) {
    // We already filter out identical directories in filteredAndSorted, but just in case, we rebuild from relativePath
    if (entry.isDirectory) continue

    const parts = entry.relativePath.split('/')
    let currentLevelMap = rootMap
    let currentPath = ''

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      currentPath = currentPath ? `${currentPath}/${part}` : part
      const isFile = i === parts.length - 1

      if (!currentLevelMap[part]) {
        currentLevelMap[part] = {
          name: part,
          relativePath: currentPath,
          isDirectory: !isFile,
          childrenMap: {},
          children: [],
          leftSize: 0,
          rightSize: 0,
          sizeDiff: 0,
          status: entry.status,
          fileCount: 0,
        }
      }

      const node = currentLevelMap[part]

      if (isFile) {
        node.entry = entry
        node.leftSize = entry.leftSize || 0
        node.rightSize = entry.rightSize || 0
        node.sizeDiff = entry.sizeDiff || 0
        node.status = entry.status
        node.fileCount = 1
      } else {
        node.leftSize += entry.leftSize || 0
        node.rightSize += entry.rightSize || 0
        node.sizeDiff += entry.sizeDiff || 0
        node.fileCount += 1
      }

      currentLevelMap = node.childrenMap
    }
  }

  function finalize(nodeMap: Record<string, TreeNode>): TreeNode[] {
    const arr = Object.values(nodeMap)
    for (const node of arr) {
      if (node.isDirectory) {
        node.children = finalize(node.childrenMap)
      }
    }
    return arr.sort((a, b) => {
      // Always put folders first regardless of sort direction, unless sorting by name? Let's just always put folders first
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1

      const va = getSortValue(a, sortColumn)
      const vb = getSortValue(b, sortColumn)
      let cmp = 0
      if (typeof va === 'number' && typeof vb === 'number') {
        cmp = va - vb
      } else {
        cmp = String(va).localeCompare(String(vb))
      }
      return sortDirection === 'asc' ? cmp : -cmp
    })
  }

  return finalize(rootMap)
}

interface FlattenedNode {
  node: TreeNode
  depth: number
}

function flatten(nodes: TreeNode[], depth: number, expandedPaths: Set<string>): FlattenedNode[] {
  let result: FlattenedNode[] = []
  for (const node of nodes) {
    result.push({ node, depth })
    if (node.isDirectory && expandedPaths.has(node.relativePath)) {
      result = result.concat(flatten(node.children, depth + 1, expandedPaths))
    }
  }
  return result
}

/* ------------------------------------------------------------------ */
/*  Collapsible Section Component                                      */
/* ------------------------------------------------------------------ */

interface CollapsibleSectionProps {
  status: string
  entries: any[]
  sortColumn: DiffSortColumn
  sortDirection: 'asc' | 'desc'
  handleSort: (col: DiffSortColumn) => void
  onFileClick: (entry: any) => void
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ status, entries, sortColumn, sortDirection, handleSort, onFileClick }) => {
  const [isOpen, setIsOpen] = useState(status !== 'identical')
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())

  const treeNodes = useMemo(() => buildTree(entries, sortColumn, sortDirection), [entries, sortColumn, sortDirection])
  const flattened = useMemo(() => flatten(treeNodes, 0, expandedPaths), [treeNodes, expandedPaths])

  if (entries.length === 0) return null

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.identical

  const toggleExpand = (path: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedPaths((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  return (
    <div className="mb-4 border border-border rounded-lg overflow-hidden bg-background">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-5 h-5">
            {isOpen ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
          </div>
          <div className="flex items-center gap-2">
            <span className={`p-1.5 rounded-md ${config.bg} ${config.text}`}>
              {config.icon}
            </span>
            <span className="font-medium text-sm text-foreground">{config.label}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{entries.length} dosya</span>
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-border">
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
              {flattened.map(({ node, depth }) => {
                const isExpanded = expandedPaths.has(node.relativePath)
                
                return (
                  <TableRow
                    key={node.relativePath}
                    className={`cursor-pointer transition-colors ${getRowBg(node.status)}`}
                    onClick={(e) => {
                      if (node.isDirectory) {
                        toggleExpand(node.relativePath, e)
                      } else {
                        onFileClick(node.entry)
                      }
                    }}
                  >
                    <TableCell className="py-2">
                      <div 
                        className="flex items-center gap-2"
                        style={{ paddingLeft: `${depth * 20}px` }}
                      >
                        <div 
                          className={`flex items-center justify-center w-5 h-5 shrink-0 ${node.isDirectory ? 'hover:bg-muted rounded' : ''}`}
                          onClick={(e) => node.isDirectory && toggleExpand(node.relativePath, e)}
                        >
                          {node.isDirectory ? (
                            isExpanded ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />
                          ) : (
                            <span className="w-3.5 h-3.5" /> // placeholder for alignment
                          )}
                        </div>
                        <span className="text-sm shrink-0">
                          {node.isDirectory ? (
                            <Folder size={14} className="text-blue-400" />
                          ) : (
                            getFileIcon(node.name, false, node.name.split('.').pop() || 'other')
                          )}
                        </span>
                        <span className="text-xs truncate max-w-[300px]" title={node.name}>
                          {node.name}
                        </span>
                        {node.isDirectory && (
                          <span className="text-[10px] text-muted-foreground/50 ml-1">({node.fileCount})</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 text-xs text-right font-mono tabular-nums w-[100px]">
                      <SizeCell size={node.leftSize} />
                    </TableCell>
                    <TableCell className="py-2 text-xs text-right font-mono tabular-nums w-[100px]">
                      <SizeCell size={node.rightSize} />
                    </TableCell>
                    <TableCell className="py-2 text-xs text-right font-mono tabular-nums w-[100px]">
                      <DiffCell diff={node.sizeDiff} status={node.status} />
                    </TableCell>
                    <TableCell className="py-2 w-[110px]">
                      <StatusBadge status={node.status} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const DiffTable: React.FC = () => {
  const { compareResult, filter, searchQuery, sortColumn, sortDirection, setSort } = useCompareStore()

  const handleOpenFile = useCallback(
    (entry: any) => {
      if (!compareResult || !entry) return
      const basePath = entry.status === 'only-right' ? compareResult.rightPath : compareResult.leftPath
      const fullPath = `${basePath}/${entry.relativePath}`.replace(/\//g, '\\')
      window.electronAPI.openInExplorer(fullPath)
    },
    [compareResult]
  )

  const handleSort = useCallback(
    (col: DiffSortColumn) => {
      setSort(col)
    },
    [setSort],
  )

  const filteredAndSorted = useMemo(() => {
    if (!compareResult) return []

    let entries = compareResult.entries

    // Filter out identical directories entirely from base entries
    // Since we build tree recursively based on file paths
    entries = entries.filter((e) => !e.isDirectory)

    if (filter !== 'all') {
      entries = entries.filter((e) => e.status === filter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      entries = entries.filter(
        (e) =>
          e.relativePath.toLowerCase().includes(q) ||
          e.name.toLowerCase().includes(q),
      )
    }

    return entries
  }, [compareResult, filter, searchQuery])

  if (!compareResult) return null

  // Group by status
  const grouped = {
    'only-left': filteredAndSorted.filter((e) => e.status === 'only-left'),
    'size-diff': filteredAndSorted.filter((e) => e.status === 'size-diff'),
    'date-diff': filteredAndSorted.filter((e) => e.status === 'date-diff'),
    'only-right': filteredAndSorted.filter((e) => e.status === 'only-right'),
    'identical': filteredAndSorted.filter((e) => e.status === 'identical'),
  }

  const ORDER = ['only-left', 'size-diff', 'date-diff', 'only-right', 'identical']

  return (
    <div className="w-full pb-10">
      {ORDER.map((status) => (
        <CollapsibleSection
          key={status}
          status={status}
          entries={grouped[status as keyof typeof grouped]}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          handleSort={handleSort}
          onFileClick={handleOpenFile}
        />
      ))}

      {filteredAndSorted.length === 0 && (
        <div className="flex items-center justify-center h-32 text-xs text-muted-foreground border border-dashed border-border rounded-lg">
          {filter !== 'all' || searchQuery
            ? 'Filtre kriterlerine uygun sonuç bulunamadı'
            : 'Karşılaştırma sonuçları burada görünecek'}
        </div>
      )}
      
      {filteredAndSorted.length > 0 && (
        <div className="flex items-center justify-between px-3 py-2 mt-4 text-[11px] text-muted-foreground">
          <span>{filteredAndSorted.length} dosya listelendi</span>
          <span>Toplam: {compareResult.summary.totalFiles} taranan dosya</span>
        </div>
      )}
    </div>
  )
}

export default DiffTable
