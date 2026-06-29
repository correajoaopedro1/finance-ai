import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number
  max?: number
  className?: string
  color?: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function Progress({
  value,
  max = 100,
  className,
  color,
  size = 'md',
  showLabel = false,
}: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-3.5' }

  const defaultColor =
    pct >= 100
      ? 'bg-rose-500'
      : pct >= 80
        ? 'bg-amber-400'
        : 'bg-brand-500'

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('w-full bg-slate-100 rounded-full overflow-hidden', heights[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', color ?? defaultColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-slate-500 mt-1">{pct.toFixed(0)}%</span>
      )}
    </div>
  )
}
