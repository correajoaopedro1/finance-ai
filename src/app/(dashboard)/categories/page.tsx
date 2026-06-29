'use client'

import { useState } from 'react'
import { Plus, Trash2, Tag, Lock } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { useCategories } from '@/hooks/use-categories'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981',
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#ec4899', '#f43f5e', '#64748b',
]

const ICONS = [
  'tag', 'utensils', 'car', 'home', 'heart-pulse', 'graduation-cap',
  'gamepad-2', 'shirt', 'wrench', 'laptop', 'sparkles', 'plane',
  'briefcase', 'trending-up', 'shopping-bag', 'gift', 'coffee',
]

export default function CategoriesPage() {
  const { categories, createCategory, deleteCategory } = useCategories()
  const [showAdd, setShowAdd] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('ALL')

  // Form state
  const [form, setForm] = useState({ name: '', color: '#6366f1', type: 'EXPENSE', icon: 'tag' })
  const [loading, setLoading] = useState(false)

  const filtered = categories.filter((c) =>
    typeFilter === 'ALL' || c.type === typeFilter || c.type === 'BOTH'
  )

  const systemCats = filtered.filter((c) => c.isSystem)
  const userCats = filtered.filter((c) => !c.isSystem)

  const handleCreate = async () => {
    if (!form.name.trim()) return toast.error('Nome é obrigatório')
    setLoading(true)
    try {
      await createCategory(form as any)
      setShowAdd(false)
      setForm({ name: '', color: '#6366f1', type: 'EXPENSE', icon: 'tag' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header title="Categorias" subtitle="Organize seus gastos por categorias personalizadas" />

      <div className="flex-1 p-6 space-y-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white">
            {(['ALL', 'EXPENSE', 'INCOME'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={cn(
                  'px-4 py-1.5 text-sm font-medium transition-colors',
                  typeFilter === t ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-50'
                )}
              >
                {t === 'ALL' ? 'Todas' : t === 'INCOME' ? 'Receitas' : 'Despesas'}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4" />
            Nova categoria
          </Button>
        </div>

        {/* User categories */}
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Minhas categorias ({userCats.length})
          </h3>
          {userCats.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 py-10 text-center">
              <Tag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Você ainda não criou nenhuma categoria</p>
              <Button className="mt-3" size="sm" onClick={() => setShowAdd(true)}>
                <Plus className="w-4 h-4" />
                Criar categoria
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {userCats.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between group hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${cat.color}20` }}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{cat.name}</p>
                      <Badge variant={cat.type === 'INCOME' ? 'success' : 'danger'} size="sm">
                        {cat.type === 'INCOME' ? 'Receita' : 'Despesa'}
                      </Badge>
                    </div>
                  </div>
                  <button
                    onClick={() => setConfirmDelete(cat.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System categories */}
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5" />
            Categorias do sistema ({systemCats.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {systemCats.map((cat) => (
              <div
                key={cat.id}
                className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 opacity-75"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${cat.color}20` }}
                >
                  <div className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{cat.name}</p>
                  <Badge variant={cat.type === 'INCOME' ? 'success' : 'danger'} size="sm">
                    {cat.type === 'INCOME' ? 'Receita' : 'Despesa'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add modal */}
      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="Nova Categoria"
        description="Crie uma categoria personalizada"
      >
        <div className="space-y-4">
          <Input
            label="Nome"
            placeholder="Ex: Academia, Streaming..."
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <div>
            <label className="label-base">Tipo</label>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              {(['EXPENSE', 'INCOME'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type: t })}
                  className={cn(
                    'flex-1 py-2 text-sm font-medium transition-colors',
                    form.type === t
                      ? t === 'INCOME' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                      : 'text-slate-500 hover:bg-slate-50'
                  )}
                >
                  {t === 'INCOME' ? 'Receita' : 'Despesa'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label-base">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm({ ...form, color })}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                  style={{
                    background: color,
                    boxShadow: form.color === color ? `0 0 0 2px white, 0 0 0 4px ${color}` : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowAdd(false)}>
              Cancelar
            </Button>
            <Button className="flex-1" loading={loading} onClick={handleCreate}>
              Criar categoria
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Excluir Categoria"
        description="As transações vinculadas perderão a categoria. Continuar?"
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
                await deleteCategory(confirmDelete)
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
