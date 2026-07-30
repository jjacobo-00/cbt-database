import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  try {
    await sql`ALTER TABLE members ADD COLUMN email text`;
    console.log("Successfully added email column");
  } catch (e) {
    if (e instanceof Error && e.message.includes("already exists")) {
      console.log("Email column already exists");
      return;
    }
    throw e;
  }
}

main().catch((e) => {
  console.error("Error adding email column:", e);
  process.exit(1);
});
