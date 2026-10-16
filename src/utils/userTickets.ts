import { getAdminClient } from "@/utils/supabase/admin";

const adminDb = getAdminClient();

export interface UserTicketsPayload {
  tickets: any[];
  incomingTransfers: any[];
  acceptedOutgoingTransfers: any[];
}

/**
 * Determina de forma estricta y sin fugas si una boleta le pertenece actualmente al usuario.
 * Evita que el comprador original siga viendo o controlando una boleta por `order_id`
 * después de que otro usuario ya aceptó la transferencia.
 */
export function isTicketOwnedByUser(
  ticket: any,
  userId: string,
  userEmail: string | null | undefined,
  userOrderIdsSet: Set<string>
): boolean {
  const cleanUserEmail = (userEmail || "").trim().toLowerCase();
  const ticketAssignedEmail = (ticket.assigned_email || "").trim().toLowerCase();

  // 1. Si la boleta tiene un correo asignado explícito (por transferencia aceptada o cortesía nominal):
  if (ticketAssignedEmail) {
    return cleanUserEmail.length > 0 && ticketAssignedEmail === cleanUserEmail;
  }

  // 2. Si no tiene assigned_email pero tiene user_id asignado:
  if (ticket.user_id) {
    return ticket.user_id === userId;
  }

  // 3. Solo si NO tiene ni assigned_email ni user_id (ej. compra como invitado antes de registrarse),
  // se verifica mediante la orden de compra original:
  if (ticket.order_id && userOrderIdsSet.has(ticket.order_id)) {
    return true;
  }

  return false;
}

/**
 * Limpia transferencias pendientes duplicadas/huérfanas (self-healing) para un conjunto de boletas
 * o para todo un evento.
 */
export async function healStalePendingTransfers(ticketIds?: string[]) {
  try {
    let query = adminDb
      .from("ticket_transfers")
      .select("id, ticket_id, from_user_id, to_email, status, created_at")
      .eq("status", "pending");

    if (ticketIds && ticketIds.length > 0) {
      query = query.in("ticket_id", ticketIds);
    }

    const { data: pendingTransfers } = await query;
    if (!pendingTransfers || pendingTransfers.length === 0) return;

    const now = Date.now();
    const expiredIds: string[] = [];
    const targetTicketIds = Array.from(new Set(pendingTransfers.map((tr: any) => tr.ticket_id).filter(Boolean)));

    const { data: relatedTickets } = targetTicketIds.length > 0
      ? await adminDb
          .from("tickets")
          .select("id, user_id, assigned_email, transferred_at")
          .in("id", targetTicketIds)
      : { data: [] };

    const ticketMap = new Map((relatedTickets || []).map((t: any) => [t.id, t]));

    // También consultar si ya existe una transferencia aceptada posterior o previa al mismo destinatario
    const { data: acceptedTransfers } = targetTicketIds.length > 0
      ? await adminDb
          .from("ticket_transfers")
          .select("id, ticket_id, to_email, created_at")
          .in("ticket_id", targetTicketIds)
          .eq("status", "accepted")
      : { data: [] };

    const bogusIdsToDelete: string[] = [];

    for (const tr of pendingTransfers) {
      // 1. Expiración de 48 horas
      if (now - new Date(tr.created_at).getTime() > 48 * 60 * 60 * 1000) {
        expiredIds.push(tr.id);
        continue;
      }

      const ticket = ticketMap.get(tr.ticket_id);
      if (!ticket) continue;

      const ticketEmail = (ticket.assigned_email || "").trim().toLowerCase();
      const trToEmail = (tr.to_email || "").trim().toLowerCase();

      // 2. Si la boleta ya pertenece al destinatario (ej. ya fue aceptada previamente) y el emisor
      // ya no es el dueño actual, esta transferencia pendiente es un duplicado inválido:
      const alreadyAcceptedByTarget =
        ticketEmail &&
        ticketEmail === trToEmail &&
        ((ticket.user_id && tr.from_user_id && ticket.user_id !== tr.from_user_id) ||
          Boolean(ticket.transferred_at) ||
          (acceptedTransfers || []).some(
            (acc: any) =>
              acc.ticket_id === tr.ticket_id &&
              (acc.to_email || "").trim().toLowerCase() === trToEmail
          ));

      if (alreadyAcceptedByTarget) {
        bogusIdsToDelete.push(tr.id);
      }
    }

    if (expiredIds.length > 0) {
      await adminDb
        .from("ticket_transfers")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .in("id", expiredIds);
    }

    if (bogusIdsToDelete.length > 0) {
      await adminDb.from("ticket_transfers").delete().in("id", bogusIdsToDelete);
    }
  } catch (err) {
    console.error("Error in healStalePendingTransfers:", err);
  }
}

