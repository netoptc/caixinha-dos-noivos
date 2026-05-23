import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const caixinha = await prisma.caixinha.findUnique({
    where: { slug, isActive: true },
    include: {
      donations: {
        where: { paymentStatus: "CONFIRMED" },
        select: {
          id: true,
          donorName: true,
          donorPhone: true,
          amount: true,
          message: true,
          videoUrl: true,
          paymentMethod: true,
          createdAt: true,
        },
        orderBy: [{ amount: "desc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!caixinha) {
    return NextResponse.json({ error: "Caixinha não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ caixinha });
}
