"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { members, member_ministries, commitments, commitment_ministries, commitment_offerings, invitation_links, children, org_chart_nodes, missions } from "@/db/schema"
import crypto from "crypto"
import { eq, and, gt, desc, isNull, ne } from "drizzle-orm"
import {
  addReciprocalSibling,
  buildMemberValues,
  linkChildToParent,
  linkSpouse,
  removeReciprocalSibling,
  resolveMinistryIds,
  toChildRows,
  unlinkSpouse,
} from "@/lib/db/members"
import { replaceCommitmentAssignments } from "@/lib/db/commitments"
import { getInviteUsabilityError, invitationLinkColumns } from "@/lib/db/invitations"
import { getCurrentYear, getFullName } from "@/lib/utils/format"

export async function coreCreateMember(payloadStr: string) {
  const data = JSON.parse(payloadStr)

  if (data.church_role === "Main Pastor") {
    await db.update(members).set({ church_role: "Member" }).where(eq(members.church_role, "Main Pastor"))
  }

  const [member] = await db.insert(members).values({
    ...buildMemberValues(data),
    gender: data.gender,
    church_role: data.church_role || "Member",
  }).returning()

  if (!member) {
    throw new Error("Failed to create member")
  }

  // Selected ministries merged with the "for everyone" ministries
  const selectedOfferings: string[] = data.offerings || []
  const allMinistryIds = await resolveMinistryIds(data.ministries || [])

  if (allMinistryIds.length > 0) {
    await db.insert(member_ministries).values(
      allMinistryIds.map(mid => ({
        member_id: member.id,
        ministry_id: mid,
      }))
    ).onConflictDoNothing()
  }

  // Create commitment for current year
  const [commitment] = await db.insert(commitments).values({
    member_id: member.id,
    year: getCurrentYear(),
  }).returning()

  if (commitment && allMinistryIds.length > 0) {
    await db.insert(commitment_ministries).values(
      allMinistryIds.map(mid => ({ commitment_id: commitment.id, ministry_id: mid }))
    )
  }

  if (commitment && selectedOfferings.length > 0) {
    await db.insert(commitment_offerings).values(
      selectedOfferings.map(oid => ({ commitment_id: commitment.id, offering_category_id: oid }))
    )
  }

  // TWO-WAY SPOUSE SYNC
  if (data.spouse_member_id) {
    await linkSpouse(data.spouse_member_id, member, data)
  }

  // PROCESS CHILDREN
  if (Array.isArray(data.children) && data.children.length > 0) {
    await db.insert(children).values(toChildRows(member.id, data.children))

    // Auto-sync to spouse if married
    if (data.spouse_member_id) {
      await db.insert(children).values(toChildRows(data.spouse_member_id, data.children))
    }

    // TWO-WAY CHILD SYNC (Update child's parents)
    for (const c of data.children) {
      if (c.child_member_id) {
        await linkChildToParent(c.child_member_id, { id: member.id, name: getFullName(member), gender: data.gender })
      }
    }
  }

  // TWO-WAY SIBLING SYNC
  if (Array.isArray(data.siblings)) {
    for (const s of data.siblings) {
      if (s.sibling_member_id) {
        await addReciprocalSibling(s.sibling_member_id, {
          name: getFullName(member),
          birth_date: member.birth_date || "",
          sibling_is_member: true,
          sibling_member_id: member.id,
        })
      }
    }
  }

  return member.id
}

export async function createMember(payloadStr: string) {
  const memberId = await coreCreateMember(payloadStr)
  revalidatePath("/members")
  revalidatePath("/commitments")
  redirect(`/members/${memberId}`)
}

