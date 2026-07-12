const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function run() {
  console.log("Fetching active ads...");
  const { data, error } = await supabase
    .from("ads")
    .select(`
      id,
      ad_placements!inner(name),
      ad_campaigns!inner(name, is_active, end_date)
    `)
    .eq("is_active", true)
    .eq("ad_campaigns.is_active", true);
  
  console.log("Ads:", JSON.stringify(data, null, 2));
  console.log("Error:", error);
}
run();
