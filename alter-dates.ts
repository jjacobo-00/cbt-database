import { neon } from '@neondatabase/serverless';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  
  try {
    console.log("Altering date_saved...");
    await sql`ALTER TABLE members ALTER COLUMN date_saved TYPE date USING date_saved::date;`;
    console.log("Success date_saved!");
  } catch (e) {
    console.error("date_saved error:", e);
  }
  
  try {
    console.log("Altering membership_date...");
    await sql`ALTER TABLE members ALTER COLUMN membership_date TYPE date USING membership_date::date;`;
    console.log("Success membership_date!");
  } catch (e) {
    console.error("membership_date error:", e);
  }

  try {
    console.log("Altering date_baptized...");
    await sql`ALTER TABLE members ALTER COLUMN date_baptized TYPE date USING date_baptized::date;`;
    console.log("Success date_baptized!");
  } catch (e) {
    console.error("date_baptized error:", e);
  }

  try {
    console.log("Altering baptism_date...");
    await sql`ALTER TABLE members ALTER COLUMN baptism_date TYPE date USING baptism_date::date;`;
    console.log("Success baptism_date!");
  } catch (e) {
    console.error("baptism_date error:", e);
  }
}

main();
