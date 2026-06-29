export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, apiSuccess, apiError, handleApiError } from '@/lib/api'
import { goalUpdateSchema } from '@/lib/validators'

interface Params {
  params: { id: string }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const context = getAuthContext(request)
    if (!context) return apiError('Não autorizado', 401)

    const existing = await prisma.goal.findFirst({
      where: { id: params.id, userId: context.userId },
    })
    if (!existing) return apiError('Meta não encontrada', 404)

    const body = await request.json()
    const data = goalUpdateSchema.parse(body)

    const goal = await prisma.goal.update({
      where: { id: params.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.targetAmount !== undefined && { targetAmount: data.targetAmount }),
        ...(data.currentAmount !== undefined && { currentAmount: data.currentAmount }),
        ...(data.deadline !== undefined && {
          deadline: data.deadline ? new Date(data.deadline) : null,
        }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.color !== undefined && { color: data.color }),
      },
    })

    const target = Number(goal.targetAmount)
    const current = Number(goal.currentAmount)

    // Auto-complete if goal is reached
    if (current >= target && goal.status === 'ACTIVE') {
      await prisma.goal.update({ where: { id: params.id }, data: { status: 'COMPLETED' } })
      await prisma.alert.create({
        data: {
          userId: context.userId,
          type: 'GOAL_MILESTONE',
          title: `🎉 Meta atingida: ${goal.name}`,
          message: `Parabéns! Você atingiu sua meta de R$ ${target.toFixed(2)}.`,
          metadata: { goalId: params.id },
        },
      })
    }

    return apiSuccess({
      ...goal,
      targetAmount: target,
      currentAmount: current,
      progress: target > 0 ? Math.min(100, (current / target) * 100) : 0,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const context = getAuthContext(request)
  if (!context) return apiError('Não autorizado', 401)

  const existing = await prisma.goal.findFirst({
    where: { id: params.id, userId: context.userId },
  })
  if (!existing) return apiError('Meta não encontrada', 404)

  await prisma.goal.delete({ where: { id: params.id } })

  return apiSuccess({ message: 'Meta excluída com sucesso' })
}
