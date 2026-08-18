require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  console.log("Intentando enviar correo de prueba para validar SMTP...");
  const { data, error } = await supabase.auth.resetPasswordForEmail('soporte@bassfactory.co');
  if (error) {
    console.error("Error al enviar (Probablemente SMTP mal configurado):", error.message);
  } else {
    console.log("¡Supabase aceptó el comando! El correo ha sido encolado para envío a través de Resend.");
  }
}
test();
