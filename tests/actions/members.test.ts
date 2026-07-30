import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createDbMock } from "../support/mock-db"

const mock = createDbMock()
const revalidatePath = vi.fn()
const redirect = vi.fn()

vi.mock("@/db", () => ({ db: mock.db }))
vi.mock("next/cache", () => ({ revalidatePath: (path: string) => revalidatePath(path) }))
vi.mock("next/navigation", () => ({ redirect: (path: string) => redirect(path) }))

const actions = await import("@/app/(dashboard)/members/actions")
const {
  checkMainPastorExists,
  coreCreateMember,
  coreUpdateMember,
  createMember,
  deleteMember,
  generateInviteLink,
  getActiveInvitationLinks,
  getInviteDetails,
  getMembersList,
  revokeInviteLink,
  submitInviteForm,
  updateMember,
  verifyDobAndGetMember,
} = actions

const schema = await import("@/db/schema")
const {
  children,
  commitment_ministries,
  commitment_offerings,
  commitments,
  invitation_links,
  member_ministries,
  members,
  ministries,
  org_chart_nodes,
} = schema

const minimalPayload = {
  first_name: "Juan",
  last_name: "Dela Cruz",
  gender: "Male",
  contact_number: "09171234567",
  employment_status: "Employed",
}

const createdMember = (overrides: Record<string, unknown> = {}) => ({
  id: "member-1",
  first_name: "Juan",
  last_name: "Dela Cruz",
  birth_date: "1990-01-15",
  ...overrides,
})

