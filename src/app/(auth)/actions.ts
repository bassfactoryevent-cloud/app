"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirect("/login?message=No+se+pudo+iniciar+sesión.+Verifica+tus+credenciales.");
  }

  return redirect("/account");
}

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const full_name = formData.get("full_name") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
      }
    }
  });

  if (error) {
    return redirect("/register?message=Error+al+crear+la+cuenta.+Inténtalo+de+nuevo.");
  }

  return redirect("/account?message=Cuenta+creada.+Revisa+tu+correo+para+confirmar.");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/");
}
