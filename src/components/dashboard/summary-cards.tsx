'use client'

import { TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowUp, ArrowDown } from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface MetricCard {
  label: string
  value: number
  previousValue?: number
  change?: number
  icon: React.ElementType
  iconBg: string
  iconColor: string
  valueColor?: string
  prefix?: string
}

interface SummaryCardsProps {
  income: number
  expenses: number
  balance: number
  savings: number
  savingsRate: number
  comparison?: {
    income: { change: number }
    expenses: { change: number }
  }
  isLoading?: boolean
}

function ChangeIndicator({ change }: { change: number }) {
  const isPositive = change >= 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium',
        isPositive ? 'text-emerald-600' : 'text-rose-500'
      )}
    >
      {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
      {Math.abs(change).toFixed(1)}% vs mês anterior
    </span>
  )
}

export function SummaryCards({
  income,
  expenses,
  balance,
  savings,
  savingsRate,
  comparison,
  isLoading,
}: SummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-10 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>
    )
  }

  const cards: MetricCard[] = [
    {
      label: 'Saldo do Mês',
      value: balance,
      icon: Wallet,
      iconBg: balance >= 0 ? 'bg-brand-50' : 'bg-rose-50',
      iconColor: balance >= 0 ? 'text-brand-600' : 'text-rose-500',
      valueColor: balance >= 0 ? 'text-slate-900' : 'text-rose-500',
    },
    {
      label: 'Receitas',
      value: income,
      change: comparison?.income.change,
      icon: TrendingUp,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      valueColor: 'text-emerald-600',
    },
    {
      label: 'Despesas',
      value: expenses,
      change: comparison?.expenses.change,
      icon: TrendingDown,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-500',
      valueColor: 'text-rose-500',
    },
    {
      label: 'Taxa de Poupança',
      value: savingsRate,
      icon: PiggyBank,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
      prefix: '',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, value, change, icon: Icon, iconBg, iconColor, valueColor, prefix }) => (
        <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500">{label}</span>
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
              <Icon className={cn('w-5 h-5', iconColor)} />
            </div>
          </div>
          <p className={cn('text-2xl font-bold number-tabular', valueColor ?? 'text-slate-900')}>
            {label === 'Taxa de Poupança'
              ? `${value.toFixed(1)}%`
              : formatCurrency(value)}
          </p>
          <div className="mt-1.5 h-4">
            {change !== undefined ? (
              <ChangeIndicator change={change} />
            ) : (
              label === 'Taxa de Poupança' && (
                <span className="text-xs text-slate-400">
                  {value >= 20
                    ? '✅ Ótima taxa!'
                    : value >= 10
                      ? '👍 Boa taxa'
                      : '⚠️ Abaixo do ideal'}
                </span>
              )
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
