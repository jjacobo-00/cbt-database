import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  try {
    await sql`ALTER TABLE members ADD COLUMN email text`;
    console.log("Successfully added email column");
  } catch (e: any) {
    if (e.message.includes("already exists")) {
      console.log("Email column already exists");
    } else {
      console.error("Error adding email:", e);
    }
  }
}

main();