/**
 * Obtiene de forma exacta:
 * 1. Las boletas que actualmente están en posesión del usuario (o en transferencia saliente pendiente).
 * 2. Las transferencias entrantes pendientes por aceptar dirigidas al correo del usuario.
 * 3. El historial de boletas que el usuario transfirió y ya fueron aceptadas (descontadas de su cuenta).
 */
export async function getUserTicketsData(user: {
  id: string;
  email?: string | null;
}): Promise<UserTicketsPayload> {
  const cleanEmail = (user.email || "").trim().toLowerCase();

  // Primero sanear cualquier transferencia pendiente expirada o duplicada
  await healStalePendingTransfers();

  // 1. Obtener órdenes del usuario (para reclamar boletas compradas como invitado sin user_id/assigned_email)
  const { data: userOrders } = await adminDb
    .from("merch_orders")
    .select("id")
    .or(
      cleanEmail
        ? `user_id.eq.${user.id},customer_email.ilike.${cleanEmail}`
        : `user_id.eq.${user.id}`
    );

  const orderIds = (userOrders || []).map((o: any) => o.id);
  const userOrderIdsSet = new Set<string>(orderIds);

  // 2. Consultar boletas candidatas
  let query = adminDb.from("tickets").select(`
    id,
    user_id,
    order_id,
    qr_hash,
    status,
    tier_id,
    assigned_name,
    assigned_email,
    qr_dispatched,
    transferred_at,
    scanned_at,
    created_at,
    ticket_transfers (
      id,
      from_user_id,
      to_email,
      to_name,
      status,
      created_at,
      updated_at
    )
  `);

  const orParts = [`user_id.eq.${user.id}`];
  if (cleanEmail) {
    orParts.push(`assigned_email.ilike.${cleanEmail}`);
  }
  if (orderIds.length > 0) {
    orParts.push(`order_id.in.(${orderIds.join(",")})`);
  }

  query = query.or(orParts.join(",")).neq("status", "void");

  const { data: candidateTickets, error: ticketsError } = await query.order("created_at", {
    ascending: false,
  });

  if (ticketsError) {
    console.error("Error fetching candidate tickets:", ticketsError);
  }

  // 3. FILTRO ESTRICTO DE PROPIEDAD ACTUAL (Cero fugas por order_id o cortesías de otros)
  const ownedRawTickets = (candidateTickets || []).filter((t: any) =>
    isTicketOwnedByUser(t, user.id, cleanEmail, userOrderIdsSet)
  );

  // 4. Auto-vincular user_id (y assigned_email si estaba vacío) en boletas legítimamente propias
  if (ownedRawTickets.length > 0) {
    const unlinkedTicketIds = ownedRawTickets
      .filter((t: any) => t.user_id !== user.id)
      .map((t: any) => t.id);

    if (unlinkedTicketIds.length > 0) {
      await adminDb
        .from("tickets")
        .update({ user_id: user.id })
        .in("id", unlinkedTicketIds);
    }
  }

  // 5. Consultar transferencias entrantes pendientes para este usuario (para aceptar en 1 clic)
  let incomingRawTransfers: any[] = [];
  if (cleanEmail) {
    const { data: inc } = await adminDb
      .from("ticket_transfers")
      .select("id, ticket_id, from_user_id, to_email, to_name, status, created_at")
      .ilike("to_email", cleanEmail)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    incomingRawTransfers = inc || [];
  }

  // 6. Consultar historial de transferencias enviadas por este usuario que YA fueron aceptadas (descontadas)
  const { data: outgoingAcceptedRaw } = await adminDb
    .from("ticket_transfers")
    .select("id, ticket_id, from_user_id, to_email, to_name, status, created_at, updated_at")
    .eq("from_user_id", user.id)
    .eq("status", "accepted")
    .order("updated_at", { ascending: false });

  // Deduplicar historial de enviadas aceptadas por ticket_id (mostrando la más reciente si se transfirió varias veces)
  // y excluir boletas que actualmente hayan vuelto a manos del usuario
  const ownedTicketIdsSet = new Set(ownedRawTickets.map((t: any) => t.id));
  const seenAcceptedTicketIds = new Set<string>();
  const filteredOutgoingAccepted: any[] = [];
  for (const tr of outgoingAcceptedRaw || []) {
    if (ownedTicketIdsSet.has(tr.ticket_id)) continue;
    if (seenAcceptedTicketIds.has(tr.ticket_id)) continue;
    seenAcceptedTicketIds.add(tr.ticket_id);
    filteredOutgoingAccepted.push(tr);
  }

  // 7. Recolectar todos los tickets adicionales necesarios para enriquecer incoming y outgoing
  const extraTicketIds = Array.from(
    new Set([
      ...incomingRawTransfers.map((tr: any) => tr.ticket_id),
      ...filteredOutgoingAccepted.map((tr: any) => tr.ticket_id),
    ].filter(Boolean))
  );

  let extraTicketsMap = new Map<string, any>();
  if (extraTicketIds.length > 0) {
    const { data: extraTickets } = await adminDb
      .from("tickets")
      .select("id, tier_id, order_id, status")
      .in("id", extraTicketIds);
    extraTicketsMap = new Map((extraTickets || []).map((t: any) => [t.id, t]));
  }

  // 8. Recolectar todos los tier_ids para traer localidades y eventos en una sola consulta
  const allTierIds = Array.from(
    new Set(
      [
        ...ownedRawTickets.map((t: any) => t.tier_id),
        ...Array.from(extraTicketsMap.values()).map((t: any) => t.tier_id),
      ].filter(Boolean)
    )
  );

  let tiersMap = new Map<string, any>();
  if (allTierIds.length > 0) {
    const { data: tiersData } = await adminDb
      .from("ticket_tiers")
      .select(`
        id,
        name,
        price,
        events (
          id,
          title,
          start_date,
          location_name,
          location_address,
          cover_image,
          description
        )
      `)
      .in("id", allTierIds);

    tiersMap = new Map((tiersData || []).map((tr: any) => [tr.id, tr]));
  }

  // Enriquecer boletas propias
  const enrichedTickets = ownedRawTickets.map((t: any) => {
    const tier = tiersMap.get(t.tier_id) || null;
    // Filtrar ticket_transfers para que solo considere pending reales emitidas por el dueño actual
    const rawTransfers = Array.isArray(t.ticket_transfers)
      ? t.ticket_transfers
      : t.ticket_transfers
      ? [t.ticket_transfers]
      : [];
    const cleanTransfers = rawTransfers.filter((tr: any) => {
      if (tr.status !== "pending") return true;
      // Una transferencia pendiente solo es válida como saliente si no es hacia el propio dueño actual
      return (tr.to_email || "").trim().toLowerCase() !== cleanEmail;
    });

    return {
      ...t,
      ticket_transfers: cleanTransfers,
      ticket_tiers: tier,
    };
  });

  // Resolver nombres de emisores para incomingRawTransfers
  const senderIds = Array.from(
    new Set(incomingRawTransfers.map((tr: any) => tr.from_user_id).filter(Boolean))
  );
  const senderProfilesMap = new Map<string, string>();
  if (senderIds.length > 0) {
    const { data: senderProfiles } = await adminDb
      .from("profiles")
      .select("id, full_name")
      .in("id", senderIds);
    for (const p of senderProfiles || []) {
      if (p.full_name) senderProfilesMap.set(p.id, p.full_name);
    }
  }

  const enrichedIncoming = incomingRawTransfers
    .map((tr: any) => {
      const t = extraTicketsMap.get(tr.ticket_id);
      if (!t || t.status !== "valid") return null;
      const tier = tiersMap.get(t.tier_id) || null;
      const event = Array.isArray(tier?.events) ? tier?.events[0] : tier?.events;
      return {
        ...tr,
        sender_name: senderProfilesMap.get(tr.from_user_id) || "Un usuario de Bassfactory",
        tier_name: tier?.name || "Localidad General",
        event: event || { title: "Evento Bassfactory" },
      };
    })
    .filter(Boolean);

  const enrichedOutgoingAccepted = filteredOutgoingAccepted.map((tr: any) => {
    const t = extraTicketsMap.get(tr.ticket_id);
    const tier = t ? tiersMap.get(t.tier_id) : null;
    const event = Array.isArray(tier?.events) ? tier?.events[0] : tier?.events;
    return {
      ...tr,
      tier_name: tier?.name || "Localidad General",
      event_title: event?.title || "Evento Bassfactory",
      event_id: event?.id || "general-event",
    };
  });

  return {
    tickets: enrichedTickets,
    incomingTransfers: enrichedIncoming,
    acceptedOutgoingTransfers: enrichedOutgoingAccepted,
  };
}
