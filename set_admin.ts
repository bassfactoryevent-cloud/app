import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envFile = fs.readFileSync(path.join(process.cwd(), '.env.production'), 'utf8');
const envVars = envFile.split('\n').reduce((acc, line) => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length > 0) acc[key.trim()] = rest.join('=').replace(/"/g, '').trim();
  return acc;
}, {} as Record<string, string>);

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function setAdmin() {
  const { data: users, error: userError } = await supabase.from('profiles').select('*');
  if (userError) {
    console.error('Error fetching profiles:', userError);
    return;
  }
  console.log('Profiles:', users);

  if (users && users.length > 0) {
    for (const user of users) {
      console.log(`Setting ${user.id} (${user.full_name}) to admin...`);
      const { error: updateError } = await supabase.from('profiles').update({ role: 'admin' }).eq('id', user.id);
      if (updateError) {
        console.error('Update error:', updateError);
      } else {
        console.log('Successfully updated to admin!');
      }
    }
  }
}

setAdmin();
