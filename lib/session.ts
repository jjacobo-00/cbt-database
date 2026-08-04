import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours
const SESSION_DURATION_H = "24h"

const secretKey = process.env.SESSION_SECRET || process.env.AUTH_SECRET || "build_fallback_secret_do_not_use_in_prod"
const key = new TextEncoder().encode(secretKey)

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION_H)
    .sign(key)
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  })
  return payload
}

export async function createSession() {
  const expires = new Date(Date.now() + SESSION_DURATION_MS)
  const session = await encrypt({ role: "admin", expires })

  const cookieStore = await cookies()
  cookieStore.set("session", session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  })
}

export async function getSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get("session")?.value
  if (!session) return null
  try {
    return await decrypt(session)
  } catch (error) {
    return null
  }
}

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.set("session", "", { expires: new Date(0), path: "/" })
}
