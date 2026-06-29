import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth/password'
import { signAccessToken, signRefreshToken, applyAuthCookies } from '@/lib/auth/jwt'
import { registerSchema } from '@/lib/validators'
import { apiSuccess, apiError, handleApiError } from '@/lib/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = registerSchema.parse(body)

    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
      return apiError('E-mail já está em uso', 409)
    }

    const passwordHash = await hashPassword(data.password)

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
      },
      select: { id: true, email: true, name: true, plan: true, currency: true, createdAt: true },
    })

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
    })
    const refreshToken = signRefreshToken(user.id)

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    return applyAuthCookies({ user }, 201, accessToken, refreshToken)
  } catch (error) {
    return handleApiError(error)
  }
}
