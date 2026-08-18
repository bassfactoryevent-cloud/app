import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
  const emailToDelete = 'danielopzj@gmail.com';
  
  // 1. Encontrar al usuario en Supabase Auth
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error("Error fetching users:", listError);
    return;
  }

  const user = users.find(u => u.email === emailToDelete);

  if (!user) {
    console.log(`Usuario con correo ${emailToDelete} no encontrado en auth.users.`);
    return;
  }

  console.log(`Usuario encontrado con ID: ${user.id}. Procediendo a eliminar...`);

  // 2. Eliminar el usuario (Esto debería hacer cascada a perfiles si la FK está configurada, pero por si acaso borramos perfil también)
  
  // Primero intentamos borrar de public.profiles por precaución
  await supabase.from('profiles').delete().eq('id', user.id);
  // Borramos tickets o cualquier otra tabla si no hay cascada (normalmente hay cascada, pero ignoramos errores si fallan)
  await supabase.from('tickets').delete().eq('user_id', user.id);
  await supabase.from('merch_orders').delete().eq('user_id', user.id);
  
  // Borrar de Auth
  const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
  
  if (deleteError) {
    console.error("Error al eliminar el usuario de Auth:", deleteError);
  } else {
    console.log(`Usuario ${emailToDelete} eliminado exitosamente de la base de datos.`);
  }
}

run().catch(console.error);
