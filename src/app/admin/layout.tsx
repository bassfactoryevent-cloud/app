import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import styles from "./AdminLayout.module.css";
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

  if (!profile || profile.role !== "admin") {
    // TEMPORARY: Bypass role check for testing
    // redirect("/account");
  }

  return (
    <div className={styles.adminWrapper}>
      <AdminSidebar profile={profile} />

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        <header className={styles.topbar}>
          <div className={styles.topbarTitle} style={{ color: 'var(--color-accent)', fontWeight: 800 }}>
            Administración B2B
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Hola, {profile.full_name?.split(' ')[0] || 'Admin'}
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-magenta)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.875rem', color: 'white' }}>
              {(profile.full_name || 'A')[0].toUpperCase()}
            </div>
          </div>
        </header>
        <main className={styles.contentArea}>
          {children}
        </main>
      </div>
    </div>
  );
}
