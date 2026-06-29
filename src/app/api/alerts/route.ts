import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, apiError } from '@/lib/api'

export async function GET(request: NextRequest) {
  const context = getAuthContext(request)
  if (!context) return apiError('Não autorizado', 401)

  const alerts = await prisma.alert.findMany({
    where: { userId: context.userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return NextResponse.json({ data: alerts })
}
