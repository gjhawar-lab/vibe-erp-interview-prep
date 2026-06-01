import { prisma } from "@/lib/db";
import Link from "next/link";
import BillsTable, { BillRow } from "./BillsTable";

export default async function BillsPage() {
  const bills = await prisma.bill.findMany({ orderBy: { dueDate: "asc" } });

  const rows: BillRow[] = bills.map((b) => ({
    id: b.id,
    vendorName: b.vendorName,
    dueDate: b.dueDate.toISOString(),
    amount: b.amount.toString(),
    invoiceNumber: b.invoiceNumber,
    paid: b.paid,
  }));

  return (
    <div className="p-8">
      <Link href="/" className="text-blue-600 underline">
        ← Dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Bills</h1>
      {/*
        FIX (hydration): "Last refreshed" should mean "when this data was read".
        This page is dynamic (Prisma runs per request), so the server timestamp
        is the correct value. Computing it here and passing it down keeps the
        server HTML and client hydration identical — no hydration mismatch.
      */}
      <BillsTable bills={rows} refreshedAt={new Date().toISOString()} />
    </div>
  );
}
