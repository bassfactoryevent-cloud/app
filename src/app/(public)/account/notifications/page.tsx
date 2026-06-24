import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Bell, Info, CheckCircle, Package, Ticket } from "lucide-react";

export default async function AccountNotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Load user notifications
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Update all to read upon viewing (optional: could be a client action instead)
  await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);

  const getIconForType = (type: string) => {
    switch(type) {
      case 'order': return <Package size={24} color="#3b82f6" />;
      case 'ticket': return <Ticket size={24} color="#a855f7" />;
      case 'promo': return <CheckCircle size={24} color="#22c55e" />;
      default: return <Info size={24} color="var(--color-magenta)" />;
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Centro de Notificaciones</h1>
      <p style={{ opacity: 0.7, marginBottom: '2rem' }}>Avisos sobre tus tickets, envíos y novedades de Bassfactory.</p>

      {!notifications || notifications.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '1rem', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <Bell size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
          <p style={{ opacity: 0.7 }}>No tienes notificaciones en este momento.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {notifications.map((notif: any) => (
            <div key={notif.id} style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', backgroundColor: notif.is_read ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)', borderRadius: '1rem', border: '1px solid', borderColor: notif.is_read ? 'rgba(255,255,255,0.05)' : 'var(--color-magenta)', transition: 'all 0.2s' }}>
              <div style={{ flexShrink: 0, marginTop: '0.25rem' }}>
                {getIconForType(notif.type)}
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem', color: notif.is_read ? 'white' : 'var(--color-magenta)' }}>{notif.title}</h3>
                <p style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '0.5rem', lineHeight: 1.5 }}>{notif.message}</p>
                <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                  {new Date(notif.created_at).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
