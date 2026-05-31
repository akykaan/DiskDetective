import React from 'react'
import {
  FolderOpen,
  ArrowLeftRight,
  Search,
  ArrowLeft,
  Loader2,
  FileSearch,
  GitCompareArrows,
  XCircle,
  ChevronDown,
  ChevronRight,
  Ban,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useCompareStore, DiffFilter } from '@/store/useCompareStore'
import { formatDuration, formatBytes } from '@/lib/utils'
import DiffSummary from '@/components/DiffSummary'
import DiffTable from '@/components/DiffTable'

/* ------------------------------------------------------------------ */
/*  Filter tabs                                                        */
/* ------------------------------------------------------------------ */

const FILTER_TABS: { key: DiffFilter; label: string }[] = [
  { key: 'all', label: 'Tümü' },
  { key: 'only-left', label: 'Sadece Sol' },
  { key: 'only-right', label: 'Sadece Sağ' },
  { key: 'size-diff', label: 'Boyut Farklı' },
  { key: 'identical', label: 'Aynı' },
]

/* ------------------------------------------------------------------ */
/*  Folder picker card                                                 */
/* ------------------------------------------------------------------ */

interface FolderPickerProps {
  label: string
  side: 'left' | 'right'
  path: string | null
  onSelect: () => void
  accentColor: string
}

const FolderPicker: React.FC<FolderPickerProps> = ({ label, path, onSelect, accentColor }) => (
  <button
    onClick={onSelect}
    className="flex-1 flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-5 transition-all hover:border-primary/50 hover:bg-primary/[0.02] group cursor-pointer"
  >
    <div
      className="flex h-10 w-10 items-center justify-center rounded-full transition-colors"
      style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
    >
      <FolderOpen size={20} className="group-hover:scale-110 transition-transform" />
    </div>
    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
      {label}
    </span>
    {path ? (
      <span className="text-xs text-foreground font-medium truncate max-w-[300px]" title={path}>
        {path}
      </span>
    ) : (
      <span className="text-xs text-muted-foreground/60">Klasör seçmek için tıklayın</span>
    )}
  </button>
)

/* ------------------------------------------------------------------ */
/*  Progress indicator                                                 */
/* ------------------------------------------------------------------ */

