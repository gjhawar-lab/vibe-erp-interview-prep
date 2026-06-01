// FIX (negative days): clamp to 0 so bills that aren't due yet don't show negatives.
//   EXAMPLE (today = 2026-05-31):
//     due 2026-05-01 -> 30   (30 days overdue)
//     due 2026-06-15 -> 0    (not due yet; was -15 before the clamp)
export function daysPastDue(dueDate: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.floor((Date.now() - dueDate.getTime()) / msPerDay));
}

// FIX (timezone display): render a stored date in UTC so it never shifts a day.
//   EXAMPLE: a bill due 2026-04-15 viewed in California (UTC-7)
//     before: new Date(iso).toLocaleDateString()                  -> "4/14/2026"
//     after:  ...toLocaleDateString("en-US", { timeZone: "UTC" }) -> "4/15/2026"
export function formatDateOnly(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { timeZone: "UTC" });
}
