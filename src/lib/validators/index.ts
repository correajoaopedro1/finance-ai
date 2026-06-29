import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().email('E-mail inválido'),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
})

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
})

export const transactionSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória').max(255),
  amount: z.number().positive('Valor deve ser positivo'),
  type: z.enum(['INCOME', 'EXPENSE']),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  categoryId: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  isRecurring: z.boolean().optional().default(false),
  recurringFreq: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional().nullable(),
})

export const categorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(50),
  icon: z.string().default('tag'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida').default('#6366f1'),
  type: z.enum(['INCOME', 'EXPENSE', 'BOTH']),
})

export const budgetSchema = z.object({
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  amount: z.number().positive('Valor deve ser positivo'),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
  alertAt: z.number().int().min(1).max(100).default(80),
})

export const goalSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  description: z.string().max(500).optional().nullable(),
  targetAmount: z.number().positive('Valor deve ser positivo'),
  currentAmount: z.number().min(0).optional().default(0),
  deadline: z.string().datetime().optional().nullable(),
  icon: z.string().default('target'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida').default('#10b981'),
})

export const goalUpdateSchema = goalSchema.partial().extend({
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
})

export const aiChatSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1, 'Mensagem é obrigatória').max(2000),
})
