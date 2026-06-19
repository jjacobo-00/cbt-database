import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase URL or Anon Key in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log(`Testing connection to: ${supabaseUrl}`);
  
  // We query a non-existent table just to confirm we can reach the database.
  const { error } = await supabase.from('test_connection').select('*').limit(1);
  
  // '42P01' is the Postgres error code for "relation does not exist".
  // Getting this specific error proves we successfully connected to your database!
  if (error && error.code === '42P01') {
    console.log("✅ Connection successful!");
  } else if (error) {
    console.error("❌ Connection failed with a different error:", error.message);
  } else {
    console.log("✅ Connection successful!");
  }
}

test();
