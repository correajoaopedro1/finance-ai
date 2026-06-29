'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Plus, Target, Edit2, Trash2, CheckCircle, XCircle, Calendar } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Progress } from '@/components/ui/progress'
import { GoalForm } from '@/components/forms/goal-form'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Goal } from '@/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json().then((j) => j.data))

export default function GoalsPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'COMPLETED' | 'ALL'>('ACTIVE')

  const { data: goals = [], mutate } = useSWR<Goal[]>(
    `/api/goals?status=${statusFilter}`,
    fetcher
  )

  const createGoal = async (data: any) => {
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Erro ao criar meta')
    toast.success('Meta criada com sucesso!')
    setShowAdd(false)
    mutate()
  }

  const updateGoal = async (id: string, data: any) => {
    const res = await fetch(`/api/goals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Erro ao atualizar meta')
    toast.success('Meta atualizada!')
    setEditingGoal(null)
    mutate()
  }

  const deleteGoal = async (id: string) => {
    await fetch(`/api/goals/${id}`, { method: 'DELETE' })
    toast.success('Meta excluída')
    setConfirmDelete(null)
    mutate()
  }

  const updateAmount = async (goal: Goal, newAmount: number) => {
    await updateGoal(goal.id, { currentAmount: newAmount })
  }

  return (
    <>
      <Header title="Metas Financeiras" subtitle="Acompanhe e atinja seus objetivos" />

      <div className="flex-1 p-6 space-y-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white">
            {(['ACTIVE', 'COMPLETED', 'ALL'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'px-4 py-1.5 text-sm font-medium transition-colors',
                  statusFilter === s ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-50'
                )}
              >
                {s === 'ACTIVE' ? 'Ativas' : s === 'COMPLETED' ? 'Concluídas' : 'Todas'}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4" />
            Nova meta
          </Button>
        </div>

        {/* Goals grid */}
        {goals.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
            <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Nenhuma meta encontrada</p>
            <p className="text-slate-400 text-sm mt-1">
              {statusFilter === 'ACTIVE'
                ? 'Crie sua primeira meta financeira!'
                : 'Nenhuma meta com este status'}
            </p>
            {statusFilter === 'ACTIVE' && (
              <Button className="mt-4" size="sm" onClick={() => setShowAdd(true)}>
                <Plus className="w-4 h-4" />
                Criar meta
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {goals.map((goal) => {
              const progress = Number(goal.targetAmount) > 0
                ? Math.min(100, (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100)
                : 0
              const remaining = Number(goal.targetAmount) - Number(goal.currentAmount)
              const isCompleted = goal.status === 'COMPLETED'

              return (
                <div
                  key={goal.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden"
                >
                  {/* Color bar */}
                  <div className="h-1.5" style={{ background: goal.color }} />

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                          style={{ backgroundColor: `${goal.color}20` }}
                        >
                          🎯
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{goal.name}</h3>
                          {goal.description && (
                            <p className="text-xs text-slate-400 mt-0.5">{goal.description}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant={isCompleted ? 'success' : 'default'}>
                        {isCompleted ? 'Concluída' : 'Ativa'}
                      </Badge>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-slate-800 number-tabular">
                          {formatCurrency(Number(goal.currentAmount))}
                        </span>
                        <span className="text-slate-400 number-tabular">
                          de {formatCurrency(Number(goal.targetAmount))}
                        </span>
                      </div>
                      <Progress value={progress} color={isCompleted ? 'bg-emerald-500' : undefined} />
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-brand-600">{progress.toFixed(1)}%</span>
                        {!isCompleted && remaining > 0 && (
                          <span className="text-slate-400">
                            Faltam {formatCurrency(remaining)}
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Concluída!
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Deadline */}
                    {goal.deadline && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
                        <Calendar className="w-3.5 h-3.5" />
                        Prazo: {formatDate(goal.deadline)}
                      </div>
                    )}

                    {/* Quick update deposit */}
                    {!isCompleted && (
                      <div className="mb-4">
                        <QuickDeposit
                          goal={goal}
                          onDeposit={(amount) => updateAmount(goal, Number(goal.currentAmount) + amount)}
                        />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingGoal(goal)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-slate-500
                                   hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Editar
                      </button>
                      <button
                        onClick={() => setConfirmDelete(goal.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-slate-500
                                   hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add modal */}
      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="Nova Meta Financeira"
        description="Defina seu objetivo e acompanhe o progresso"
      >
        <GoalForm onSubmit={createGoal} onCancel={() => setShowAdd(false)} />
      </Modal>

      {/* Edit modal */}
      <Modal
        isOpen={!!editingGoal}
        onClose={() => setEditingGoal(null)}
        title="Editar Meta"
      >
        {editingGoal && (
          <GoalForm
            initialData={editingGoal}
            onSubmit={(data) => updateGoal(editingGoal.id, data)}
            onCancel={() => setEditingGoal(null)}
          />
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Excluir Meta"
        description="Esta ação não pode ser desfeita."
        size="sm"
      >
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirmDelete(null)}>
            Cancelar
          </Button>
          <Button variant="danger" className="flex-1" onClick={() => confirmDelete && deleteGoal(confirmDelete)}>
            Excluir
          </Button>
        </div>
      </Modal>
    </>
  )
}

function QuickDeposit({ goal, onDeposit }: { goal: Goal; onDeposit: (amount: number) => void }) {
  const [value, setValue] = useState('')

  return (
    <div className="flex gap-2">
      <input
        type="number"
        min="0.01"
        step="0.01"
        placeholder="Depositar R$"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="input-base flex-1 text-xs py-1.5"
      />
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          const amount = parseFloat(value)
          if (amount > 0) {
            onDeposit(amount)
            setValue('')
          }
        }}
        disabled={!value || parseFloat(value) <= 0}
      >
        Depositar
      </Button>
    </div>
  )
}
