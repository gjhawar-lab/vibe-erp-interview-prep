import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/db";
import { parseBillRow, splitCsv } from "@/lib/csv";

const FIXTURE = path.join(process.cwd(), "fixtures", "bills.csv");

export async function POST() {
  const text = await fs.readFile(FIXTURE, "utf8");
  const { headers, rows } = splitCsv(text);

  const created: string[] = [];
  for (const r of rows) {
    const b = parseBillRow(headers, r);
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
  }

  return NextResponse.json({ created });
}
