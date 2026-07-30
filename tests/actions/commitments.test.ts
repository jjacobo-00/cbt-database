import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createDbMock } from "../support/mock-db"

const mock = createDbMock()
const revalidatePath = vi.fn()

vi.mock("@/db", () => ({ db: mock.db }))
vi.mock("next/cache", () => ({ revalidatePath: (path: string) => revalidatePath(path) }))

const {
  getAvailableYears,
  getCommitmentsByYear,
  getRecommitmentTrackerData,
  upsertCommitment,
} = await import("@/app/(dashboard)/commitments/actions")

const {
  commitment_ministries,
  commitment_offerings,
  commitments,
  members,
} = await import("@/db/schema")

const member = (id: string, lastName = "Dela Cruz") => ({
  member_id: id,
  first_name: "Juan",
  last_name: lastName,
  contact_number: "09171234567",
})

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

describe("getCommitmentsByYear", () => {
  it("returns an empty list when the directory is empty", async () => {
    mock.queueSelect(members, [])
    expect(await getCommitmentsByYear(2026)).toEqual([])
    expect(mock.db.select).toHaveBeenCalledTimes(1)
  })

  it("marks members without a commitment as not pledged and gives them a temp id", async () => {
    mock.queueSelect(members, [member("member-1")])
    mock.queueSelect(commitments, [])

    expect(await getCommitmentsByYear(2026)).toEqual([
      {
        id: "temp-member-1",
        member_id: "member-1",
        year: 2026,
        first_name: "Juan",
        last_name: "Dela Cruz",
        contact_number: "09171234567",
        has_pledged: false,
        ministries: [],
        offerings: [],
      },
    ])
  })

  it("treats a commitment with no ministries or offerings as not pledged", async () => {
    mock.queueSelect(members, [member("member-1")])
    mock.queueSelect(commitments, [{ id: "commitment-1", member_id: "member-1", year: 2026 }])
    mock.queueSelect(commitment_ministries, [])
    mock.queueSelect(commitment_offerings, [])

    const [row] = await getCommitmentsByYear(2026)
    expect(row.id).toBe("commitment-1")
    expect(row.has_pledged).toBe(false)
  })

  it("attaches only the assignments belonging to each member's commitment", async () => {
    mock.queueSelect(members, [member("member-1"), member("member-2", "Santos")])
    mock.queueSelect(commitments, [
      { id: "commitment-1", member_id: "member-1", year: 2026 },
      { id: "commitment-2", member_id: "member-2", year: 2026 },
    ])
    mock.queueSelect(commitment_ministries, [
      { commitment_id: "commitment-1", ministry_id: "min-1", ministry_name: "Choir", parent_id: null },
      { commitment_id: "commitment-2", ministry_id: "min-2", ministry_name: "Ushers", parent_id: null },
    ])
    mock.queueSelect(commitment_offerings, [
      { commitment_id: "commitment-1", offering_category_id: "off-1", offering_name: "Tithes" },
    ])

    const rows = await getCommitmentsByYear(2026)
    expect(rows[0].has_pledged).toBe(true)
    expect(rows[0].ministries.map((m) => m.ministry_name)).toEqual(["Choir"])
    expect(rows[0].offerings.map((o) => o.offering_name)).toEqual(["Tithes"])
    expect(rows[1].ministries.map((m) => m.ministry_name)).toEqual(["Ushers"])
    expect(rows[1].offerings).toEqual([])
  })

  it("returns an empty list and logs when the query fails", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    mock.queueSelect(members, new Error("db down"))

    expect(await getCommitmentsByYear(2026)).toEqual([])
    expect(error).toHaveBeenCalled()
  })
})

