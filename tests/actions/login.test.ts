import { beforeEach, describe, expect, it, vi } from "vitest"

const signIn = vi.fn()

vi.mock("@/auth", () => ({ signIn: (...args: unknown[]) => signIn(...args) }))

const { loginWithGoogle } = await import("@/app/(auth)/login/actions")

beforeEach(() => {
  signIn.mockReset()
})

describe("loginWithGoogle", () => {
  it("starts the Google flow and returns to the dashboard", async () => {
    await loginWithGoogle()
    expect(signIn).toHaveBeenCalledWith("google", { redirectTo: "/dashboard" })
  })

  it("propagates provider failures", async () => {
    signIn.mockRejectedValue(new Error("provider unavailable"))
    await expect(loginWithGoogle()).rejects.toThrow("provider unavailable")
  })
})
