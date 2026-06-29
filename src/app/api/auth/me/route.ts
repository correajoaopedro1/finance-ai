export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, apiSuccess, apiError } from '@/lib/api'

export async function GET(request: NextRequest) {
  const context = getAuthContext(request)
  if (!context) return apiError('Não autorizado', 401)

  const user = await prisma.user.findUnique({
    where: { id: context.userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      plan: true,
      currency: true,
      monthlyIncomeGoal: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!user) return apiError('Usuário não encontrado', 404)

  return apiSuccess({ user })
}

export async function PATCH(request: NextRequest) {
  const context = getAuthContext(request)
  if (!context) return apiError('Não autorizado', 401)

  const body = await request.json()
  const { name, currency, monthlyIncomeGoal } = body

  const user = await prisma.user.update({
    where: { id: context.userId },
    data: {
      ...(name && { name }),
      ...(currency && { currency }),
      ...(monthlyIncomeGoal !== undefined && {
        monthlyIncomeGoal: monthlyIncomeGoal ? Number(monthlyIncomeGoal) : null,
      }),
    },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      plan: true,
      currency: true,
      monthlyIncomeGoal: true,
      updatedAt: true,
    },
  })

  return apiSuccess({ user })
}
