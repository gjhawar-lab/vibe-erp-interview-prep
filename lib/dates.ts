/**
 * Calendar days between due date and today.
 * Returns 0 if the bill is not yet due.
 */
export function daysPastDue(dueDate: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = Math.floor((Date.now() - dueDate.getTime()) / msPerDay);
  return Math.max(0, diff);
}

/** Format a stored date for display without timezone day-shift. */
export function formatDateOnly(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { timeZone: "UTC" });
}
