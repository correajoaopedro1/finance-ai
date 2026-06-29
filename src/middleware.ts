import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'

const PUBLIC_ROUTES = ['/login', '/register']
const PROTECTED_API_PREFIX = '/api'
const PUBLIC_API_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/debug',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Static assets — skip
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Root → redirect to dashboard or login
  if (pathname === '/') {
    const token = request.cookies.get('access_token')?.value
    if (token && verifyAccessToken(token)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Public API routes — allow
  if (PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Public page routes — redirect if already authenticated
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    const token = request.cookies.get('access_token')?.value
    if (token) {
      const payload = verifyAccessToken(token)
      if (payload) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
    return NextResponse.next()
  }

  // Protected routes — validate token
  const token = request.cookies.get('access_token')?.value

  if (!token) {
    if (pathname.startsWith(PROTECTED_API_PREFIX)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const payload = verifyAccessToken(token)

  if (!payload) {
    if (pathname.startsWith(PROTECTED_API_PREFIX)) {
      return NextResponse.json({ error: 'Token expirado' }, { status: 401 })
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    const response = NextResponse.redirect(loginUrl)
    response.cookies.delete('access_token')
    return response
  }

  // Inject user context into API request headers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', payload.sub)
  requestHeaders.set('x-user-email', payload.email)
  requestHeaders.set('x-user-name', payload.name)
  requestHeaders.set('x-user-plan', payload.plan)

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
