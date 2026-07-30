import { describe, expect, it, vi } from "vitest"

const neon = vi.fn((url: string) => ({ url }))
const drizzle = vi.fn((client: unknown, options: unknown) => ({ client, options }))

vi.mock("@neondatabase/serverless", () => ({ neon: (url: string) => neon(url) }))
vi.mock("drizzle-orm/neon-http", () => ({
  drizzle: (client: unknown, options: unknown) => drizzle(client, options),
}))

vi.stubEnv("DATABASE_URL", "postgres://user:pass@localhost/cbt")

const { db } = await import("@/db")
const schema = await import("@/db/schema")

describe("db", () => {
  it("connects the neon client to drizzle with the full schema", () => {
    expect(neon).toHaveBeenCalledWith("postgres://user:pass@localhost/cbt")
    expect(drizzle).toHaveBeenCalledWith(
      { url: "postgres://user:pass@localhost/cbt" },
      { schema }
    )
    expect(db).toBeDefined()
  })
})
