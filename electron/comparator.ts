import path from 'path'
import { FileNode } from './preload'
import { scanFolder } from './scanner'

/* ------------------------------------------------------------------ */
/*  Public types                                                       */
/* ------------------------------------------------------------------ */

export interface DiffEntry {
  relativePath: string
  name: string
  isDirectory: boolean
  status: 'only-left' | 'only-right' | 'size-diff' | 'date-diff' | 'identical'
  leftSize: number | null
  rightSize: number | null
  leftModified: string | null
  rightModified: string | null
  sizeDiff: number
  extension: string
}

export interface CompareSummary {
  onlyLeft: number
  onlyRight: number
  sizeDiff: number
  identical: number
  totalFiles: number
  onlyLeftSize: number
  onlyRightSize: number
  sizeDiffSize: number
}

export interface CompareResult {
  leftPath: string
  rightPath: string
  totalLeft: number
  totalRight: number
  sizeDifference: number
  entries: DiffEntry[]
  ignoredPaths: string[]
  summary: CompareSummary
  elapsedMs: number
}

export interface CompareProgress {
  phase: 'scanning-left' | 'scanning-right' | 'comparing'
  scannedFiles: number
  totalFiles: number
  currentPath: string
  totalSize: number
  elapsedMs: number
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Flatten a FileNode tree into a Map keyed by relative path */
async function flattenTree(
  node: FileNode,
  rootPath: string,
  map: Map<string, FileNode>,
) {
  let count = 0
  async function traverse(current: FileNode) {
    for (const child of current.children) {
      const rel = path.relative(rootPath, child.path).replace(/\\/g, '/')
      map.set(rel, child)
      
      count++
      if (count % 5000 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0))
      }

      if (child.isDirectory) {
        await traverse(child)
      }
    }
  }
  await traverse(node)
}

/* ------------------------------------------------------------------ */
/*  Main compare function                                              */
/* ------------------------------------------------------------------ */

