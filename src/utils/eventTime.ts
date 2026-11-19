/**
 * Returns an ISO cutoff timestamp 12 hours in the past so events happening
 * today remain visible in all "Upcoming / Próximos" lists throughout the day/night.
 */
export function getUpcomingCutoffIso(): string {
  return new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
}

/**
 * Checks whether an event's start_date falls on today's calendar date
 * in Colombia time (America/Bogota).
 */
export function isEventToday(startDate?: string | null): boolean {
  if (!startDate) return false;
  try {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Bogota",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return fmt.format(new Date(startDate)) === fmt.format(new Date());
  } catch {
    return false;
  }
}
