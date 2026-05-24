import React from 'react'
import { ChevronRight, FolderIcon, FileIcon } from 'lucide-react'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { useFolderStore } from '@/store/useFolderStore'
import { formatBytes, getFileIcon } from '@/lib/utils'

interface FolderTreeProps {
  node: FileNode
  depth?: number
  selectedPath?: string | null
}

const FolderTreeNode: React.FC<FolderTreeProps> = ({ node, depth = 0, selectedPath }) => {
  const { expandedPaths, toggleExpanded, navigateTo, selectedNode } = useFolderStore()
  const isExpanded = expandedPaths.has(node.path)
  const isSelected = selectedNode?.path === node.path
  const hasChildren = node.children.length > 0

  function handleClick() {
    if (node.isDirectory) navigateTo(node)
  }

  function handleToggle() {
    toggleExpanded(node.path)
  }

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1 pr-2 cursor-pointer group table-row-hover rounded-sm ${
          isSelected ? 'bg-primary/10 text-primary' : ''
        }`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={handleClick}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleToggle()
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
        <span className="text-[13px] shrink-0">
          {getFileIcon(node.name, node.isDirectory, node.extension)}
        </span>
        <span className={`text-xs truncate ${isSelected ? 'font-medium' : ''}`}>
          {node.name}
        </span>
        {node.isDirectory && node.fileCount > 0 && (
          <span className="text-[10px] text-muted-foreground ml-auto">
            {formatBytes(node.size)}
          </span>
        )}
      </div>

      {hasChildren && (
        <Collapsible open={isExpanded}>
          <CollapsibleContent className="overflow-hidden transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            {node.children
              .filter((child) => child.isDirectory)
              .map((child) => (
                <FolderTreeNode
                  key={child.path}
                  node={child}
                  depth={depth + 1}
                  selectedPath={selectedPath}
                />
              ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
}

const FolderTree: React.FC = () => {
  const { tree } = useFolderStore()

  if (!tree) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        <div className="text-center">
          <FolderIcon size={32} className="mx-auto mb-2 text-muted-foreground/40" />
          <p>Bir klasör seçerek analizi başlatın</p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-1">
      <FolderTreeNode node={tree} depth={0} />
    </div>
  )
}

export default FolderTree
