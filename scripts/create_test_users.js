import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tkbrnblnkmuopmffslzn.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrYnJuYmxua211b3BtZmZzbHpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MjgyOTAsImV4cCI6MjA5NzQwNDI5MH0.q28cUM56g2anOlbr_npBclFuuGdSIO8vqR7dl6vNYAA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createUsers() {
  console.log('Creando usuario Admin...');
  const { data: adminData, error: adminError } = await supabase.auth.signUp({
    email: 'admin@admin.com',
    password: '12345678',
    options: {
      data: {
        full_name: 'Super Admin',
      }
    }
  });

  if (adminError) {
    console.error('Error creando admin:', adminError.message);
  } else {
    console.log('✅ Admin creado. ID:', adminData.user?.id);
    console.log(`\nEJECUTA ESTO EN SUPABASE SQL EDITOR PARA DARLE PERMISOS DE ADMIN:\n`);
    console.log(`UPDATE public.profiles SET role = 'admin' WHERE id = '${adminData.user?.id}';\n`);
  }

  console.log('Creando usuario Cliente...');
  const { data: clientData, error: clientError } = await supabase.auth.signUp({
    email: 'cliente@cliente.com',
    password: '12345678',
    options: {
      data: {
        full_name: 'Usuario Cliente',
      }
    }
  });

  if (clientError) {
    console.error('Error creando cliente:', clientError.message);
  } else {
    console.log('✅ Cliente creado exitosamente. (Rol por defecto: customer)');
  }
}

createUsers();