const ProgressView: React.FC = () => {
  const { compareStatus, compareProgress } = useCompareStore()

  const phaseLabel =
    compareStatus === 'scanning-left'
      ? 'Sol klasör taranıyor...'
      : compareStatus === 'scanning-right'
        ? 'Sağ klasör taranıyor...'
        : 'Karşılaştırılıyor...'

  const progressText = (() => {
    if (!compareProgress) return null

    if (compareProgress.phase === 'comparing') {
      // During comparing: show scanned / total
      return (
        <>
          <p className="text-xs text-muted-foreground">
            Taranan dosya: <span className="text-foreground font-medium">{compareProgress.scannedFiles.toLocaleString()}</span>
            {' / '}
            Toplam dosya: <span className="text-foreground font-medium">{compareProgress.totalFiles.toLocaleString()}</span>
          </p>
          <p className="text-[11px] text-muted-foreground/70 mt-0.5">
            Toplam boyut: {formatBytes(compareProgress.totalSize)} • {formatDuration(compareProgress.elapsedMs)}
          </p>
        </>
      )
    }

    // During scanning phases: show scanned files + total size
    return (
      <>
        <p className="text-xs text-muted-foreground">
          Taranan dosya: <span className="text-foreground font-medium">{compareProgress.scannedFiles.toLocaleString()}</span>
          {' • '}
          Toplam boyut: <span className="text-foreground font-medium">{formatBytes(compareProgress.totalSize)}</span>
        </p>
        <p className="text-[11px] text-muted-foreground/70 mt-0.5">
          {formatDuration(compareProgress.elapsedMs)}
        </p>
      </>
    )
  })()

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 w-full max-w-lg mx-auto">
      <div className="relative">
        <Loader2 size={50} className="animate-spin text-primary" />
        <div className="absolute inset-0 flex items-center justify-center">
          <FileSearch size={20} className="text-primary/60" />
        </div>
      </div>
      <div className="text-center space-y-1 w-full">
        <p className="text-sm font-medium text-foreground">{phaseLabel}</p>
        {progressText}
        {compareProgress?.currentPath && (
          <p className="text-[10px] text-muted-foreground mt-2 truncate w-full px-4" title={compareProgress.currentPath} dir="rtl">
            &lrm;{compareProgress.currentPath}
          </p>
        )}
      </div>

      {/* Progress bar for comparing phase */}
      {compareProgress?.phase === 'comparing' && compareProgress.totalFiles > 0 && (
        <div className="w-64 h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{
              width: `${Math.min((compareProgress.scannedFiles / compareProgress.totalFiles) * 100, 100)}%`,
            }}
          />
        </div>
      )}

      {/* Phase dots */}
      <div className="flex items-center gap-2 mt-2">
        {(['scanning-left', 'scanning-right', 'comparing'] as const).map((phase, i) => {
          const isActive = compareStatus === phase
          const isDone =
            (phase === 'scanning-left' && (compareStatus === 'scanning-right' || compareStatus === 'comparing' || compareStatus === 'done')) ||
            (phase === 'scanning-right' && (compareStatus === 'comparing' || compareStatus === 'done')) ||
            (phase === 'comparing' && compareStatus === 'done')
          return (
            <React.Fragment key={phase}>
              {i > 0 && (
                <div className={`h-px w-8 ${isDone || isActive ? 'bg-primary' : 'bg-border'}`} />
              )}
              <div
                className={`h-3 w-3 rounded-full transition-all ${isActive
                    ? 'bg-primary animate-pulse scale-125'
                    : isDone
                      ? 'bg-primary'
                      : 'bg-border'
                  }`}
              />
            </React.Fragment>
          )
        })}
      </div>
      <div className="flex gap-16 text-[10px] text-muted-foreground mt-1">
        <span>Sol Tarama</span>
        <span>Sağ Tarama</span>
        <span>Karşılaştır</span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main CompareView                                                   */
/* ------------------------------------------------------------------ */

