export type ParsedBill = {
  vendorName: string;
  amount: string; // keep as string to preserve Decimal precision downstream
  dueDate: Date;
  invoiceNumber: string;
};

/**
 * Parse a YYYY-MM-DD value as a UTC calendar date. Plain `new Date("2026-04-15")`
 * is UTC midnight but renders in the local zone, shifting a day in US timezones.
 */
export function parseDateOnly(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Map a CSV row to a bill by column *header*, not fixed position. The customer's
 * PDF spec lists a stale column order; in the real file `due_date` is the last
 * column, so positional parsing was reading `invoice_date` as the due date.
 */
export function parseBillRow(headers: string[], row: string[]): ParsedBill {
  const cell = (name: string) => {
    const i = headers.indexOf(name);
    if (i === -1) throw new Error(`Missing column: ${name}`);
    return row[i]?.trim() ?? "";
  };
  return {
    vendorName: cell("vendor"),
    amount: cell("amount"),
    dueDate: parseDateOnly(cell("due_date")),
    invoiceNumber: cell("invoice_number"),
  };
}

/** Split CSV text into a header row + data rows. Naive: no quoted-comma handling. */
export function splitCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((l) => l.split(",").map((c) => c.trim()));
  return { headers, rows };
}
