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
        FIX (hydration): compute the timestamp HERE on the server and pass it as a
        prop. If the client component called new Date() itself, the server-render time
        and the browser-hydration time would differ and React would warn.
      */}
      <BillsTable bills={rows} refreshedAt={new Date().toISOString()} />
    </div>
  );
}
