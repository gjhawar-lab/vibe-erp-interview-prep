// CSV parsing for bill imports.
//
// FIX (TICKET-104): map columns by HEADER NAME, not fixed position.
//   BUG: the PDF spec (docs/bill_format_spec.pdf.txt) lists a stale column order,
//        so positional code read column 3 (invoice_date) as the due date.
//   EXAMPLE — real fixture row:
//     vendor,amount,invoice_date,invoice_number,...,due_date
//     Northwind Traders,1450.00,2026-03-01,INV-7741,...,2026-04-15
//       wrong (row[2]):           2026-03-01  (that's the invoice date)
//       right (row["due_date"]):  2026-04-15
//
// We turn each row into a { header: value } object so lookups read clearly
// and a console.log shows { vendor: "SAP", ... } instead of ["SAP", ...].

export type ParsedBill = {
  vendorName: string;
  amount: string; // keep as a string so precision survives until Prisma.Decimal
  dueDate: Date;
  invoiceNumber: string;
};

const REQUIRED_COLUMNS = ["vendor", "amount", "due_date"] as const;

/**
 * Parse "YYYY-MM-DD" as UTC midnight. Plain new Date("2026-04-15") is UTC but
 * renders in the local zone, which shifts the day backward in US timezones.
 *   EXAMPLE: parseDateOnly("2026-04-15") -> 2026-04-15T00:00:00.000Z
 */
export function parseDateOnly(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)); // month - 1: JS months are 0-indexed
}

/**
 * Split CSV text into an array of { header: value } row objects.
 * Validates required columns once, up front, so a missing/renamed column fails
 * loudly here instead of silently producing Invalid Date / undefined later.
 * NOTE: naive split(",") — does not handle quoted fields containing commas.
 */
export function splitCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const missing = REQUIRED_COLUMNS.filter((c) => !headers.includes(c));
  if (missing.length) {
    throw new Error(`CSV is missing required column(s): ${missing.join(", ")}`);
  }

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = values[i] ?? ""));
    return row;
  });
}

/** Map one row object to a bill. invoice_number is optional (schema allows null). */
export function parseBillRow(row: Record<string, string>): ParsedBill {
  return {
    vendorName: row["vendor"],
    amount: row["amount"],
    dueDate: parseDateOnly(row["due_date"]),
    invoiceNumber: row["invoice_number"] ?? "",
  };
}
