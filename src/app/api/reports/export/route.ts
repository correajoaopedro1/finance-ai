import { NextRequest, NextResponse } from 'next/server'
import Papa from 'papaparse'
import { prisma } from '@/lib/db'
import { getAuthContext, apiError } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const context = getAuthContext(request)
  if (!context) return apiError('Não autorizado', 401)

  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') ?? 'csv'
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  const type = searchParams.get('type') as 'INCOME' | 'EXPENSE' | null

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: context.userId,
      ...(type && { type }),
      ...(dateFrom || dateTo
        ? {
            date: {
              ...(dateFrom && { gte: new Date(dateFrom) }),
              ...(dateTo && { lte: new Date(dateTo + 'T23:59:59.999Z') }),
            },
          }
        : {}),
    },
    include: { category: true },
    orderBy: { date: 'desc' },
  })

  if (format === 'csv') {
    const rows = transactions.map((t) => ({
      Data: formatDate(t.date),
      Descrição: t.description,
      Tipo: t.type === 'INCOME' ? 'Receita' : 'Despesa',
      Categoria: t.category?.name ?? 'Sem categoria',
      Valor: Number(t.amount).toFixed(2),
      Notas: t.notes ?? '',
    }))

    const csv = Papa.unparse(rows, { delimiter: ';' })

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="financas-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  }

  // JSON fallback (PDF generation is handled client-side)
  const summary = {
    totalIncome: transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((s, t) => s + Number(t.amount), 0),
    totalExpenses: transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((s, t) => s + Number(t.amount), 0),
    count: transactions.length,
  }

  return NextResponse.json({
    data: {
      transactions: transactions.map((t) => ({
        ...t,
        amount: Number(t.amount),
        amountFormatted: formatCurrency(Number(t.amount)),
        dateFormatted: formatDate(t.date),
      })),
      summary,
    },
  })
}
