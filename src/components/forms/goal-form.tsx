'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { goalSchema } from '@/lib/validators'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Goal } from '@/types'

type FormData = z.infer<typeof goalSchema>

const GOAL_ICONS = ['target', 'home', 'car', 'plane', 'graduation-cap', 'heart', 'smartphone', 'briefcase', 'gift', 'piggy-bank']
const GOAL_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6']

interface GoalFormProps {
  initialData?: Partial<Goal>
  onSubmit: (data: FormData) => Promise<void>
  onCancel: () => void
}

export function GoalForm({ initialData, onSubmit, onCancel }: GoalFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      description: initialData?.description ?? '',
      targetAmount: initialData?.targetAmount ?? 0,
      currentAmount: initialData?.currentAmount ?? 0,
      deadline: initialData?.deadline
        ? new Date(initialData.deadline).toISOString().split('T')[0]
        : '',
      icon: initialData?.icon ?? 'target',
      color: initialData?.color ?? '#10b981',
    },
  })

  const selectedColor = watch('color')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Nome da meta"
        placeholder="Ex: Reserva de emergência"
        error={errors.name?.message}
        {...register('name')}
      />

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Descrição <span className="text-slate-400 font-normal">(opcional)</span>
        </label>
        <textarea
          rows={2}
          placeholder="Descreva sua meta..."
          className="input-base resize-none"
          {...register('description')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Valor alvo (R$)</label>
          <input
            type="number"
            step="0.01"
            min="1"
            placeholder="0,00"
            className="input-base"
            {...register('targetAmount', { valueAsNumber: true })}
          />
          {errors.targetAmount && (
            <p className="mt-1.5 text-xs text-rose-500">{errors.targetAmount.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Valor atual (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            className="input-base"
            {...register('currentAmount', { valueAsNumber: true })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Prazo <span className="text-slate-400 font-normal">(opcional)</span>
        </label>
        <input type="date" className="input-base" {...register('deadline')} />
      </div>

      {/* Color picker */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Cor</label>
        <div className="flex gap-2 flex-wrap">
          {GOAL_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setValue('color', color)}
              className="w-7 h-7 rounded-full transition-transform hover:scale-110 ring-offset-2"
              style={{
                background: color,
                boxShadow: selectedColor === color ? `0 0 0 2px white, 0 0 0 4px ${color}` : 'none',
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" loading={isSubmitting}>
          {initialData ? 'Atualizar meta' : 'Criar meta'}
        </Button>
      </div>
    </form>
  )
}
