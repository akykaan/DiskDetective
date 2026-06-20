import React, { useState, useMemo, useEffect } from 'react'
import { useFolderStore } from '@/store/useFolderStore'
import { useI18nStore } from '@/store/useI18nStore'
import { formatBytes, formatDate } from '@/lib/utils'
import { Trash2, Eye, RefreshCw, AlertTriangle, Check, CheckSquare, Square, Search, ShieldCheck } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'

interface DuplicateGroup {
  hash?: string
  size: number
  files: FileNode[]
}

const DuplicateFinder: React.FC = () => {
  const { tree, deleteNode } = useFolderStore()
  const { t, language } = useI18nStore()
  const [minSize, setMinSize] = useState<number>(1024 * 1024) // Default 1MB
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  
  // Hashing states
  const [hashedGroups, setHashedGroups] = useState<DuplicateGroup[] | null>(null)
  const [isHashing, setIsHashing] = useState(false)
  const [isVerified, setIsVerified] = useState(false)

  // Selection state
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set())

  // Pagination state
  const [visibleCount, setVisibleCount] = useState(50)

  // Reset states when the tree changes
  useEffect(() => {
    setHashedGroups(null)
    setIsVerified(false)
    setSelectedPaths(new Set())
  }, [tree])

  // Debounce search query to prevent typing lag
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Get all flat files from the tree
  const allFiles = useMemo(() => {
    if (!tree) return []
    const files: FileNode[] = []
    function traverse(node: FileNode) {
      if (!node.isDirectory) {
        files.push(node)
      } else if (node.children) {
        node.children.forEach(traverse)
      }
    }
    traverse(tree)
    return files
  }, [tree])

  // Filter and group files by size to find initial candidates
  const candidateGroups = useMemo(() => {
    const sizeMap = new Map<number, FileNode[]>()
    allFiles.forEach((file) => {
      if (file.size >= minSize) {
        // Apply search query filter on file name (using debounced query)
        if (debouncedSearchQuery && !file.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) {
          return
        }
        const list = sizeMap.get(file.size) || []
        list.push(file)
        sizeMap.set(file.size, list)
      }
    })

    const groups: DuplicateGroup[] = []
    sizeMap.forEach((files, size) => {
      if (files.length > 1) {
        groups.push({ size, files })
      }
    })

    groups.sort((a, b) => b.size - a.size)
    return groups
  }, [allFiles, minSize, debouncedSearchQuery])

  // Current active groups (either exact hashed or size candidates)
  const displayGroups = useMemo(() => {
    return isVerified && hashedGroups !== null ? hashedGroups : candidateGroups
  }, [isVerified, hashedGroups, candidateGroups])

  // Reset pagination count when active list changes
  useEffect(() => {
    setVisibleCount(50)
  }, [displayGroups])

  // Get only visible groups for pagination
  const visibleGroups = useMemo(() => {
    return displayGroups.slice(0, visibleCount)
  }, [displayGroups, visibleCount])

  const hasUnverifiedVisible = useMemo(() => {
    return visibleGroups.some((g) => !g.hash)
  }, [visibleGroups])

  // Compute space savings stats
  const stats = useMemo(() => {
    let totalWaste = 0
    let totalFilesCount = 0
    displayGroups.forEach((group) => {
      totalWaste += group.size * (group.files.length - 1)
      totalFilesCount += group.files.length
    })
    return {
      wasteBytes: totalWaste,
      groupsCount: displayGroups.length,
      filesCount: totalFilesCount,
    }
  }, [displayGroups])

  // Perform exact hash verification using IPC call
  async function runHashVerification() {
    if (candidateGroups.length === 0) return
    setIsHashing(true)
    
    // Collect all paths
    const pathsToHash: string[] = []
    candidateGroups.forEach((g) => {
      g.files.forEach((f) => pathsToHash.push(f.path))
    })

    try {
      const hashes = await window.electronAPI.hashFiles(pathsToHash)
      
      const newHashGroups: DuplicateGroup[] = []
      // Group candidate groups by hash locally
      candidateGroups.forEach((group) => {
        const hashSubMap = new Map<string, FileNode[]>()
        
        group.files.forEach((file) => {
          const hash = hashes[file.path] || ''
          if (hash) {
            const list = hashSubMap.get(hash) || []
            list.push(file)
            hashSubMap.set(hash, list)
          }
        })

        hashSubMap.forEach((files, hash) => {
          if (files.length > 1) {
            newHashGroups.push({ hash, size: group.size, files })
          }
        })
      })

      newHashGroups.sort((a, b) => b.size - a.size)
      setHashedGroups(newHashGroups)
      setIsVerified(true)
      setSelectedPaths(new Set()) // Reset selections
    } catch (err) {
      console.error('Doğrulama hatası:', err)
    } finally {
      setIsHashing(false)
    }
  }

  async function runHashVerificationForVisible() {
    const groupsToHash = visibleGroups.filter((g) => !g.hash)
    if (groupsToHash.length === 0) return
    setIsHashing(true)

    const pathsToHash: string[] = []
    groupsToHash.forEach((g) => {
      g.files.forEach((f) => pathsToHash.push(f.path))
    })

    try {
      const hashes = await window.electronAPI.hashFiles(pathsToHash)
      
      const newHashGroups: DuplicateGroup[] = []
      
      groupsToHash.forEach((group) => {
        const hashSubMap = new Map<string, FileNode[]>()
        
        group.files.forEach((file) => {
          const hash = hashes[file.path] || ''
          if (hash) {
            const list = hashSubMap.get(hash) || []
            list.push(file)
            hashSubMap.set(hash, list)
          }
        })

        hashSubMap.forEach((files, hash) => {
          if (files.length > 1) {
            newHashGroups.push({ hash, size: group.size, files })
          }
        })
      })

      const alreadyHashedGroups = displayGroups.filter((g) => !!g.hash)
      const hashedPathsSet = new Set(pathsToHash)
      const remainingGroups = displayGroups.filter((g) => {
        if (g.hash) return false
        const wasHashed = g.files.some((f) => hashedPathsSet.has(f.path))
        return !wasHashed
      })

      const combined = [...alreadyHashedGroups, ...newHashGroups, ...remainingGroups]
      combined.sort((a, b) => b.size - a.size)

      setHashedGroups(combined)
      setIsVerified(true)
      setSelectedPaths(new Set()) // Reset selections
    } catch (err) {
      console.error('Sadece listelenenleri doğrulama hatası:', err)
    } finally {
      setIsHashing(false)
    }
  }

  // Toggle selection for a file path
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

  // Automatically select all duplicate files keeping only the first one (original)
  function selectAllDuplicates() {
    const next = new Set<string>()
    displayGroups.forEach((group) => {
      // Skip the first file (index 0) and select the remaining ones
      for (let i = 1; i < group.files.length; i++) {
        next.add(group.files[i].path)
      }
    })
    setSelectedPaths(next)
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
        // Update in-memory tree for each deleted file
        pathsArray.forEach((path) => {
          deleteNode(path)
        })
        // Clear selection
        setSelectedPaths(new Set())
        // Reset verified state since tree changed
        setIsVerified(false)
        setHashedGroups(null)
      } else {
        alert(t('delete_error_permission'))
      }
    } catch (err) {
      console.error('Silme hatası:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!tree) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 h-80 text-muted-foreground gap-2">
        <AlertTriangle size={24} className="text-warning animate-bounce" />
        <span className="text-xs">{t('no_scan_alert_dup')}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden p-4 gap-4 bg-background">
      {/* Header controls & stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-border bg-card rounded-lg">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span>{t('duplicate_title')}</span>
            {isVerified && (
              <span className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-medium">
                <ShieldCheck size={10} /> {t('verified_badge')}
              </span>
            )}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t('duplicate_desc')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Min Size Select */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t('min_size')}</span>
            <select
              value={minSize}
              onChange={(e) => {
                setMinSize(Number(e.target.value))
                setIsVerified(false)
                setHashedGroups(null)
              }}
              className="text-xs text-foreground bg-background border border-border rounded px-2 py-1 outline-none"
            >
              <option value={1024 * 1024}>1 MB</option>
              <option value={10 * 1024 * 1024}>10 MB</option>
              <option value={100 * 1024 * 1024}>100 MB</option>
              <option value={1024 * 1024 * 1024}>1 GB</option>
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
                setIsVerified(false)
                setHashedGroups(null)
              }}
              className="text-xs pl-8 pr-3 py-1 bg-background border border-border rounded w-40 md:w-48 outline-none focus:border-primary placeholder:text-muted-foreground/40"
            />
          </div>

          {/* Action Buttons */}
          <Button
            size="sm"
            onClick={runHashVerification}
            disabled={isHashing || candidateGroups.length === 0}
            className="gap-1.5 text-xs"
          >
            <RefreshCw size={12} className={isHashing ? 'animate-spin' : ''} />
            {isHashing ? t('hashing_progress') : t('run_hash')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-3 border border-border bg-card rounded-lg flex flex-col justify-center">
          <span className="text-[10px] text-muted-foreground uppercase font-medium">{t('potential_savings')}</span>
          <span className="text-lg font-semibold text-primary font-mono mt-1">{formatBytes(stats.wasteBytes)}</span>
        </div>
        <div className="p-3 border border-border bg-card rounded-lg flex flex-col justify-center">
          <span className="text-[10px] text-muted-foreground uppercase font-medium">{t('duplicate_groups')}</span>
          <span className="text-lg font-semibold text-foreground font-mono mt-1">{stats.groupsCount.toLocaleString()}</span>
        </div>
        <div className="p-3 border border-border bg-card rounded-lg flex flex-col justify-center">
          <span className="text-[10px] text-muted-foreground uppercase font-medium">{t('total_duplicate_files')}</span>
          <span className="text-lg font-semibold text-foreground font-mono mt-1">{stats.filesCount.toLocaleString()}</span>
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

      {/* Main List */}
      <div className="flex-1 min-h-0 border border-border bg-card rounded-lg overflow-hidden flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-2 bg-muted/30">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            {t('duplicate_groups')} ({displayGroups.length})
          </span>
          <div className="flex items-center gap-3">
            {displayGroups.length > 0 && hasUnverifiedVisible && (
              <Button
                size="sm"
                variant="outline"
                onClick={runHashVerificationForVisible}
                disabled={isHashing || visibleGroups.length === 0}
                className="h-6 text-[10px] gap-1 px-2 py-0.5 font-medium border-primary/20 hover:border-primary/50 text-primary bg-primary/5 hover:bg-primary/10 hover:text-primary transition-all shrink-0"
              >
                <RefreshCw size={10} className={isHashing ? 'animate-spin' : ''} />
                {t('run_hash_visible')}
              </Button>
            )}
            {displayGroups.length > 0 && (
              <button
                onClick={selectAllDuplicates}
                className="text-[10px] text-primary hover:underline font-medium"
              >
                {t('auto_select')}
              </button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {visibleGroups.map((group, gIdx) => {
              const totalSpace = group.size * (group.files.length - 1)
              return (
                <div key={gIdx} className="border border-border rounded-lg overflow-hidden bg-background">
                  {/* Group header */}
                  <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b border-border text-xs">
                    <div className="flex items-center gap-2 font-medium">
                      <span className="text-foreground font-mono">{formatBytes(group.size)}</span>
                      <span className="text-muted-foreground">({group.files.length} {t('waste_copies')})</span>
                      {group.hash && (
                        <span className="text-[10px] font-mono text-muted-foreground/75 bg-muted border border-border px-1 py-0.5 rounded">
                          MD5: {group.hash.substring(0, 8)}...
                        </span>
                      )}
                    </div>
                    <span className="text-muted-foreground">
                      {t('waste_recoverable')}: <strong className="text-foreground/80 font-mono">{formatBytes(totalSpace)}</strong>
                    </span>
                  </div>

                  {/* Group items */}
                  <div className="divide-y divide-border">
                    {group.files.map((file, fIdx) => {
                      const isSelected = selectedPaths.has(file.path)
                      const isOriginal = fIdx === 0

                      return (
                        <div
                          key={file.path}
                          onClick={() => !isOriginal && toggleSelect(file.path)}
                          className={`flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                            isOriginal
                              ? 'bg-primary/[0.02] text-muted-foreground'
                              : 'cursor-pointer hover:bg-accent/40'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Checkbox or Badge */}
                            {isOriginal ? (
                              <span className="inline-flex text-[9px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-semibold uppercase shrink-0">
                                {t('original')}
                              </span>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleSelect(file.path)
                                }}
                                className="text-muted-foreground hover:text-foreground shrink-0"
                              >
                                {isSelected ? (
                                  <CheckSquare size={14} className="text-primary" />
                                ) : (
                                  <Square size={14} />
                                )}
                              </button>
                            )}

                            {/* Path and name */}
                            <div className="min-w-0 flex flex-col">
                              <span className="font-medium truncate text-foreground/90">{file.name}</span>
                              <span className="text-[10px] text-muted-foreground truncate">{file.path}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 shrink-0">
                            <span className="text-[10px] text-muted-foreground">{formatDate(file.modifiedAt)}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                window.electronAPI.openInExplorer(file.path)
                              }}
                              className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
                              title={t('show_in_explorer')}
                            >
                              <Eye size={12} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {visibleCount < displayGroups.length && (
              <div className="flex justify-center py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVisibleCount((prev) => prev + 100)}
                  className="text-xs"
                >
                  {t('more', { count: displayGroups.length - visibleCount })}
                </Button>
              </div>
            )}

            {displayGroups.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-1.5">
                <Check size={20} className="text-emerald-500" />
                <span className="text-xs font-medium text-foreground/80">{t('no_duplicates_found')}</span>
                <span className="text-[10px] text-muted-foreground">{t('no_duplicates_sub')}</span>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

export default DuplicateFinder
