"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { daysPastDue, formatDateOnly } from "@/lib/dates";

export type BillRow = {
  id: string;
  vendorName: string;
  dueDate: string;
  amount: string;
  invoiceNumber: string | null;
  paid: boolean;
};

export default function BillsTable({ bills }: { bills: BillRow[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function markPaid(id: string) {
    setLoadingId(id);
    try {
      await fetch(`/api/bills/${id}`, { method: "PATCH" });
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <>
      <p className="mt-2 text-sm text-gray-500">
        Last refreshed: {new Date().toISOString()}
      </p>
      <table className="mt-2 w-full">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="p-2 text-left">Vendor</th>
            <th className="p-2 text-left">Invoice #</th>
            <th className="p-2 text-left">Due Date</th>
            <th className="p-2 text-left">Days Past Due</th>
            <th className="p-2 text-right">Amount</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bills.map((b) => {
            const overdue =
              !b.paid && daysPastDue(new Date(b.dueDate)) > 0
                ? daysPastDue(new Date(b.dueDate))
                : null;

            return (
              <tr key={b.id} className="border-b">
                <td className="p-2">{b.vendorName}</td>
                <td className="p-2">{b.invoiceNumber ?? "—"}</td>
                <td className="p-2">{formatDateOnly(b.dueDate)}</td>
                <td className="p-2">{b.paid ? "—" : overdue ?? "—"}</td>
                <td className="p-2 text-right">${b.amount}</td>
                <td className="p-2">{b.paid ? "Paid" : "Unpaid"}</td>
                <td className="p-2">
                  {!b.paid && (
                    <button
                      onClick={() => markPaid(b.id)}
                      disabled={loadingId === b.id}
                      className="rounded bg-green-600 px-2 py-1 text-sm text-white disabled:opacity-50"
                    >
                      {loadingId === b.id ? "Saving…" : "Mark paid"}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
