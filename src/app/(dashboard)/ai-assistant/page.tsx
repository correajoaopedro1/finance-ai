'use client'

import { useState, useCallback } from 'react'
import useSWR from 'swr'
import { Plus, MessageSquare, Trash2, Bot } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { ChatInterface } from '@/components/ai/chat-interface'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const fetcher = (url: string) => fetch(url).then((r) => r.json().then((j) => j.data))

interface Conversation {
  id: string
  title: string
  updatedAt: string
  _count: { messages: number }
}

export default function AIAssistantPage() {
  const [activeConvId, setActiveConvId] = useState<string | undefined>()
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const { data: conversations = [], mutate } = useSWR<Conversation[]>(
    '/api/ai/conversations',
    fetcher
  )

  const handleNewConversation = useCallback(() => {
    setActiveConvId(undefined)
  }, [])

  const handleConversationCreated = useCallback(
    (id: string) => {
      setActiveConvId(id)
      mutate()
    },
    [mutate]
  )

  const handleDelete = async (id: string) => {
    await fetch(`/api/ai/conversations/${id}`, { method: 'DELETE' })
    toast.success('Conversa excluída')
    if (activeConvId === id) setActiveConvId(undefined)
    setConfirmDelete(null)
    mutate()
  }

  return (
    <>
      <Header
        title="Assistente Financeiro IA"
        subtitle="Converse sobre suas finanças em linguagem natural"
      />

      <div className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 4rem)' }}>
        {/* Sidebar — conversation list */}
        <div className="w-64 shrink-0 border-r border-slate-200 bg-white flex flex-col">
          <div className="p-3 border-b border-slate-100">
            <Button className="w-full" size="sm" onClick={handleNewConversation}>
              <Plus className="w-4 h-4" />
              Nova conversa
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.length === 0 ? (
              <div className="py-8 text-center">
                <Bot className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Nenhuma conversa ainda</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    'group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors',
                    activeConvId === conv.id
                      ? 'bg-brand-50 text-brand-700'
                      : 'hover:bg-slate-50 text-slate-600'
                  )}
                  onClick={() => setActiveConvId(conv.id)}
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{conv.title}</p>
                    <p className="text-[10px] text-slate-400">
                      {conv._count.messages} msgs · {formatDateTime(conv.updatedAt).slice(0, 10)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setConfirmDelete(conv.id)
                    }}
                    className="p-1 rounded text-slate-300 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatInterface
            conversationId={activeConvId}
            onConversationCreated={handleConversationCreated}
          />
        </div>
      </div>

      {/* Delete confirm modal (simple inline) */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white rounded-xl shadow-float p-6 max-w-sm w-full animate-slide-up">
            <h3 className="font-semibold text-slate-900 mb-2">Excluir conversa?</h3>
            <p className="text-sm text-slate-500 mb-4">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setConfirmDelete(null)}>
                Cancelar
              </Button>
              <Button variant="danger" className="flex-1" onClick={() => handleDelete(confirmDelete)}>
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
