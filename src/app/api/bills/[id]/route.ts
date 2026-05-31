import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const bill = await prisma.bill.update({
    where: { id },
    data: { paid: true },
  });

  return NextResponse.json(bill);
}
