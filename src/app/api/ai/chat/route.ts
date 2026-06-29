import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthContext, apiError } from '@/lib/api'
import { openai, OPENAI_MODEL, SYSTEM_PROMPT } from '@/lib/ai/client'
import { buildFinancialContext } from '@/lib/ai/financial-context'
import { aiChatSchema } from '@/lib/validators'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  const context = getAuthContext(request)
  if (!context) return apiError('Não autorizado', 401)

  const body = await request.json()
  const parsed = aiChatSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Dados inválidos', 422)
  }

  const { conversationId, message } = parsed.data

  // Get or create conversation
  let convId = conversationId
  if (!convId) {
    const conv = await prisma.aiConversation.create({
      data: { userId: context.userId, title: message.slice(0, 60) },
    })
    convId = conv.id
  }

  // Verify conversation belongs to user
  const conversation = await prisma.aiConversation.findFirst({
    where: { id: convId, userId: context.userId },
    include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } },
  })

  if (!conversation) return apiError('Conversa não encontrada', 404)

  // Save user message
  await prisma.aiMessage.create({
    data: { conversationId: convId, role: 'user', content: message },
  })

  // Update conversation title from first message
  if (conversation.messages.length === 0) {
    await prisma.aiConversation.update({
      where: { id: convId },
      data: { title: message.slice(0, 60) },
    })
  }

  // Build financial context
  const financialContext = await buildFinancialContext(context.userId)

  // Build message history for OpenAI
  const history = conversation.messages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: `${SYSTEM_PROMPT}\n\n${financialContext}` },
    ...history,
    { role: 'user', content: message },
  ]

  // Stream response
  const encoder = new TextEncoder()
  let fullContent = ''
  let totalTokens = 0

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const completion = await openai.chat.completions.create({
          model: OPENAI_MODEL,
          messages,
          stream: true,
          max_tokens: 1500,
          temperature: 0.7,
        })

        // Send conversation id first
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'meta', conversationId: convId })}\n\n`)
        )

        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content ?? ''
          if (content) {
            fullContent += content
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'content', content })}\n\n`)
            )
          }

          if (chunk.usage) {
            totalTokens = chunk.usage.total_tokens
          }
        }

        // Save assistant message
        await prisma.aiMessage.create({
          data: {
            conversationId: convId!,
            role: 'assistant',
            content: fullContent,
            tokensUsed: totalTokens,
          },
        })

        // Touch conversation updatedAt
        await prisma.aiConversation.update({
          where: { id: convId! },
          data: { updatedAt: new Date() },
        })

        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (error) {
        console.error('[AI Chat Error]', error)
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'error', message: 'Erro ao processar sua mensagem' })}\n\n`
          )
        )
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Conversation-Id': convId,
    },
  })
}
