import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createDbMock } from "../support/mock-db"

const mock = createDbMock()
const revalidatePath = vi.fn()

vi.mock("@/db", () => ({ db: mock.db }))
vi.mock("next/cache", () => ({ revalidatePath: (path: string) => revalidatePath(path) }))

const {
  createOfferingCategory,
  deleteOfferingCategory,
  getOfferingCategories,
  updateOfferingCategory,
} = await import("@/app/(dashboard)/commitments/offerings/actions")
const { offering_categories } = await import("@/db/schema")

beforeEach(() => {
  mock.reset()
  revalidatePath.mockClear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("getOfferingCategories", () => {
  it("serializes created_at to an ISO string", async () => {
    mock.queueSelect(offering_categories, [
      { id: "off-1", name: "Tithes", created_at: new Date("2026-01-01T00:00:00Z") },
    ])

    expect(await getOfferingCategories()).toEqual([
      { id: "off-1", name: "Tithes", created_at: "2026-01-01T00:00:00.000Z" },
    ])
  })

  it("uses an empty string when created_at is missing", async () => {
    mock.queueSelect(offering_categories, [{ id: "off-1", created_at: null }])
    expect((await getOfferingCategories())[0].created_at).toBe("")
  })

  it("returns an empty list when the query fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    mock.queueSelect(offering_categories, new Error("db down"))

    expect(await getOfferingCategories()).toEqual([])
  })
})

describe("createOfferingCategory", () => {
  it("trims text and stores the monthly schedule", async () => {
    await createOfferingCategory("  Tithes  ", "  Monthly tithe  ", true, 3)

    expect(mock.insertsInto(offering_categories)[0].values).toEqual({
      name: "Tithes",
      description: "Monthly tithe",
      is_monthly: true,
      month: 3,
    })
    expect(revalidatePath).toHaveBeenCalledWith("/commitments/offerings")
  })

  it("stores null for a blank description and a missing month", async () => {
    await createOfferingCategory("Tithes", "   ", false)

    expect(mock.insertsInto(offering_categories)[0].values).toEqual({
      name: "Tithes",
      description: null,
      is_monthly: false,
      month: null,
    })
  })

  it("wraps failures and skips revalidation", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    mock.queueInsert(offering_categories, new Error("db down"))

    await expect(createOfferingCategory("Tithes", "", false)).rejects.toThrow(
      "Failed to create offering category."
    )
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})

describe("updateOfferingCategory", () => {
  it("trims text and stores the schedule", async () => {
    await updateOfferingCategory("off-1", "  Tithes  ", "  Updated  ", true, 12)

    expect(mock.updatesOf(offering_categories)[0].values).toEqual({
      name: "Tithes",
      description: "Updated",
      is_monthly: true,
      month: 12,
    })
    expect(revalidatePath).toHaveBeenCalledWith("/commitments/offerings")
  })

  it("wraps failures and skips revalidation", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    mock.db.update.mockImplementationOnce(() => {
      throw new Error("db down")
    })

    await expect(updateOfferingCategory("off-1", "Tithes", "", false)).rejects.toThrow(
      "Failed to update offering category."
    )
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})

describe("deleteOfferingCategory", () => {
  it("deletes the category and revalidates the offerings page", async () => {
    await deleteOfferingCategory("off-1")

    expect(mock.deletesFrom(offering_categories)).toHaveLength(1)
    expect(revalidatePath).toHaveBeenCalledWith("/commitments/offerings")
  })

  it("wraps failures and skips revalidation", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    mock.db.delete.mockImplementationOnce(() => {
      throw new Error("db down")
    })

    await expect(deleteOfferingCategory("off-1")).rejects.toThrow(
      "Failed to delete offering category."
    )
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
