/**
 * Calendar days between due date and today.
 * Returns 0 if the bill is not yet due (fixes negative numbers for future bills).
 */
export function daysPastDue(dueDate: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = Math.floor((Date.now() - dueDate.getTime()) / msPerDay);
  // Future due dates give negative diff — clamp to 0 for "not overdue yet"
  return Math.max(0, diff);
}

/**
 * Format a stored ISO date for display without timezone day-shift.
 * e.g. stored 2026-04-15 UTC always renders as 4/15/2026, not 4/14 in Pacific.
 */
export function formatDateOnly(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { timeZone: "UTC" });
}
