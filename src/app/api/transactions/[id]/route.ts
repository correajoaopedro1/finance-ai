export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, apiSuccess, apiError, handleApiError } from '@/lib/api'
import { transactionSchema } from '@/lib/validators'

interface Params {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: Params) {
  const context = getAuthContext(request)
  if (!context) return apiError('Não autorizado', 401)

  const transaction = await prisma.transaction.findFirst({
    where: { id: params.id, userId: context.userId },
    include: { category: true },
  })

  if (!transaction) return apiError('Transação não encontrada', 404)

  return apiSuccess(transaction)
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const context = getAuthContext(request)
    if (!context) return apiError('Não autorizado', 401)

    const existing = await prisma.transaction.findFirst({
      where: { id: params.id, userId: context.userId },
    })
    if (!existing) return apiError('Transação não encontrada', 404)

    const body = await request.json()
    const data = transactionSchema.partial().parse(body)

    const transaction = await prisma.transaction.update({
      where: { id: params.id },
      data: {
        ...(data.description !== undefined && { description: data.description }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.date !== undefined && { date: new Date(data.date) }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.isRecurring !== undefined && { isRecurring: data.isRecurring }),
        ...(data.recurringFreq !== undefined && { recurringFreq: data.recurringFreq }),
      },
      include: { category: true },
    })

    return apiSuccess(transaction)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const context = getAuthContext(request)
  if (!context) return apiError('Não autorizado', 401)

  const existing = await prisma.transaction.findFirst({
    where: { id: params.id, userId: context.userId },
  })
  if (!existing) return apiError('Transação não encontrada', 404)

  await prisma.transaction.delete({ where: { id: params.id } })

  return apiSuccess({ message: 'Transação excluída com sucesso' })
}
