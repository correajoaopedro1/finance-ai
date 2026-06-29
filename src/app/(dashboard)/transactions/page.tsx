'use client'

import { useState } from 'react'
import {
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Edit2,
  Trash2,
  Download,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Skeleton } from '@/components/ui/skeleton'
import { TransactionForm } from '@/components/forms/transaction-form'
import { useTransactions } from '@/hooks/use-transactions'
import { useCategories } from '@/hooks/use-categories'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Transaction } from '@/types'

export default function TransactionsPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const { categories } = useCategories()
  const { transactions, pagination, isLoading, createTransaction, updateTransaction, deleteTransaction } =
    useTransactions({
      search: search || undefined,
      type: typeFilter !== 'ALL' ? typeFilter : undefined,
      categoryId: categoryFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      page,
      limit: 20,
    })

  const handleExport = () => {
    const params = new URLSearchParams({ format: 'csv' })
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)
    if (typeFilter !== 'ALL') params.set('type', typeFilter)
    window.open(`/api/reports/export?${params}`, '_blank')
  }

  return (
    <>
      <Header title="Transações" subtitle="Gerencie todas as suas movimentações financeiras" />

      <div className="flex-1 p-6 space-y-5">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-48">
            <Input
              placeholder="Buscar transações..."
              leftIcon={<Search className="w-4 h-4" />}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>

          {/* Type filter */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white">
            {(['ALL', 'INCOME', 'EXPENSE'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTypeFilter(t); setPage(1) }}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium transition-colors',
                  typeFilter === t
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-500 hover:bg-slate-50'
                )}
              >
                {t === 'ALL' ? 'Todos' : t === 'INCOME' ? 'Receitas' : 'Despesas'}
              </button>
            ))}
          </div>

          {/* Date filters */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
            className="input-base w-36 text-sm"
            placeholder="De"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
            className="input-base w-36 text-sm"
            placeholder="Até"
          />

          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}
            className="input-base w-44 text-sm"
          >
            <option value="">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4" />
            CSV
          </Button>

          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4" />
            Adicionar
          </Button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-500">Data</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500">Descrição</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500">Categoria</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-500">Tipo</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-500">Valor</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3.5">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-slate-400">
                      Nenhuma transação encontrada
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                        {formatDate(t.date)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="font-medium text-slate-800">{t.description}</p>
                          {t.notes && (
                            <p className="text-xs text-slate-400 truncate max-w-xs">{t.notes}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {t.category ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                            style={{
                              backgroundColor: `${t.category.color}20`,
                              color: t.category.color,
                            }}
                          >
                            {t.category.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Sem categoria</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={t.type === 'INCOME' ? 'success' : 'danger'}>
                          {t.type === 'INCOME' ? (
                            <><ArrowUpRight className="w-3 h-3 mr-1" />Receita</>
                          ) : (
                            <><ArrowDownLeft className="w-3 h-3 mr-1" />Despesa</>
                          )}
                        </Badge>
                      </td>
                      <td className={cn(
                        'px-4 py-3.5 text-right font-semibold number-tabular',
                        t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-500'
                      )}>
                        {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(Number(t.amount))}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingTransaction(t)}
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(t.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <p className="text-sm text-slate-500">
                {pagination.total} transações · Página {pagination.page} de {pagination.pages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.pages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add modal */}
      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="Nova Transação"
        description="Adicione uma receita ou despesa"
      >
        <TransactionForm
          onSubmit={async (data) => {
            await createTransaction(data as any)
            setShowAdd(false)
          }}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        title="Editar Transação"
      >
        {editingTransaction && (
          <TransactionForm
            initialData={editingTransaction}
            onSubmit={async (data) => {
              await updateTransaction(editingTransaction.id, data as any)
              setEditingTransaction(null)
            }}
            onCancel={() => setEditingTransaction(null)}
          />
        )}
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Excluir Transação"
        description="Esta ação não pode ser desfeita. Tem certeza?"
        size="sm"
      >
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirmDelete(null)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={async () => {
              if (confirmDelete) {
                await deleteTransaction(confirmDelete)
                setConfirmDelete(null)
              }
            }}
          >
            Excluir
          </Button>
        </div>
      </Modal>
    </>
  )
}
