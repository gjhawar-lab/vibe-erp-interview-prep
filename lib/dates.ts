/** Whole days a bill is past due; 0 for bills not yet due (no negative numbers). */
export function daysPastDue(dueDate: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.floor((Date.now() - dueDate.getTime()) / msPerDay));
}

/** Render a stored date without timezone day-shift (dates are stored at UTC midnight). */
export function formatDateOnly(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { timeZone: "UTC" });
}