beforeEach(() => {
  mock.reset()
  revalidatePath.mockClear()
  redirect.mockClear()
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

describe("coreCreateMember", () => {
  it("returns the new member id and creates a commitment for the current year", async () => {
    vi.setSystemTime(new Date("2026-03-01T00:00:00Z"))
    mock.queueInsert(members, [createdMember()])
    mock.queueInsert(commitments, [{ id: "commitment-1" }])

    const id = await coreCreateMember(JSON.stringify(minimalPayload))

    expect(id).toBe("member-1")
    expect(mock.insertsInto(commitments)[0].values).toEqual({
      member_id: "member-1",
      year: 2026,
    })
  })

  it("fills optional text fields with empty strings and dates with null", async () => {
    mock.queueInsert(members, [createdMember()])
    mock.queueInsert(commitments, [{ id: "commitment-1" }])

    await coreCreateMember(JSON.stringify(minimalPayload))

    const values = mock.insertsInto(members)[0].values as Record<string, unknown>
    expect(values.middle_name).toBe("")
    expect(values.email).toBe("")
    expect(values.birth_date).toBeNull()
    expect(values.marital_status).toBe("Single")
    expect(values.church_role).toBe("Member")
    expect(values.country).toBe("Philippines")
    expect(values.sex).toBe("Male")
  })

  it("mirrors the current address into the permanent address when the flag is set", async () => {
    mock.queueInsert(members, [createdMember()])
    mock.queueInsert(commitments, [{ id: "commitment-1" }])

    await coreCreateMember(
      JSON.stringify({
        ...minimalPayload,
        is_perm_same_as_current: true,
        house_number: "12",
        street: "Rizal Ave",
        barangay: "Barretto",
        city: "Olongapo City",
        province: "Zambales",
        zip_code: "2200",
      })
    )

    const values = mock.insertsInto(members)[0].values as Record<string, unknown>
    expect(values.is_perm_same_as_current).toBe(true)
    expect(values.perm_house_number).toBe("12")
    expect(values.perm_street).toBe("Rizal Ave")
    expect(values.perm_barangay).toBe("Barretto")
    expect(values.perm_zip_code).toBe("2200")
  })

  it("stores is_perm_same_as_current true but blank permanent fields when the flag is omitted", async () => {
    mock.queueInsert(members, [createdMember()])
    mock.queueInsert(commitments, [{ id: "commitment-1" }])

    await coreCreateMember(
      JSON.stringify({ ...minimalPayload, house_number: "12", street: "Rizal Ave" })
    )

    const values = mock.insertsInto(members)[0].values as Record<string, unknown>
    expect(values.is_perm_same_as_current).toBe(true)
    expect(values.perm_house_number).toBe("")
    expect(values.perm_street).toBe("")
  })

  it("keeps a distinct permanent address when it differs from the current one", async () => {
    mock.queueInsert(members, [createdMember()])
    mock.queueInsert(commitments, [{ id: "commitment-1" }])

    await coreCreateMember(
      JSON.stringify({
        ...minimalPayload,
        street: "Rizal Ave",
        city: "Olongapo City",
        is_perm_same_as_current: false,
        perm_street: "Magsaysay Drive",
        perm_city: "Subic",
      })
    )

    const values = mock.insertsInto(members)[0].values as Record<string, unknown>
    expect(values.is_perm_same_as_current).toBe(false)
    expect(values.perm_street).toBe("Magsaysay Drive")
    expect(values.perm_city).toBe("Subic")
    expect(values.perm_country).toBe("Philippines")
  })

  it("falls back to the legacy address field for the street", async () => {
    mock.queueInsert(members, [createdMember()])
    mock.queueInsert(commitments, [{ id: "commitment-1" }])

    await coreCreateMember(
      JSON.stringify({
        ...minimalPayload,
        address: "14 Legacy St",
        is_perm_same_as_current: true,
      })
    )

    const values = mock.insertsInto(members)[0].values as Record<string, unknown>
    expect(values.street).toBe("14 Legacy St")
    expect(values.perm_street).toBe("14 Legacy St")
  })

  describe("years_in_church", () => {
    const yearsFor = async (payload: Record<string, unknown>) => {
      mock.reset()
      mock.queueInsert(members, [createdMember()])
      mock.queueInsert(commitments, [{ id: "commitment-1" }])
      await coreCreateMember(JSON.stringify({ ...minimalPayload, ...payload }))
      return (mock.insertsInto(members)[0].values as Record<string, unknown>).years_in_church
    }

    beforeEach(() => {
      vi.setSystemTime(new Date("2026-07-30T12:00:00Z"))
    })

    it("counts full years since the membership date", async () => {
      expect(await yearsFor({ membership_date: "2020-07-29" })).toBe(6)
    })

    it("does not count a year that has not fully elapsed", async () => {
      expect(await yearsFor({ membership_date: "2020-07-31" })).toBe(5)
      expect(await yearsFor({ membership_date: "2020-08-01" })).toBe(5)
    })

    it("prefers membership date, then date saved, then baptism date", async () => {
      expect(
        await yearsFor({
          membership_date: "2016-01-01",
          date_saved: "2010-01-01",
          baptism_date: "2000-01-01",
        })
      ).toBe(10)
      expect(await yearsFor({ date_saved: "2010-01-01", baptism_date: "2000-01-01" })).toBe(16)
      expect(await yearsFor({ baptism_date: "2000-01-01" })).toBe(26)
    })

    it("is null without any reference date and for unparseable dates", async () => {
      expect(await yearsFor({})).toBeNull()
      expect(await yearsFor({ membership_date: "not-a-date" })).toBeNull()
    })

    it("never goes negative for future dates", async () => {
      expect(await yearsFor({ membership_date: "2030-01-01" })).toBe(0)
    })
  })

  describe("occupation", () => {
    const occupationFor = async (payload: Record<string, unknown>) => {
      mock.reset()
      mock.queueInsert(members, [createdMember()])
      mock.queueInsert(commitments, [{ id: "commitment-1" }])
      await coreCreateMember(JSON.stringify({ ...minimalPayload, ...payload }))
      return (mock.insertsInto(members)[0].values as Record<string, unknown>).occupation
    }

    it("uses the explicit occupation when given", async () => {
      expect(await occupationFor({ occupation: "Nurse", position: "Manager" })).toBe("Nurse")
    })

    it("falls back to the position", async () => {
      expect(await occupationFor({ position: "Manager" })).toBe("Manager")
    })

    it("labels students", async () => {
      expect(await occupationFor({ employment_status: "Student" })).toBe("Student")
    })

    it("derives position at company when only a company is known", async () => {
      expect(await occupationFor({ company: "Acme" })).toBe("Employee at Acme")
    })

    it("falls back to the employment status, but leaves None blank", async () => {
      expect(await occupationFor({ employment_status: "Self-Employed" })).toBe("Self-Employed")
      expect(await occupationFor({ employment_status: "None" })).toBe("")
    })
  })

  it("demotes the incumbent Main Pastor before creating a new one", async () => {
    mock.queueInsert(members, [createdMember()])
    mock.queueInsert(commitments, [{ id: "commitment-1" }])

    await coreCreateMember(JSON.stringify({ ...minimalPayload, church_role: "Main Pastor" }))

    expect(mock.updatesOf(members)[0].values).toEqual({ church_role: "Member" })
  })

  it("merges selected ministries with for-everyone ministries, de-duplicated", async () => {
    mock.queueInsert(members, [createdMember()])
    mock.queueSelect(ministries, [{ id: "min-shared" }, { id: "min-all" }])
    mock.queueInsert(commitments, [{ id: "commitment-1" }])

    await coreCreateMember(
      JSON.stringify({ ...minimalPayload, ministries: ["min-a", "min-shared"] })
    )

    expect(mock.insertsInto(member_ministries)[0].values).toEqual([
      { member_id: "member-1", ministry_id: "min-a" },
      { member_id: "member-1", ministry_id: "min-shared" },
      { member_id: "member-1", ministry_id: "min-all" },
    ])
    expect(mock.insertsInto(commitment_ministries)[0].values).toHaveLength(3)
  })

  it("skips ministry rows when there is nothing to enroll in", async () => {
    mock.queueInsert(members, [createdMember()])
    mock.queueInsert(commitments, [{ id: "commitment-1" }])

    await coreCreateMember(JSON.stringify(minimalPayload))

    expect(mock.insertsInto(member_ministries)).toHaveLength(0)
    expect(mock.insertsInto(commitment_ministries)).toHaveLength(0)
    expect(mock.insertsInto(commitment_offerings)).toHaveLength(0)
  })

  it("links pledged offerings to the new commitment", async () => {
    mock.queueInsert(members, [createdMember()])
    mock.queueInsert(commitments, [{ id: "commitment-1" }])

    await coreCreateMember(JSON.stringify({ ...minimalPayload, offerings: ["off-1", "off-2"] }))

    expect(mock.insertsInto(commitment_offerings)[0].values).toEqual([
      { commitment_id: "commitment-1", offering_category_id: "off-1" },
      { commitment_id: "commitment-1", offering_category_id: "off-2" },
    ])
  })

  it("links the spouse back to the new member", async () => {
    mock.queueInsert(members, [createdMember()])
    mock.queueInsert(commitments, [{ id: "commitment-1" }])

    await coreCreateMember(
      JSON.stringify({
        ...minimalPayload,
        spouse_member_id: "member-2",
        anniversary_date: "2015-06-06",
      })
    )

    expect(mock.updatesOf(members)[0].values).toEqual({
      spouse_member_id: "member-1",
      spouse_name: "Juan Dela Cruz",
      marital_status: "Married",
      anniversary_date: "2015-06-06",
    })
  })

  it("copies children to the spouse and back-fills the child's father", async () => {
    mock.queueInsert(members, [createdMember()])
    mock.queueInsert(commitments, [{ id: "commitment-1" }])

    await coreCreateMember(
      JSON.stringify({
        ...minimalPayload,
        spouse_member_id: "member-2",
        children: [{ name: "Ana", birth_date: "2015-01-01", child_member_id: "member-3" }],
      })
    )

    const childInserts = mock.insertsInto(children)
    expect(childInserts[0].values).toEqual([
      {
        member_id: "member-1",
        name: "Ana",
        birth_date: "2015-01-01",
        child_member_id: "member-3",
      },
    ])
    expect(childInserts[1].values).toEqual([
      {
        member_id: "member-2",
        name: "Ana",
        birth_date: "2015-01-01",
        child_member_id: "member-3",
      },
    ])
    expect(mock.updatesOf(members).at(-1)?.values).toEqual({
      father_member_id: "member-1",
      father_name: "Juan Dela Cruz",
    })
  })

  it("back-fills the child's mother for female members", async () => {
    mock.queueInsert(members, [createdMember()])
    mock.queueInsert(commitments, [{ id: "commitment-1" }])

    await coreCreateMember(
      JSON.stringify({
        ...minimalPayload,
        gender: "Female",
        children: [{ name: "Ana", child_member_id: "member-3" }],
      })
    )

    expect(mock.updatesOf(members).at(-1)?.values).toEqual({
      mother_member_id: "member-1",
      mother_name: "Juan Dela Cruz",
    })
    const childValues = mock.insertsInto(children)[0].values as Record<string, unknown>[]
    expect(childValues[0].birth_date).toBeNull()
  })

  it("adds a reciprocal sibling entry for member siblings", async () => {
    mock.queueInsert(members, [createdMember()])
    mock.queueInsert(commitments, [{ id: "commitment-1" }])
    mock.queueSelect(members, [{ siblings: [{ name: "Pedro", sibling_member_id: "member-9" }] }])

    await coreCreateMember(
      JSON.stringify({
        ...minimalPayload,
        siblings: [{ name: "Maria", sibling_member_id: "member-4" }, { name: "Non-member" }],
      })
    )

    expect(mock.updatesOf(members).at(-1)?.values).toEqual({
      siblings: [
        { name: "Pedro", sibling_member_id: "member-9" },
        {
          name: "Juan Dela Cruz",
          birth_date: "1990-01-15",
          sibling_is_member: true,
          sibling_member_id: "member-1",
        },
      ],
    })
  })

  it("does not duplicate an existing reciprocal sibling entry", async () => {
    mock.queueInsert(members, [createdMember()])
    mock.queueInsert(commitments, [{ id: "commitment-1" }])
    mock.queueSelect(members, [{ siblings: [{ sibling_member_id: "member-1" }] }])

    await coreCreateMember(
      JSON.stringify({ ...minimalPayload, siblings: [{ sibling_member_id: "member-4" }] })
    )

    expect(mock.updatesOf(members)).toHaveLength(0)
  })

  it("throws when the member row cannot be created", async () => {
    mock.queueInsert(members, [])

    await expect(coreCreateMember(JSON.stringify(minimalPayload))).rejects.toThrow(
      "Failed to create member"
    )
  })
})

describe("createMember", () => {
  it("revalidates the affected pages and redirects to the new profile", async () => {
    mock.queueInsert(members, [createdMember()])
    mock.queueInsert(commitments, [{ id: "commitment-1" }])

    await createMember(JSON.stringify(minimalPayload))

    expect(revalidatePath).toHaveBeenCalledWith("/members")
    expect(revalidatePath).toHaveBeenCalledWith("/commitments")
    expect(redirect).toHaveBeenCalledWith("/members/member-1")
  })
})

describe("coreUpdateMember", () => {
  const updatePayload = { ...minimalPayload, id: "member-1" }

  beforeEach(() => {
    // every update path ends up reading back a commitment row for the year
    mock.queueInsert(commitments, [{ id: "commitment-auto" }])
  })

  it("returns the edited member id and keeps the stored role when none is sent", async () => {
    mock.queueSelect(members, [{ church_role: "Deacon", spouse_member_id: null, siblings: [] }])

    expect(await coreUpdateMember(JSON.stringify(updatePayload))).toBe("member-1")
    expect(mock.updatesOf(members)[0].values.church_role).toBe("Deacon")
  })

  it("defaults the role to Member for an unknown member", async () => {
    await coreUpdateMember(JSON.stringify(updatePayload))
    expect(mock.updatesOf(members)[0].values.church_role).toBe("Member")
  })

  it("promotes the member into the existing root org chart node", async () => {
    mock.queueSelect(org_chart_nodes, [{ id: "node-root" }])

    await coreUpdateMember(JSON.stringify({ ...updatePayload, church_role: "Main Pastor" }))

    expect(mock.updatesOf(members)[0].values).toEqual({ church_role: "Member" })
    expect(mock.updatesOf(org_chart_nodes)[0].values).toEqual({
      member_id: "member-1",
      role_title: "Main Pastor",
    })
    expect(mock.insertsInto(org_chart_nodes)).toHaveLength(0)
  })

  it("creates a root org chart node when none exists yet", async () => {
    mock.queueSelect(org_chart_nodes, [])

    await coreUpdateMember(JSON.stringify({ ...updatePayload, church_role: "Main Pastor" }))

    expect(mock.insertsInto(org_chart_nodes)[0].values).toEqual({
      role_title: "Main Pastor",
      member_id: "member-1",
      parent_id: null,
      sort_order: 0,
    })
  })

  it("reuses the current year commitment and clears its old pledges", async () => {
    vi.setSystemTime(new Date("2026-02-02T00:00:00Z"))
    mock.queueSelect(
      members,
      [{ church_role: "Member", spouse_member_id: null, siblings: [] }]
    )
    mock.queueSelect(commitments, [{ id: "commitment-7" }])

    await coreUpdateMember(
      JSON.stringify({ ...updatePayload, ministries: ["min-1"], offerings: ["off-1"] })
    )

    expect(mock.insertsInto(commitments)).toHaveLength(0)
    expect(mock.deletesFrom(commitment_ministries)).toHaveLength(1)
    expect(mock.deletesFrom(commitment_offerings)).toHaveLength(1)
    expect(mock.insertsInto(commitment_ministries)[0].values).toEqual([
      { commitment_id: "commitment-7", ministry_id: "min-1" },
    ])
    expect(mock.insertsInto(commitment_offerings)[0].values).toEqual([
      { commitment_id: "commitment-7", offering_category_id: "off-1" },
    ])
  })

  it("creates a commitment for the year when the member has none", async () => {
    vi.setSystemTime(new Date("2026-02-02T00:00:00Z"))
    mock.queueSelect(members, [{ church_role: "Member", spouse_member_id: null, siblings: [] }])
    mock.queueSelect(commitments, [])

    await coreUpdateMember(JSON.stringify({ ...updatePayload, ministries: ["min-1"] }))

    expect(mock.insertsInto(commitments)[0].values).toEqual({
      member_id: "member-1",
      year: 2026,
    })
    expect(mock.insertsInto(commitment_ministries)[0].values).toEqual([
      { commitment_id: "commitment-auto", ministry_id: "min-1" },
    ])
  })

  it("unlinks a replaced spouse and links the new one", async () => {
    mock.queueSelect(members, [
      { church_role: "Member", spouse_member_id: "member-old", siblings: [] },
    ])

    await coreUpdateMember(
      JSON.stringify({ ...updatePayload, spouse_member_id: "member-new" })
    )

    const spouseUpdates = mock.updatesOf(members).slice(1)
    expect(spouseUpdates[0].values).toEqual({ spouse_member_id: null, spouse_name: "" })
    expect(spouseUpdates[1].values).toEqual({
      spouse_member_id: "member-1",
      spouse_name: "Juan Dela Cruz",
      marital_status: "Married",
      anniversary_date: null,
    })
  })

  it("keeps an unchanged spouse linked without unlinking", async () => {
    mock.queueSelect(members, [
      { church_role: "Member", spouse_member_id: "member-2", siblings: [] },
    ])

    await coreUpdateMember(JSON.stringify({ ...updatePayload, spouse_member_id: "member-2" }))

    const spouseUpdates = mock.updatesOf(members).slice(1)
    expect(spouseUpdates).toHaveLength(1)
    expect(spouseUpdates[0].values.spouse_member_id).toBe("member-1")
  })

  it("replaces the children rows and mirrors them to the spouse", async () => {
    mock.queueSelect(members, [
      { church_role: "Member", spouse_member_id: null, siblings: [] },
    ])

    await coreUpdateMember(
      JSON.stringify({
        ...updatePayload,
        spouse_member_id: "member-2",
        children: [{ name: "Ana" }],
      })
    )

    expect(mock.deletesFrom(children)).toHaveLength(2)
    expect(mock.insertsInto(children).map((i) => i.values)).toEqual([
      [{ member_id: "member-1", name: "Ana", birth_date: null, child_member_id: null }],
      [{ member_id: "member-2", name: "Ana", birth_date: null, child_member_id: null }],
    ])
  })

  it("recomputes years_in_church from the membership date", async () => {
    vi.setSystemTime(new Date("2026-07-30T12:00:00Z"))
    mock.queueSelect(members, [{ church_role: "Member", spouse_member_id: null, siblings: [] }])

    await coreUpdateMember(JSON.stringify({ ...updatePayload, membership_date: "2019-07-30" }))

    expect(mock.updatesOf(members)[0].values.years_in_church).toBe(7)
  })

  it("back-fills the child's parent when children are edited", async () => {
    mock.queueSelect(members, [{ church_role: "Member", spouse_member_id: null, siblings: [] }])

    await coreUpdateMember(
      JSON.stringify({
        ...updatePayload,
        gender: "Female",
        children: [{ name: "Ana", child_member_id: "member-3" }],
      })
    )

    expect(mock.updatesOf(members).at(-1)?.values).toEqual({
      mother_member_id: "member-1",
      mother_name: "Juan Dela Cruz",
    })
  })

  it("syncs added and removed siblings in both directions", async () => {
    mock.queueSelect(
      members,
      // the member being edited
      [
        {
          church_role: "Member",
          spouse_member_id: null,
          siblings: [{ sibling_member_id: "member-removed" }],
        },
      ],
      // the newly added sibling
      [{ siblings: [] }],
      // the removed sibling, who still points back at this member
      [{ siblings: [{ sibling_member_id: "member-1" }, { sibling_member_id: "member-x" }] }]
    )

    await coreUpdateMember(
      JSON.stringify({ ...updatePayload, siblings: [{ sibling_member_id: "member-added" }] })
    )

    const siblingUpdates = mock
      .updatesOf(members)
      .filter((u) => Object.keys(u.values).length === 1 && "siblings" in u.values)
    expect(siblingUpdates[0].values.siblings).toEqual([
      {
        name: "Juan Dela Cruz",
        birth_date: "",
        sibling_is_member: true,
        sibling_member_id: "member-1",
      },
    ])
    expect(siblingUpdates[1].values.siblings).toEqual([{ sibling_member_id: "member-x" }])
  })
})

describe("updateMember", () => {
  it("revalidates the list and profile then redirects to the profile", async () => {
    mock.queueSelect(members, [{ church_role: "Member", spouse_member_id: null, siblings: [] }])
    mock.queueInsert(commitments, [{ id: "commitment-auto" }])

    await updateMember(JSON.stringify({ ...minimalPayload, id: "member-1" }))

    expect(revalidatePath).toHaveBeenCalledWith("/members")
    expect(revalidatePath).toHaveBeenCalledWith("/members/member-1")
    expect(redirect).toHaveBeenCalledWith("/members/member-1")
  })
})

describe("getMembersList", () => {
  it("returns the selected directory columns", async () => {
    mock.queueSelect(members, [{ id: "member-1", first_name: "Juan", last_name: "Dela Cruz" }])

    expect(await getMembersList()).toEqual([
      { id: "member-1", first_name: "Juan", last_name: "Dela Cruz" },
    ])
  })

  it("returns an empty list for an empty directory", async () => {
    mock.queueSelect(members, [])
    expect(await getMembersList()).toEqual([])
  })
})

describe("deleteMember", () => {
  it("deletes the member, revalidates and redirects to the list", async () => {
    await deleteMember("member-1")

    expect(mock.deletesFrom(members)).toHaveLength(1)
    expect(revalidatePath).toHaveBeenCalledWith("/members")
    expect(redirect).toHaveBeenCalledWith("/members")
  })
})

describe("checkMainPastorExists", () => {
  it("returns the incumbent Main Pastor", async () => {
    mock.queueSelect(members, [{ id: "member-1", first_name: "Juan", last_name: "Dela Cruz" }])

    expect(await checkMainPastorExists()).toEqual({
      id: "member-1",
      first_name: "Juan",
      last_name: "Dela Cruz",
    })
  })

  it("returns null when the role is vacant", async () => {
    mock.queueSelect(members, [])
    expect(await checkMainPastorExists()).toBeNull()
  })
})

describe("generateInviteLink", () => {
  it("issues a 64 character hex token expiring in 30 minutes by default", async () => {
    vi.setSystemTime(new Date("2026-07-30T12:00:00Z"))

    const token = await generateInviteLink()

    expect(token).toMatch(/^[0-9a-f]{64}$/)
    const values = mock.insertsInto(invitation_links)[0].values as Record<string, unknown>
    expect(values.token).toBe(token)
    expect(values.expires_at).toEqual(new Date("2026-07-30T12:30:00Z"))
    expect(values.use_count).toBe(0)
    expect(values.is_used).toBe(false)
    expect(values.is_disabled).toBe(false)
  })

  it("honours a custom expiration window", async () => {
    vi.setSystemTime(new Date("2026-07-30T12:00:00Z"))

    await generateInviteLink({ expirationMinutes: 120 })

    const values = mock.insertsInto(invitation_links)[0].values as Record<string, unknown>
    expect(values.expires_at).toEqual(new Date("2026-07-30T14:00:00Z"))
  })

  it("treats a bare string argument as an edit link for that member", async () => {
    await generateInviteLink("member-1")

    const values = mock.insertsInto(invitation_links)[0].values as Record<string, unknown>
    expect(values.member_id).toBe("member-1")
    expect(values.max_uses).toBe(1)
  })

  it("defaults batch registration links to 50 uses", async () => {
    await generateInviteLink({ title: "Youth camp" })

    const values = mock.insertsInto(invitation_links)[0].values as Record<string, unknown>
    expect(values.member_id).toBeNull()
    expect(values.title).toBe("Youth camp")
    expect(values.max_uses).toBe(50)
  })

  it("treats maxUses 0 as unlimited", async () => {
    await generateInviteLink({ maxUses: 0 })

    expect((mock.insertsInto(invitation_links)[0].values as Record<string, unknown>).max_uses)
      .toBeNull()
  })

  it("keeps an explicit use limit", async () => {
    await generateInviteLink({ maxUses: 5 })

    expect((mock.insertsInto(invitation_links)[0].values as Record<string, unknown>).max_uses)
      .toBe(5)
  })

  it("locks Main Pastor links to a single use when the role is vacant", async () => {
    mock.queueSelect(members, [])

    await generateInviteLink({ presetRole: "Main Pastor", maxUses: 20 })

    expect((mock.insertsInto(invitation_links)[0].values as Record<string, unknown>).max_uses)
      .toBe(1)
  })

  it("refuses to issue a Main Pastor link while one is assigned", async () => {
    mock.queueSelect(members, [{ id: "member-1" }])

    await expect(generateInviteLink({ presetRole: "Main Pastor" })).rejects.toThrow(
      "Cannot generate link for Main Pastor: A Main Pastor is already assigned."
    )
    expect(mock.insertsInto(invitation_links)).toHaveLength(0)
  })

  it("stores the preset mission", async () => {
    await generateInviteLink({ presetRole: "Member", presetMissionId: "mission-1" })

    const values = mock.insertsInto(invitation_links)[0].values as Record<string, unknown>
    expect(values.preset_role).toBe("Member")
    expect(values.preset_mission_id).toBe("mission-1")
  })
})

describe("revokeInviteLink", () => {
  it("disables the link and revalidates the members page", async () => {
    await revokeInviteLink("token-1")

    expect(mock.updatesOf(invitation_links)[0].values).toEqual({ is_disabled: true })
    expect(revalidatePath).toHaveBeenCalledWith("/members")
  })
})

describe("getActiveInvitationLinks", () => {
  it("serializes timestamps to ISO strings", async () => {
    mock.queueSelect(invitation_links, [
      {
        token: "token-1",
        expires_at: new Date("2026-07-30T12:30:00Z"),
        created_at: new Date("2026-07-30T12:00:00Z"),
      },
    ])

    expect(await getActiveInvitationLinks()).toEqual([
      {
        token: "token-1",
        expires_at: "2026-07-30T12:30:00.000Z",
        created_at: "2026-07-30T12:00:00.000Z",
      },
    ])
  })

  it("tolerates a missing created_at", async () => {
    mock.queueSelect(invitation_links, [
      { token: "token-1", expires_at: new Date("2026-07-30T12:30:00Z"), created_at: null },
    ])

    expect((await getActiveInvitationLinks("member-1"))[0].created_at).toBeNull()
  })
})

describe("getInviteDetails", () => {
  const validInvite = (overrides: Record<string, unknown> = {}) => ({
    token: "token-1",
    member_id: null,
    title: null,
    max_uses: 50,
    use_count: 0,
    preset_role: null,
    preset_mission_id: null,
    is_disabled: false,
    expires_at: new Date(Date.now() + 60_000),
    is_used: false,
    mission_name: null,
    ...overrides,
  })

  it("rejects an unknown token", async () => {
    mock.queueSelect(invitation_links, [])
    expect(await getInviteDetails("nope")).toEqual({ error: "Invalid or revoked link" })
  })

  it("rejects a revoked link", async () => {
    mock.queueSelect(invitation_links, [validInvite({ is_disabled: true })])
    expect(await getInviteDetails("token-1")).toEqual({ error: "Invalid or revoked link" })
  })

  it("rejects a link that hit its usage limit", async () => {
    mock.queueSelect(invitation_links, [validInvite({ is_used: true })])
    expect(await getInviteDetails("token-1")).toEqual({ error: "Link usage limit reached" })

    mock.reset()
    mock.queueSelect(invitation_links, [validInvite({ max_uses: 2, use_count: 2 })])
    expect(await getInviteDetails("token-1")).toEqual({ error: "Link usage limit reached" })
  })

  it("allows an unlimited link with many uses", async () => {
    mock.queueSelect(invitation_links, [validInvite({ max_uses: null, use_count: 99 })])
    expect(await getInviteDetails("token-1")).toEqual({
      type: "new",
      preset_role: null,
      preset_mission_id: null,
      mission_name: null,
      title: null,
    })
  })

  it("rejects an expired link", async () => {
    mock.queueSelect(invitation_links, [
      validInvite({ expires_at: new Date(Date.now() - 60_000) }),
    ])
    expect(await getInviteDetails("token-1")).toEqual({ error: "Link expired" })
  })

  it("returns registration presets for a new-member link", async () => {
    mock.queueSelect(invitation_links, [
      validInvite({
        preset_role: "Missionary",
        preset_mission_id: "mission-1",
        mission_name: "Iba Outreach",
        title: "Iba sign-up",
      }),
    ])

    expect(await getInviteDetails("token-1")).toEqual({
      type: "new",
      preset_role: "Missionary",
      preset_mission_id: "mission-1",
      mission_name: "Iba Outreach",
      title: "Iba sign-up",
    })
  })

  it("returns the member for an edit link", async () => {
    mock.queueSelect(invitation_links, [validInvite({ member_id: "member-1" })])
    mock.queueSelect(members, [{ first_name: "Juan", last_name: "Dela Cruz" }])

    expect(await getInviteDetails("token-1")).toEqual({
      type: "edit",
      member_id: "member-1",
      first_name: "Juan",
      last_name: "Dela Cruz",
    })
  })

  it("errors when the edit link points at a deleted member", async () => {
    mock.queueSelect(invitation_links, [validInvite({ member_id: "member-1" })])
    mock.queueSelect(members, [])

    expect(await getInviteDetails("token-1")).toEqual({ error: "Member not found" })
  })
})

describe("verifyDobAndGetMember", () => {
  const editInvite = (overrides: Record<string, unknown> = {}) => ({
    token: "token-1",
    member_id: "member-1",
    is_disabled: false,
    is_used: false,
    expires_at: new Date(Date.now() + 60_000),
    ...overrides,
  })

  it("rejects invalid, revoked, used or expired links", async () => {
    for (const invite of [
      [],
      [editInvite({ is_disabled: true })],
      [editInvite({ is_used: true })],
      [editInvite({ expires_at: new Date(Date.now() - 1000) })],
    ]) {
      mock.reset()
      mock.queueSelect(invitation_links, invite)
      expect(await verifyDobAndGetMember("token-1", "1990-01-15")).toEqual({
        error: "Invalid or expired link",
      })
    }
  })

  it("rejects a registration link", async () => {
    mock.queueSelect(invitation_links, [editInvite({ member_id: null })])
    expect(await verifyDobAndGetMember("token-1", "1990-01-15")).toEqual({
      error: "Not an edit link",
    })
  })

  it("errors when the member no longer exists", async () => {
    mock.queueSelect(invitation_links, [editInvite()])
    mock.queueSelect(members, [])
    expect(await verifyDobAndGetMember("token-1", "1990-01-15")).toEqual({
      error: "Member not found",
    })
  })

  it("rejects a mismatched date of birth", async () => {
    mock.queueSelect(invitation_links, [editInvite()])
    mock.queueSelect(members, [{ id: "member-1", birth_date: "1990-01-15" }])

    expect(await verifyDobAndGetMember("token-1", "1991-01-15")).toEqual({
      error: "Incorrect Date of Birth",
    })
  })

  it("returns the member with merged ministries and offerings on success", async () => {
    vi.setSystemTime(new Date("2026-04-04T00:00:00Z"))
    mock.queueSelect(invitation_links, [editInvite()])
    mock.queueSelect(members, [{ id: "member-1", birth_date: "1990-01-15" }])
    mock.queueSelect(member_ministries, [{ id: "min-1" }])
    mock.queueSelect(commitments, [{ id: "commitment-1" }])
    mock.queueSelect(commitment_ministries, [{ ministry_id: "min-1" }, { ministry_id: "min-2" }])
    mock.queueSelect(commitment_offerings, [{ offering_category_id: "off-1" }])

    expect(await verifyDobAndGetMember("token-1", "1990-01-15")).toEqual({
      success: true,
      member: {
        id: "member-1",
        birth_date: "1990-01-15",
        ministries: ["min-1", "min-2"],
        offerings: ["off-1"],
      },
    })
  })

  it("returns only the global ministries when there is no commitment yet", async () => {
    mock.queueSelect(invitation_links, [editInvite()])
    mock.queueSelect(members, [{ id: "member-1", birth_date: "1990-01-15" }])
    mock.queueSelect(member_ministries, [{ id: "min-1" }])
    mock.queueSelect(commitments, [])

    const result = await verifyDobAndGetMember("token-1", "1990-01-15")
    expect(result).toMatchObject({ success: true, member: { ministries: ["min-1"], offerings: [] } })
  })
})

describe("submitInviteForm", () => {
  const invite = (overrides: Record<string, unknown> = {}) => ({
    token: "token-1",
    member_id: null,
    max_uses: 50,
    use_count: 0,
    is_disabled: false,
    is_used: false,
    expires_at: new Date(Date.now() + 60_000),
    ...overrides,
  })

  it("rejects an unknown or revoked link", async () => {
    mock.queueSelect(invitation_links, [])
    await expect(submitInviteForm("token-1", "{}")).rejects.toThrow("Link is invalid or revoked")

    mock.reset()
    mock.queueSelect(invitation_links, [invite({ is_disabled: true })])
    await expect(submitInviteForm("token-1", "{}")).rejects.toThrow("Link is invalid or revoked")
  })

  it("rejects a link that hit its usage limit", async () => {
    mock.queueSelect(invitation_links, [invite({ max_uses: 1, use_count: 1 })])
    await expect(submitInviteForm("token-1", "{}")).rejects.toThrow("Link usage limit reached")
  })

  it("rejects an expired link", async () => {
    mock.queueSelect(invitation_links, [invite({ expires_at: new Date(Date.now() - 1000) })])
    await expect(submitInviteForm("token-1", "{}")).rejects.toThrow("Link is expired")
  })

  it("updates the linked member and burns an edit link", async () => {
    mock.queueSelect(invitation_links, [invite({ member_id: "member-1", max_uses: 1 })])
    mock.queueSelect(members, [{ church_role: "Member", spouse_member_id: null, siblings: [] }])
    mock.queueInsert(commitments, [{ id: "commitment-auto" }])

    await submitInviteForm("token-1", JSON.stringify(minimalPayload))

    expect(mock.updatesOf(members)[0].values.first_name).toBe("Juan")
    expect(mock.updatesOf(invitation_links)[0].values).toEqual({ is_used: true, use_count: 1 })
  })

  it("creates a member with the preset role and increments the use count", async () => {
    mock.queueSelect(invitation_links, [invite({ preset_role: "Missionary", use_count: 3 })])
    mock.queueInsert(members, [createdMember()])
    mock.queueInsert(commitments, [{ id: "commitment-1" }])

    await submitInviteForm("token-1", JSON.stringify({ ...minimalPayload, church_role: "Member" }))

    expect((mock.insertsInto(members)[0].values as Record<string, unknown>).church_role).toBe(
      "Missionary"
    )
    expect(mock.updatesOf(invitation_links)[0].values).toEqual({ use_count: 4, is_used: false })
  })

  it("marks a batch link as used once the final slot is taken", async () => {
    mock.queueSelect(invitation_links, [invite({ max_uses: 4, use_count: 3 })])
    mock.queueInsert(members, [createdMember()])
    mock.queueInsert(commitments, [{ id: "commitment-1" }])

    await submitInviteForm("token-1", JSON.stringify(minimalPayload))

    expect(mock.updatesOf(invitation_links)[0].values).toEqual({ use_count: 4, is_used: true })
  })

  it("never marks an unlimited link as used", async () => {
    mock.queueSelect(invitation_links, [invite({ max_uses: null, use_count: 10 })])
    mock.queueInsert(members, [createdMember()])
    mock.queueInsert(commitments, [{ id: "commitment-1" }])

    await submitInviteForm("token-1", JSON.stringify(minimalPayload))

    expect(mock.updatesOf(invitation_links)[0].values).toEqual({ use_count: 11, is_used: false })
  })
})