export async function compareFolders(
  leftPath: string,
  rightPath: string,
  onProgress: (progress: CompareProgress) => void,
  options?: {
    ignoreUnnecessary?: boolean
    checkCancel?: () => boolean
  }
): Promise<CompareResult> {
  const startTime = Date.now()

  // Phase 1 — scan left folder
  const { tree: leftTree, ignoredPaths: leftIgnored } = await scanFolder(leftPath, (p) => {
    onProgress({
      phase: 'scanning-left',
      scannedFiles: p.scannedFiles,
      totalFiles: 0,
      currentPath: p.currentPath,
      totalSize: p.totalSize,
      elapsedMs: Date.now() - startTime,
    })
  }, options)

  if (options?.checkCancel?.()) throw new Error('Cancelled')

  // Phase 2 — scan right folder
  const { tree: rightTree, ignoredPaths: rightIgnored } = await scanFolder(rightPath, (p) => {
    onProgress({
      phase: 'scanning-right',
      scannedFiles: p.scannedFiles,
      totalFiles: 0,
      currentPath: p.currentPath,
      totalSize: p.totalSize,
      elapsedMs: Date.now() - startTime,
    })
  }, options)

  if (options?.checkCancel?.()) throw new Error('Cancelled')

  // Phase 3 — compare
  const leftMap = new Map<string, FileNode>()
  const rightMap = new Map<string, FileNode>()

  await flattenTree(leftTree, leftPath, leftMap)
  await flattenTree(rightTree, rightPath, rightMap)

  const totalFilesToCompare = leftMap.size + rightMap.size

  onProgress({
    phase: 'comparing',
    scannedFiles: 0,
    totalFiles: totalFilesToCompare,
    currentPath: '',
    totalSize: leftTree.size + rightTree.size,
    elapsedMs: Date.now() - startTime,
  })

  const entries: DiffEntry[] = []
  const visited = new Set<string>()

  const summary: CompareSummary = {
    onlyLeft: 0,
    onlyRight: 0,
    sizeDiff: 0,
    identical: 0,
    totalFiles: 0,
    onlyLeftSize: 0,
    onlyRightSize: 0,
    sizeDiffSize: 0,
  }

  let comparedCount = 0
  let lastProgressTime = Date.now()
  const COMPARE_THROTTLE_MS = 200

  function trySendCompareProgress(currentPath: string) {
    const now = Date.now()
    if (now - lastProgressTime >= COMPARE_THROTTLE_MS) {
      lastProgressTime = now
      onProgress({
        phase: 'comparing',
        scannedFiles: comparedCount,
        totalFiles: totalFilesToCompare,
        currentPath,
        totalSize: leftTree.size + rightTree.size,
        elapsedMs: now - startTime,
      })
    }
  }

  // Walk left map
  for (const [rel, leftNode] of leftMap) {
    if (options?.checkCancel?.()) throw new Error('Cancelled')

    visited.add(rel)
    comparedCount++
    const rightNode = rightMap.get(rel)

    if (!rightNode) {
      // Only in left
      entries.push({
        relativePath: rel,
        name: leftNode.name,
        isDirectory: leftNode.isDirectory,
        status: 'only-left',
        leftSize: leftNode.size,
        rightSize: null,
        leftModified: leftNode.modifiedAt,
        rightModified: null,
        sizeDiff: leftNode.size,
        extension: leftNode.extension,
      })
      if (!leftNode.isDirectory) {
        summary.onlyLeft++
        summary.onlyLeftSize += leftNode.size
      }
    } else if (leftNode.isDirectory && rightNode.isDirectory) {
      // Both directories — compare sizes
      if (leftNode.size !== rightNode.size) {
        entries.push({
          relativePath: rel,
          name: leftNode.name,
          isDirectory: true,
          status: 'size-diff',
          leftSize: leftNode.size,
          rightSize: rightNode.size,
          leftModified: leftNode.modifiedAt,
          rightModified: rightNode.modifiedAt,
          sizeDiff: leftNode.size - rightNode.size,
          extension: '',
        })
      }
      // Don't count directories in summary counts
    } else if (!leftNode.isDirectory && !rightNode.isDirectory) {
      // Both files — compare
      if (leftNode.size !== rightNode.size) {
        entries.push({
          relativePath: rel,
          name: leftNode.name,
          isDirectory: false,
          status: 'size-diff',
          leftSize: leftNode.size,
          rightSize: rightNode.size,
          leftModified: leftNode.modifiedAt,
          rightModified: rightNode.modifiedAt,
          sizeDiff: leftNode.size - rightNode.size,
          extension: leftNode.extension,
        })
        summary.sizeDiff++
        summary.sizeDiffSize += Math.abs(leftNode.size - rightNode.size)
      } else {
        // Sizes equal
        entries.push({
          relativePath: rel,
          name: leftNode.name,
          isDirectory: false,
          status: 'identical',
          leftSize: leftNode.size,
          rightSize: rightNode.size,
          leftModified: leftNode.modifiedAt,
          rightModified: rightNode.modifiedAt,
          sizeDiff: 0,
          extension: leftNode.extension,
        })
        summary.identical++
      }
    }

    trySendCompareProgress(rel)

    if (comparedCount % 1000 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
  }

  // Walk right map for entries not in left
  for (const [rel, rightNode] of rightMap) {
    if (options?.checkCancel?.()) throw new Error('Cancelled')

    if (visited.has(rel)) continue
    comparedCount++

    entries.push({
      relativePath: rel,
      name: rightNode.name,
      isDirectory: rightNode.isDirectory,
      status: 'only-right',
      leftSize: null,
      rightSize: rightNode.size,
      leftModified: null,
      rightModified: rightNode.modifiedAt,
      sizeDiff: -rightNode.size,
      extension: rightNode.extension,
    })
    if (!rightNode.isDirectory) {
      summary.onlyRight++
      summary.onlyRightSize += rightNode.size
    }

    trySendCompareProgress(rel)

    if (comparedCount % 1000 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
  }

  summary.totalFiles = summary.onlyLeft + summary.onlyRight + summary.sizeDiff + summary.identical

  // Sort: directories first, then by relative path
  entries.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
    return a.relativePath.localeCompare(b.relativePath)
  })

  const elapsed = Date.now() - startTime

  // Final progress
  onProgress({
    phase: 'comparing',
    scannedFiles: comparedCount,
    totalFiles: totalFilesToCompare,
    currentPath: '',
    totalSize: leftTree.size + rightTree.size,
    elapsedMs: elapsed,
  })

  const allIgnored = Array.from(new Set([...leftIgnored, ...rightIgnored])).sort()

  return {
    leftPath,
    rightPath,
    totalLeft: leftTree.fileCount,
    totalRight: rightTree.fileCount,
    sizeDifference: summary.onlyLeftSize + summary.onlyRightSize + summary.sizeDiffSize,
    entries: entries,
    ignoredPaths: allIgnored,
    summary,
    elapsedMs: Date.now() - startTime,
  }
}
