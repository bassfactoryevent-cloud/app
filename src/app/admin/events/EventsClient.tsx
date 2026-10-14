"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, Plus, MapPin, Ticket, Search, Filter, ChevronLeft, ChevronRight, Activity } from "lucide-react";
import DeleteEventButton from "./DeleteEventButton";
import { updateEventStatus } from "./actions";
import { toast } from "sonner";

export default function EventsClient({ initialEvents, error }: { initialEvents: any[], error: any }) {
  const [events, setEvents] = useState<any[]>(initialEvents || []);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("published"); // Por defecto muestra los publicados 'de una'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Conteo por estado
  const counts = {
    all: events.length,
    published: events.filter(e => e.status === 'published').length,
    draft: events.filter(e => e.status === 'draft').length,
    archived: events.filter(e => e.status === 'archived').length,
  };

  const handleQuickStatusChange = async (eventId: string, newStatus: string) => {
    const prevStatus = events.find(e => e.id === eventId)?.status;
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: newStatus } : e));
    try {
      const res = await updateEventStatus(eventId, newStatus);
      if (res.success) {
        toast.success(`Estado actualizado a: ${newStatus.toUpperCase()}`);
      } else {
        setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: prevStatus } : e));
        toast.error(res.error || "Error al actualizar estado");
      }
    } catch {
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: prevStatus } : e));
      toast.error("Error al actualizar estado");
    }
  };

  // Filtrado
  const filteredEvents = events.filter((event) => {
    const matchesSearch = 
      (event.title?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
      (event.location_name?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || event.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Paginación
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + itemsPerPage);

  // Reiniciar página si cambian los filtros
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
  };

  return (
    <div>
      {/* Header & Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}><Calendar size={28} /> Eventos y Boletería</h1>
            <p style={{ opacity: 0.7, marginTop: '0.5rem', marginBottom: 0 }}>Administra tus eventos, aforos, ventas y códigos QR.</p>
          </div>
          <Link href="/admin/events/new" style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            backgroundColor: 'var(--color-magenta)', color: 'white',
            padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)',
            textDecoration: 'none', fontWeight: 600
          }}>
            <Plus size={18} /> Crear Evento
          </Link>
        </div>

        {/* Pestañas Rápidas de Estados (Públicos de una, Borradores, Archivados, Todos) */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => handleStatusChange("published")}
            style={{
              padding: "0.5rem 1.1rem",
              borderRadius: "99px",
              border: "1px solid",
              borderColor: statusFilter === "published" ? "#10b981" : "rgba(255,255,255,0.1)",
              backgroundColor: statusFilter === "published" ? "rgba(16, 185, 129, 0.2)" : "rgba(255,255,255,0.04)",
              color: statusFilter === "published" ? "#34d399" : "rgba(255,255,255,0.7)",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              transition: "all 0.2s"
            }}
          >
            <span>Públicos</span>
            <span style={{ fontSize: "0.75rem", padding: "0.1rem 0.5rem", borderRadius: "10px", backgroundColor: statusFilter === "published" ? "rgba(16, 185, 129, 0.4)" : "rgba(255,255,255,0.1)", color: "white" }}>
              {counts.published}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusChange("draft")}
            style={{
              padding: "0.5rem 1.1rem",
              borderRadius: "99px",
              border: "1px solid",
              borderColor: statusFilter === "draft" ? "var(--color-magenta)" : "rgba(255,255,255,0.1)",
              backgroundColor: statusFilter === "draft" ? "rgba(255, 0, 128, 0.2)" : "rgba(255,255,255,0.04)",
              color: statusFilter === "draft" ? "white" : "rgba(255,255,255,0.7)",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              transition: "all 0.2s"
            }}
          >
            <span>Borradores</span>
            <span style={{ fontSize: "0.75rem", padding: "0.1rem 0.5rem", borderRadius: "10px", backgroundColor: statusFilter === "draft" ? "var(--color-magenta)" : "rgba(255,255,255,0.1)", color: "white" }}>
              {counts.draft}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusChange("archived")}
            style={{
              padding: "0.5rem 1.1rem",
              borderRadius: "99px",
              border: "1px solid",
              borderColor: statusFilter === "archived" ? "#f59e0b" : "rgba(255,255,255,0.1)",
              backgroundColor: statusFilter === "archived" ? "rgba(245, 158, 11, 0.2)" : "rgba(255,255,255,0.04)",
              color: statusFilter === "archived" ? "#fbbf24" : "rgba(255,255,255,0.7)",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              transition: "all 0.2s"
            }}
          >
            <span>Archivados</span>
            <span style={{ fontSize: "0.75rem", padding: "0.1rem 0.5rem", borderRadius: "10px", backgroundColor: statusFilter === "archived" ? "rgba(245, 158, 11, 0.4)" : "rgba(255,255,255,0.1)", color: "white" }}>
              {counts.archived}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusChange("all")}
            style={{
              padding: "0.5rem 1.1rem",
              borderRadius: "99px",
              border: "1px solid",
              borderColor: statusFilter === "all" ? "white" : "rgba(255,255,255,0.1)",
              backgroundColor: statusFilter === "all" ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.04)",
              color: statusFilter === "all" ? "white" : "rgba(255,255,255,0.7)",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              transition: "all 0.2s"
            }}
          >
            <span>Todos</span>
            <span style={{ fontSize: "0.75rem", padding: "0.1rem 0.5rem", borderRadius: "10px", backgroundColor: statusFilter === "all" ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)", color: "white" }}>
              {counts.all}
            </span>
          </button>
        </div>

        {/* Buscador y Filtros */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 300px" }}>
            <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-secondary)" }} />
            <input
              type="text"
              placeholder="Buscar por nombre o locación..."
              value={searchTerm}
              onChange={handleSearchChange}
              style={{
                width: "100%", padding: "0.75rem 1rem 0.75rem 2.5rem",
                backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "var(--radius-md)", color: "white", outline: "none"
              }}
            />
          </div>
          
          <div style={{ position: "relative", flex: "1 1 180px", minWidth: "min(100%, 180px)" }}>
            <Filter size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-secondary)" }} />
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              style={{
                width: "100%", padding: "0.75rem 1rem 0.75rem 2.5rem",
                backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "var(--radius-md)", color: "white", outline: "none", appearance: "none", cursor: "pointer"
              }}
            >
              <option value="published" style={{ backgroundColor: "#111" }}>Publicados (Published)</option>
              <option value="draft" style={{ backgroundColor: "#111" }}>Borradores (Draft)</option>
              <option value="archived" style={{ backgroundColor: "#111" }}>Archivados</option>
              <option value="all" style={{ backgroundColor: "#111" }}>Todos los estados</option>
              <option value="postponed" style={{ backgroundColor: "#111" }}>Aplazados</option>
              <option value="cancelled" style={{ backgroundColor: "#111" }}>Cancelados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid de Eventos */}
      <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))' }}>
        {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
        {(!initialEvents || initialEvents.length === 0) ? (
          <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)', gridColumn: '1 / -1' }}>
            <Calendar size={48} opacity={0.2} style={{ marginBottom: '1rem' }} />
            <h3>No hay eventos creados</h3>
            <p style={{ opacity: 0.7, marginBottom: '1.5rem' }}>Empieza a planificar tu próximo show y vender boletas.</p>
            <Link href="/admin/events/new" style={{ color: 'var(--color-magenta)' }}>Crear mi primer evento</Link>
          </div>
        ) : paginatedEvents.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)', gridColumn: '1 / -1' }}>
            <Search size={48} opacity={0.2} style={{ marginBottom: '1rem' }} />
            <h3>No se encontraron eventos</h3>
            <p style={{ opacity: 0.7 }}>Intenta ajustar los filtros de búsqueda.</p>
          </div>
        ) : (
          paginatedEvents.map((event) => (
            <div key={event.id} style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '160px', backgroundColor: 'rgba(0,0,0,0.1)', position: 'relative' }}>
                {event.cover_image ? (
                  <img src={event.cover_image} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                    <Calendar size={48} />
                  </div>
                )}
                <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', zIndex: 10 }}>
                  <select
                    value={event.status}
                    onChange={(e) => handleQuickStatusChange(event.id, e.target.value)}
                    style={{
                      padding: '0.3rem 0.65rem',
                      borderRadius: '99px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      backgroundColor: 
                        event.status === 'published' ? '#10b981' : 
                        event.status === 'archived' ? '#f59e0b' :
                        event.status === 'postponed' ? '#3b82f6' :
                        event.status === 'cancelled' ? '#ef4444' :
                        'rgba(0,0,0,0.8)', 
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.3)',
                      cursor: 'pointer',
                      outline: 'none',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                    }}
                  >
                    <option value="published" style={{ backgroundColor: '#111', color: '#10b981' }}>🟢 PUBLICADO</option>
                    <option value="archived" style={{ backgroundColor: '#111', color: '#f59e0b' }}>📦 ARCHIVADO</option>
                    <option value="draft" style={{ backgroundColor: '#111', color: '#9ca3af' }}>⚪ BORRADOR</option>
                    <option value="postponed" style={{ backgroundColor: '#111', color: '#3b82f6' }}>🟡 APLAZADO</option>
                    <option value="cancelled" style={{ backgroundColor: '#111', color: '#ef4444' }}>🔴 CANCELADO</option>
                  </select>
                </div>

                {event.start_date && new Date(event.start_date) < new Date() && event.status === 'published' && (
                  <div style={{
                    position: 'absolute', bottom: '0.5rem', left: '0.5rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.95)', color: 'white',
                    padding: '0.2rem 0.5rem', borderRadius: '4px',
                    fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.5)', zIndex: 5
                  }}>
                    ⚠️ Pasado - Pendiente Archivar
                  </div>
                )}
              </div>
              
              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{event.title}</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: 0.7, fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={16} /> 
                    {event.start_date ? new Date(event.start_date).toLocaleDateString() : 'Fecha por definir'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={16} /> 
                    {event.location_name || 'Locación secreta'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-magenta)' }}>
                    <Ticket size={16} /> 
                    {event.is_free ? 'Entrada Libre' : `${event.ticket_tiers?.length || 0} Tipos de Boleta`}
                  </span>
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid rgba(128,128,128,0.1)', paddingTop: '0.85rem' }}>
                  <Link 
                    href={`/admin/events/${event.id}/dashboard`} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '0.4rem', 
                      padding: '0.6rem', 
                      backgroundColor: 'rgba(59, 130, 246, 0.15)', 
                      border: '1px solid rgba(59, 130, 246, 0.35)', 
                      color: '#60a5fa', 
                      borderRadius: 'var(--radius-md)', 
                      textDecoration: 'none', 
                      fontSize: '0.825rem', 
                      fontWeight: 800 
                    }}
                  >
                    <Activity size={15} /> Detalle: Asistentes y Ventas
                  </Link>

                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <Link 
                      href={`/admin/events/${event.id}/staff`} 
                      style={{ 
                        flex: 1, 
                        textAlign: 'center', 
                        padding: '0.45rem 0.3rem', 
                        backgroundColor: 'rgba(6, 182, 212, 0.12)', 
                        border: '1px solid rgba(6, 182, 212, 0.25)', 
                        color: '#06b6d4', 
                        borderRadius: 'var(--radius-md)', 
                        textDecoration: 'none', 
                        fontSize: '0.78rem', 
                        fontWeight: 700 
                      }}
                    >
                      🚪 Puerta
                    </Link>
                    <Link 
                      href={`/admin/events/${event.id}`} 
                      style={{ 
                        flex: 1, 
                        textAlign: 'center', 
                        padding: '0.45rem 0.3rem', 
                        backgroundColor: 'rgba(255,255,255,0.06)', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        borderRadius: 'var(--radius-md)', 
                        textDecoration: 'none', 
                        color: 'white', 
                        fontSize: '0.78rem', 
                        fontWeight: 600 
                      }}
                    >
                      Editar
                    </Link>
                    <Link 
                      href={`/admin/events/${event.id}/scan`} 
                      style={{ 
                        flex: 1, 
                        textAlign: 'center', 
                        padding: '0.45rem 0.3rem', 
                        backgroundColor: 'var(--color-magenta)', 
                        color: 'white', 
                        borderRadius: 'var(--radius-md)', 
                        textDecoration: 'none', 
                        fontSize: '0.78rem', 
                        fontWeight: 700 
                      }}
                    >
                      Escáner
                    </Link>
                    <DeleteEventButton id={event.id} eventName={event.title} />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem",
              backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "var(--radius-md)", color: currentPage === 1 ? "rgba(255,255,255,0.3)" : "white",
              cursor: currentPage === 1 ? "not-allowed" : "pointer"
            }}
          >
            <ChevronLeft size={16} /> Anterior
          </button>
          
          <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
            Página {currentPage} de {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem",
              backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "var(--radius-md)", color: currentPage === totalPages ? "rgba(255,255,255,0.3)" : "white",
              cursor: currentPage === totalPages ? "not-allowed" : "pointer"
            }}
          >
            Siguiente <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
