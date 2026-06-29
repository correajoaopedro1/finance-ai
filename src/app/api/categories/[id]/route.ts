export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, apiSuccess, apiError, handleApiError } from '@/lib/api'
import { categorySchema } from '@/lib/validators'

interface Params {
  params: { id: string }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const context = getAuthContext(request)
    if (!context) return apiError('Não autorizado', 401)

    const category = await prisma.category.findFirst({
      where: { id: params.id, userId: context.userId, isSystem: false },
    })
    if (!category) return apiError('Categoria não encontrada', 404)

    const body = await request.json()
    const data = categorySchema.partial().parse(body)

    const updated = await prisma.category.update({
      where: { id: params.id },
      data,
    })

    return apiSuccess(updated)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const context = getAuthContext(request)
  if (!context) return apiError('Não autorizado', 401)

  const category = await prisma.category.findFirst({
    where: { id: params.id, userId: context.userId, isSystem: false },
  })
  if (!category) return apiError('Categoria não encontrada', 404)

  // Unlink transactions from this category before deleting
  await prisma.transaction.updateMany({
    where: { userId: context.userId, categoryId: params.id },
    data: { categoryId: null },
  })

  await prisma.category.delete({ where: { id: params.id } })

  return apiSuccess({ message: 'Categoria excluída com sucesso' })
}
