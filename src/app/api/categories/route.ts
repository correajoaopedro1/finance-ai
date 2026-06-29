import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, apiSuccess, apiError, handleApiError } from '@/lib/api'
import { categorySchema } from '@/lib/validators'

export async function GET(request: NextRequest) {
  const context = getAuthContext(request)
  if (!context) return apiError('Não autorizado', 401)

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') as 'INCOME' | 'EXPENSE' | 'BOTH' | null

  const categories = await prisma.category.findMany({
    where: {
      OR: [{ userId: context.userId }, { isSystem: true }],
      ...(type && { OR: [{ type }, { type: 'BOTH' }] }),
    },
    orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
  })

  return apiSuccess(categories)
}

export async function POST(request: NextRequest) {
  try {
    const context = getAuthContext(request)
    if (!context) return apiError('Não autorizado', 401)

    const body = await request.json()
    const data = categorySchema.parse(body)

    const category = await prisma.category.create({
      data: {
        userId: context.userId,
        name: data.name,
        icon: data.icon,
        color: data.color,
        type: data.type,
        isSystem: false,
      },
    })

    return apiSuccess(category, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
