export type Plan = 'FREE' | 'PRO' | 'ENTERPRISE'
export type CategoryType = 'INCOME' | 'EXPENSE' | 'BOTH'
export type TransactionType = 'INCOME' | 'EXPENSE'
export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
export type AlertType = 'BUDGET_WARNING' | 'BUDGET_EXCEEDED' | 'GOAL_MILESTONE' | 'UNUSUAL_SPENDING' | 'MONTHLY_SUMMARY'

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
  plan: Plan
  currency: string
  monthlyIncomeGoal?: number
  createdAt: string
}

export interface Category {
  id: string
  userId?: string
  name: string
  icon: string
  color: string
  type: CategoryType
  isSystem: boolean
  createdAt: string
}

export interface Transaction {
  id: string
  userId: string
  categoryId?: string
  category?: Category
  description: string
  amount: number
  type: TransactionType
  date: string
  notes?: string
  tags: string[]
  isRecurring: boolean
  recurringFreq?: string
  createdAt: string
  updatedAt: string
}

export interface Budget {
  id: string
  userId: string
  categoryId: string
  category: Category
  amount: number
  month: number
  year: number
  alertAt: number
  spent?: number
  percentage?: number
  createdAt: string
  updatedAt: string
}

export interface Goal {
  id: string
  userId: string
  name: string
  description?: string
  targetAmount: number
  currentAmount: number
  deadline?: string
  status: GoalStatus
  icon: string
  color: string
  progress?: number
  createdAt: string
  updatedAt: string
}

export interface Alert {
  id: string
  userId: string
  type: AlertType
  title: string
  message: string
  isRead: boolean
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface AiConversation {
  id: string
  userId: string
  title: string
  messages?: AiMessage[]
  createdAt: string
  updatedAt: string
}

export interface AiMessage {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  tokensUsed?: number
  createdAt: string
}

export interface DashboardSummary {
  period: { month: number; year: number }
  metrics: {
    balance: number
    income: number
    expenses: number
    savings: number
    savingsRate: number
    comparison: {
      income: { current: number; previous: number; change: number }
      expenses: { current: number; previous: number; change: number }
    }
  }
  charts: {
    cashFlow: Array<{ month: string; income: number; expenses: number }>
    categorySpending: Array<{ name: string; color: string; amount: number }>
  }
  budgets: Array<{
    id: string
    categoryName: string
    categoryColor: string
    limit: number
    spent: number
    percentage: number
  }>
  goals: Goal[]
  recentTransactions: Transaction[]
}

export interface ApiResponse<T> {
  data: T
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}
