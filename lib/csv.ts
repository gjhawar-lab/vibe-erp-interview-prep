/**
 * Parse a bill CSV row using column headers from the file.
 * Fixture columns: vendor, amount, invoice_date, invoice_number, ..., due_date
 */

export type ParsedBill = {
  vendorName: string;
  amount: string; // keep as string to preserve Decimal precision downstream
  dueDate: Date;
  invoiceNumber: string;
};

/** Parse "2026-04-15" as a calendar date (no timezone shift). */
export function parseDateOnly(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

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

export function parseBillRow(headers: string[], row: string[]): ParsedBill {
  return {
    vendorName: getCell(headers, row, "vendor"),
    amount: getCell(headers, row, "amount"),
    dueDate: parseDateOnly(getCell(headers, row, "due_date")),
    invoiceNumber: getCell(headers, row, "invoice_number"),
  };
}

/** Split a CSV file into header row + data rows. Naive (no quote handling). */
export function splitCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((l) => l.split(",").map((c) => c.trim()));
  return { headers, rows };
}
