import { SignJWT, jwtVerify, errors as joseErrors } from "jose"
import { cookies } from "next/headers"

const secretKey = process.env.SESSION_SECRET || "default_secret_key_for_cbt_directory_change_me_in_prod"
const key = new TextEncoder().encode(secretKey)

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key)
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  })
  return payload
}

export async function createSession() {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
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
    // Expired or tampered cookies simply mean "no session"; anything else
    // (e.g. a misconfigured SESSION_SECRET) must not be hidden.
    if (error instanceof joseErrors.JOSEError) {
      return null
    }
    throw error
  }
}

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.set("session", "", { expires: new Date(0), path: "/" })
}
