import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, apiSuccess, apiError } from '@/lib/api'

interface Params {
  params: { id: string }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const context = getAuthContext(request)
  if (!context) return apiError('Não autorizado', 401)

  const budget = await prisma.budget.findFirst({
    where: { id: params.id, userId: context.userId },
  })
  if (!budget) return apiError('Orçamento não encontrado', 404)

  await prisma.budget.delete({ where: { id: params.id } })

  return apiSuccess({ message: 'Orçamento excluído com sucesso' })
}
