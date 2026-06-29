'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Plus, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Progress } from '@/components/ui/progress'
import { useCategories } from '@/hooks/use-categories'
import { formatCurrency, getMonthName } from '@/lib/utils'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const fetcher = (url: string) => fetch(url).then((r) => r.json().then((j) => j.data))

interface BudgetItem {
  id: string
  categoryId: string
  category: { name: string; color: string }
  amount: number
  spent: number
  percentage: number
  month: number
  year: number
  alertAt: number
}

export default function BudgetsPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [showAdd, setShowAdd] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const { data: budgets = [], mutate } = useSWR<BudgetItem[]>(
    `/api/budgets?month=${month}&year=${year}`,
    fetcher
  )
  const { expenseCategories } = useCategories()

  // Form state
  const [form, setForm] = useState({ categoryId: '', amount: '', alertAt: '80' })
  const [loading, setLoading] = useState(false)

  const navigate = (dir: -1 | 1) => {
    const d = new Date(year, month - 1 + dir, 1)
    setMonth(d.getMonth() + 1)
    setYear(d.getFullYear())
  }

  const handleCreate = async () => {
    if (!form.categoryId || !form.amount) return toast.error('Preencha todos os campos')
    setLoading(true)
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: form.categoryId,
          amount: parseFloat(form.amount),
          month,
          year,
          alertAt: parseInt(form.alertAt),
        }),
      })
      if (!res.ok) throw new Error('Erro ao criar orçamento')
      toast.success('Orçamento definido!')
      setShowAdd(false)
      setForm({ categoryId: '', amount: '', alertAt: '80' })
      mutate()
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/budgets/${id}`, { method: 'DELETE' })
    toast.success('Orçamento excluído')
    setConfirmDelete(null)
    mutate()
  }

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0)
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0)
  const overBudget = budgets.filter((b) => b.percentage >= 100)

  return (
    <>
      <Header title="Orçamentos" subtitle="Controle seus limites de gastos por categoria" />

      <div className="flex-1 p-6 space-y-6">
        {/* Month nav */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-1 py-1">
            <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-slate-100 rounded-md">
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </button>
            <span className="text-sm font-semibold text-slate-800 px-2 min-w-[140px] text-center capitalize">
              {getMonthName(month, year)}
            </span>
            <button
              onClick={() => navigate(1)}
              disabled={year === now.getFullYear() && month === now.getMonth() + 1}
              className="p-1.5 hover:bg-slate-100 rounded-md disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4" />
            Novo orçamento
          </Button>
        </div>

        {/* Summary */}
        {budgets.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500 mb-1">Total orçado</p>
              <p className="text-2xl font-bold text-slate-900 number-tabular">
                {formatCurrency(totalBudget)}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500 mb-1">Total gasto</p>
              <p className="text-2xl font-bold text-rose-500 number-tabular">
                {formatCurrency(totalSpent)}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500 mb-1">Disponível</p>
              <p
                className={cn(
                  'text-2xl font-bold number-tabular',
                  totalBudget - totalSpent >= 0 ? 'text-emerald-600' : 'text-rose-500'
                )}
              >
                {formatCurrency(Math.max(0, totalBudget - totalSpent))}
              </p>
            </div>
          </div>
        )}

        {/* Alerts */}
        {overBudget.length > 0 && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-rose-700 font-medium mb-2">
              <AlertTriangle className="w-4 h-4" />
              {overBudget.length} orçamento(s) excedido(s)!
            </div>
            <div className="space-y-1">
              {overBudget.map((b) => (
                <p key={b.id} className="text-sm text-rose-600">
                  • {b.category.name}: {formatCurrency(b.spent)} (limite: {formatCurrency(b.amount)})
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Budget list */}
        {budgets.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 py-16 text-center">
            <p className="text-slate-500 font-medium">Nenhum orçamento para este mês</p>
            <p className="text-slate-400 text-sm mt-1">
              Defina limites de gastos por categoria para controlar melhor suas finanças
            </p>
            <Button className="mt-4" size="sm" onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4" />
              Definir orçamento
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {[...budgets]
              .sort((a, b) => b.percentage - a.percentage)
              .map((budget) => (
                <div key={budget.id} className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ background: budget.category.color }}
                      />
                      <span className="font-semibold text-slate-800">{budget.category.name}</span>
                      {budget.percentage >= 100 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-rose-600 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" /> Excedido
                        </span>
                      ) : budget.percentage >= budget.alertAt ? (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" /> Alerta
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                          <CheckCircle className="w-3.5 h-3.5" /> Dentro do limite
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-800 number-tabular">
                          {formatCurrency(budget.spent)}{' '}
                          <span className="text-slate-400 font-normal">
                            / {formatCurrency(budget.amount)}
                          </span>
                        </p>
                        <p
                          className={cn(
                            'text-xs font-medium',
                            budget.percentage >= 100
                              ? 'text-rose-500'
                              : budget.percentage >= budget.alertAt
                                ? 'text-amber-500'
                                : 'text-slate-400'
                          )}
                        >
                          {budget.percentage.toFixed(1)}% utilizado
                        </p>
                      </div>
                      <button
                        onClick={() => setConfirmDelete(budget.id)}
                        className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <Progress value={budget.percentage} size="md" />
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Add modal */}
      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title={`Novo Orçamento — ${getMonthName(month, year)}`}
        description="Defina um limite de gasto para uma categoria"
      >
        <div className="space-y-4">
          <div>
            <label className="label-base">Categoria</label>
            <select
              className="input-base"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">Selecione uma categoria</option>
              {expenseCategories
                .filter((c) => !budgets.find((b) => b.categoryId === c.id))
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
          </div>

          <div>
            <label className="label-base">Limite mensal (R$)</label>
            <input
              type="number"
              step="0.01"
              min="1"
              placeholder="0,00"
              className="input-base"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>

          <div>
            <label className="label-base">Alertar em (%)</label>
            <input
              type="number"
              min="1"
              max="100"
              className="input-base"
              value={form.alertAt}
              onChange={(e) => setForm({ ...form, alertAt: e.target.value })}
            />
            <p className="text-xs text-slate-400 mt-1">
              Você será notificado quando atingir este percentual
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowAdd(false)}>
              Cancelar
            </Button>
            <Button className="flex-1" loading={loading} onClick={handleCreate}>
              Definir orçamento
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Remover Orçamento"
        size="sm"
      >
        <div className="flex gap-3 pt-4">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirmDelete(null)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => confirmDelete && handleDelete(confirmDelete)}
          >
            Remover
          </Button>
        </div>
      </Modal>
    </>
  )
}
