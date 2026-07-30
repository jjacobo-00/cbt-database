import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createDbMock } from "../support/mock-db"

const mock = createDbMock()
const revalidatePath = vi.fn()

vi.mock("@/db", () => ({ db: mock.db }))
vi.mock("next/cache", () => ({ revalidatePath: (path: string) => revalidatePath(path) }))

const { createMinistry, deleteMinistry, getMinistries, updateMinistry } = await import(
  "@/app/(dashboard)/ministries/actions"
)

const {
  commitment_ministries,
  commitments,
  member_ministries,
  members,
  ministries,
} = await import("@/db/schema")

const conflict = () => Object.assign(new Error("duplicate key"), { code: "23505" })

beforeEach(() => {
  mock.reset()
  revalidatePath.mockClear()
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(new Date("2026-05-05T00:00:00Z"))
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe("getMinistries", () => {
  it("serializes created_at to an ISO string", async () => {
    mock.queueSelect(ministries, [
      {
        id: "min-1",
        name: "Choir",
        for_everyone: false,
        parent_id: null,
        created_at: new Date("2026-01-01T00:00:00Z"),
      },
    ])

    expect(await getMinistries()).toEqual([
      {
        id: "min-1",
        name: "Choir",
        for_everyone: false,
        parent_id: null,
        created_at: "2026-01-01T00:00:00.000Z",
      },
    ])
  })

  it("uses an empty string when created_at is missing", async () => {
    mock.queueSelect(ministries, [{ id: "min-1", name: "Choir", created_at: null }])
    expect((await getMinistries())[0].created_at).toBe("")
  })

  it("returns an empty list when the query fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    mock.queueSelect(ministries, new Error("db down"))

    expect(await getMinistries()).toEqual([])
  })
})

describe("createMinistry", () => {
  it("trims the name, stores the parent and revalidates the dependent pages", async () => {
    mock.queueInsert(ministries, [{ id: "min-1" }])

    await createMinistry("  Choir  ", false, "min-parent")

    expect(mock.insertsInto(ministries)[0].values).toEqual({
      name: "Choir",
      for_everyone: false,
      parent_id: "min-parent",
    })
    expect(revalidatePath.mock.calls.flat()).toEqual([
      "/ministries",
      "/members/new",
      "/commitments",
    ])
  })

  it("normalizes a missing parent to null", async () => {
    mock.queueInsert(ministries, [{ id: "min-1" }])

    await createMinistry("Choir", false)

    expect((mock.insertsInto(ministries)[0].values as Record<string, unknown>).parent_id).toBeNull()
  })

  it("does not auto-enroll anyone for a regular ministry", async () => {
    mock.queueInsert(ministries, [{ id: "min-1" }])

    await createMinistry("Choir", false)

    expect(mock.insertsInto(member_ministries)).toHaveLength(0)
  })

  it("auto-enrolls every member and current year commitment for a for-everyone ministry", async () => {
    mock.queueInsert(ministries, [{ id: "min-1" }])
    mock.queueSelect(members, [{ id: "member-1" }, { id: "member-2" }])
    mock.queueSelect(commitments, [{ id: "commitment-1" }])

    await createMinistry("Sunday Service", true)

    expect(mock.insertsInto(member_ministries)[0].values).toEqual([
      { member_id: "member-1", ministry_id: "min-1" },
      { member_id: "member-2", ministry_id: "min-1" },
    ])
    expect(mock.insertsInto(commitment_ministries)[0].values).toEqual([
      { commitment_id: "commitment-1", ministry_id: "min-1" },
    ])
  })

  it("skips enrollment entirely when there are no members", async () => {
    mock.queueInsert(ministries, [{ id: "min-1" }])
    mock.queueSelect(members, [])

    await createMinistry("Sunday Service", true)

    expect(mock.insertsInto(member_ministries)).toHaveLength(0)
    expect(mock.insertsInto(commitment_ministries)).toHaveLength(0)
  })

  it("skips commitment enrollment when no commitments exist for the year", async () => {
    mock.queueInsert(ministries, [{ id: "min-1" }])
    mock.queueSelect(members, [{ id: "member-1" }])
    mock.queueSelect(commitments, [])

    await createMinistry("Sunday Service", true)

    expect(mock.insertsInto(member_ministries)).toHaveLength(1)
    expect(mock.insertsInto(commitment_ministries)).toHaveLength(0)
  })

  it("swallows auto-enrollment failures so the ministry still gets created", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    mock.queueInsert(ministries, [{ id: "min-1" }])
    mock.queueSelect(members, new Error("db down"))

    await expect(createMinistry("Sunday Service", true)).resolves.toBeUndefined()
    expect(error).toHaveBeenCalled()
    expect(revalidatePath).toHaveBeenCalledWith("/ministries")
  })

  it("reports a duplicate name distinctly", async () => {
    mock.queueInsert(ministries, conflict())

    await expect(createMinistry("Choir", false)).rejects.toThrow(
      "A ministry with that name already exists."
    )
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it("wraps other failures in a generic error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    mock.queueInsert(ministries, new Error("db down"))

    await expect(createMinistry("Choir", false)).rejects.toThrow("Failed to create ministry.")
  })
})

describe("updateMinistry", () => {
  it("renames the ministry without touching for_everyone when it is omitted", async () => {
    await updateMinistry("min-1", "  Choir  ")

    expect(mock.updatesOf(ministries)[0].values).toEqual({ name: "Choir" })
    expect(mock.insertsInto(member_ministries)).toHaveLength(0)
  })

  it("clears the for-everyone flag without auto-enrolling", async () => {
    await updateMinistry("min-1", "Choir", false)

    expect(mock.updatesOf(ministries)[0].values).toEqual({ name: "Choir", for_everyone: false })
    expect(mock.insertsInto(member_ministries)).toHaveLength(0)
  })

  it("auto-enrolls everyone when the ministry becomes for-everyone", async () => {
    mock.queueSelect(members, [{ id: "member-1" }])
    mock.queueSelect(commitments, [{ id: "commitment-1" }])

    await updateMinistry("min-1", "Sunday Service", true)

    expect(mock.updatesOf(ministries)[0].values).toEqual({
      name: "Sunday Service",
      for_everyone: true,
    })
    expect(mock.insertsInto(member_ministries)[0].values).toEqual([
      { member_id: "member-1", ministry_id: "min-1" },
    ])
    expect(mock.insertsInto(commitment_ministries)[0].values).toEqual([
      { commitment_id: "commitment-1", ministry_id: "min-1" },
    ])
  })

  it("reports a duplicate name distinctly", async () => {
    mock.db.update.mockImplementationOnce(() => {
      throw conflict()
    })

    await expect(updateMinistry("min-1", "Choir")).rejects.toThrow(
      "A ministry with that name already exists."
    )
  })

  it("wraps other failures in a generic error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    mock.db.update.mockImplementationOnce(() => {
      throw new Error("db down")
    })

    await expect(updateMinistry("min-1", "Choir")).rejects.toThrow("Failed to update ministry.")
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})

describe("deleteMinistry", () => {
  it("removes sub-ministries before the ministry itself", async () => {
    await deleteMinistry("min-1")

    expect(mock.deletesFrom(ministries)).toHaveLength(2)
    expect(revalidatePath.mock.calls.flat()).toEqual([
      "/ministries",
      "/members/new",
      "/commitments",
    ])
  })

  it("wraps failures in a user-facing error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    mock.db.delete.mockImplementationOnce(() => {
      throw new Error("db down")
    })

    await expect(deleteMinistry("min-1")).rejects.toThrow("Failed to delete ministry.")
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
