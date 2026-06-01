import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

/** PATCH /api/bills/:id — mark a single bill as paid. */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const bill = await prisma.bill.update({
      where: { id },
      data: { paid: true },
    });

    return NextResponse.json(bill);
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update bill" }, { status: 500 });
  }
}
