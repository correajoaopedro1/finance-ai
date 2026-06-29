import { jwtVerify } from 'jose'

export interface JwtPayload {
  sub: string
  email: string
  name: string
  plan: string
  iat?: number
  exp?: number
}

export async function verifyAccessToken(token: string): Promise<JwtPayload | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!)
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as JwtPayload
  } catch {
    return null
  }
}
