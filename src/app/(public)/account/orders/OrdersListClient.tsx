"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Ticket, 
  Clock, 
  AlertCircle, 
  FileText, 
  Search, 
  Filter, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  X,
  Layers
} from "lucide-react";

interface OrdersListClientProps {
  initialOrders: any[];
  orderTicketsMap: Record<string, any[]>;
}

export default function OrdersListClient({ initialOrders, orderTicketsMap }: OrdersListClientProps) {
  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState("all");
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Extraer lista única de eventos de todas las órdenes para el dropdown
  const availableEvents = useMemo(() => {
    const eventsMap = new Map<string, string>();
    for (const order of initialOrders) {
      const tickets = orderTicketsMap[order.id] || [];
      for (const t of tickets) {
        const tier = Array.isArray(t.ticket_tiers) ? t.ticket_tiers[0] : t.ticket_tiers;
        const event = Array.isArray(tier?.events) ? tier.events[0] : tier?.events;
        if (event?.title) {
          eventsMap.set(event.title, event.title);
        }
      }
    }
    return Array.from(eventsMap.values());
  }, [initialOrders, orderTicketsMap]);

  // Conteos por estado para las píldoras de filtrado
  const statusCounts = useMemo(() => {
    const counts = { all: initialOrders.length, paid: 0, pending: 0, cancelled: 0 };
    for (const o of initialOrders) {
      if (o.status === "paid") counts.paid++;
      else if (o.status === "pending") counts.pending++;
      else counts.cancelled++;
    }
    return counts;
  }, [initialOrders]);

  // Filtrado reactivo de órdenes
  const filteredOrders = useMemo(() => {
    return initialOrders.filter((order) => {
      // 1. Búsqueda por texto (ID, Factura, email o nombre de producto/evento)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const shortId = (order.id || "").toLowerCase();
        const invoice = (order.payment_id || "").toLowerCase();
        const customerName = (order.customer_name || "").toLowerCase();
        
        // Buscar también en nombres de tickets o merch
        const tickets = orderTicketsMap[order.id] || [];
        const hasMatchingTicket = tickets.some((t: any) => {
          const tier = Array.isArray(t.ticket_tiers) ? t.ticket_tiers[0] : t.ticket_tiers;
          const event = Array.isArray(tier?.events) ? tier.events[0] : tier?.events;
          return (event?.title || "").toLowerCase().includes(term);
        });

        const merch = order.merch_order_items || [];
        const hasMatchingMerch = merch.some((m: any) => 
          (m.product_name || "").toLowerCase().includes(term)
        );

        const matches = 
          shortId.includes(term) || 
          invoice.includes(term) || 
          customerName.includes(term) ||
          hasMatchingTicket ||
          hasMatchingMerch;

        if (!matches) return false;
      }

      // 2. Filtro por Estado
      if (selectedStatus !== "all") {
        if (selectedStatus === "paid" && order.status !== "paid") return false;
        if (selectedStatus === "pending" && order.status !== "pending") return false;
        if (selectedStatus === "cancelled" && (order.status === "paid" || order.status === "pending")) return false;
      }

      // 3. Filtro por Evento
      if (selectedEvent !== "all") {
        const tickets = orderTicketsMap[order.id] || [];
        const matchesEvent = tickets.some((t: any) => {
          const tier = Array.isArray(t.ticket_tiers) ? t.ticket_tiers[0] : t.ticket_tiers;
          const event = Array.isArray(tier?.events) ? tier.events[0] : tier?.events;
          return event?.title === selectedEvent;
        });
        if (!matchesEvent) return false;
      }

      // 4. Filtro por Rango de Fecha
      if (selectedDateRange !== "all") {
        const orderDate = new Date(order.created_at).getTime();
        const now = Date.now();
        const daysDiff = (now - orderDate) / (1000 * 60 * 60 * 24);

        if (selectedDateRange === "30_days" && daysDiff > 30) return false;
        if (selectedDateRange === "90_days" && daysDiff > 90) return false;
        if (selectedDateRange === "this_year") {
          const orderYear = new Date(order.created_at).getFullYear();
          const currentYear = new Date().getFullYear();
          if (orderYear !== currentYear) return false;
        }
      }

      return true;
    });
  }, [initialOrders, searchTerm, selectedStatus, selectedEvent, selectedDateRange, orderTicketsMap]);

  // Paginación calculada
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + pageSize);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedEvent("all");
    setSelectedStatus("all");
    setSelectedDateRange("all");
    setCurrentPage(1);
  };

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'pending': 
        return { icon: <Clock size={16} />, color: '#eab308', text: 'Pendiente de Pago', bg: 'rgba(234, 179, 8, 0.15)' };
      case 'paid': 
        return { icon: <CheckCircle size={16} />, color: '#22c55e', text: 'Aprobado y Confirmado', bg: 'rgba(34, 197, 94, 0.15)' };
      case 'shipped': 
        return { icon: <Truck size={16} />, color: '#a855f7', text: 'Enviado', bg: 'rgba(168, 85, 247, 0.15)' };
      case 'delivered': 
        return { icon: <CheckCircle size={16} />, color: '#22c55e', text: 'Entregado', bg: 'rgba(34, 197, 94, 0.15)' };
      default: 
        return { icon: <Package size={16} />, color: '#ef4444', text: 'No Confirmada / Cancelada', bg: 'rgba(239, 68, 68, 0.15)' };
    }
  };

  const isFiltering = searchTerm !== "" || selectedEvent !== "all" || selectedStatus !== "all" || selectedDateRange !== "all";

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* BARRA DE FILTROS Y CONTROLES */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '1rem',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem'
      }}>
        
        {/* Fila 1: Buscador y Selectores principales */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          alignItems: 'center'
        }}>
          
          {/* Buscador de texto */}
          <div style={{ position: 'relative' }}>
            <Search size={17} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
            <input
              type="text"
              placeholder="Buscar por orden, factura o evento..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.65rem 1rem 0.65rem 2.4rem',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '0.5rem',
                color: 'white',
                fontSize: '0.875rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Filtro por Evento */}
          <div style={{ position: 'relative' }}>
            <Layers size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }} />
            <select
              value={selectedEvent}
              onChange={(e) => {
                setSelectedEvent(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.65rem 1rem 0.65rem 2.4rem',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '0.5rem',
                color: 'white',
                fontSize: '0.875rem',
                outline: 'none',
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
            >
              <option value="all" style={{ backgroundColor: '#121216' }}>Todos los eventos</option>
              {availableEvents.map((eventName) => (
                <option key={eventName} value={eventName} style={{ backgroundColor: '#121216' }}>
                  {eventName}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Fecha */}
          <div style={{ position: 'relative' }}>
            <Calendar size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }} />
            <select
              value={selectedDateRange}
              onChange={(e) => {
                setSelectedDateRange(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.65rem 1rem 0.65rem 2.4rem',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '0.5rem',
                color: 'white',
                fontSize: '0.875rem',
                outline: 'none',
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
            >
              <option value="all" style={{ backgroundColor: '#121216' }}>Cualquier fecha</option>
              <option value="30_days" style={{ backgroundColor: '#121216' }}>Últimos 30 días</option>
              <option value="90_days" style={{ backgroundColor: '#121216' }}>Últimos 3 meses</option>
              <option value="this_year" style={{ backgroundColor: '#121216' }}>Este año (2026)</option>
            </select>
          </div>

        </div>

        {/* Fila 2: Píldoras de Estado y Botón Limpiar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          
          {/* Píldoras de estado */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            
            <button
              onClick={() => { setSelectedStatus("all"); setCurrentPage(1); }}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '2rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: selectedStatus === "all" ? '1px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.08)',
                backgroundColor: selectedStatus === "all" ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.3)',
                color: 'white'
              }}
            >
              Todos ({statusCounts.all})
            </button>

            <button
              onClick={() => { setSelectedStatus("paid"); setCurrentPage(1); }}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '2rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: selectedStatus === "paid" ? '1px solid #22c55e' : '1px solid rgba(34, 197, 94, 0.2)',
                backgroundColor: selectedStatus === "paid" ? 'rgba(34, 197, 94, 0.2)' : 'rgba(0,0,0,0.3)',
                color: '#22c55e'
              }}
            >
              ✓ Confirmados ({statusCounts.paid})
            </button>

            <button
              onClick={() => { setSelectedStatus("pending"); setCurrentPage(1); }}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '2rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: selectedStatus === "pending" ? '1px solid #eab308' : '1px solid rgba(234, 179, 8, 0.2)',
                backgroundColor: selectedStatus === "pending" ? 'rgba(234, 179, 8, 0.2)' : 'rgba(0,0,0,0.3)',
                color: '#eab308'
              }}
            >
              ⏳ Pendientes ({statusCounts.pending})
            </button>

            {statusCounts.cancelled > 0 && (
              <button
                onClick={() => { setSelectedStatus("cancelled"); setCurrentPage(1); }}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '2rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: selectedStatus === "cancelled" ? '1px solid #ef4444' : '1px solid rgba(239, 68, 68, 0.2)',
                  backgroundColor: selectedStatus === "cancelled" ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0,0,0,0.3)',
                  color: '#ef4444'
                }}
              >
                Cancelados ({statusCounts.cancelled})
              </button>
            )}

          </div>

          {/* Contador y Limpiar filtros */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
              Mostrando <strong>{filteredOrders.length}</strong> de <strong>{initialOrders.length}</strong> órdenes
            </span>

            {isFiltering && (
              <button
                onClick={handleResetFilters}
                style={{
                  background: 'none',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#00F0FF',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <X size={13} /> Limpiar filtros
              </button>
            )}
          </div>

        </div>

      </div>

      {/* LISTA DE ÓRDENES */}
      {paginatedOrders.length === 0 ? (
        <div style={{
          padding: '4rem 2rem',
          textAlign: 'center',
          backgroundColor: 'rgba(255,255,255,0.02)',
          borderRadius: '1rem',
          border: '1px dashed rgba(255,255,255,0.1)'
        }}>
          <Filter size={40} style={{ opacity: 0.3, margin: '0 auto 1rem', color: '#00F0FF' }} />
          <h3 style={{ color: 'white', fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.5rem' }}>
            No se encontraron compras con los filtros seleccionados
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: '450px', margin: '0 auto 1.5rem' }}>
            Prueba cambiando el evento, rango de fecha o estado en la barra de búsqueda superior.
          </p>
          <button
            onClick={handleResetFilters}
            style={{
              padding: '0.65rem 1.25rem',
              backgroundColor: 'var(--color-magenta)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Restablecer todos los filtros
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {paginatedOrders.map((order) => {
            const statusConfig = getStatusConfig(order.status);
            const tickets = orderTicketsMap[order.id] || [];
            const merchItems = order.merch_order_items || [];

            return (
              <div 
                key={order.id} 
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.02)', 
                  borderRadius: '1rem', 
                  border: '1px solid rgba(255,255,255,0.07)', 
                  overflow: 'hidden',
                  transition: 'border-color 0.2s ease'
                }}
              >
                {/* Header de la Orden */}
                <div style={{ 
                  padding: '1.25rem 1.5rem', 
                  borderBottom: '1px solid rgba(255,255,255,0.05)', 
                  backgroundColor: 'rgba(0,0,0,0.25)',
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  flexWrap: 'wrap', 
                  gap: '1rem' 
                }}>
                  <div>
                    <div style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                      Fecha: {new Date(order.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <div style={{ fontSize: '0.875rem', fontFamily: 'monospace', fontWeight: 700, color: 'white' }}>
                        Orden: #{order.id.slice(0, 8).toUpperCase()}
                      </div>
                      {order.payment_id && order.payment_id.startsWith("BF-FAC-") && (
                        <div style={{ fontSize: '0.875rem', fontFamily: 'monospace', fontWeight: 800, color: '#00F0FF' }}>
                          • Factura: {order.payment_id}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    color: statusConfig.color, 
                    fontWeight: 700, 
                    backgroundColor: statusConfig.bg, 
                    padding: '0.4rem 1rem', 
                    borderRadius: '2rem',
                    fontSize: '0.875rem'
                  }}>
                    {statusConfig.icon} {statusConfig.text}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.2rem' }}>Total Pagado</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>
                      ${Number(order.total_amount).toLocaleString('es-CO')} COP
                    </div>
                  </div>
                </div>
                
                {/* Contenido / Artículos */}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Si hay Boletas en la Orden */}
                  {tickets.length > 0 && (
                    <div>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-magenta)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Ticket size={16} /> Entradas / Boletas ({tickets.length})
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {tickets.map((t: any) => {
                          const tier = Array.isArray(t.ticket_tiers) ? t.ticket_tiers[0] : t.ticket_tiers;
                          const event = Array.isArray(tier?.events) ? tier.events[0] : tier?.events;
                          
                          return (
                            <div key={t.id} style={{ padding: '1rem 1.25rem', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                              <div>
                                <div style={{ fontWeight: 700, color: 'white', fontSize: '1rem' }}>
                                  {event?.title || 'Evento Bassfactory'}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                                  Localidad / Fase: <strong style={{ color: 'white' }}>{tier?.name || 'General'}</strong>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {order.status === 'paid' ? (
                                  <>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', padding: '0.35rem 0.75rem', borderRadius: '1rem' }}>
                                      ✓ Confirmada
                                    </span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', padding: '0.35rem 0.75rem', borderRadius: '1rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                      <Clock size={12} /> QR se genera 1 día antes
                                    </span>
                                  </>
                                ) : order.status === 'pending' ? (
                                  <>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#eab308', backgroundColor: 'rgba(234,179,8,0.12)', padding: '0.35rem 0.75rem', borderRadius: '1rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                      <Clock size={12} /> Pago en Verificación
                                    </span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.35rem 0.75rem', borderRadius: '1rem' }}>
                                      Bloqueada hasta confirmación
                                    </span>
                                  </>
                                ) : (
                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.12)', padding: '0.35rem 0.75rem', borderRadius: '1rem' }}>
                                    ❌ No Confirmada
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Si hay Merch en la Orden */}
                  {merchItems.length > 0 && (
                    <div>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-accent)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Package size={16} /> Productos de Tienda ({merchItems.length})
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {merchItems.map((item: any) => (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div>
                              <div style={{ fontWeight: 700, color: 'white' }}>{item.product_name}</div>
                              {item.variant_name && <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Talla / Variante: {item.variant_name}</div>}
                              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Cantidad: {item.quantity}</div>
                            </div>
                            <div style={{ fontWeight: 800, color: 'white' }}>
                              ${Number(item.total_price).toLocaleString('es-CO')} COP
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Enlaces de Acción: Solo disponibles si el pago está aprobado */}
                  <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    {order.status === 'paid' ? (
                      <>
                        <Link
                          href={`/orders/${order.id}/invoice`}
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: '#00F0FF',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.4rem 0.85rem',
                            borderRadius: '0.375rem',
                            backgroundColor: 'rgba(0, 240, 255, 0.08)',
                            border: '1px solid rgba(0, 240, 255, 0.2)'
                          }}
                        >
                          <FileText size={15} /> Ver Factura Oficial
                        </Link>

                        {tickets.length > 0 && (
                          <Link 
                            href="/account/tickets" 
                            style={{ 
                              fontSize: '0.875rem', 
                              fontWeight: 700, 
                              color: 'var(--color-magenta)', 
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem'
                            }}
                          >
                            Ir a Mis Boletas &rarr;
                          </Link>
                        )}
                      </>
                    ) : order.status === 'pending' ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#eab308', fontSize: '0.825rem' }}>
                        <Clock size={15} />
                        <span>La factura y las boletas solo se habilitan una vez confirmado el pago bancario.</span>
                      </div>
                    ) : (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontSize: '0.825rem' }}>
                        <AlertCircle size={15} />
                        <span>Orden cancelada. No se generó factura ni boletas.</span>
                      </div>
                    )}
                  </div>

                  {order.tracking_number && (
                    <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', borderLeft: '4px solid var(--color-magenta)' }}>
                      <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>Número de Seguimiento de Envío:</div>
                      <div style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '1.1rem', color: 'white' }}>{order.tracking_number}</div>
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CONTROLES DE PAGINACIÓN */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.75rem',
          marginTop: '1rem',
          padding: '1.25rem',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '0.75rem'
        }}>
          
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={validCurrentPage === 1}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.5rem 1rem',
              backgroundColor: validCurrentPage === 1 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: validCurrentPage === 1 ? 'rgba(255,255,255,0.3)' : 'white',
              borderRadius: '0.5rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: validCurrentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            <ChevronLeft size={16} /> Anterior
          </button>

          {/* Números de página */}
          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                style={{
                  width: '36px',
                  height: '36px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '0.4rem',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  border: pageNum === validCurrentPage ? '1px solid var(--color-magenta)' : '1px solid rgba(255,255,255,0.08)',
                  backgroundColor: pageNum === validCurrentPage ? 'var(--color-magenta)' : 'rgba(0,0,0,0.3)',
                  color: 'white'
                }}
              >
                {pageNum}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={validCurrentPage === totalPages}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.5rem 1rem',
              backgroundColor: validCurrentPage === totalPages ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: validCurrentPage === totalPages ? 'rgba(255,255,255,0.3)' : 'white',
              borderRadius: '0.5rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: validCurrentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Siguiente <ChevronRight size={16} />
          </button>

        </div>
      )}

    </div>
  );
}
