import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import ScannerClient from "./ScannerClient";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function ScanPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  
  const { data: event } = await supabase
    .from("events")
    .select("title")
    .eq("id", id)
    .single();

  if (!event) {
    notFound();
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link href={`/admin/events`} style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Escáner de Boletas</h1>
          <p style={{ color: 'var(--color-magenta)', fontWeight: 600, fontSize: '1rem', margin: 0 }}>{event.title}</p>
        </div>
      </div>

      <ScannerClient eventId={id} />
    </div>
  );
}
