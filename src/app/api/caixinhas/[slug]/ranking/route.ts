import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const caixinha = await prisma.caixinha.findUnique({
    where: { slug, isActive: true },
    select: { id: true },
  });

  if (!caixinha) {
    return NextResponse.json({ error: "Caixinha não encontrada." }, { status: 404 });
  }

  const donations = await prisma.donation.findMany({
    where: {
      caixinhaId: caixinha.id,
      paymentStatus: "CONFIRMED",
    },
    select: {
      id: true,
      donorName: true,
      donorPhone: true,
      amount: true,
      message: true,
      videoUrl: true,
      createdAt: true,
    },
    orderBy: [{ amount: "desc" }, { createdAt: "asc" }],
    take: 20,
  });

  // Mask phone for privacy
  const ranking = donations.map((d, index) => ({
    ...d,
    amount: Number(d.amount),
    donorPhone: d.donorPhone.replace(/(\d{2})(\d{4,5})(\d{4})/, "($1) $2-****"),
    rank: index + 1,
    createdAt: d.createdAt.toISOString(),
  }));

  return NextResponse.json({ ranking });
}
