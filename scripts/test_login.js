import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tkbrnblnkmuopmffslzn.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrYnJuYmxua211b3BtZmZzbHpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MjgyOTAsImV4cCI6MjA5NzQwNDI5MH0.q28cUM56g2anOlbr_npBclFuuGdSIO8vqR7dl6vNYAA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testLogin() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@admin.com',
    password: '12345678',
  });

  if (error) {
    console.error('ERROR LOGGING IN:', error.message);
  } else {
    console.log('SUCCESS:', data.user?.id);
  }
}

testLogin();
