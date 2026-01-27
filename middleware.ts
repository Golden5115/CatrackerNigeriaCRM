import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySession } from '@/lib/session'

export async function middleware(req: NextRequest) {
  // 1. Check for session cookie
  const cookie = req.cookies.get('session')?.value
  const session = await verifySession(cookie)

  // 2. Define protected routes
  const isDashboard = req.nextUrl.pathname.startsWith('/dashboard')
  const isLogin = req.nextUrl.pathname.startsWith('/login')

  // 3. Logic:
  // If user is on Dashboard but NOT logged in -> Kick to Login
  if (isDashboard && !session) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  // If user is on Login page but IS logged in -> Send to Dashboard
  if (isLogin && session) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
  }

  return NextResponse.next()
}

// Routes where Middleware runs
export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}