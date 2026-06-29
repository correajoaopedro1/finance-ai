import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword } from '@/lib/auth/password'
import { signAccessToken, signRefreshToken, applyAuthCookies } from '@/lib/auth/jwt'
import { loginSchema } from '@/lib/validators'
import { apiSuccess, apiError, handleApiError } from '@/lib/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = loginSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email: data.email },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        currency: true,
        passwordHash: true,
        isActive: true,
        monthlyIncomeGoal: true,
        createdAt: true,
      },
    })

    if (!user || !user.isActive) {
      return apiError('Credenciais inválidas', 401)
    }

    const valid = await verifyPassword(data.password, user.passwordHash)
    if (!valid) {
      return apiError('Credenciais inválidas', 401)
    }

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
    })
    const refreshToken = signRefreshToken(user.id)

    await prisma.refreshToken.deleteMany({ where: { userId: user.id } })
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    const { passwordHash: _, ...userWithoutPassword } = user
    return applyAuthCookies({ user: userWithoutPassword }, 200, accessToken, refreshToken)
  } catch (error) {
    return handleApiError(error)
  }
}
