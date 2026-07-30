import { describe, expect, it, vi } from "vitest"

type ProxyRequest = {
  auth: unknown
  nextUrl: URL
}

vi.mock("@/auth", () => ({
  auth: (handler: (req: ProxyRequest) => Response | undefined) => handler,
}))

const { config, proxy } = await import("@/proxy")

const request = (pathname: string, loggedIn: boolean): ProxyRequest => ({
  auth: loggedIn ? { user: { id: "1" } } : null,
  nextUrl: new URL(`https://cbt.example.com${pathname}`),
})

const run = (pathname: string, loggedIn: boolean) =>
  (proxy as unknown as (req: ProxyRequest) => Response | undefined)(request(pathname, loggedIn))

describe("proxy", () => {
  it.each(["/api/auth/callback/google", "/api/auth/session", "/invite/abc123", "/invite"])(
    "leaves %s untouched for anonymous visitors",
    (pathname) => {
      expect(run(pathname, false)).toBeUndefined()
    }
  )

  it("keeps auth and invite routes accessible while logged in", () => {
    expect(run("/api/auth/session", true)).toBeUndefined()
    expect(run("/invite/abc123", true)).toBeUndefined()
  })

  it("lets anonymous visitors reach the login page", () => {
    expect(run("/login", false)).toBeUndefined()
    expect(run("/login?error=Denied", false)).toBeUndefined()
  })

  it("sends logged-in users away from the login page to the dashboard", () => {
    const response = run("/login", true)
    expect(response?.status).toBe(302)
    expect(response?.headers.get("location")).toBe("https://cbt.example.com/dashboard")
  })

  it.each(["/dashboard", "/members", "/members/123", "/reports", "/"])(
    "redirects anonymous visitors from %s to /login",
    (pathname) => {
      const response = run(pathname, false)
      expect(response?.status).toBe(302)
      expect(response?.headers.get("location")).toBe("https://cbt.example.com/login")
    }
  )

  it("allows logged-in users through to protected pages", () => {
    expect(run("/dashboard", true)).toBeUndefined()
    expect(run("/members/123", true)).toBeUndefined()
  })
})

describe("proxy matcher", () => {
  const matches = (pathname: string) => new RegExp(`^${config.matcher[0]}$`).test(pathname)

  it("matches application routes", () => {
    expect(matches("/dashboard")).toBe(true)
    expect(matches("/members/123")).toBe(true)
  })

  it("skips next internals, the favicon and static image assets", () => {
    expect(matches("/_next/static/chunks/main.js")).toBe(false)
    expect(matches("/_next/image")).toBe(false)
    expect(matches("/favicon.ico")).toBe(false)
    expect(matches("/icon.svg")).toBe(false)
    expect(matches("/logo.png")).toBe(false)
  })
})
