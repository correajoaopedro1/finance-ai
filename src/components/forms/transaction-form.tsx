'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { transactionSchema } from '@/lib/validators'
import { useCategories } from '@/hooks/use-categories'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Transaction } from '@/types'

type FormData = z.infer<typeof transactionSchema>

interface TransactionFormProps {
  initialData?: Partial<Transaction>
  onSubmit: (data: FormData) => Promise<void>
  onCancel: () => void
}

export function TransactionForm({ initialData, onSubmit, onCancel }: TransactionFormProps) {
  const { categories } = useCategories()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: initialData?.description ?? '',
      amount: initialData?.amount ?? 0,
      type: initialData?.type ?? 'EXPENSE',
      date: initialData?.date
        ? new Date(initialData.date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      categoryId: initialData?.categoryId ?? '',
      notes: initialData?.notes ?? '',
      tags: initialData?.tags ?? [],
      isRecurring: initialData?.isRecurring ?? false,
    },
  })

  const type = watch('type')
  const filteredCategories = categories.filter(
    (c) => c.type === type || c.type === 'BOTH'
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Type toggle */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Tipo</label>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden">
          {(['EXPENSE', 'INCOME'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setValue('type', t, { shouldValidate: true })}
              className={cn(
                'flex-1 py-2 text-sm font-medium transition-colors',
                type === t
                  ? t === 'INCOME'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-rose-500 text-white'
                  : 'text-slate-500 hover:bg-slate-50'
              )}
            >
              {t === 'INCOME' ? 'Receita' : 'Despesa'}
            </button>
          ))}
        </div>
      </div>

      <Input
        label="Descrição"
        placeholder="Ex: Almoço no restaurante"
        error={errors.description?.message}
        {...register('description')}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Valor (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0,00"
            className={cn(
              'input-base',
              errors.amount && 'border-rose-400 focus:ring-rose-400'
            )}
            {...register('amount', { valueAsNumber: true })}
          />
          {errors.amount && (
            <p className="mt-1.5 text-xs text-rose-500">{errors.amount.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Data</label>
          <input
            type="date"
            className={cn('input-base', errors.date && 'border-rose-400')}
            {...register('date')}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Categoria</label>
        <select
          className="input-base"
          {...register('categoryId')}
        >
          <option value="">Selecionar categoria</option>
          {filteredCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Notas <span className="text-slate-400 font-normal">(opcional)</span>
        </label>
        <textarea
          rows={2}
          placeholder="Observações adicionais..."
          className="input-base resize-none"
          {...register('notes')}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isRecurring"
          className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          {...register('isRecurring')}
        />
        <label htmlFor="isRecurring" className="text-sm text-slate-600">
          Transação recorrente
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" loading={isSubmitting}>
          {initialData ? 'Atualizar' : 'Adicionar'}
        </Button>
      </div>
    </form>
  )
}
