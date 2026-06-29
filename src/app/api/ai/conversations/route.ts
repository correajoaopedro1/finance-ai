export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, apiSuccess, apiError } from '@/lib/api'

export async function GET(request: NextRequest) {
  const context = getAuthContext(request)
  if (!context) return apiError('Não autorizado', 401)

  const conversations = await prisma.aiConversation.findMany({
    where: { userId: context.userId },
    orderBy: { updatedAt: 'desc' },
    take: 30,
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
  })

  return apiSuccess(conversations)
}

export async function POST(request: NextRequest) {
  const context = getAuthContext(request)
  if (!context) return apiError('Não autorizado', 401)

  const conversation = await prisma.aiConversation.create({
    data: {
      userId: context.userId,
      title: 'Nova conversa',
    },
  })

  return apiSuccess(conversation, 201)
}
