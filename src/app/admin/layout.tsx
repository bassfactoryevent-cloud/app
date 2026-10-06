import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { AdminShell } from "./AdminShell";
import React from "react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Security Check: Enforce admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "superadmin")) {
    redirect("/account");
  }

  return (
    <AdminShell profile={{ ...profile, email: user.email }}>
      {children}
    </AdminShell>
  );
}
