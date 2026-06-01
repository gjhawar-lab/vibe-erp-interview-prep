import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";
import { parseBillRow, splitCsv } from "@/lib/csv";

type BillSeed = {
  vendorName: string;
  amount: string;
  dueDate: Date;
  paid: boolean;
};

const BILLS: BillSeed[] = [
  { vendorName: "SAP SE",     amount: "99.995",  dueDate: new Date("2026-03-01T23:00:00Z"), paid: false },
  { vendorName: "SAP SE",     amount: "99.995",  dueDate: new Date("2026-03-05T23:00:00Z"), paid: false },
  { vendorName: "SAP SE",     amount: "99.995",  dueDate: new Date("2026-04-10T12:00:00Z"), paid: false },
  { vendorName: "SAP SE",     amount: "99.995",  dueDate: new Date("2026-04-15T12:00:00Z"), paid: false },
  { vendorName: "SAP SE",     amount: "99.995",  dueDate: new Date("2026-05-15T00:00:00Z"), paid: false },
  { vendorName: "Acme Corp",  amount: "250.005", dueDate: new Date("2026-02-15T23:00:00Z"), paid: false },
  { vendorName: "Acme Corp",  amount: "250.005", dueDate: new Date("2026-04-20T12:00:00Z"), paid: false },
  { vendorName: "Acme Corp",  amount: "250.005", dueDate: new Date("2026-05-01T12:00:00Z"), paid: false },
  { vendorName: "Globex Inc", amount: "100.00",  dueDate: new Date("2026-04-25T12:00:00Z"), paid: false },
  { vendorName: "Globex Inc", amount: "100.005", dueDate: new Date("2026-05-05T12:00:00Z"), paid: false },
  { vendorName: "Initech",    amount: "0.10",    dueDate: new Date("2026-05-10T12:00:00Z"), paid: false },
  { vendorName: "Initech",    amount: "0.10",    dueDate: new Date("2026-05-12T12:00:00Z"), paid: false },

  { vendorName: "Stripe",     amount: "45.00",   dueDate: new Date("2026-01-15T12:00:00Z"), paid: true },
  { vendorName: "Stripe",     amount: "45.00",   dueDate: new Date("2026-02-15T12:00:00Z"), paid: true },
  { vendorName: "Stripe",     amount: "45.00",   dueDate: new Date("2026-03-15T12:00:00Z"), paid: true },
  { vendorName: "Acme Corp",  amount: "500.00",  dueDate: new Date("2026-01-30T12:00:00Z"), paid: true },
  { vendorName: "Globex Inc", amount: "75.50",   dueDate: new Date("2026-02-20T12:00:00Z"), paid: true },
  { vendorName: "Initech",    amount: "12.99",   dueDate: new Date("2026-03-01T12:00:00Z"), paid: true },
  { vendorName: "SAP SE",     amount: "199.99",  dueDate: new Date("2026-04-05T12:00:00Z"), paid: true },
  { vendorName: "Acme Corp",  amount: "1.00",    dueDate: new Date("2026-04-12T12:00:00Z"), paid: true },
];

async function main() {
  try {
    let user = await prisma.user.findUnique({
      where: { email: "test@test.com" },
    });
    if (!user) {
      user = await prisma.user.create({
        data: { email: "test@test.com" },
      });
    }

    await prisma.bill.deleteMany();

    for (const b of BILLS) {
      await prisma.bill.create({
        data: {
          vendorName: b.vendorName,
          amount: new Prisma.Decimal(b.amount),
          dueDate: b.dueDate,
          paid: b.paid,
        },
      });
    }

    // Import the customer-provided CSV via the same parser the /import
    // page uses. Mirrors a real ingestion run on a fresh DB.
    const csvPath = path.join(process.cwd(), "fixtures", "bills.csv");
    const text = await fs.readFile(csvPath, "utf8");
    const rows = splitCsv(text);
    for (const r of rows) {
      const b = parseBillRow(r);
      await prisma.bill.create({
        data: {
          vendorName: b.vendorName,
          amount: new Prisma.Decimal(b.amount),
          dueDate: b.dueDate,
          invoiceNumber: b.invoiceNumber,
          paid: false,
        },
      });
    }

    const unpaidCount = await prisma.bill.count({ where: { paid: false } });
    const paidCount = await prisma.bill.count({ where: { paid: true } });
    console.log(
      `Seed completed. user=${user.email}, bills=${BILLS.length} + csv (unpaid=${unpaidCount}, paid=${paidCount})`,
    );
  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
