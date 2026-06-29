'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { registerSchema } from '@/lib/validators'
import { useAuth } from '@/hooks/use-auth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type FormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const { register: registerUser } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      await registerUser(data.name, data.email, data.password)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Criar conta</h2>
        <p className="text-slate-500 mt-2">
          Comece a controlar suas finanças gratuitamente
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600">
            {error}
          </div>
        )}

        <Input
          label="Nome completo"
          type="text"
          placeholder="João Silva"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="E-mail"
          type="email"
          placeholder="seu@email.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        <div>
          <Input
            label="Senha"
            type={showPassword ? 'text' : 'password'}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            error={errors.password?.message}
            hint="Use pelo menos 8 caracteres, uma letra maiúscula e um número"
            rightIcon={
              <button type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            {...register('password')}
          />
        </div>

        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Criar conta grátis
        </Button>

        <p className="text-xs text-slate-400 text-center">
          Ao criar uma conta você concorda com os nossos{' '}
          <span className="text-brand-600 cursor-pointer">Termos de Uso</span> e{' '}
          <span className="text-brand-600 cursor-pointer">Política de Privacidade</span>.
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Já tem uma conta?{' '}
        <Link href="/login" className="text-brand-600 hover:text-brand-700 font-medium">
          Entrar
        </Link>
      </p>
    </div>
  )
}
