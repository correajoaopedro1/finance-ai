'use client'

import useSWR from 'swr'
import type { DashboardSummary } from '@/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json().then((j) => j.data))

export function useDashboard(month?: number, year?: number) {
  const now = new Date()
  const m = month ?? now.getMonth() + 1
  const y = year ?? now.getFullYear()

  const { data, isLoading, error, mutate } = useSWR<DashboardSummary>(
    `/api/dashboard/summary?month=${m}&year=${y}`,
    fetcher,
    { refreshInterval: 30000 }
  )

  return { summary: data, isLoading, error, mutate }
}
