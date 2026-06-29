'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  TrendingUp,
  PieChart,
  AlertCircle,
  Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

interface ChatInterfaceProps {
  conversationId?: string
  onConversationCreated?: (id: string) => void
}

const SUGGESTED_QUESTIONS = [
  { icon: TrendingUp, text: 'Quanto gastei este mês comparado ao mês anterior?' },
  { icon: PieChart, text: 'Quais categorias consomem mais do meu orçamento?' },
  { icon: AlertCircle, text: 'Estou gastando mais do que ganho?' },
  { icon: Target, text: 'Como posso economizar mais para atingir minhas metas?' },
]

export function ChatInterface({ conversationId, onConversationCreated }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeConvId, setActiveConvId] = useState(conversationId)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (conversationId && conversationId !== activeConvId) {
      setActiveConvId(conversationId)
      loadConversation(conversationId)
    }
  }, [conversationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversation = async (id: string) => {
    const res = await fetch(`/api/ai/conversations/${id}`)
    if (!res.ok) return
    const json = await res.json()
    setMessages(
      json.data.messages.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
      }))
    )
  }

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text.trim(),
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        isStreaming: true,
      }

      setMessages((prev) => [...prev, userMessage, assistantMessage])
      setInput('')
      setIsLoading(true)

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }

      abortRef.current = new AbortController()

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: activeConvId,
            message: text.trim(),
          }),
          signal: abortRef.current.signal,
        })

        if (!res.ok) throw new Error('Erro na requisição')

        const reader = res.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) throw new Error('Stream não disponível')

        let fullContent = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))

          for (const line of lines) {
            const raw = line.replace('data: ', '').trim()
            if (raw === '[DONE]') break

            try {
              const parsed = JSON.parse(raw)

              if (parsed.type === 'meta' && parsed.conversationId) {
                setActiveConvId(parsed.conversationId)
                onConversationCreated?.(parsed.conversationId)
              }

              if (parsed.type === 'content') {
                fullContent += parsed.content
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessage.id
                      ? { ...m, content: fullContent, isStreaming: true }
                      : m
                  )
                )
              }

              if (parsed.type === 'error') {
                throw new Error(parsed.message)
              }
            } catch (parseErr) {
              // Skip malformed chunks
            }
          }
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id ? { ...m, isStreaming: false } : m
          )
        )
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id
                ? {
                    ...m,
                    content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
                    isStreaming: false,
                  }
                : m
            )
          )
        }
      } finally {
        setIsLoading(false)
      }
    },
    [activeConvId, isLoading, onConversationCreated]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {isEmpty ? (
          <div className="max-w-2xl mx-auto text-center pt-8">
            <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-brand-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Assistente Financeiro IA</h2>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed">
              Tenho acesso aos seus dados financeiros e posso responder perguntas, gerar análises e
              oferecer sugestões personalizadas para melhorar sua saúde financeira.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {SUGGESTED_QUESTIONS.map(({ icon: Icon, text }) => (
                <button
                  key={text}
                  onClick={() => sendMessage(text)}
                  className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-600
                             hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-700 transition-colors text-left"
                >
                  <Icon className="w-4 h-4 mt-0.5 shrink-0 text-brand-500" />
                  {text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3 max-w-3xl animate-fade-in',
                message.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1',
                  message.role === 'user'
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-800 text-white'
                )}
              >
                {message.role === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={cn(
                  'rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[85%]',
                  message.role === 'user'
                    ? 'bg-brand-600 text-white rounded-tr-sm'
                    : 'bg-white border border-slate-200 text-slate-800 shadow-card rounded-tl-sm'
                )}
              >
                {message.content ? (
                  <div
                    className={cn(
                      'whitespace-pre-wrap',
                      message.isStreaming && 'animate-stream'
                    )}
                  >
                    {message.content}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-400 py-1">
                    <Sparkles className="w-4 h-4 animate-spin-slow" />
                    <span>Analisando seus dados financeiros...</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-slate-200 bg-white p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte algo sobre suas finanças... (Enter para enviar)"
              rows={1}
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 resize-none outline-none leading-relaxed"
              style={{ maxHeight: '160px' }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center transition-all shrink-0',
                input.trim() && !isLoading
                  ? 'bg-brand-600 text-white hover:bg-brand-700'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-center text-xs text-slate-400 mt-2">
            Powered by GPT-4o · Seus dados são privados e seguros
          </p>
        </div>
      </div>
    </div>
  )
}
