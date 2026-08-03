import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  try {
    await sql`
      ALTER TABLE ministries 
      ADD COLUMN IF NOT EXISTS leader_id UUID REFERENCES members(id) ON DELETE SET NULL;
    `;
    console.log("Successfully added leader_id column to ministries table in Neon Postgres!");
  } catch (e: any) {
    console.error("Error adding leader_id column:", e);
  }
}

main();
