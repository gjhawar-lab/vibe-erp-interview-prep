// CSV parsing for bill imports.
//
// FIX (TICKET-104): parse columns by HEADER NAME, not by fixed position.
//   BUG: the PDF spec (docs/bill_format_spec.pdf.txt) lists a stale column order,
//        so positional code read column 3 — invoice_date — as the due date.
//   EXAMPLE — real fixture row:
//     vendor,amount,invoice_date,invoice_number,...,due_date
//     Northwind Traders,1450.00,2026-03-01,INV-7741,...,2026-04-15
//       before: dueDate = row[2]            = 2026-03-01  (invoice date — WRONG)
//       after:  dueDate = cell("due_date")  = 2026-04-15  (correct)
//   Bonus: header lookup still works if the vendor reorders columns later.

export type ParsedBill = {
  vendorName: string;
  amount: string; // keep as a string so precision isn't lost before Prisma.Decimal
  dueDate: Date;
  invoiceNumber: string;
};

// FIX (timezone parse): treat "YYYY-MM-DD" as UTC midnight.
//   BUG: new Date("2026-04-15") is UTC but rendered in the local zone, so in US
//        timezones it can display as 2026-04-14 (a day early).
//   EXAMPLE: parseDateOnly("2026-04-15") -> 2026-04-15T00:00:00.000Z
export function parseDateOnly(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)); // month - 1: JS months are 0-indexed
}

export function parseBillRow(headers: string[], row: string[]): ParsedBill {
  // Resolve a value by its column header (e.g. "due_date") instead of a guessed index.
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

// Split CSV text into a header row + data rows.
// NOTE: naive split(",") — does NOT handle quoted fields with commas (e.g. "Stark, LLC").
// Fine for this fixture; swap in a real CSV parser for messy vendor files.
export function splitCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const headers = lines[0].split(",").map((h) => h.trim()); // line 1 = column names
  const rows = lines.slice(1).map((l) => l.split(",").map((c) => c.trim()));
  return { headers, rows };
}
