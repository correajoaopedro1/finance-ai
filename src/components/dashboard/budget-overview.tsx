'use client'

import Link from 'next/link'
import { ArrowRight, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface BudgetItem {
  id: string
  categoryName: string
  categoryColor: string
  limit: number
  spent: number
  percentage: number
}

export function BudgetOverview({ budgets }: { budgets: BudgetItem[] }) {
  const sorted = [...budgets].sort((a, b) => b.percentage - a.percentage).slice(0, 4)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">Orçamentos</h3>
        <Link
          href="/budgets"
          className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium"
        >
          Gerenciar <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {sorted.length === 0 ? (
        <div className="py-6 text-center text-sm text-slate-400">
          Nenhum orçamento configurado
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((b) => (
            <div key={b.id}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: b.categoryColor }}
                  />
                  <span className="text-sm font-medium text-slate-700">{b.categoryName}</span>
                  {b.percentage >= 100 && (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium',
                    b.percentage >= 100
                      ? 'text-rose-500'
                      : b.percentage >= 80
                        ? 'text-amber-500'
                        : 'text-slate-400'
                  )}
                >
                  {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                </span>
              </div>
              <Progress value={b.percentage} size="sm" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