describe("getRecommitmentTrackerData", () => {
  it("returns an empty list when the directory is empty", async () => {
    mock.queueSelect(members, [])
    expect(await getRecommitmentTrackerData(2026)).toEqual([])
  })

  it("marks a member with target-year pledges as recommitted", async () => {
    mock.queueSelect(members, [member("member-1")])
    mock.queueSelect(commitments, [
      { id: "commitment-2026", member_id: "member-1", year: 2026 },
      { id: "commitment-2025", member_id: "member-1", year: 2025 },
    ])
    mock.queueSelect(commitment_ministries, [
      { commitment_id: "commitment-2026", ministry_id: "min-1", ministry_name: "Choir" },
      { commitment_id: "commitment-2025", ministry_id: "min-2", ministry_name: "Ushers" },
    ])
    mock.queueSelect(commitment_offerings, [])

    const [row] = await getRecommitmentTrackerData(2026)
    expect(row.status).toBe("recommitted")
    expect(row.referenceYear).toBe(2025)
    expect(row.targetMinistries.map((m) => m.ministry_name)).toEqual(["Choir"])
    expect(row.referenceMinistries.map((m) => m.ministry_name)).toEqual(["Ushers"])
  })

  it("marks a member with only prior-year pledges as pending", async () => {
    mock.queueSelect(members, [member("member-1")])
    mock.queueSelect(commitments, [{ id: "commitment-2025", member_id: "member-1", year: 2025 }])
    mock.queueSelect(commitment_ministries, [])
    mock.queueSelect(commitment_offerings, [
      { commitment_id: "commitment-2025", offering_category_id: "off-1", offering_name: "Tithes" },
    ])

    const [row] = await getRecommitmentTrackerData(2026)
    expect(row.status).toBe("pending")
    expect(row.referenceYear).toBe(2025)
    expect(row.referenceOfferings).toHaveLength(1)
  })

  it("falls back to the most recent earlier year when the previous year is missing", async () => {
    mock.queueSelect(members, [member("member-1")])
    mock.queueSelect(commitments, [
      { id: "commitment-2021", member_id: "member-1", year: 2021 },
      { id: "commitment-2023", member_id: "member-1", year: 2023 },
    ])
    mock.queueSelect(commitment_ministries, [
      { commitment_id: "commitment-2023", ministry_id: "min-1", ministry_name: "Choir" },
    ])
    mock.queueSelect(commitment_offerings, [])

    const [row] = await getRecommitmentTrackerData(2026)
    expect(row.referenceYear).toBe(2023)
    expect(row.status).toBe("pending")
  })

  it("ignores commitments from later years when picking the reference", async () => {
    mock.queueSelect(members, [member("member-1")])
    mock.queueSelect(commitments, [{ id: "commitment-2027", member_id: "member-1", year: 2027 }])
    mock.queueSelect(commitment_ministries, [
      { commitment_id: "commitment-2027", ministry_id: "min-1", ministry_name: "Choir" },
    ])
    mock.queueSelect(commitment_offerings, [])

    const [row] = await getRecommitmentTrackerData(2026)
    expect(row.referenceYear).toBeNull()
    expect(row.status).toBe("unassigned")
  })

  it("marks members with no commitment history as unassigned", async () => {
    mock.queueSelect(members, [member("member-1")])
    mock.queueSelect(commitments, [])

    const [row] = await getRecommitmentTrackerData(2026)
    expect(row).toMatchObject({
      status: "unassigned",
      targetYear: 2026,
      referenceYear: null,
      targetMinistries: [],
      referenceOfferings: [],
    })
  })

  it("returns an empty list and logs when the query fails", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    mock.queueSelect(members, new Error("db down"))

    expect(await getRecommitmentTrackerData(2026)).toEqual([])
    expect(error).toHaveBeenCalled()
  })
})

describe("upsertCommitment", () => {
  it("reuses the existing commitment and replaces its pledges", async () => {
    mock.queueSelect(commitments, [{ id: "commitment-1", member_id: "member-1", year: 2026 }])

    const result = await upsertCommitment("member-1", 2026, ["min-1"], ["off-1", "off-2"])

    expect(result).toEqual({ id: "commitment-1", member_id: "member-1", year: 2026 })
    expect(mock.insertsInto(commitments)).toHaveLength(0)
    expect(mock.deletesFrom(commitment_ministries)).toHaveLength(1)
    expect(mock.deletesFrom(commitment_offerings)).toHaveLength(1)
    expect(mock.insertsInto(commitment_ministries)[0].values).toEqual([
      { commitment_id: "commitment-1", ministry_id: "min-1" },
    ])
    expect(mock.insertsInto(commitment_offerings)[0].values).toEqual([
      { commitment_id: "commitment-1", offering_category_id: "off-1" },
      { commitment_id: "commitment-1", offering_category_id: "off-2" },
    ])
    expect(revalidatePath).toHaveBeenCalledWith("/commitments")
    expect(revalidatePath).toHaveBeenCalledWith("/commitments/recommitment")
    expect(revalidatePath).toHaveBeenCalledWith("/commitments/offerings")
  })

  it("creates the commitment when the member has none for that year", async () => {
    mock.queueSelect(commitments, [])
    mock.queueInsert(commitments, [{ id: "commitment-new" }])

    const result = await upsertCommitment("member-1", 2026, [], [])

    expect(result).toEqual({ id: "commitment-new" })
    expect(mock.insertsInto(commitments)[0].values).toEqual({ member_id: "member-1", year: 2026 })
    expect(mock.insertsInto(commitment_ministries)).toHaveLength(0)
    expect(mock.insertsInto(commitment_offerings)).toHaveLength(0)
  })

  it("clears pledges when empty selections are saved", async () => {
    mock.queueSelect(commitments, [{ id: "commitment-1" }])

    await upsertCommitment("member-1", 2026, [], [])

    expect(mock.deletesFrom(commitment_ministries)).toHaveLength(1)
    expect(mock.deletesFrom(commitment_offerings)).toHaveLength(1)
    expect(mock.insertsInto(commitment_ministries)).toHaveLength(0)
  })

  it("wraps failures in a user-facing error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    mock.queueSelect(commitments, new Error("db down"))

    await expect(upsertCommitment("member-1", 2026, [], [])).rejects.toThrow(
      "Failed to save commitment."
    )
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})

describe("getAvailableYears", () => {
  it("always includes the current year, newest first, without duplicates", async () => {
    mock.queueSelect(commitments, [{ year: 2024 }, { year: 2026 }, { year: 2025 }])

    expect(await getAvailableYears()).toEqual([2026, 2025, 2024])
  })

  it("falls back to just the current year when the query fails", async () => {
    mock.queueSelect(commitments, new Error("db down"))

    expect(await getAvailableYears()).toEqual([2026])
  })
})
