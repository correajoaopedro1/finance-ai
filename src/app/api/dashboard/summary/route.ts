import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, apiError } from '@/lib/api'

export async function GET(request: NextRequest) {
  const context = getAuthContext(request)
  if (!context) return apiError('Não autorizado', 401)

  const { searchParams } = new URL(request.url)
  const now = new Date()
  const month = parseInt(searchParams.get('month') ?? String(now.getMonth() + 1))
  const year = parseInt(searchParams.get('year') ?? String(now.getFullYear()))

  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 1)
  const prevMonthStart = new Date(year, month - 2, 1)
  const prevMonthEnd = new Date(year, month - 1, 1)
  const sixMonthsAgo = new Date(year, month - 7, 1)

  const [currentTxs, prevTxs, budgets, goals, historicalTxs, unreadAlerts] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: context.userId, date: { gte: monthStart, lt: monthEnd } },
      include: { category: true },
    }),
    prisma.transaction.findMany({
      where: { userId: context.userId, date: { gte: prevMonthStart, lt: prevMonthEnd } },
    }),
    prisma.budget.findMany({
      where: { userId: context.userId, month, year },
      include: { category: true },
    }),
    prisma.goal.findMany({
      where: { userId: context.userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
      take: 4,
    }),
    prisma.transaction.findMany({
      where: { userId: context.userId, date: { gte: sixMonthsAgo, lt: monthEnd } },
    }),
    prisma.alert.count({ where: { userId: context.userId, isRead: false } }),
  ])

  const income = sum(currentTxs.filter((t) => t.type === 'INCOME'))
  const expenses = sum(currentTxs.filter((t) => t.type === 'EXPENSE'))
  const prevIncome = sum(prevTxs.filter((t) => t.type === 'INCOME'))
  const prevExpenses = sum(prevTxs.filter((t) => t.type === 'EXPENSE'))

  const categorySpending = currentTxs
    .filter((t) => t.type === 'EXPENSE')
    .reduce(
      (acc, t) => {
        const key = t.categoryId ?? 'uncategorized'
        const name = t.category?.name ?? 'Sem categoria'
        const color = t.category?.color ?? '#94a3b8'
        if (!acc[key]) acc[key] = { name, color, amount: 0 }
        acc[key].amount += Number(t.amount)
        return acc
      },
      {} as Record<string, { name: string; color: string; amount: number }>
    )

  const cashFlow = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(year, month - 6 + i, 1)
    const dEnd = new Date(year, month - 5 + i, 1)
    const txs = historicalTxs.filter((t) => t.date >= d && t.date < dEnd)
    return {
      month: d.toLocaleDateString('pt-BR', { month: 'short' }),
      income: sum(txs.filter((t) => t.type === 'INCOME')),
      expenses: sum(txs.filter((t) => t.type === 'EXPENSE')),
    }
  })

  const budgetsWithSpent = budgets.map((b) => {
    const spent = currentTxs
      .filter((t) => t.categoryId === b.categoryId && t.type === 'EXPENSE')
      .reduce((s, t) => s + Number(t.amount), 0)
    const limit = Number(b.amount)
    return {
      id: b.id,
      categoryName: b.category.name,
      categoryColor: b.category.color,
      limit,
      spent,
      percentage: limit > 0 ? (spent / limit) * 100 : 0,
    }
  })

  return NextResponse.json({
    data: {
      period: { month, year },
      metrics: {
        income,
        expenses,
        balance: income - expenses,
        savings: income - expenses,
        savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0,
        comparison: {
          income: { current: income, previous: prevIncome, change: pctChange(income, prevIncome) },
          expenses: {
            current: expenses,
            previous: prevExpenses,
            change: pctChange(expenses, prevExpenses),
          },
        },
      },
      charts: {
        cashFlow,
        categorySpending: Object.values(categorySpending).sort((a, b) => b.amount - a.amount),
      },
      budgets: budgetsWithSpent,
      goals: goals.map((g) => ({
        ...g,
        targetAmount: Number(g.targetAmount),
        currentAmount: Number(g.currentAmount),
        progress:
          Number(g.targetAmount) > 0
            ? Math.min(100, (Number(g.currentAmount) / Number(g.targetAmount)) * 100)
            : 0,
      })),
      recentTransactions: currentTxs
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 5),
      unreadAlerts,
    },
  })
}

function sum(txs: Array<{ amount: unknown }>): number {
  return txs.reduce((s, t) => s + Number(t.amount), 0)
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}
