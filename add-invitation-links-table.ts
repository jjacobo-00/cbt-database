import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  await sql`
      CREATE TABLE IF NOT EXISTS invitation_links (
        token TEXT PRIMARY KEY,
        member_id UUID REFERENCES members(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        is_used BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
  `;
  console.log("Successfully created invitation_links table");
}

main().catch((e) => {
  console.error("Error creating invitation_links table:", e);
  process.exit(1);
});
