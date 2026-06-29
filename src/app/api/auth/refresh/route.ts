import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
  getRefreshTokenFromCookies,
} from '@/lib/auth/jwt'
import { apiSuccess, apiError } from '@/lib/api'

export async function POST(_request: NextRequest) {
  const refreshToken = getRefreshTokenFromCookies()

  if (!refreshToken) {
    return apiError('Refresh token não encontrado', 401)
  }

  const payload = verifyRefreshToken(refreshToken)
  if (!payload) {
    return apiError('Refresh token inválido ou expirado', 401)
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: { select: { id: true, email: true, name: true, plan: true, isActive: true } } },
  })

  if (!storedToken || !storedToken.user.isActive || storedToken.expiresAt < new Date()) {
    return apiError('Sessão inválida', 401)
  }

  const { user } = storedToken

  const newAccessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
  })
  const newRefreshToken = signRefreshToken(user.id)

  await prisma.refreshToken.delete({ where: { id: storedToken.id } })
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  setAuthCookies(newAccessToken, newRefreshToken)

  return apiSuccess({ message: 'Token renovado com sucesso' })
}
