import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function run() {
  const missions = await sql`SELECT id, name, location, pastor_id, pastor_name, status FROM missions`;
  console.log("=== MISSIONS ===");
  console.log(JSON.stringify(missions, null, 2));

  const membersWithMissions = await sql`SELECT id, first_name, last_name, mission_id, church_role FROM members WHERE mission_id IS NOT NULL`;
  console.log("=== MEMBERS WITH MISSION_ID ===");
  console.log(JSON.stringify(membersWithMissions, null, 2));
}

run().catch(console.error);
