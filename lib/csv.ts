/**
 * CSV parsing for bill imports.
 *
 * BUG WE FIXED: The PDF spec says columns are positional (col 3 = due date),
 * but the real customer CSV has headers and extra columns — due_date is NOT
 * at index 2 (that's invoice_date). We now look up columns by header name.
 *
 * Fixture columns: vendor, amount, invoice_date, invoice_number, ..., due_date
 */

export type ParsedBill = {
  vendorName: string;
  amount: string; // keep as string to preserve Decimal precision downstream
  dueDate: Date;
  invoiceNumber: string;
};

/**
 * Parse "2026-04-15" as a calendar date in UTC.
 * Avoids new Date("2026-04-15") which can shift a day in US timezones.
 */
export function parseDateOnly(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  // month - 1 because JS months are 0-indexed (0 = January)
  return new Date(Date.UTC(year, month - 1, day));
}

/** Look up one cell by column header name (e.g. "due_date"). */
function getCell(headers: string[], row: string[], columnName: string): string {
  const index = headers.indexOf(columnName);
  if (index === -1) {
    throw new Error(`Missing column: ${columnName}`);
  }
  const value = row[index]?.trim();
  if (!value) {
    throw new Error(`Empty value for column: ${columnName}`);
  }
  return value;
}

/** Turn one CSV data row into a bill object. Requires headers from line 1 of the file. */
export function parseBillRow(headers: string[], row: string[]): ParsedBill {
  return {
    vendorName: getCell(headers, row, "vendor"),
    amount: getCell(headers, row, "amount"),
    dueDate: parseDateOnly(getCell(headers, row, "due_date")),
    invoiceNumber: getCell(headers, row, "invoice_number"),
  };
}

/** Split CSV text into header row + data rows. Naive (no quoted-comma handling). */
export function splitCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const headers = lines[0].split(",").map((h) => h.trim()); // line 1 → column names
  const rows = lines.slice(1).map((l) => l.split(",").map((c) => c.trim())); // rest → data
  return { headers, rows };
}
