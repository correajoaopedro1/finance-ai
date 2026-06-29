import { prisma } from '@/lib/db'
import { formatCurrency } from '@/lib/utils'

export async function buildFinancialContext(userId: string): Promise<string> {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const threeMonthsAgo = new Date(now)
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const [currentMonthTxs, recentTxs, budgets, goals] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: new Date(currentYear, currentMonth - 1, 1),
          lt: new Date(currentYear, currentMonth, 1),
        },
      },
      include: { category: true },
      orderBy: { date: 'desc' },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: threeMonthsAgo },
      },
      include: { category: true },
      orderBy: { date: 'desc' },
      take: 100,
    }),
    prisma.budget.findMany({
      where: { userId, month: currentMonth, year: currentYear },
      include: { category: true },
    }),
    prisma.goal.findMany({
      where: { userId, status: 'ACTIVE' },
    }),
  ])

  const monthlyIncome = currentMonthTxs
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const monthlyExpenses = currentMonthTxs
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const savingsRate =
    monthlyIncome > 0
      ? (((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100).toFixed(1)
      : '0'

  const spendingByCategory = currentMonthTxs
    .filter((t) => t.type === 'EXPENSE')
    .reduce(
      (acc, t) => {
        const name = t.category?.name ?? 'Sem categoria'
        acc[name] = (acc[name] ?? 0) + Number(t.amount)
        return acc
      },
      {} as Record<string, number>
    )

  const sortedCategories = Object.entries(spendingByCategory).sort(([, a], [, b]) => b - a)

  const budgetStatus = budgets.map((b) => {
    const spent = currentMonthTxs
      .filter((t) => t.categoryId === b.categoryId && t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const pct = Number(b.amount) > 0 ? (spent / Number(b.amount)) * 100 : 0
    return {
      category: b.category.name,
      limit: Number(b.amount),
      spent,
      pct: pct.toFixed(1),
      status: pct >= 100 ? '⚠️ EXCEDIDO' : pct >= 80 ? '⚠️ Próximo do limite' : '✅ Ok',
    }
  })

  const monthlyComparison = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(currentYear, currentMonth - 1 - i, 1)
    const start = new Date(d.getFullYear(), d.getMonth(), 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    const txs = recentTxs.filter((t) => t.date >= start && t.date < end)
    return {
      label: d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      income: txs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0),
      expenses: txs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0),
    }
  }).reverse()

  const lines: string[] = [
    `## Dados Financeiros do Usuário`,
    `**Data atual:** ${now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`,
    '',
    `### Resumo do Mês Atual (${new Date(currentYear, currentMonth - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })})`,
    `- Receitas totais: ${formatCurrency(monthlyIncome)}`,
    `- Despesas totais: ${formatCurrency(monthlyExpenses)}`,
    `- Saldo do mês: ${formatCurrency(monthlyIncome - monthlyExpenses)}`,
    `- Taxa de poupança: ${savingsRate}%`,
    '',
    '### Gastos por Categoria (Este Mês)',
  ]

  if (sortedCategories.length > 0) {
    sortedCategories.forEach(([cat, amount]) => {
      const pct = monthlyExpenses > 0 ? ((amount / monthlyExpenses) * 100).toFixed(1) : '0'
      lines.push(`- ${cat}: ${formatCurrency(amount)} (${pct}% das despesas)`)
    })
  } else {
    lines.push('- Nenhuma despesa registrada neste mês')
  }

  lines.push('', '### Status dos Orçamentos')
  if (budgetStatus.length > 0) {
    budgetStatus.forEach((b) => {
      lines.push(
        `- ${b.category}: ${formatCurrency(b.spent)} de ${formatCurrency(b.limit)} (${b.pct}%) ${b.status}`
      )
    })
  } else {
    lines.push('- Nenhum orçamento configurado para este mês')
  }

  lines.push('', '### Metas Financeiras Ativas')
  if (goals.length > 0) {
    goals.forEach((g) => {
      const pct = ((Number(g.currentAmount) / Number(g.targetAmount)) * 100).toFixed(1)
      const deadline = g.deadline
        ? ` | Prazo: ${new Date(g.deadline).toLocaleDateString('pt-BR')}`
        : ''
      lines.push(
        `- ${g.name}: ${formatCurrency(Number(g.currentAmount))} / ${formatCurrency(Number(g.targetAmount))} (${pct}%${deadline})`
      )
    })
  } else {
    lines.push('- Nenhuma meta ativa')
  }

  lines.push('', '### Comparativo Últimos 3 Meses')
  monthlyComparison.forEach((m) => {
    const balance = m.income - m.expenses
    lines.push(
      `- ${m.label}: Receitas ${formatCurrency(m.income)} | Despesas ${formatCurrency(m.expenses)} | Saldo ${balance >= 0 ? '+' : ''}${formatCurrency(balance)}`
    )
  })

  lines.push('', '### Últimas 15 Transações')
  recentTxs.slice(0, 15).forEach((t) => {
    const sign = t.type === 'INCOME' ? '+' : '-'
    const cat = t.category?.name ?? 'Sem categoria'
    lines.push(
      `- ${new Date(t.date).toLocaleDateString('pt-BR')}: ${t.description} | ${cat} | ${sign}${formatCurrency(Number(t.amount))}`
    )
  })

  return lines.join('\n')
}
