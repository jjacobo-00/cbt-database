import { beforeEach, describe, expect, it, vi } from "vitest"
import { decodeJwt } from "jose"

const cookieStore = {
  get: vi.fn(),
  set: vi.fn(),
}

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStore),
}))

const { createSession, decrypt, destroySession, encrypt, getSession } = await import("@/lib/session")

beforeEach(() => {
  cookieStore.get.mockReset()
  cookieStore.set.mockReset()
})

describe("encrypt/decrypt", () => {
  it("round-trips a payload and stamps iat/exp", async () => {
    const token = await encrypt({ role: "admin" })
    const payload = await decrypt(token)

    expect(payload.role).toBe("admin")
    expect(payload.iat).toBeTypeOf("number")
    expect(payload.exp).toBe(payload.iat + 24 * 60 * 60)
  })

  it("signs with HS256", async () => {
    const token = await encrypt({ role: "admin" })
    const header = JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString())
    expect(header.alg).toBe("HS256")
  })

  it("rejects a tampered token", async () => {
    const token = await encrypt({ role: "admin" })
    const [header, , signature] = token.split(".")
    const forgedPayload = Buffer.from(JSON.stringify({ role: "superadmin" })).toString("base64url")

    await expect(decrypt(`${header}.${forgedPayload}.${signature}`)).rejects.toThrow()
  })

  it("rejects a token signed with a different key", async () => {
    const { SignJWT } = await import("jose")
    const foreign = await new SignJWT({ role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(new TextEncoder().encode("some_other_secret_key_that_is_long_enough"))

    await expect(decrypt(foreign)).rejects.toThrow()
  })
})

describe("createSession", () => {
  it("writes a signed admin session cookie with hardened options", async () => {
    await createSession()

    expect(cookieStore.set).toHaveBeenCalledTimes(1)
    const [name, value, options] = cookieStore.set.mock.calls[0]
    expect(name).toBe("session")

    const payload = decodeJwt(value) as { role: string; expires: string }
    expect(payload.role).toBe("admin")

    expect(options.httpOnly).toBe(true)
    expect(options.sameSite).toBe("lax")
    expect(options.path).toBe("/")
    expect(options.secure).toBe(process.env.NODE_ENV === "production")
    expect(options.expires.getTime()).toBeGreaterThan(Date.now())
    expect(new Date(payload.expires).getTime()).toBe(options.expires.getTime())
  })

  it("expires the cookie roughly 24 hours out", async () => {
    const before = Date.now()
    await createSession()
    const { expires } = cookieStore.set.mock.calls[0][2]

    const delta = expires.getTime() - before
    expect(delta).toBeGreaterThan(23 * 60 * 60 * 1000)
    expect(delta).toBeLessThanOrEqual(24 * 60 * 60 * 1000 + 1000)
  })
})

describe("getSession", () => {
  it("returns null when no cookie is present", async () => {
    cookieStore.get.mockReturnValue(undefined)
    expect(await getSession()).toBeNull()
  })

  it("returns null for a malformed cookie instead of throwing", async () => {
    cookieStore.get.mockReturnValue({ value: "not-a-jwt" })
    expect(await getSession()).toBeNull()
  })

  it("returns null for an expired session", async () => {
    const { SignJWT } = await import("jose")
    const expired = await new SignJWT({ role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
      .sign(
        new TextEncoder().encode(
          process.env.SESSION_SECRET || "default_secret_key_for_cbt_directory_change_me_in_prod"
        )
      )

    cookieStore.get.mockReturnValue({ value: expired })
    expect(await getSession()).toBeNull()
  })

  it("returns the decoded payload for a valid session", async () => {
    cookieStore.get.mockReturnValue({ value: await encrypt({ role: "admin" }) })

    const session = await getSession()
    expect(session.role).toBe("admin")
  })
})

describe("destroySession", () => {
  it("clears the cookie with an epoch expiry", async () => {
    await destroySession()

    const [name, value, options] = cookieStore.set.mock.calls[0]
    expect(name).toBe("session")
    expect(value).toBe("")
    expect(options.expires.getTime()).toBe(0)
    expect(options.path).toBe("/")
  })
})
