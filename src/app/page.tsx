import { prisma } from "@/lib/db";
import { formatUsd, sumDecimalStrings } from "@/lib/money";
import Link from "next/link";
import { UserIcon } from "@heroicons/react/16/solid";

/** Server component — dashboard totals computed on the server from Prisma. */
export default async function Home() {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "desc" } });
  const bills = await prisma.bill.findMany({ where: { paid: false } });

  // Sum in cents to avoid float drift (see lib/money.ts)
  const total = sumDecimalStrings(bills.map((b) => b.amount.toString()));
  const overdueCount = bills.filter((b) => b.dueDate < new Date()).length;

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
          Total Outstanding: ${formatUsd(total)}
        </div>
        <div className="mt-2 text-gray-600">
          {overdueCount} overdue bill{overdueCount === 1 ? "" : "s"}
        </div>
        <div className="mt-6 flex gap-4">
          <Link href="/bills" className="text-blue-600 underline">
            View bills →
          </Link>
          <Link href="/bills?filter=overdue" className="text-blue-600 underline">
            Overdue bills →
          </Link>
          <Link href="/import" className="text-blue-600 underline">
            Import bills →
          </Link>
        </div>
      </div>
    </div>
  );
}
