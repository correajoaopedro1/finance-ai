import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, apiSuccess, apiError, handleApiError } from '@/lib/api'
import { budgetSchema } from '@/lib/validators'

export async function GET(request: NextRequest) {
  const context = getAuthContext(request)
  if (!context) return apiError('Não autorizado', 401)

  const { searchParams } = new URL(request.url)
  const now = new Date()
  const month = parseInt(searchParams.get('month') ?? String(now.getMonth() + 1))
  const year = parseInt(searchParams.get('year') ?? String(now.getFullYear()))

  const budgets = await prisma.budget.findMany({
    where: { userId: context.userId, month, year },
    include: { category: true },
    orderBy: { category: { name: 'asc' } },
  })

  // Calculate spent amount for each budget
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 1)

  const budgetsWithSpent = await Promise.all(
    budgets.map(async (budget) => {
      const spent = await prisma.transaction.aggregate({
        where: {
          userId: context.userId,
          categoryId: budget.categoryId,
          type: 'EXPENSE',
          date: { gte: monthStart, lt: monthEnd },
        },
        _sum: { amount: true },
      })

      const spentAmount = Number(spent._sum.amount ?? 0)
      const limit = Number(budget.amount)

      return {
        ...budget,
        amount: limit,
        spent: spentAmount,
        percentage: limit > 0 ? (spentAmount / limit) * 100 : 0,
      }
    })
  )

  return NextResponse.json({ data: budgetsWithSpent })
}

export async function POST(request: NextRequest) {
  try {
    const context = getAuthContext(request)
    if (!context) return apiError('Não autorizado', 401)

    const body = await request.json()
    const data = budgetSchema.parse(body)

    const budget = await prisma.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId: context.userId,
          categoryId: data.categoryId,
          month: data.month,
          year: data.year,
        },
      },
      update: { amount: data.amount, alertAt: data.alertAt },
      create: {
        userId: context.userId,
        categoryId: data.categoryId,
        amount: data.amount,
        month: data.month,
        year: data.year,
        alertAt: data.alertAt,
      },
      include: { category: true },
    })

    return apiSuccess(budget, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
