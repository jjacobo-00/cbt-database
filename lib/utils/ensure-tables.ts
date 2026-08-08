import { db } from "@/db"
import { sql } from "drizzle-orm"

/**
 * Ensures the member_permissions table exists in Postgres.
 * Safe to call idempotently on server actions.
 */
export async function ensureMemberPermissionsTable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "member_permissions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "member_id" uuid NOT NULL UNIQUE REFERENCES "members"("id") ON DELETE CASCADE,
        "can_manage_attendance" boolean NOT NULL DEFAULT false,
        "attendance_ministry_ids" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "can_manage_members" boolean NOT NULL DEFAULT false,
        "can_manage_offerings" boolean NOT NULL DEFAULT false,
        "can_view_reports" boolean NOT NULL DEFAULT false,
        "notes" text,
        "created_at" timestamp with time zone DEFAULT now(),
        "updated_at" timestamp with time zone DEFAULT now()
      );
    `)
  } catch (error) {
    console.error("[ensureMemberPermissionsTable] Error:", error)
  }
}
