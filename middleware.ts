import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from "jose"

const secretKey = process.env.SESSION_SECRET || "default_secret_key_for_cbt_directory_change_me_in_prod"
const key = new TextEncoder().encode(secretKey)

export async function middleware(request: NextRequest) {
  const session = request.cookies.get("session")?.value
  const isLoginPage = request.nextUrl.pathname.startsWith('/login')
  
  if (isLoginPage) {
    if (session) {
      try {
        await jwtVerify(session, key, { algorithms: ["HS256"] })
        return NextResponse.redirect(new URL('/dashboard', request.url))
      } catch (e) {
        // invalid session, let them log in
      }
    }
    return NextResponse.next()
  }

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const { payload } = await jwtVerify(session, key, { algorithms: ["HS256"] })
    
    // Refresh token expiration
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const res = NextResponse.next()
    res.cookies.set({
      name: 'session',
      value: session,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expires,
      path: "/",
    })
    return res
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
