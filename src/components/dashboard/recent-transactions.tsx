'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Transaction } from '@/types'

interface RecentTransactionsProps {
  transactions: Transaction[]
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">Transações Recentes</h3>
        <Link
          href="/transactions"
          className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium"
        >
          Ver todas <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-400">
          Nenhuma transação este mês
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
                style={{ backgroundColor: `${t.category?.color ?? '#6366f1'}20` }}
              >
                <span>{getCategoryEmoji(t.category?.icon)}</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{t.description}</p>
                <p className="text-xs text-slate-400">
                  {t.category?.name ?? 'Sem categoria'} · {formatDateShort(t.date)}
                </p>
              </div>

              <span
                className={cn(
                  'text-sm font-semibold number-tabular shrink-0',
                  t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-500'
                )}
              >
                {t.type === 'INCOME' ? '+' : '-'}
                {formatCurrency(Number(t.amount))}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function getCategoryEmoji(icon?: string): string {
  const map: Record<string, string> = {
    utensils: '🍽️',
    car: '🚗',
    home: '🏠',
    'heart-pulse': '❤️',
    'graduation-cap': '📚',
    'gamepad-2': '🎮',
    shirt: '👕',
    wrench: '🔧',
    laptop: '💻',
    sparkles: '✨',
    'paw-print': '🐾',
    plane: '✈️',
    briefcase: '💼',
    'trending-up': '📈',
    'shopping-bag': '🛍️',
    gift: '🎁',
    building: '🏢',
    target: '🎯',
    'piggy-bank': '🐷',
  }
  return map[icon ?? ''] ?? '💰'
}
