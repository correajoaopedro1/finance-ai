import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

export interface JwtPayload {
  sub: string
  email: string
  name: string
  plan: string
  iat?: number
  exp?: number
}

export function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' })
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, REFRESH_SECRET, { expiresIn: '7d' })
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, ACCESS_SECRET) as JwtPayload
  } catch {
    return null
  }
}

export function verifyRefreshToken(token: string): { sub: string } | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as { sub: string }
  } catch {
    return null
  }
}

export function applyAuthCookies<T>(data: T, status = 200, accessToken: string, refreshToken: string): NextResponse {
  const response = NextResponse.json({ data }, { status })
  response.cookies.set('access_token', accessToken, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax',
    maxAge: 60 * 15,
    path: '/',
  })
  response.cookies.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return response
}

export function clearAuthCookies() {
  const cookieStore = cookies()
  cookieStore.delete('access_token')
  cookieStore.delete('refresh_token')
}

export function getAccessTokenFromCookies(): string | undefined {
  return cookies().get('access_token')?.value
}

export function getRefreshTokenFromCookies(): string | undefined {
  return cookies().get('refresh_token')?.value
}
