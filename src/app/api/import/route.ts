import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/db";
import { parseBillRow, splitCsv } from "@/lib/csv";

const FIXTURE = path.join(process.cwd(), "fixtures", "bills.csv");

export async function POST() {
  try {
    const text = await fs.readFile(FIXTURE, "utf8");
    const rows = splitCsv(text).map(parseBillRow); // throws if a column is missing

    // FIX (no duplicates): find bills we already have, keyed by vendor+invoice.
    // (Invoice numbers are unique per vendor, not globally — see schema.prisma.)
    const existing = await prisma.bill.findMany({
      select: { vendorName: true, invoiceNumber: true },
    });
    const seen = new Set(
      existing.map((e) => `${e.vendorName}|${e.invoiceNumber}`),
    );

    // Keep only rows we haven't imported before.
    const newBills = rows.filter(
      (b) => !seen.has(`${b.vendorName}|${b.invoiceNumber}`),
    );

    // createMany runs as ONE statement, so it's all-or-nothing (atomic):
    // either every new bill is inserted, or none are.
    await prisma.bill.createMany({
      data: newBills.map((b) => ({
        vendorName: b.vendorName,
        amount: new Prisma.Decimal(b.amount),
        dueDate: b.dueDate,
        invoiceNumber: b.invoiceNumber || null,
        paid: false,
      })),
    });

    return NextResponse.json({
      created: newBills.length,
      skipped: rows.length - newBills.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
