export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import jwt from 'jsonwebtoken'

export async function GET() {
  const results: Record<string, string> = {}

  // Test DB
  try {
    await prisma.$queryRaw`SELECT 1`
    results.db = 'OK'
  } catch (e) {
    results.db = `ERRO: ${(e as Error).message}`
  }

  // Test JWT
  try {
    const secret = process.env.JWT_ACCESS_SECRET
    results.jwt_secret_defined = secret ? `OK (${secret.length} chars)` : 'UNDEFINED'
    if (secret) {
      jwt.sign({ test: 1 }, secret)
      results.jwt_sign = 'OK'
    }
  } catch (e) {
    results.jwt_sign = `ERRO: ${(e as Error).message}`
  }

  results.node_env = process.env.NODE_ENV ?? 'undefined'
  results.gemini_key = process.env.GEMINI_API_KEY ? 'defined' : 'undefined'

  return NextResponse.json(results)
}
