import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Calendar, ShoppingCart, Ticket, Tag } from "lucide-react";

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { id } = params;

  // Fetch User Profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (profileError || !profile) {
    return notFound();
  }

  // Fetch Ticket Orders
  const { data: ticketOrders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  // Fetch Merch Orders
  const { data: merchOrders } = await supabase
    .from("merch_orders")
    .select("*")
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  // Helper to format currency
  const formatCurrency = (amount: number) => `$${Number(amount).toLocaleString('es-CO')}`;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", paddingBottom: "4rem" }}>
      {/* Header & Navigation */}
      <div style={{ marginBottom: "2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link href="/admin/users" style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "40px", height: "40px", backgroundColor: "rgba(255,255,255,0.05)",
          borderRadius: "50%", color: "white", textDecoration: "none", transition: "background-color 0.2s"
        }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: 0, color: "white" }}>Perfil de Cliente</h1>
          <p style={{ opacity: 0.7, fontSize: "0.875rem", margin: 0, color: "#e5e5e5" }}>ID: {profile.id}</p>
        </div>
      </div>

      {/* Main CRM Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem", alignItems: "start" }}>
        
        {/* Left Column: User Info Card */}
        <div style={{
          backgroundColor: "var(--color-surface, #111)",
          border: "1px solid var(--color-border, #333)",
          borderRadius: "var(--radius-lg)",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center"
        }}>
          <div style={{
            width: "120px", height: "120px", borderRadius: "50%",
            backgroundColor: "var(--color-magenta, #ff00ff)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "bold", fontSize: "3rem", color: "white", marginBottom: "1.5rem",
            overflow: "hidden"
          }}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              (profile.full_name || "U")[0].toUpperCase()
            )}
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.5rem 0", color: "white" }}>
            {profile.full_name || "Sin Nombre"}
          </h2>
          <span style={{
            padding: "0.25rem 0.75rem",
            borderRadius: "1rem",
            fontSize: "0.75rem",
            fontWeight: 600,
            backgroundColor: profile.role === 'admin' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255,255,255,0.1)',
            color: profile.role === 'admin' ? '#ec4899' : 'white',
            textTransform: "capitalize",
            marginBottom: "1.5rem"
          }}>
            {profile.role}
          </span>

          <div style={{ width: "100%", textAlign: "left", display: "flex", flexDirection: "column", gap: "1rem", borderTop: "1px solid var(--color-border, #333)", paddingTop: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--color-text-secondary)" }}>
              <Mail size={16} />
              <span style={{ fontSize: "0.875rem", wordBreak: "break-all" }}>Usuario Base de Datos</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--color-text-secondary)" }}>
              <Calendar size={16} />
              <span style={{ fontSize: "0.875rem" }}>Registrado el: {new Date(profile.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Order Histories */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* Ticket Orders Section */}
          <div style={{
            backgroundColor: "var(--color-surface, #111)",
            border: "1px solid var(--color-border, #333)",
            borderRadius: "var(--radius-lg)",
            padding: "1.5rem"
          }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 600, margin: "0 0 1.5rem 0", color: "white", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <Ticket size={20} color="#3b82f6" />
              Historial de Boletería (Eventos)
            </h3>
            
            {ticketOrders && ticketOrders.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {ticketOrders.map(order => (
                  <div key={order.id} style={{
                    padding: "1rem",
                    backgroundColor: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: "0.5rem",
                    display: "flex", justifyContent: "space-between", alignItems: "center"
                  }}>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginBottom: "0.25rem" }}>
                        Orden: {order.id.split('-')[0]}
                      </div>
                      <div style={{ fontWeight: 600, color: "white", fontSize: "0.875rem" }}>
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, color: "white" }}>{formatCurrency(order.total_amount)}</div>
                      <div style={{ fontSize: "0.75rem", color: order.status === 'paid' ? '#22c55e' : '#f59e0b', textTransform: "uppercase", fontWeight: 600, marginTop: "0.25rem" }}>
                        {order.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", margin: 0 }}>No ha comprado boletos aún.</p>
            )}
          </div>

          {/* Merch Orders Section */}
          <div style={{
            backgroundColor: "var(--color-surface, #111)",
            border: "1px solid var(--color-border, #333)",
            borderRadius: "var(--radius-lg)",
            padding: "1.5rem"
          }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 600, margin: "0 0 1.5rem 0", color: "white", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <ShoppingCart size={20} color="#ec4899" />
              Compras de Tienda (Merch)
            </h3>
            
            {merchOrders && merchOrders.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {merchOrders.map(order => (
                  <div key={order.id} style={{
                    padding: "1rem",
                    backgroundColor: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: "0.5rem",
                    display: "flex", justifyContent: "space-between", alignItems: "center"
                  }}>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginBottom: "0.25rem" }}>
                        Orden: {order.id.split('-')[0]}
                      </div>
                      <div style={{ fontWeight: 600, color: "white", fontSize: "0.875rem" }}>
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, color: "white" }}>{formatCurrency(order.total_amount)}</div>
                      <div style={{ fontSize: "0.75rem", color: order.status === 'paid' ? '#22c55e' : order.status === 'delivered' ? '#3b82f6' : '#f59e0b', textTransform: "uppercase", fontWeight: 600, marginTop: "0.25rem" }}>
                        {order.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", margin: 0 }}>No ha comprado mercancía aún.</p>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
