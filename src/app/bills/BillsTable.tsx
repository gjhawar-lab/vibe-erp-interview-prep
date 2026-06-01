"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { daysPastDue, formatDateOnly } from "@/lib/dates";
import { formatUsd } from "@/lib/money";

export type BillRow = {
  id: string;
  vendorName: string;
  dueDate: string;
  amount: string;
  invoiceNumber: string | null;
  paid: boolean;
};

type Props = {
  bills: BillRow[];
  /** Set on the server so client hydration matches (avoids new Date() mismatch). */
  refreshedAt: string;
};

/** Client component — needs "use client" for onClick buttons and router.refresh(). */
export default function BillsTable({ bills, refreshedAt }: Props) {
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
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bills.map((b) => {
            const days = b.paid ? 0 : daysPastDue(new Date(b.dueDate));
            const overdueDisplay = b.paid ? "—" : days > 0 ? days : "—";

            return (
              <tr key={b.id} className="border-b">
                <td className="p-2">{b.vendorName}</td>
                <td className="p-2">{b.invoiceNumber ?? "—"}</td>
                <td className="p-2">{formatDateOnly(b.dueDate)}</td>
                <td className="p-2">{overdueDisplay}</td>
                <td className="p-2 text-right">${formatUsd(b.amount)}</td>
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
