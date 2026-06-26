import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envFile = fs.readFileSync(path.join(process.cwd(), '.env.production'), 'utf8');
const envVars = envFile.split('\n').reduce((acc: any, line) => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length > 0) {
    acc[key.trim()] = rest.join('=').trim().replace(/['"]/g, '');
  }
  return acc;
}, {});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  // Query 1 row to see the keys
  const { data, error } = await supabase.from('djs').select('*').limit(1);
  if (error) {
    console.error('Error fetching djs:', error);
  } else {
    console.log('Columns found in djs:', Object.keys(data?.[0] || {}));
    if (data && data.length === 0) {
       console.log("No rows, trying to insert an invalid row to get the error message with columns");
       const { error: insertErr } = await supabase.from('djs').insert({ INVALID_COLUMN: 1 });
       console.log("Insert error details:", insertErr);
    }
  }
}

checkSchema();
