import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/db";
import { parseBillRow, splitCsv } from "@/lib/csv";

const FIXTURE = path.join(process.cwd(), "fixtures", "bills.csv");

/** Shared import logic for fixture file and uploaded CSV. */
async function importCsvText(text: string) {
  const { headers, rows } = splitCsv(text);
  const created: string[] = [];
  const skipped: string[] = [];

  for (const r of rows) {
    const b = parseBillRow(headers, r);

    // Skip duplicate imports — same invoice # already in DB
    if (b.invoiceNumber) {
      const existing = await prisma.bill.findFirst({
        where: { invoiceNumber: b.invoiceNumber },
      });
      if (existing) {
        skipped.push(b.invoiceNumber);
        continue;
      }
    }

    try {
      const bill = await prisma.bill.create({
        data: {
          vendorName: b.vendorName,
          amount: new Prisma.Decimal(b.amount),
          dueDate: b.dueDate,
          invoiceNumber: b.invoiceNumber,
          paid: false,
        },
      });
      created.push(bill.id);
    } catch (err) {
      // Unique constraint on invoiceNumber — handles concurrent double-submit
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        b.invoiceNumber
      ) {
        skipped.push(b.invoiceNumber);
        continue;
      }
      throw err;
    }
  }

  return { created, skipped };
}

/**
 * POST /api/import
 * - No body: reads fixtures/bills.csv from disk (dev/demo button)
 * - multipart/form-data with "file": reads uploaded CSV from browser
 */
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json(
          { error: "Missing file field" },
          { status: 400 },
        );
      }
      const text = await file.text();
      return NextResponse.json(await importCsvText(text));
    }

    // Default: import the bundled fixture file
    const text = await fs.readFile(FIXTURE, "utf8");
    return NextResponse.json(await importCsvText(text));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
