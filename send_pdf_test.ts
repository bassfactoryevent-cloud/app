import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
import { createClient } from '@supabase/supabase-js';
import { sendTicketEmail } from './src/utils/sendTicketEmail';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function run() {
  // Get any ticket
  const { data: ticket, error } = await supabase.from('tickets').select('id').limit(1).single();
  if (error || !ticket) {
    console.error("Error fetching ticket:", error);
    return;
  }
  
  console.log("Found ticket:", ticket.id);
  const success = await sendTicketEmail(ticket.id, "Daniel Lopez", "danielopzj@gmail.com");
  console.log("Success?", success);
}

run();