const CompareView: React.FC = () => {
  const {
    leftPath,
    rightPath,
    compareStatus,
    compareResult,
    error,
    filter,
    searchQuery,
    ignoreUnnecessary,
    selectLeftFolder,
    selectRightFolder,
    startCompare,
    setCompareMode,
    setFilter,
    setSearch,
    setIgnoreUnnecessary,
    reset,
    cancel,
  } = useCompareStore()

  const isScanning = compareStatus === 'scanning-left' || compareStatus === 'scanning-right' || compareStatus === 'comparing'
  const canCompare = !!leftPath && !!rightPath && !isScanning

  const [isIgnoredOpen, setIsIgnoredOpen] = useState(false)

  const handleOpenIgnoredFile = (relativePath: string) => {
    if (!leftPath || !rightPath) return
    const possiblePaths = [
      `${leftPath}/${relativePath}`.replace(/\//g, '\\'),
      `${rightPath}/${relativePath}`.replace(/\//g, '\\')
    ]
    window.electronAPI.openInExplorer(possiblePaths)
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex h-10 items-center justify-between border-b border-border px-4 bg-background shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCompareMode(false)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Geri</span>
          </button>
          <span className="w-px h-4 bg-border" />
          <GitCompareArrows size={14} className="text-primary" />
          <span className="text-xs font-medium text-foreground">Klasör Karşılaştırma</span>
        </div>

        {compareResult && (
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span>
              {compareResult.summary.totalFiles.toLocaleString()} dosya karşılaştırıldı
            </span>
            <span className="w-px h-3 bg-border" />
            <span>{formatDuration(compareResult.elapsedMs)}</span>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4 max-w-[1400px] mx-auto">
          {/* Folder pickers */}
          <div className="flex gap-3 items-stretch">
            <FolderPicker
              label="Sol Klasör (A)"
              side="left"
              path={leftPath}
              onSelect={selectLeftFolder}
              accentColor="hsl(0 72% 51%)"
            />

            <div className="flex items-center justify-center shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <ArrowLeftRight size={16} className="text-muted-foreground" />
              </div>
            </div>

            <FolderPicker
              label="Sağ Klasör (B)"
              side="right"
              path={rightPath}
              onSelect={selectRightFolder}
              accentColor="hsl(217 91% 60%)"
            />
          </div>

          {/* Action button */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={startCompare}
                disabled={!canCompare}
                className="gap-2 px-8"
                size="sm"
              >
                {isScanning ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Karşılaştırılıyor...
                  </>
                ) : (
                  <>
                    <Search size={14} />
                    Karşılaştır
                  </>
                )}
              </Button>
              {isScanning && (
                <Button onClick={cancel} variant="destructive" size="sm" className="gap-1.5 text-xs">
                  <XCircle size={14} />
                  İptal Et
                </Button>
              )}
              {(compareResult || leftPath || rightPath) && !isScanning && (
                <Button onClick={reset} variant="outline" size="sm" className="text-xs">
                  Sıfırla
                </Button>
              )}
            </div>

            {!isScanning && (
              <label className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors mt-1">
                <input
                  type="checkbox"
                  checked={ignoreUnnecessary}
                  onChange={(e) => setIgnoreUnnecessary(e.target.checked)}
                  className="rounded border-border bg-background text-primary focus:ring-1 focus:ring-primary focus:ring-offset-0"
                />
                Gereksiz dosya ve klasörleri atla (node_modules, .git, vb.)
              </label>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-xs text-destructive">
              {error}
            </div>
          )}

          {/* Progress */}
          {isScanning && <ProgressView />}

          {/* Results */}
          {compareResult && compareStatus === 'done' && (
            <>
              <DiffSummary />

              {/* Filter tabs + search */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                  {FILTER_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setFilter(tab.key)}
                      className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-all ${filter === tab.key
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="relative flex-1 max-w-[300px]">
                  <Search
                    size={13}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="text"
                    placeholder="Dosya ara..."
                    value={searchQuery}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-md border border-border bg-background pl-8 pr-3 py-1.5 text-xs outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>

              {/* Diff table */}
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <DiffTable />
              </div>

              {/* Ignored files section */}
              {compareResult.ignoredPaths && compareResult.ignoredPaths.length > 0 && (
                <div className="mt-4 border border-border rounded-lg overflow-hidden bg-background">
                  <button
                    onClick={() => setIsIgnoredOpen(!isIgnoredOpen)}
                    className="w-full flex items-center justify-between p-3 bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-5 h-5">
                        {isIgnoredOpen ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-md bg-muted/50 text-muted-foreground">
                          <Ban size={12} />
                        </span>
                        <span className="font-medium text-sm text-foreground">Taranmayan Dosyalar</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{compareResult.ignoredPaths.length} öğe atlandı</span>
                    </div>
                  </button>
                  {isIgnoredOpen && (
                    <div className="border-t border-border p-3 max-h-60 overflow-y-auto">
                      <ul className="text-xs font-mono text-muted-foreground space-y-1">
                        {compareResult.ignoredPaths.map((p, idx) => (
                          <li
                            key={idx}
                            className="truncate cursor-pointer hover:text-foreground hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                            title={p}
                            onClick={() => handleOpenIgnoredFile(p)}
                          >
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Empty state */}
          {compareStatus === 'idle' && !leftPath && !rightPath && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
                <GitCompareArrows size={28} className="text-muted-foreground/60" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                İki klasörü karşılaştırarak farkları bulun
              </p>
              <p className="text-xs text-muted-foreground/60 max-w-[400px]">
                Birebir aynı olması gereken iki klasör arasındaki eksik dosyaları,
                boyut farklılıklarını ve fazla dosyaları tespit edin.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

export default CompareView
