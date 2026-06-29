export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, apiSuccess, apiError } from '@/lib/api'

interface Params {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: Params) {
  const context = getAuthContext(request)
  if (!context) return apiError('Não autorizado', 401)

  const conversation = await prisma.aiConversation.findFirst({
    where: { id: params.id, userId: context.userId },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!conversation) return apiError('Conversa não encontrada', 404)

  return apiSuccess(conversation)
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const context = getAuthContext(request)
  if (!context) return apiError('Não autorizado', 401)

  const conversation = await prisma.aiConversation.findFirst({
    where: { id: params.id, userId: context.userId },
  })
  if (!conversation) return apiError('Conversa não encontrada', 404)

  await prisma.aiConversation.delete({ where: { id: params.id } })

  return apiSuccess({ message: 'Conversa excluída com sucesso' })
}
