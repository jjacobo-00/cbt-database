import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from "next-auth/jwt"

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request })
  const isLoggedIn = !!token
  const isLoginPage = request.nextUrl.pathname.startsWith('/login')
  const isApiAuthRoute = request.nextUrl.pathname.startsWith('/api/auth')
  const isInvitePage = request.nextUrl.pathname.startsWith('/invite')

  // Always allow NextAuth API routes and invite pages through
  if (isApiAuthRoute || isInvitePage) {
    return NextResponse.next()
  }

  // If on login page and already logged in, redirect to dashboard
  if (isLoginPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // If not logged in and trying to access a protected page, redirect to login
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

