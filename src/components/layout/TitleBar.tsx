import React from 'react'
import { Minus, Square, X } from 'lucide-react'

const TitleBar: React.FC = () => {
  return (
    <div className="flex h-9 items-center justify-between bg-[hsl(var(--titlebar-bg))] px-3 select-none drag-region">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-foreground/70">Klasör Boyutu Analiz</span>
      </div>
      <div className="flex items-center -mr-3 no-drag">
        <button
          onClick={() => window.electronAPI.windowControl('minimize')}
          className="flex h-9 w-11 items-center justify-center text-foreground/60 hover:bg-foreground/10 hover:text-foreground transition-colors"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={() => window.electronAPI.windowControl('maximize')}
          className="flex h-9 w-11 items-center justify-center text-foreground/60 hover:bg-foreground/10 hover:text-foreground transition-colors"
        >
          <Square size={12} />
        </button>
        <button
          onClick={() => window.electronAPI.windowControl('close')}
          className="flex h-9 w-11 items-center justify-center text-foreground/60 hover:bg-destructive hover:text-destructive-foreground transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

export default TitleBar