export async function coreUpdateMember(payloadStr: string) {
  const data = JSON.parse(payloadStr)
  const id = data.id

  if (data.church_role === "Main Pastor") {
    await db.update(members).set({ church_role: "Member" }).where(and(eq(members.church_role, "Main Pastor"), ne(members.id, id)))
    const existingNodes = await db.select().from(org_chart_nodes).where(isNull(org_chart_nodes.parent_id))
    if (existingNodes.length > 0) {
      await db.update(org_chart_nodes).set({ member_id: id, role_title: "Main Pastor" }).where(eq(org_chart_nodes.id, existingNodes[0].id))
    } else {
      await db.insert(org_chart_nodes).values({ role_title: "Main Pastor", member_id: id, parent_id: null, sort_order: 0 })
    }
  }

  const [existingMember] = await db.select({ spouse_member_id: members.spouse_member_id, siblings: members.siblings, church_role: members.church_role }).from(members).where(eq(members.id, id))

  await db.update(members).set({
    ...buildMemberValues(data),
    church_role: data.church_role || existingMember?.church_role || "Member",
  }).where(eq(members.id, id))

  // Update ministries & offerings for the current year
  const currentYear = getCurrentYear()
  const selectedOfferings: string[] = data.offerings || []
  const allMinistryIds = await resolveMinistryIds(data.ministries || [])

  // Update member_ministries (global active ministries)
  await db.delete(member_ministries).where(eq(member_ministries.member_id, id))
  if (allMinistryIds.length > 0) {
    await db.insert(member_ministries).values(
      allMinistryIds.map(mid => ({ member_id: id, ministry_id: mid }))
    )
  }

  // Find existing commitment for the year
  const existingCommitments = await db
    .select()
    .from(commitments)
    .where(and(eq(commitments.member_id, id), eq(commitments.year, currentYear)))

  let commitmentId: string

  if (existingCommitments.length > 0) {
    commitmentId = existingCommitments[0].id
  } else {
    // Create new commitment
    const [newCommitment] = await db.insert(commitments).values({
      member_id: id,
      year: currentYear,
    }).returning()
    commitmentId = newCommitment.id
  }

  await replaceCommitmentAssignments(commitmentId, allMinistryIds, selectedOfferings)

  // TWO-WAY SPOUSE SYNC
  const newSpouseId = data.spouse_member_id || null
  const oldSpouseId = existingMember?.spouse_member_id || null

  if (oldSpouseId && oldSpouseId !== newSpouseId) {
    await unlinkSpouse(oldSpouseId)
  }

  if (newSpouseId) {
    await linkSpouse(newSpouseId, { id, first_name: data.first_name, last_name: data.last_name }, data)
  }

  // PROCESS CHILDREN
  await db.delete(children).where(eq(children.member_id, id))
  if (Array.isArray(data.children) && data.children.length > 0) {
    await db.insert(children).values(toChildRows(id, data.children))

    // Auto-sync to spouse if married
    if (newSpouseId) {
      await db.delete(children).where(eq(children.member_id, newSpouseId))
      await db.insert(children).values(toChildRows(newSpouseId, data.children))
    }

    // TWO-WAY CHILD SYNC (Update child's parents)
    for (const c of data.children) {
      if (c.child_member_id) {
        await linkChildToParent(c.child_member_id, { id, name: getFullName(data), gender: data.gender })
      }
    }
  }

  // TWO-WAY SIBLING SYNC (UPDATE)
  const siblingIdsOf = (value: unknown) =>
    (Array.isArray(value) ? value : []).map((s: any) => s.sibling_member_id).filter(Boolean)

  const oldSiblingIds = siblingIdsOf(existingMember?.siblings)
  const newSiblingIds = siblingIdsOf(data.siblings)

  for (const siblingId of newSiblingIds.filter(sid => !oldSiblingIds.includes(sid))) {
    await addReciprocalSibling(siblingId, {
      name: getFullName(data),
      birth_date: data.birth_date || "",
      sibling_is_member: true,
      sibling_member_id: id,
    })
  }

  for (const siblingId of oldSiblingIds.filter(sid => !newSiblingIds.includes(sid))) {
    await removeReciprocalSibling(siblingId, id)
  }

  return id
}

export async function updateMember(payloadStr: string) {
  const memberId = await coreUpdateMember(payloadStr)
  revalidatePath("/members")
  revalidatePath(`/members/${memberId}`)
  redirect(`/members/${memberId}`)
}

export async function deleteMember(id: string) {
  await db.delete(members).where(eq(members.id, id))
  revalidatePath("/members")
  redirect("/members")
}

// --------------------------------------------------------------------------------------
// INVITATION LINKS (Self-Service)
// --------------------------------------------------------------------------------------

export async function checkMainPastorExists() {
  const existing = await db
    .select({ id: members.id, first_name: members.first_name, last_name: members.last_name })
    .from(members)
    .where(eq(members.church_role, "Main Pastor"))
  return existing.length > 0 ? existing[0] : null
}

export async function generateInviteLink(arg?: string | {
  memberId?: string
  title?: string
  maxUses?: number | null
  presetRole?: string | null
  presetMissionId?: string | null
  expirationMinutes?: number
}) {
  const options = typeof arg === "string" ? { memberId: arg } : arg

  const token = crypto.randomBytes(32).toString("hex")
  const expMinutes = options?.expirationMinutes || 30
  const expiresAt = new Date(Date.now() + expMinutes * 60 * 1000)

  // Safeguard: If presetRole is "Main Pastor", check if a Main Pastor already exists
  if (options?.presetRole === "Main Pastor") {
    const existingMainPastor = await db.select().from(members).where(eq(members.church_role, "Main Pastor"))
    if (existingMainPastor.length > 0) {
      throw new Error("Cannot generate link for Main Pastor: A Main Pastor is already assigned.")
    }
  }

  // Edit links are locked to 1 use. Main Pastor links are locked to 1 use. Default batch is 50.
  const maxUsesVal = options?.memberId ? 1 : (options?.presetRole === "Main Pastor" ? 1 : (options?.maxUses === 0 ? null : (options?.maxUses || 50)))

  await db.insert(invitation_links).values({
    token,
    member_id: options?.memberId || null,
    title: options?.title || null,
    max_uses: maxUsesVal,
    use_count: 0,
    preset_role: options?.presetRole || null,
    preset_mission_id: options?.presetMissionId || null,
    expires_at: expiresAt,
    is_used: false,
    is_disabled: false,
  })

  return token
}

