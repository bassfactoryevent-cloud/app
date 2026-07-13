import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function main() {
  const { data, error } = await supabase.from('posts').select('*').limit(1);
  console.log("Data:", data);
  console.log("Error:", error);
}

main();
