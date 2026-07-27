const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const sql = neon(process.env.DATABASE_URL);
  await sql`TRUNCATE TABLE commitments CASCADE;`;
  console.log('users table dropped');
}

main().catch(console.error);
