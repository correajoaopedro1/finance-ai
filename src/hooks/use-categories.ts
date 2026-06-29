'use client'

import useSWR from 'swr'
import toast from 'react-hot-toast'
import type { Category } from '@/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json().then((j) => j.data))

export function useCategories(type?: 'INCOME' | 'EXPENSE') {
  const params = type ? `?type=${type}` : ''
  const { data, isLoading, mutate } = useSWR<Category[]>(`/api/categories${params}`, fetcher)

  const createCategory = async (payload: Partial<Category>) => {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error)
    toast.success('Categoria criada!')
    await mutate()
    return json.data
  }

  const deleteCategory = async (id: string) => {
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Erro ao excluir categoria')
    toast.success('Categoria excluída!')
    await mutate()
  }

  return {
    categories: data ?? [],
    expenseCategories: (data ?? []).filter((c) => c.type === 'EXPENSE' || c.type === 'BOTH'),
    incomeCategories: (data ?? []).filter((c) => c.type === 'INCOME' || c.type === 'BOTH'),
    isLoading,
    mutate,
    createCategory,
    deleteCategory,
  }
}
