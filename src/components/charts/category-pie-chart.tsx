'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface CategoryData {
  name: string
  color: string
  amount: number
}

interface CategoryPieChartProps {
  data: CategoryData[]
  totalExpenses: number
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-float p-3 text-sm">
      <p className="font-semibold text-slate-800">{item.name}</p>
      <p className="text-slate-600 mt-1">{formatCurrency(item.value)}</p>
      <p className="text-slate-400 text-xs">{item.payload.percentage?.toFixed(1)}% do total</p>
    </div>
  )
}

const CustomLegend = ({ payload }: any) => (
  <div className="space-y-1.5 mt-3">
    {payload?.slice(0, 6).map((entry: any) => (
      <div key={entry.value} className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: entry.color }} />
          <span className="text-slate-600 truncate max-w-[120px]">{entry.value}</span>
        </div>
        <span className="text-slate-500 font-medium ml-2">
          {entry.payload.percentage?.toFixed(0)}%
        </span>
      </div>
    ))}
  </div>
)

export function CategoryPieChart({ data, totalExpenses }: CategoryPieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-slate-400">
        Nenhum gasto este mês
      </div>
    )
  }

  const chartData = data.map((d) => ({
    ...d,
    percentage: totalExpenses > 0 ? (d.amount / totalExpenses) * 100 : 0,
  }))

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            dataKey="amount"
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <CustomLegend
        payload={chartData.map((d) => ({
          value: d.name,
          color: d.color,
          payload: d,
        }))}
      />
    </div>
  )
}
