import React from 'react'
import { ChevronLeft } from 'lucide-react'
import TitleBar from '@/components/layout/TitleBar'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import FolderTree from '@/components/FolderTree'
import FolderTable from '@/components/FolderTable'
import ChartPanel from '@/components/ChartPanel'
import CompareView from '@/components/CompareView'
import DuplicateFinder from '@/components/DuplicateFinder'
import OldFileDetective from '@/components/OldFileDetective'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useFolderStore } from '@/store/useFolderStore'
import { useCompareStore } from '@/store/useCompareStore'
import { setTheme } from '@/themes'

const App: React.FC = () => {
  const theme = useFolderStore((s) => s.theme)
  const fontSize = useFolderStore((s) => s.fontSize)
  const panelsOpen = useFolderStore((s) => s.panelsOpen)
  const togglePanels = useFolderStore((s) => s.togglePanels)
  const isCompareMode = useCompareStore((s) => s.isCompareMode)
  const activeView = useFolderStore((s) => s.activeView)

  React.useEffect(() => {
    setTheme(theme as any)
  }, [theme])

  React.useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`
  }, [fontSize])

  return (
    <div className="flex h-screen flex-col bg-background">
      <TitleBar />

      {isCompareMode ? (
        <CompareView />
      ) : (
        <div className="flex flex-1 overflow-hidden relative">
          <div
            className={`flex shrink-0 overflow-hidden transition-all duration-200 ${
              panelsOpen ? 'w-[460px]' : 'w-0'
            }`}
          >
            <Sidebar />
            <div className="flex w-[240px] shrink-0 flex-col overflow-hidden border-r border-border bg-card">
              <div className="border-b border-border px-3 py-2">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Klasör Ağacı
                </span>
              </div>
              <ScrollArea className="flex-1">
                <FolderTree />
              </ScrollArea>
            </div>
          </div>

          <button
            onClick={togglePanels}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-5 h-12 bg-card border border-border border-l-0 rounded-r-md flex items-center justify-center hover:bg-accent transition-colors group"
          >
            <ChevronLeft
              size={14}
              className={`text-muted-foreground group-hover:text-foreground transition-transform duration-200 ${
                panelsOpen ? '' : 'rotate-180'
              }`}
            />
          </button>

          <div className="flex flex-1 flex-col overflow-hidden">
            <TopBar />
            {activeView === 'analyzer' && (
              <div className="flex flex-1 gap-3 overflow-hidden p-3">
                <div className="flex flex-1 flex-col gap-3 overflow-hidden">
                  <ChartPanel />

                  <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card">
                    <div className="border-b border-border px-3 py-2">
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        Klasör İçeriği
                      </span>
                    </div>
                    <ScrollArea className="flex-1">
                      <FolderTable />
                    </ScrollArea>
                  </div>
                </div>
              </div>
            )}
            {activeView === 'duplicates' && <DuplicateFinder />}
            {activeView === 'old-files' && <OldFileDetective />}
          </div>
        </div>
      )}
    </div>
  )
}

export default App

