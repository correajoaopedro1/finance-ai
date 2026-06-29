'use client'

import { useState, useEffect } from 'react'
import { Bell, Search, ChevronDown, Download } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { getInitials, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface Alert {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [showAlerts, setShowAlerts] = useState(false)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    fetch('/api/alerts')
      .then((r) => r.json())
      .then((j) => {
        if (j.data) {
          setAlerts(j.data)
          setUnread(j.data.filter((a: Alert) => !a.isRead).length)
        }
      })
      .catch(() => null)
  }, [])

  const markAllRead = async () => {
    await fetch('/api/alerts/read-all', { method: 'POST' })
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })))
    setUnread(0)
  }

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {showAlerts && (
            <div className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-float border border-slate-200 z-50 animate-slide-up">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <span className="font-semibold text-slate-900 text-sm">Notificações</span>
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-400">
                    Nenhuma notificação
                  </div>
                ) : (
                  alerts.slice(0, 10).map((alert) => (
                    <div
                      key={alert.id}
                      className={cn(
                        'px-4 py-3 border-b border-slate-50 last:border-0',
                        !alert.isRead && 'bg-brand-50/50'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {!alert.isRead && (
                          <div className="w-2 h-2 bg-brand-500 rounded-full mt-1.5 shrink-0" />
                        )}
                        <div className={!alert.isRead ? '' : 'pl-4'}>
                          <p className="text-sm font-medium text-slate-800">{alert.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{alert.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{formatDate(alert.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        {user && (
          <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
            <div className="w-8 h-8 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-sm font-semibold">
              {getInitials(user.name)}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-800 leading-tight">{user.name.split(' ')[0]}</p>
              <Badge variant="info" size="sm">{user.plan}</Badge>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
