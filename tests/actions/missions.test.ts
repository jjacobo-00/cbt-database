import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createDbMock } from "../support/mock-db"

const mock = createDbMock()
const revalidatePath = vi.fn()

vi.mock("@/db", () => ({ db: mock.db }))
vi.mock("next/cache", () => ({ revalidatePath: (path: string) => revalidatePath(path) }))

const { createMission, deleteMission, getMissions, updateMission } = await import(
  "@/app/(dashboard)/missions/actions"
)
const { missions } = await import("@/db/schema")

beforeEach(() => {
  mock.reset()
  revalidatePath.mockClear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("getMissions", () => {
  it("returns the rows as stored", async () => {
    mock.queueSelect(missions, [{ id: "mission-1", name: "Iba Outreach" }])
    expect(await getMissions()).toEqual([{ id: "mission-1", name: "Iba Outreach" }])
  })

  it("returns an empty list when the query fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    mock.queueSelect(missions, new Error("db down"))

    expect(await getMissions()).toEqual([])
  })
})

describe("createMission", () => {
  it("returns the created mission and revalidates the missions page", async () => {
    mock.queueInsert(missions, [{ id: "mission-1", name: "Iba Outreach" }])

    const result = await createMission({
      name: "Iba Outreach",
      location: "Iba",
      pastor_name: "Ptr. Cruz",
      established_date: "2020-01-01",
    })

    expect(result).toEqual({ success: true, data: { id: "mission-1", name: "Iba Outreach" } })
    expect(mock.insertsInto(missions)[0].values).toEqual({
      name: "Iba Outreach",
      location: "Iba",
      pastor_name: "Ptr. Cruz",
      established_date: "2020-01-01",
    })
    expect(revalidatePath).toHaveBeenCalledWith("/missions")
  })

  it("stores null for the optional fields", async () => {
    mock.queueInsert(missions, [{ id: "mission-1" }])

    await createMission({ name: "Iba Outreach" })

    expect(mock.insertsInto(missions)[0].values).toEqual({
      name: "Iba Outreach",
      location: null,
      pastor_name: null,
      established_date: null,
    })
  })

  it("reports a failure without revalidating", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    mock.queueInsert(missions, new Error("db down"))

    expect(await createMission({ name: "Iba Outreach" })).toEqual({
      success: false,
      error: "Failed to create mission",
    })
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})

describe("updateMission", () => {
  it("updates the mission and returns the updated row", async () => {
    const result = await updateMission("mission-1", { name: "Iba Outreach", location: "Iba" })

    expect(result).toEqual({ success: true, data: undefined })
    expect(mock.updatesOf(missions)[0].values).toEqual({
      name: "Iba Outreach",
      location: "Iba",
      pastor_name: null,
      established_date: null,
    })
    expect(revalidatePath).toHaveBeenCalledWith("/missions")
  })

  it("reports a failure without revalidating", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    mock.db.update.mockImplementationOnce(() => {
      throw new Error("db down")
    })

    expect(await updateMission("mission-1", { name: "Iba Outreach" })).toEqual({
      success: false,
      error: "Failed to update mission",
    })
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})

describe("deleteMission", () => {
  it("deletes the mission and revalidates the missions page", async () => {
    expect(await deleteMission("mission-1")).toEqual({ success: true })
    expect(mock.deletesFrom(missions)).toHaveLength(1)
    expect(revalidatePath).toHaveBeenCalledWith("/missions")
  })

  it("reports a failure without revalidating", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    mock.db.delete.mockImplementationOnce(() => {
      throw new Error("db down")
    })

    expect(await deleteMission("mission-1")).toEqual({
      success: false,
      error: "Failed to delete mission",
    })
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
