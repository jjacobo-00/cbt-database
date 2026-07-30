import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createDbMock } from "../support/mock-db"

const mock = createDbMock()
const revalidatePath = vi.fn()

vi.mock("@/db", () => ({ db: mock.db }))
vi.mock("next/cache", () => ({ revalidatePath: (path: string) => revalidatePath(path) }))

const { addOrgNode, deleteOrgNode, updateOrgNode } = await import("@/app/actions/org-chart")
const { org_chart_nodes } = await import("@/db/schema")

beforeEach(() => {
  mock.reset()
  revalidatePath.mockClear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("addOrgNode", () => {
  it("inserts the node and revalidates the org chart", async () => {
    const result = await addOrgNode({
      role_title: "Deacon",
      member_id: "member-1",
      parent_id: "node-1",
      sort_order: 3,
    })

    expect(result).toEqual({ success: true })
    expect(mock.inserts).toEqual([
      {
        table: org_chart_nodes,
        values: {
          role_title: "Deacon",
          member_id: "member-1",
          parent_id: "node-1",
          sort_order: 3,
        },
      },
    ])
    expect(revalidatePath).toHaveBeenCalledWith("/org-chart")
  })

  it("defaults sort_order to 0 and normalizes empty ids to null", async () => {
    await addOrgNode({ role_title: "Root", member_id: "", parent_id: "" })

    expect(mock.inserts[0].values).toEqual({
      role_title: "Root",
      member_id: null,
      parent_id: null,
      sort_order: 0,
    })
  })

  it("returns the error message and skips revalidation when the insert fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    mock.queueInsert(org_chart_nodes, new Error("insert boom"))

    expect(await addOrgNode({ role_title: "Deacon", member_id: null, parent_id: null })).toEqual({
      success: false,
      error: "insert boom",
    })
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})

describe("updateOrgNode", () => {
  it("updates only the editable fields for the given node", async () => {
    const result = await updateOrgNode("node-9", {
      role_title: "Elder",
      member_id: "member-2",
      parent_id: "node-1",
    })

    expect(result).toEqual({ success: true })
    expect(mock.updates).toHaveLength(1)
    expect(mock.updates[0].table).toBe(org_chart_nodes)
    expect(mock.updates[0].values).toEqual({
      role_title: "Elder",
      member_id: "member-2",
      parent_id: "node-1",
    })
    expect(revalidatePath).toHaveBeenCalledWith("/org-chart")
  })

  it("clears the member and parent when passed empty ids", async () => {
    await updateOrgNode("node-9", { role_title: "Elder", member_id: "", parent_id: "" })

    expect(mock.updates[0].values).toEqual({
      role_title: "Elder",
      member_id: null,
      parent_id: null,
    })
  })

  it("reports failures instead of throwing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    mock.db.update.mockImplementationOnce(() => {
      throw new Error("update boom")
    })

    expect(
      await updateOrgNode("node-9", { role_title: "Elder", member_id: null, parent_id: null })
    ).toEqual({ success: false, error: "update boom" })
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})

describe("deleteOrgNode", () => {
  it("deletes the node and revalidates the org chart", async () => {
    const result = await deleteOrgNode("node-4")

    expect(result).toEqual({ success: true })
    expect(mock.deletes).toHaveLength(1)
    expect(mock.deletes[0].table).toBe(org_chart_nodes)
    expect(revalidatePath).toHaveBeenCalledWith("/org-chart")
  })

  it("reports failures instead of throwing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    mock.db.delete.mockImplementationOnce(() => {
      throw new Error("delete boom")
    })

    expect(await deleteOrgNode("node-4")).toEqual({ success: false, error: "delete boom" })
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