export async function revokeInviteLink(token: string) {
  await db.update(invitation_links).set({ is_disabled: true }).where(eq(invitation_links.token, token))
  revalidatePath("/members")
}

export async function getActiveInvitationLinks(memberId?: string) {
  const now = new Date()
  const links = await db
    .select(invitationLinkColumns)
    .from(invitation_links)
    .leftJoin(missions, eq(invitation_links.preset_mission_id, missions.id))
    .where(
      and(
        memberId ? eq(invitation_links.member_id, memberId) : isNull(invitation_links.member_id),
        eq(invitation_links.is_disabled, false),
        eq(invitation_links.is_used, false),
        gt(invitation_links.expires_at, now)
      )
    )
    .orderBy(desc(invitation_links.created_at))

  return links.map(l => ({
    ...l,
    expires_at: l.expires_at.toISOString(),
    created_at: l.created_at?.toISOString() || null
  }))
}

export async function getInviteDetails(token: string) {
  const [invite] = await db
    .select(invitationLinkColumns)
    .from(invitation_links)
    .leftJoin(missions, eq(invitation_links.preset_mission_id, missions.id))
    .where(eq(invitation_links.token, token))

  const usabilityError = getInviteUsabilityError(invite)
  if (usabilityError) return { error: usabilityError }

  if (invite.member_id) {
    const [member] = await db.select().from(members).where(eq(members.id, invite.member_id))
    if (!member) return { error: "Member not found" }
    return { 
      type: "edit", 
      member_id: invite.member_id,
      first_name: member.first_name,
      last_name: member.last_name
    }
  }

  return { 
    type: "new",
    preset_role: invite.preset_role || null,
    preset_mission_id: invite.preset_mission_id || null,
    mission_name: invite.mission_name || null,
    title: invite.title || null,
  }
}

export async function verifyDobAndGetMember(token: string, dobString: string) {
  const [invite] = await db
    .select()
    .from(invitation_links)
    .where(eq(invitation_links.token, token))

  if (getInviteUsabilityError(invite)) return { error: "Invalid or expired link" }

  if (!invite.member_id) return { error: "Not an edit link" }

  const [member] = await db.select().from(members).where(eq(members.id, invite.member_id))
  
  if (!member) return { error: "Member not found" }
  
  if (member.birth_date !== dobString) {
    return { error: "Incorrect Date of Birth" }
  }

  const minRows = await db
    .select({ id: member_ministries.ministry_id })
    .from(member_ministries)
    .where(eq(member_ministries.member_id, member.id))

  const existingCommitments = await db
    .select()
    .from(commitments)
    .where(and(eq(commitments.member_id, member.id), eq(commitments.year, getCurrentYear())))

  let min = minRows.map(m => m.id)
  let off: string[] = []

  if (existingCommitments.length > 0) {
    const cId = existingCommitments[0].id
    const cMin = await db.select().from(commitment_ministries).where(eq(commitment_ministries.commitment_id, cId))
    const cOff = await db.select().from(commitment_offerings).where(eq(commitment_offerings.commitment_id, cId))
    min = [...new Set([...min, ...cMin.map(m => m.ministry_id)])]
    off = cOff.map(o => o.offering_category_id)
  }

  const memberData = {
    ...member,
    ministries: min,
    offerings: off
  }

  return { success: true, member: memberData }
}

export async function submitInviteForm(token: string, payloadStr: string) {
  const [invite] = await db
    .select()
    .from(invitation_links)
    .where(eq(invitation_links.token, token))

  const usabilityError = getInviteUsabilityError(invite)
  if (usabilityError) {
    throw new Error(usabilityError)
  }

  const data = JSON.parse(payloadStr)

  if (invite.member_id) {
    // Edit link for existing member
    data.id = invite.member_id
    await coreUpdateMember(JSON.stringify(data))
    await db.update(invitation_links).set({ is_used: true, use_count: (invite.use_count || 0) + 1 }).where(eq(invitation_links.token, token))
  } else {
    // Registration link for new member
    if (invite.preset_role) {
      data.church_role = invite.preset_role
    }
    await coreCreateMember(JSON.stringify(data))

    const newUseCount = (invite.use_count || 0) + 1
    const isNowUsed = invite.max_uses ? newUseCount >= invite.max_uses : false
    await db.update(invitation_links).set({ use_count: newUseCount, is_used: isNowUsed }).where(eq(invitation_links.token, token))
  }
}

export async function getMembersList() {
  const result = await db.select({
    id: members.id,
    first_name: members.first_name,
    middle_name: members.middle_name,
    last_name: members.last_name,
    suffix: members.suffix,
    sex: members.sex,
    email: members.email,
    contact_number: members.contact_number,
    position: members.position,
    company: members.company,
    birth_date: members.birth_date
  }).from(members)
  return result
}

