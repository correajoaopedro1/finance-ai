'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tag,
  Wallet,
  Target,
  Bot,
  LogOut,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transações', icon: ArrowLeftRight },
  { href: '/categories', label: 'Categorias', icon: Tag },
  { href: '/budgets', label: 'Orçamentos', icon: Wallet },
  { href: '/goals', label: 'Metas', icon: Target },
  { href: '/ai-assistant', label: 'Assistente IA', icon: Bot, highlight: true },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-slate-900 flex flex-col transition-all duration-300 z-30',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-slate-800')}>
        <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shrink-0">
          <TrendingUp className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <span className="font-bold text-white text-base tracking-tight">FinanceAI</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, highlight }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? highlight
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200',
                highlight && !active && 'text-brand-400 hover:text-brand-300',
                collapsed && 'justify-center'
              )}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
              {!collapsed && highlight && (
                <span className="ml-auto text-[10px] bg-brand-500/20 text-brand-400 px-1.5 py-0.5 rounded-full font-semibold">
                  IA
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800 px-2 py-3 space-y-0.5">
        {/* User */}
        {!collapsed && user && (
          <div className="px-3 py-2.5 mb-1">
            <p className="text-sm font-medium text-slate-200 truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400',
            'hover:bg-slate-800 hover:text-slate-200 transition-colors w-full',
            collapsed && 'justify-center'
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 shrink-0" />
              <span>Recolher</span>
            </>
          )}
        </button>

        <button
          onClick={logout}
          title={collapsed ? 'Sair' : undefined}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400',
            'hover:bg-rose-900/40 hover:text-rose-400 transition-colors w-full',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  )
}
