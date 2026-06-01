"use client";

import { daysPastDue, formatDateOnly } from "@/lib/dates";

export type BillRow = {
  id: string;
  vendorName: string;
  dueDate: string;
  amount: string;
  invoiceNumber: string | null;
  paid: boolean;
};

// `refreshedAt` comes from the server (see bills/page.tsx). Because the server HTML and
// the client hydration render the SAME string, there's no "Text content did not match"
// hydration warning — which calling new Date() in here would cause.
export default function BillsTable({
  bills,
  refreshedAt,
}: {
  bills: BillRow[];
  refreshedAt: string;
}) {
  return (
    <>
      <p className="mt-2 text-sm text-gray-500">Last refreshed: {refreshedAt}</p>
      <table className="mt-2 w-full">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="p-2 text-left">Vendor</th>
            <th className="p-2 text-left">Invoice #</th>
            <th className="p-2 text-left">Due Date</th>
            <th className="p-2 text-left">Days Past Due</th>
            <th className="p-2 text-right">Amount</th>
            <th className="p-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {bills.map((b) => {
            // null when paid; daysPastDue() already clamps not-yet-due bills to 0.
            const dpd = b.paid ? null : daysPastDue(new Date(b.dueDate));
            return (
              <tr key={b.id} className="border-b">
                <td className="p-2">{b.vendorName}</td>
                <td className="p-2">{b.invoiceNumber ?? "—"}</td>
                {/* UTC display so the date never shifts a day (see lib/dates.ts) */}
                <td className="p-2">{formatDateOnly(b.dueDate)}</td>
                {/* 0 (not overdue) and null (paid) both render as a dash */}
                <td className="p-2">{dpd || "—"}</td>
                <td className="p-2 text-right">${b.amount}</td>
                <td className="p-2">{b.paid ? "Paid" : "Unpaid"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
