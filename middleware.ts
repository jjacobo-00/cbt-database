import { auth } from "@/auth"

export const middleware = auth((req) => {
  const isLoggedIn = !!req.auth
  const path = req.nextUrl.pathname
  const isAuthPage = path.startsWith('/login')
  const isApiAuthRoute = path.startsWith('/api/auth')
  const isInviteRoute = path.startsWith('/invite')
  const isIcon = path === '/icon.svg'
  const role = req.auth?.user?.role

  if (isApiAuthRoute || isInviteRoute || isIcon) {
    return
  }

  if (isAuthPage) {
    if (isLoggedIn) {
      if (role === "member") {
        return Response.redirect(new URL('/my-profile', req.nextUrl))
      }
      return Response.redirect(new URL('/dashboard', req.nextUrl))
    }
    return
  }

  if (!isLoggedIn) {
    return Response.redirect(new URL('/login', req.nextUrl))
  }

  // Enforce member access restriction
  if (role === "member" && path !== "/my-profile") {
    return Response.redirect(new URL('/my-profile', req.nextUrl))
  }

  return
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
