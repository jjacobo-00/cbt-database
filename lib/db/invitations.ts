import { invitation_links, missions } from "@/db/schema"

/** Columns shared by every invitation-link read, joined with the preset mission name. */
export const invitationLinkColumns = {
  token: invitation_links.token,
  member_id: invitation_links.member_id,
  title: invitation_links.title,
  max_uses: invitation_links.max_uses,
  use_count: invitation_links.use_count,
  preset_role: invitation_links.preset_role,
  preset_mission_id: invitation_links.preset_mission_id,
  is_disabled: invitation_links.is_disabled,
  expires_at: invitation_links.expires_at,
  is_used: invitation_links.is_used,
  created_at: invitation_links.created_at,
  mission_name: missions.name,
}

type InviteUsability = {
  is_disabled: boolean | null
  is_used: boolean | null
  max_uses: number | null
  use_count: number | null
  expires_at: Date | string
}

/** Why an invite cannot be used, or null when it is still usable. */
export function getInviteUsabilityError(invite: InviteUsability | undefined) {
  if (!invite || invite.is_disabled) return "Invalid or revoked link"
  if (invite.is_used || (invite.max_uses && (invite.use_count || 0) >= invite.max_uses)) return "Link usage limit reached"
  if (new Date() > new Date(invite.expires_at)) return "Link expired"
  return null
}
