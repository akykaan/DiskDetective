import React, { useMemo } from 'react'
import { ArrowLeftRight, FolderMinus, FolderPlus, AlertTriangle, CheckCircle2, FileWarning } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useCompareStore } from '@/store/useCompareStore'
import { useI18nStore } from '@/store/useI18nStore'
import { formatBytes } from '@/lib/utils'

const COLORS = {
  onlyLeft: 'hsl(0 72% 51%)',       // red
  onlyRight: 'hsl(217 91% 60%)',    // blue
  sizeDiff: 'hsl(45 93% 47%)',      // amber
  identical: 'hsl(142 71% 45%)',    // green
}

interface StatCardProps {
  label: string
  value: string | number
  subValue?: string
  icon: React.ReactNode
  color: string
  active?: boolean
  onClick?: () => void
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subValue, icon, color, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all hover:scale-[1.02] hover:shadow-md ${
      active
        ? 'border-primary bg-primary/5 shadow-sm'
        : 'border-border bg-card hover:border-primary/30'
    }`}
  >
    <div className="flex items-center gap-2 w-full">
      <div
        className="flex h-7 w-7 items-center justify-center rounded-md"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {icon}
      </div>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
        {label}
      </span>
    </div>
    <div className="flex items-baseline gap-1.5 mt-0.5">
      <span className="text-xl font-bold tabular-nums" style={{ color }}>
        {value}
      </span>
      {subValue && (
        <span className="text-[10px] text-muted-foreground">{subValue}</span>
      )}
    </div>
  </button>
)

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; payload?: { name: string; color: string } }>
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  const { t } = useI18nStore()
  if (!active || !payload || payload.length === 0) return null
  const data = payload[0]
  return (
    <div className="rounded-md border bg-card px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-foreground">{data.payload?.name}</p>
      <p className="text-muted-foreground">{data.value} {t('files_scanned_count')}</p>
    </div>
  )
}

const DiffSummary: React.FC = () => {
  const { compareResult, filter, setFilter } = useCompareStore()
  const { t } = useI18nStore()

  const chartData = useMemo(() => {
    if (!compareResult) return []
    const { summary } = compareResult
    return [
      { name: t('diff_tabs.only_left'), value: summary.onlyLeft, color: COLORS.onlyLeft },
      { name: t('diff_tabs.only_right'), value: summary.onlyRight, color: COLORS.onlyRight },
      { name: t('diff_tabs.size_diff'), value: summary.sizeDiff, color: COLORS.sizeDiff },
      { name: t('diff_tabs.identical'), value: summary.identical, color: COLORS.identical },
    ].filter((d) => d.value > 0)
  }, [compareResult, t])

  if (!compareResult) return null

  const { summary, sizeDifference, totalLeft, totalRight } = compareResult
  const absDiff = Math.abs(sizeDifference)
  const diffSign = sizeDifference > 0 ? '+' : sizeDifference < 0 ? '-' : ''
  const diffColor = sizeDifference > 0 ? COLORS.onlyLeft : sizeDifference < 0 ? COLORS.onlyRight : COLORS.identical

  return (
    <div className="space-y-3">
      {/* Total size comparison bar */}
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-muted-foreground">
            {t('left')}: <span className="text-foreground font-medium">{formatBytes(totalLeft)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowLeftRight size={12} className="text-muted-foreground" />
            <span className="text-sm font-bold tabular-nums" style={{ color: diffColor }}>
              {diffSign}{formatBytes(absDiff)}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {t('right')}: <span className="text-foreground font-medium">{formatBytes(totalRight)}</span>
          </div>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden bg-secondary">
          <div
            className="h-full transition-all duration-500 rounded-l-full"
            style={{
              width: `${(totalLeft / Math.max(totalLeft, totalRight)) * 100}%`,
              background: 'hsl(var(--chart-1))',
            }}
          />
        </div>
        <div className="flex h-2 rounded-full overflow-hidden bg-secondary mt-1">
          <div
            className="h-full transition-all duration-500 rounded-l-full"
            style={{
              width: `${(totalRight / Math.max(totalLeft, totalRight)) * 100}%`,
              background: 'hsl(var(--chart-2))',
            }}
          />
        </div>
      </div>

      {/* Stat cards + mini chart */}
      <div className="flex gap-3">
        <div className="grid grid-cols-2 gap-2 flex-1 xl:grid-cols-4">
          <StatCard
            label={t('diff_tabs.only_left')}
            value={summary.onlyLeft}
            subValue={summary.onlyLeftSize > 0 ? formatBytes(summary.onlyLeftSize) : undefined}
            icon={<FolderMinus size={14} />}
            color={COLORS.onlyLeft}
            active={filter === 'only-left'}
            onClick={() => setFilter(filter === 'only-left' ? 'all' : 'only-left')}
          />
          <StatCard
            label={t('diff_tabs.only_right')}
            value={summary.onlyRight}
            subValue={summary.onlyRightSize > 0 ? formatBytes(summary.onlyRightSize) : undefined}
            icon={<FolderPlus size={14} />}
            color={COLORS.onlyRight}
            active={filter === 'only-right'}
            onClick={() => setFilter(filter === 'only-right' ? 'all' : 'only-right')}
          />
          <StatCard
            label={t('diff_tabs.size_diff')}
            value={summary.sizeDiff}
            subValue={summary.sizeDiffSize > 0 ? formatBytes(summary.sizeDiffSize) : undefined}
            icon={<AlertTriangle size={14} />}
            color={COLORS.sizeDiff}
            active={filter === 'size-diff'}
            onClick={() => setFilter(filter === 'size-diff' ? 'all' : 'size-diff')}
          />
          <StatCard
            label={t('diff_tabs.identical')}
            value={summary.identical}
            icon={<CheckCircle2 size={14} />}
            color={COLORS.identical}
            active={filter === 'identical'}
            onClick={() => setFilter(filter === 'identical' ? 'all' : 'identical')}
          />
        </div>

        {/* Mini pie chart */}
        {chartData.length > 0 && (
          <div className="w-[120px] shrink-0 rounded-lg border border-border bg-card flex items-center justify-center">
            <ResponsiveContainer width={100} height={100}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={42}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

export default DiffSummary
