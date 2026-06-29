import jwt from 'jsonwebtoken'

export interface JwtPayload {
  sub: string
  email: string
  name: string
  plan: string
  iat?: number
  exp?: number
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JwtPayload
  } catch {
    return null
  }
}
