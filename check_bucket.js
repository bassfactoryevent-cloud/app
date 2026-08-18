const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data, error } = await supabase.storage.getBucket('avatars');
  if (error && error.message.includes('not found')) {
     console.log("Bucket not found, creating...");
     const { data: createData, error: createError } = await supabase.storage.createBucket('avatars', { public: true });
     console.log("Create result:", createData, createError);
  } else {
     console.log("Bucket exists:", data);
  }
}
test();
