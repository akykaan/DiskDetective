import React, { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useFolderStore } from '@/store/useFolderStore'
import { formatBytes } from '@/lib/utils'

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))',
  'hsl(var(--chart-7))',
  'hsl(var(--chart-8))',
]

interface SizeEntry {
  name: string
  value: number
  color: string
}

interface TypeEntry {
  type: string
  size: number
  color: string
}

function aggregateBySize(node: FileNode): SizeEntry[] {
  const sizeCategories: { name: string; min: number; max: number }[] = [
    { name: '< 1 KB', min: 0, max: 1024 },
    { name: '1 KB - 1 MB', min: 1024, max: 1024 * 1024 },
    { name: '1 MB - 100 MB', min: 1024 * 1024, max: 100 * 1024 * 1024 },
    { name: '100 MB - 1 GB', min: 100 * 1024 * 1024, max: 1024 * 1024 * 1024 },
    { name: '> 1 GB', min: 1024 * 1024 * 1024, max: Infinity },
  ]

  const counts = new Array(sizeCategories.length).fill(0)

  function walk(n: FileNode) {
    if (!n.isDirectory) {
      for (let i = 0; i < sizeCategories.length; i++) {
        if (n.size >= sizeCategories[i].min && n.size < sizeCategories[i].max) {
          counts[i]++
          break
        }
      }
    }
    for (const child of n.children) {
      walk(child)
    }
  }

  walk(node)

  return sizeCategories
    .map((cat, i) => ({ name: cat.name, value: counts[i], color: CHART_COLORS[i % CHART_COLORS.length] }))
    .filter((e) => e.value > 0)
}

function aggregateByType(node: FileNode): TypeEntry[] {
  const typeTotals: Record<string, number> = {}

  const typeLabels: Record<string, string> = {
    image: 'Resim',
    video: 'Video',
    audio: 'Ses',
    archive: 'Arşiv',
    code: 'Kod',
    document: 'Belge',
    executable: 'Çalıştırılabilir',
    font: 'Font',
  }

  function walk(n: FileNode) {
    if (!n.isDirectory) {
      const ext = n.extension || 'other'
      typeTotals[ext] = (typeTotals[ext] || 0) + n.size
    }
    for (const child of n.children) {
      walk(child)
    }
  }

  walk(node)

  return Object.entries(typeTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([ext, size], i) => ({
      type: typeLabels[ext] || ext.toUpperCase(),
      size,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }))
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; payload?: { name?: string; type?: string } }>
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null
  const data = payload[0]
  return (
    <div className="rounded-md border bg-card px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-foreground">{data.payload?.name || data.payload?.type || data.name}</p>
      <p className="text-muted-foreground">{formatBytes(data.value as number)}</p>
    </div>
  )
}

const ChartPanel: React.FC = () => {
  const { tree, scanStatus } = useFolderStore()

  const sizeData = useMemo(() => (tree ? aggregateBySize(tree) : []), [tree])
  const typeData = useMemo(() => (tree ? aggregateByType(tree) : []), [tree])

  if (scanStatus === 'idle' || !tree) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">Boyuta Göre Dağılım</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Veri yok</span>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">Dosya Türüne Göre Dağılım</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Veri yok</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <Card className="bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium">Boyuta Göre Dağılım</CardTitle>
        </CardHeader>
        <CardContent className="h-[220px]">
          <div className="flex h-full items-center gap-2">
            <div className="h-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sizeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {sizeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5">
              {sizeData.map((entry, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                  <span
                    className="h-2.5 w-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-muted-foreground">{entry.name}</span>
                  <span className="text-foreground/70 font-medium">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium">Dosya Türüne Göre Dağılım</CardTitle>
        </CardHeader>
        <CardContent className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={typeData} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="type"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="size" radius={[0, 3, 3, 0]} barSize={14}>
                {typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

export default ChartPanel
