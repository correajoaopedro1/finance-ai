import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getAuthContext, apiSuccess, apiError, handleApiError } from '@/lib/api'
import { transactionSchema } from '@/lib/validators'

export async function GET(request: NextRequest) {
  const context = getAuthContext(request)
  if (!context) return apiError('Não autorizado', 401)

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') as 'INCOME' | 'EXPENSE' | null
  const categoryId = searchParams.get('categoryId')
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  const search = searchParams.get('search')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))

  const where: Prisma.TransactionWhereInput = {
    userId: context.userId,
    ...(type && { type }),
    ...(categoryId && { categoryId }),
    ...(dateFrom || dateTo
      ? {
          date: {
            ...(dateFrom && { gte: new Date(dateFrom) }),
            ...(dateTo && { lte: new Date(dateTo + 'T23:59:59.999Z') }),
          },
        }
      : {}),
    ...(search && {
      description: { contains: search, mode: Prisma.QueryMode.insensitive },
    }),
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ])

  return NextResponse.json({
    data: transactions,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}

export async function POST(request: NextRequest) {
  try {
    const context = getAuthContext(request)
    if (!context) return apiError('Não autorizado', 401)

    const body = await request.json()
    const data = transactionSchema.parse(body)

    const transaction = await prisma.transaction.create({
      data: {
        userId: context.userId,
        description: data.description,
        amount: data.amount,
        type: data.type,
        date: new Date(data.date),
        categoryId: data.categoryId ?? null,
        notes: data.notes ?? null,
        tags: data.tags ?? [],
        isRecurring: data.isRecurring ?? false,
        recurringFreq: data.recurringFreq ?? null,
      },
      include: { category: true },
    })

    // Check budget alerts for expenses
    if (data.type === 'EXPENSE' && data.categoryId) {
      await checkBudgetAlert(context.userId, data.categoryId, transaction.date)
    }

    return apiSuccess(transaction, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

async function checkBudgetAlert(userId: string, categoryId: string, date: Date) {
  const month = date.getMonth() + 1
  const year = date.getFullYear()

  const budget = await prisma.budget.findUnique({
    where: { userId_categoryId_month_year: { userId, categoryId, month, year } },
    include: { category: true },
  })

  if (!budget) return

  const spent = await prisma.transaction.aggregate({
    where: {
      userId,
      categoryId,
      type: 'EXPENSE',
      date: {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      },
    },
    _sum: { amount: true },
  })

  const totalSpent = Number(spent._sum.amount ?? 0)
  const limit = Number(budget.amount)
  const pct = (totalSpent / limit) * 100

  if (pct >= 100) {
    await prisma.alert.create({
      data: {
        userId,
        type: 'BUDGET_EXCEEDED',
        title: `Orçamento excedido: ${budget.category.name}`,
        message: `Você ultrapassou o limite de R$ ${limit.toFixed(2)} em ${budget.category.name}. Gasto atual: R$ ${totalSpent.toFixed(2)}.`,
        metadata: { categoryId, budgetId: budget.id, spent: totalSpent, limit },
      },
    })
  } else if (pct >= budget.alertAt) {
    await prisma.alert.create({
      data: {
        userId,
        type: 'BUDGET_WARNING',
        title: `Atenção: orçamento de ${budget.category.name}`,
        message: `Você já utilizou ${pct.toFixed(0)}% do orçamento de ${budget.category.name}. Limite: R$ ${limit.toFixed(2)}.`,
        metadata: { categoryId, budgetId: budget.id, spent: totalSpent, limit, percentage: pct },
      },
    })
  }
}
