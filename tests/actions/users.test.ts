import { beforeEach, describe, expect, it, vi } from "vitest"
import { createDbMock } from "../support/mock-db"

const mock = createDbMock()
const revalidatePath = vi.fn()
const findMany = vi.fn()

vi.mock("@/db", () => ({ db: mock.db }))
vi.mock("next/cache", () => ({ revalidatePath: (path: string) => revalidatePath(path) }))

const { addWhitelistedUser, getWhitelistedUsers, removeWhitelistedUser } = await import(
  "@/app/(dashboard)/users/actions"
)
const { whitelisted_users } = await import("@/db/schema")

const formData = (entries: Record<string, string>) => {
  const data = new FormData()
  for (const [key, value] of Object.entries(entries)) data.append(key, value)
  return data
}

beforeEach(() => {
  mock.reset()
  revalidatePath.mockClear()
  findMany.mockReset()
  mock.db.query.whitelisted_users = { findMany }
})

describe("getWhitelistedUsers", () => {
  it("returns the newest whitelisted users first", async () => {
    findMany.mockResolvedValue([{ id: "user-1", email: "a@example.com" }])

    expect(await getWhitelistedUsers()).toEqual([{ id: "user-1", email: "a@example.com" }])

    const { orderBy } = findMany.mock.calls[0][0]
    const desc = vi.fn((column: unknown) => column)
    expect(orderBy({ created_at: "created_at" }, { desc })).toEqual(["created_at"])
  })
})

describe("addWhitelistedUser", () => {
  it("stores the email with its name and revalidates the users page", async () => {
    await addWhitelistedUser(formData({ email: "a@example.com", name: "Ana" }))

    expect(mock.insertsInto(whitelisted_users)[0].values).toEqual({
      email: "a@example.com",
      name: "Ana",
    })
    expect(revalidatePath).toHaveBeenCalledWith("/users")
  })

  it("stores null when no name is supplied", async () => {
    await addWhitelistedUser(formData({ email: "a@example.com", name: "" }))

    expect((mock.insertsInto(whitelisted_users)[0].values as Record<string, unknown>).name)
      .toBeNull()
  })

  it("ignores a submission without an email", async () => {
    await addWhitelistedUser(formData({ name: "Ana" }))

    expect(mock.insertsInto(whitelisted_users)).toHaveLength(0)
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})

describe("removeWhitelistedUser", () => {
  it("deletes the entry and revalidates the users page", async () => {
    await removeWhitelistedUser("user-1")

    expect(mock.deletesFrom(whitelisted_users)).toHaveLength(1)
    expect(revalidatePath).toHaveBeenCalledWith("/users")
  })
})
