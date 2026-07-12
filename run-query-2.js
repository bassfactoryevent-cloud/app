const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function run() {
  console.log("Fetching campaigns...");
  const { data, error } = await supabase
    .from("ad_campaigns")
    .select(`
      *,
      ads (count)
    `)
    .order("created_at", { ascending: false });
  
  console.log("Campaigns:", JSON.stringify(data, null, 2));
  console.log("Error:", error);
}
run();
