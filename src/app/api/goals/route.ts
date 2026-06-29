import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, apiSuccess, apiError, handleApiError } from '@/lib/api'
import { goalSchema } from '@/lib/validators'

export async function GET(request: NextRequest) {
  const context = getAuthContext(request)
  if (!context) return apiError('Não autorizado', 401)

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') ?? 'ACTIVE'

  const goals = await prisma.goal.findMany({
    where: {
      userId: context.userId,
      ...(status !== 'ALL' && { status: status as 'ACTIVE' | 'COMPLETED' | 'CANCELLED' }),
    },
    orderBy: { createdAt: 'desc' },
  })

  const goalsWithProgress = goals.map((g) => ({
    ...g,
    targetAmount: Number(g.targetAmount),
    currentAmount: Number(g.currentAmount),
    progress:
      Number(g.targetAmount) > 0
        ? Math.min(100, (Number(g.currentAmount) / Number(g.targetAmount)) * 100)
        : 0,
  }))

  return apiSuccess(goalsWithProgress)
}

export async function POST(request: NextRequest) {
  try {
    const context = getAuthContext(request)
    if (!context) return apiError('Não autorizado', 401)

    const body = await request.json()
    const data = goalSchema.parse(body)

    const goal = await prisma.goal.create({
      data: {
        userId: context.userId,
        name: data.name,
        description: data.description ?? null,
        targetAmount: data.targetAmount,
        currentAmount: data.currentAmount ?? 0,
        deadline: data.deadline ? new Date(data.deadline) : null,
        icon: data.icon,
        color: data.color,
      },
    })

    return apiSuccess(
      {
        ...goal,
        targetAmount: Number(goal.targetAmount),
        currentAmount: Number(goal.currentAmount),
        progress: 0,
      },
      201
    )
  } catch (error) {
    return handleApiError(error)
  }
}
