import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import Link from "next/link";
import { UserIcon } from "@heroicons/react/16/solid";

export default async function Home() {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "desc" } });
  const bills = await prisma.bill.findMany({ where: { paid: false } });

  // FIX (money): sum with Prisma.Decimal, then round once. Never use a JS float.
  //   BUG: bills.reduce((s, b) => s + Number(b.amount), 0) drifts —
  //        e.g. 0.1 + 0.2 === 0.30000000000000004, and amounts like 99.995 misround.
  //   EXAMPLE: three unpaid bills of 99.995
  //     before (float):            299.985000...   -> messy / wrong cents
  //     after  (Decimal.toFixed):  "299.99"
  const total = bills
    .reduce((sum, b) => sum.plus(b.amount), new Prisma.Decimal(0))
    .toFixed(2);

  return (
    <div>
      <div className="flex justify-between border-b p-4">
        <h6 className="font-bold">Vibe ERP</h6>
        {user && (
          <div className="flex items-center gap-2">
            <button className="rounded-full bg-gray-100 p-2">
              <UserIcon className="h-4 w-4" />
            </button>
            <div>{user.email}</div>
          </div>
        )}
      </div>
      <div className="p-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="mt-4 text-lg">
          Total Outstanding: ${total}
        </div>
        <div className="mt-6 flex gap-4">
          <Link href="/bills" className="text-blue-600 underline">
            View bills →
          </Link>
          <Link href="/import" className="text-blue-600 underline">
            Import bills →
          </Link>
        </div>
      </div>
    </div>
  );
}
