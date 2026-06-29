import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

export interface ApiContext {
  userId: string
  userEmail: string
  userName: string
  userPlan: string
}

export function getAuthContext(request: NextRequest): ApiContext | null {
  const userId = request.headers.get('x-user-id')
  const userEmail = request.headers.get('x-user-email')
  const userName = request.headers.get('x-user-name')
  const userPlan = request.headers.get('x-user-plan') ?? 'FREE'

  if (!userId || !userEmail || !userName) return null

  return { userId, userEmail, userName, userPlan }
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status })
}

export function handleApiError(error: unknown) {
  console.error('[API Error]', error)

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  if (error instanceof Error) {
    if (error.message.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Registro já existe' }, { status: 409 })
    }
    if (error.message.includes('Record to update not found')) {
      return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 })
    }
  }

  return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
}
