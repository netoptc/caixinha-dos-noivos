import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const donation = await prisma.donation.findUnique({
    where: { id },
    select: { paymentStatus: true },
  });
  if (!donation) {
    return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
  }
  return NextResponse.json({ status: donation.paymentStatus });
}
