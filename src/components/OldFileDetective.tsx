import React, { useState, useMemo, useEffect } from 'react'
import { useFolderStore } from '@/store/useFolderStore'
import { useI18nStore } from '@/store/useI18nStore'
import { formatBytes, formatDate } from '@/lib/utils'
import { Trash2, Eye, Calendar, AlertTriangle, CheckSquare, Square, Search, ShieldAlert, ArrowUpDown } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'

interface OldFileItem {
  node: FileNode
  ageInDays: number
  dustScore: number
}

type SortCol = 'dustScore' | 'size' | 'modifiedAt'
type SortDir = 'asc' | 'desc'

const OldFileDetective: React.FC = () => {
  const { tree, deleteNode } = useFolderStore()
  const { t, language } = useI18nStore()
  const [minSize, setMinSize] = useState<number>(10 * 1024 * 1024) // Default 10MB
  const [inactivityDays, setInactivityDays] = useState<number>(90) // Default 3 months (90 days)
  const [fileType, setFileType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  
  // Sort states
  const [sortConfig, setSortConfig] = useState<{ col: SortCol; dir: SortDir }>({ col: 'dustScore', dir: 'desc' })

  // Selection states
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set())

  // Pagination state
  const [visibleCount, setVisibleCount] = useState(100)

  // Debounce search query to prevent typing lag
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Walk the tree to gather all files and calculate stats
  const processedFiles = useMemo(() => {
    if (!tree) return []
    const list: OldFileItem[] = []
    const now = new Date().getTime()

    function traverse(node: FileNode) {
      if (!node.isDirectory) {
        const fileTime = new Date(node.modifiedAt).getTime()
        const diffMs = now - fileTime
        const ageInDays = diffMs / (1000 * 60 * 60 * 24)
        
        // Digital Dust Score: Size(MB) * (Age(Years))
        const sizeMb = node.size / (1024 * 1024)
        const ageYears = ageInDays / 365
        const dustScore = Math.round(sizeMb * ageYears * 10) / 10

        list.push({
          node,
          ageInDays,
          dustScore,
        })
      } else if (node.children) {
        node.children.forEach(traverse)
      }
    }

    traverse(tree)
    return list
  }, [tree])

  // Filter list based on criteria (using debounced search query)
  const filteredFiles = useMemo(() => {
    return processedFiles.filter((item) => {
      // 1. Min size filter
      if (item.node.size < minSize) return false

      // 2. Inactivity/Age filter
      if (item.ageInDays < inactivityDays) return false

      // 3. Search query filter
      if (debouncedSearchQuery && !item.node.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) {
        return false
      }

      // 4. File extension/category filter
      if (fileType !== 'all') {
        if (item.node.extension !== fileType) {
          return false
        }
      }

      return true
    })
  }, [processedFiles, minSize, inactivityDays, fileType, debouncedSearchQuery])

  // Sort list
  const sortedFiles = useMemo(() => {
    const sorted = [...filteredFiles]
    const { col, dir } = sortConfig

    sorted.sort((a, b) => {
      let cmp = 0
      if (col === 'dustScore') {
        cmp = a.dustScore - b.dustScore
      } else if (col === 'size') {
        cmp = a.node.size - b.node.size
      } else if (col === 'modifiedAt') {
        cmp = new Date(a.node.modifiedAt).getTime() - new Date(b.node.modifiedAt).getTime()
      }
      return dir === 'asc' ? cmp : -cmp
    })

    return sorted
  }, [filteredFiles, sortConfig])

  // Reset pagination count when sortedFiles list changes
  useEffect(() => {
    setVisibleCount(100)
  }, [sortedFiles])

  // Get only visible files for paginated rendering
  const visibleFiles = useMemo(() => {
    return sortedFiles.slice(0, visibleCount)
  }, [sortedFiles, visibleCount])

  // Compute statistics for header
  const stats = useMemo(() => {
    let totalWaste = 0
    filteredFiles.forEach((f) => {
      totalWaste += f.node.size
    })
    return {
      wasteBytes: totalWaste,
      count: filteredFiles.length,
    }
  }, [filteredFiles])

  // Toggle sorting column
  function requestSort(col: SortCol) {
    setSortConfig((prev) => {
      if (prev.col === col) {
        return { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      }
      return { col, dir: 'desc' }
    })
  }

  // Toggle selection for a path
  function toggleSelect(path: string) {
    setSelectedPaths((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  // Toggle select all
  function toggleSelectAll() {
    if (selectedPaths.size === sortedFiles.length) {
      setSelectedPaths(new Set())
    } else {
      const next = new Set<string>()
      sortedFiles.forEach((f) => next.add(f.node.path))
      setSelectedPaths(next)
    }
  }

  // Deletion logic
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDeleteSelected() {
    if (selectedPaths.size === 0) return

    const confirmMessage = t('delete_confirm_multi', { count: selectedPaths.size })
    if (!confirm(confirmMessage)) return

    setIsDeleting(true)
    try {
      const pathsArray = Array.from(selectedPaths)
      const success = await window.electronAPI.deleteItems(pathsArray)

      if (success) {
        // Update in-memory tree
        pathsArray.forEach((path) => {
          deleteNode(path)
        })
        // Clear selections
        setSelectedPaths(new Set())
      } else {
        alert(t('delete_error_permission'))
      }
    } catch (err) {
      console.error('Silme hatası:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  // Detect file categories present in list
  const uniqueExtensions = useMemo(() => {
    const set = new Set<string>()
    processedFiles.forEach((f) => {
      if (f.node.extension) set.add(f.node.extension)
    })
    return Array.from(set).sort()
  }, [processedFiles])

  if (!tree) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 h-80 text-muted-foreground gap-2">
        <AlertTriangle size={24} className="text-warning animate-bounce" />
        <span className="text-xs">{t('no_scan_alert_old')}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden p-4 gap-4 bg-background">
      {/* Header filter controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 border border-border bg-card rounded-lg">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span>{t('old_title')}</span>
            <span className="inline-flex items-center gap-0.5 text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-medium">
              <ShieldAlert size={10} /> {t('digital_dust_badge')}
            </span>
          </h2>
          <p className="text-xs text-muted-foreground">
            {t('old_desc')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Inactivity period */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t('inactivity_period')}</span>
            <select
              value={inactivityDays}
              onChange={(e) => {
                setInactivityDays(Number(e.target.value))
                setSelectedPaths(new Set())
              }}
              className="text-xs text-foreground bg-background border border-border rounded px-2 py-1 outline-none font-medium"
            >
              <option value={30}>{t('months_1')}</option>
              <option value={90}>{t('months_3')}</option>
              <option value={180}>{t('months_6')}</option>
              <option value={365}>{t('year_1')}</option>
              <option value={730}>{t('years_2')}</option>
            </select>
          </div>

          {/* Min Size Select */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t('min_size')}</span>
            <select
              value={minSize}
              onChange={(e) => {
                setMinSize(Number(e.target.value))
                setSelectedPaths(new Set())
              }}
              className="text-xs text-foreground bg-background border border-border rounded px-2 py-1 outline-none font-medium"
            >
              <option value={1024 * 1024}>1 MB</option>
              <option value={10 * 1024 * 1024}>10 MB</option>
              <option value={50 * 1024 * 1024}>50 MB</option>
              <option value={100 * 1024 * 1024}>100 MB</option>
              <option value={1024 * 1024 * 1024}>1 GB</option>
            </select>
          </div>

          {/* File type filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t('type')}:</span>
            <select
              value={fileType}
              onChange={(e) => {
                setFileType(e.target.value)
                setSelectedPaths(new Set())
              }}
              className="text-xs text-foreground bg-background border border-border rounded px-2 py-1 outline-none capitalize font-medium"
            >
              <option value="all">{language === 'tr' ? 'Hepsi' : 'All'}</option>
              {uniqueExtensions.map((ext) => (
                <option key={ext} value={ext}>
                  {ext}
                </option>
              ))}
            </select>
          </div>

          {/* Search bar */}
          <div className="relative flex items-center">
            <Search size={12} className="absolute left-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('search_placeholder')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSelectedPaths(new Set())
              }}
              className="text-xs pl-8 pr-3 py-1 bg-background border border-border rounded w-40 outline-none focus:border-primary placeholder:text-muted-foreground/40"
            />
          </div>
        </div>
      </div>

      {/* Stats and Savings Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-3 border border-border bg-card rounded-lg flex flex-col justify-center">
          <span className="text-[10px] text-muted-foreground uppercase font-medium">{t('potential_savings')}</span>
          <span className="text-lg font-semibold text-amber-500 font-mono mt-1">{formatBytes(stats.wasteBytes)}</span>
        </div>
        <div className="p-3 border border-border bg-card rounded-lg flex flex-col justify-center">
          <span className="text-[10px] text-muted-foreground uppercase font-medium">{t('total_duplicate_files')}</span>
          <span className="text-lg font-semibold text-foreground font-mono mt-1">{stats.count.toLocaleString()}</span>
        </div>
      </div>

      {/* Floating Action Bar */}
      {selectedPaths.size > 0 && (
        <div className="flex items-center justify-between p-3 border border-destructive/20 bg-destructive/5 rounded-lg text-xs animate-fade-in">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle size={14} />
            <span>{t('delete_confirm_multi', { count: selectedPaths.size })}</span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedPaths(new Set())}
              className="text-xs"
            >
              {t('selection_clear')}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDeleteSelected}
              className="gap-1.5 text-xs font-semibold"
            >
              <Trash2 size={12} />
              {isDeleting ? t('hashing_progress') : t('delete_selected')}
            </Button>
          </div>
        </div>
      )}

      {/* Main Table List */}
      <div className="flex-1 min-h-0 border border-border bg-card rounded-lg overflow-hidden flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5 bg-muted/30">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            {t('file_list_title')} ({sortedFiles.length})
          </span>
          <span className="text-[10px] text-muted-foreground">
            {t('dust_score_desc')}
          </span>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {/* Table Header */}
          <div className="flex items-center px-4 py-2 border-b border-border text-[11px] font-medium text-muted-foreground bg-muted/10">
            <div className="flex items-center w-8 shrink-0">
              <button
                onClick={toggleSelectAll}
                className="text-muted-foreground hover:text-foreground"
              >
                {selectedPaths.size === sortedFiles.length && sortedFiles.length > 0 ? (
                  <CheckSquare size={13} className="text-primary" />
                ) : (
                  <Square size={13} />
                )}
              </button>
            </div>
            <div className="flex-1 min-w-0 pr-4">{t('name')} & {language === 'tr' ? 'Konum' : 'Location'}</div>
            <div
              className="w-24 shrink-0 text-right cursor-pointer hover:text-foreground transition-colors flex items-center justify-end gap-1"
              onClick={() => requestSort('size')}
            >
              {t('size')} <ArrowUpDown size={10} />
            </div>
            <div
              className="w-28 shrink-0 text-right cursor-pointer hover:text-foreground transition-colors flex items-center justify-end gap-1"
              onClick={() => requestSort('modifiedAt')}
            >
              {t('modified')} <ArrowUpDown size={10} />
            </div>
            <div
              className="w-24 shrink-0 text-right cursor-pointer hover:text-foreground transition-colors flex items-center justify-end gap-1 pr-4"
              onClick={() => requestSort('dustScore')}
            >
              {t('dust_score_col')} <ArrowUpDown size={10} />
            </div>
            <div className="w-16 shrink-0 text-center">{t('actions')}</div>
          </div>

          {/* Table Body */}
          <ScrollArea className="flex-1">
            <div className="divide-y divide-border">
              {visibleFiles.map(({ node, ageInDays, dustScore }) => {
                const isSelected = selectedPaths.has(node.path)

                return (
                  <div
                    key={node.path}
                    onClick={() => toggleSelect(node.path)}
                    className={`flex items-center px-4 py-2 text-xs transition-colors cursor-pointer ${
                      isSelected ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-accent/40'
                    }`}
                  >
                    <div className="flex items-center w-8 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleSelect(node.path)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {isSelected ? (
                          <CheckSquare size={13} className="text-primary" />
                        ) : (
                          <Square size={13} />
                        )}
                      </button>
                    </div>

                    <div className="flex-1 min-w-0 pr-4 flex flex-col">
                      <span className="font-medium truncate text-foreground/90">{node.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate">{node.path}</span>
                    </div>

                    <div className="w-24 shrink-0 text-right font-mono tabular-nums">
                      {formatBytes(node.size)}
                    </div>

                    <div className="w-28 shrink-0 text-right text-muted-foreground flex flex-col items-end">
                      <span>{formatDate(node.modifiedAt)}</span>
                      <span className="text-[9px] text-muted-foreground/60">{t('days_ago', { count: Math.round(ageInDays) })}</span>
                    </div>

                    <div className="w-24 shrink-0 text-right font-mono tabular-nums pr-4 font-semibold text-amber-500">
                      {dustScore}
                    </div>

                    <div className="w-16 shrink-0 flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
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
                              deleteNode(node.path)
                            }
                          }
                        }}
                        className="p-1 hover:bg-destructive/15 rounded text-muted-foreground hover:text-destructive transition-colors"
                        title={t('delete')}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                )
              })}

              {visibleCount < sortedFiles.length && (
                <div className="flex justify-center py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setVisibleCount((prev) => prev + 100)}
                    className="text-xs"
                  >
                    {t('more', { count: sortedFiles.length - visibleCount })}
                  </Button>
                </div>
              )}

              {sortedFiles.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-1.5">
                  <Calendar size={20} className="text-muted-foreground/60" />
                  <span className="text-xs font-medium text-foreground/80">{t('no_old_files_found')}</span>
                  <span className="text-[10px] text-muted-foreground">{t('no_old_files_sub')}</span>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}

export default OldFileDetective
