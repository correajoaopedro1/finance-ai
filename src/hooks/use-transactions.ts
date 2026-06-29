'use client'

import useSWR from 'swr'
import toast from 'react-hot-toast'
import type { Transaction, PaginatedResponse } from '@/types'

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Erro ao buscar dados')
    return r.json()
  })

interface TransactionFilters {
  type?: 'INCOME' | 'EXPENSE'
  categoryId?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  page?: number
  limit?: number
}

export function useTransactions(filters: TransactionFilters = {}) {
  const params = new URLSearchParams()
  if (filters.type) params.set('type', filters.type)
  if (filters.categoryId) params.set('categoryId', filters.categoryId)
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.set('dateTo', filters.dateTo)
  if (filters.search) params.set('search', filters.search)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.limit) params.set('limit', String(filters.limit))

  const key = `/api/transactions?${params.toString()}`

  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<Transaction>>(key, fetcher)

  const createTransaction = async (payload: Partial<Transaction>) => {
    const toastId = toast.loading('Salvando transação...')
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Transação criada!', { id: toastId })
      await mutate()
      return json.data
    } catch (err) {
      toast.error((err as Error).message ?? 'Erro ao criar transação', { id: toastId })
      throw err
    }
  }

  const updateTransaction = async (id: string, payload: Partial<Transaction>) => {
    const toastId = toast.loading('Atualizando...')
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Transação atualizada!', { id: toastId })
      await mutate()
      return json.data
    } catch (err) {
      toast.error((err as Error).message ?? 'Erro ao atualizar', { id: toastId })
      throw err
    }
  }

  const deleteTransaction = async (id: string) => {
    const toastId = toast.loading('Excluindo...')
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir')
      toast.success('Transação excluída!', { id: toastId })
      await mutate()
    } catch (err) {
      toast.error((err as Error).message ?? 'Erro ao excluir', { id: toastId })
      throw err
    }
  }

  return {
    transactions: data?.data ?? [],
    pagination: data?.pagination,
    isLoading,
    error,
    mutate,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  }
}
