import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, apiSuccess, apiError } from '@/lib/api'

export async function POST(request: NextRequest) {
  const context = getAuthContext(request)
  if (!context) return apiError('Não autorizado', 401)

  await prisma.alert.updateMany({
    where: { userId: context.userId, isRead: false },
    data: { isRead: true },
  })

  return apiSuccess({ message: 'Alertas marcados como lidos' })
}
