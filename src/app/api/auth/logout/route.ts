import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { clearAuthCookies, getRefreshTokenFromCookies } from '@/lib/auth/jwt'
import { apiSuccess } from '@/lib/api'

export async function POST(_request: NextRequest) {
  const refreshToken = getRefreshTokenFromCookies()

  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } }).catch(() => null)
  }

  clearAuthCookies()

  return apiSuccess({ message: 'Logout realizado com sucesso' })
}
