import { prisma } from "@/lib/db";
import Link from "next/link";
import BillsTable, { BillRow } from "./BillsTable";

type Props = {
  searchParams: Promise<{ filter?: string }>;
};

/** Server component — reads bills from DB, passes rows to client table. */
export default async function BillsPage({ searchParams }: Props) {
  const { filter } = await searchParams;
  const now = new Date();

  const bills = await prisma.bill.findMany({
    where:
      filter === "overdue"
        ? { paid: false, dueDate: { lt: now } }
        : filter === "unpaid"
          ? { paid: false }
          : filter === "paid"
            ? { paid: true }
            : undefined,
    orderBy: { dueDate: "asc" },
  });

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
      <div className="mt-3 flex gap-3 text-sm">
        <Link
          href="/bills"
          className={!filter ? "font-bold underline" : "text-blue-600 underline"}
        >
          All
        </Link>
        <Link
          href="/bills?filter=unpaid"
          className={
            filter === "unpaid" ? "font-bold underline" : "text-blue-600 underline"
          }
        >
          Unpaid
        </Link>
        <Link
          href="/bills?filter=paid"
          className={
            filter === "paid" ? "font-bold underline" : "text-blue-600 underline"
          }
        >
          Paid
        </Link>
        <Link
          href="/bills?filter=overdue"
          className={
            filter === "overdue" ? "font-bold underline" : "text-blue-600 underline"
          }
        >
          Overdue
        </Link>
      </div>
      <BillsTable bills={rows} refreshedAt={now.toISOString()} />
    </div>
  );
}
