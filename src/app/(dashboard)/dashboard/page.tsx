'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Download } from 'lucide-react'
import { useDashboard } from '@/hooks/use-dashboard'
import { useTransactions } from '@/hooks/use-transactions'
import { Header } from '@/components/layout/header'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { BudgetOverview } from '@/components/dashboard/budget-overview'
import { CashFlowChart } from '@/components/charts/cash-flow-chart'
import { CategoryPieChart } from '@/components/charts/category-pie-chart'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { TransactionForm } from '@/components/forms/transaction-form'
import { getMonthName } from '@/lib/utils'

export default function DashboardPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [showAddTransaction, setShowAddTransaction] = useState(false)

  const { summary, isLoading } = useDashboard(month, year)
  const { createTransaction, mutate } = useTransactions()

  const navigate = (dir: -1 | 1) => {
    const d = new Date(year, month - 1 + dir, 1)
    setMonth(d.getMonth() + 1)
    setYear(d.getFullYear())
  }

  const handleExport = async () => {
    const url = `/api/reports/export?format=csv&dateFrom=${year}-${String(month).padStart(2, '0')}-01&dateTo=${year}-${String(month).padStart(2, '0')}-31`
    const a = document.createElement('a')
    a.href = url
    a.download = `financas-${year}-${month}.csv`
    a.click()
  }

  return (
    <>
      <Header
        title="Dashboard"
        subtitle={`Resumo financeiro de ${getMonthName(month, year)}`}
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-1 py-1">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </button>
            <span className="text-sm font-semibold text-slate-800 px-2 min-w-[140px] text-center capitalize">
              {getMonthName(month, year)}
            </span>
            <button
              onClick={() => navigate(1)}
              disabled={year === now.getFullYear() && month === now.getMonth() + 1}
              className="p-1.5 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <Download className="w-3.5 h-3.5" />
              Exportar
            </Button>
            <Button size="sm" onClick={() => setShowAddTransaction(true)}>
              <Plus className="w-3.5 h-3.5" />
              Transação
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <SummaryCards
          income={summary?.metrics.income ?? 0}
          expenses={summary?.metrics.expenses ?? 0}
          balance={summary?.metrics.balance ?? 0}
          savings={summary?.metrics.savings ?? 0}
          savingsRate={summary?.metrics.savingsRate ?? 0}
          comparison={summary?.metrics.comparison}
          isLoading={isLoading}
        />

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Fluxo de Caixa (6 meses)</CardTitle>
            </CardHeader>
            <CashFlowChart data={summary?.charts.cashFlow ?? []} />
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gastos por Categoria</CardTitle>
            </CardHeader>
            <CategoryPieChart
              data={summary?.charts.categorySpending ?? []}
              totalExpenses={summary?.metrics.expenses ?? 0}
            />
          </Card>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <RecentTransactions transactions={(summary?.recentTransactions as any) ?? []} />
          </Card>

          <Card>
            <BudgetOverview budgets={summary?.budgets ?? []} />
          </Card>
        </div>
      </div>

      {/* Add transaction modal */}
      <Modal
        isOpen={showAddTransaction}
        onClose={() => setShowAddTransaction(false)}
        title="Nova Transação"
        description="Adicione uma receita ou despesa"
      >
        <TransactionForm
          onSubmit={async (data) => {
            await createTransaction(data as any)
            setShowAddTransaction(false)
            mutate()
          }}
          onCancel={() => setShowAddTransaction(false)}
        />
      </Modal>
    </>
  )
}
