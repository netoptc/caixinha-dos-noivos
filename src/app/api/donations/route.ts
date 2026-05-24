import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateFee, type PaymentMethod } from "@/lib/fees";
import {
  formatMinDonationAmount,
  getMinDonationAmount,
} from "@/lib/donation-limits";
import { z } from "zod";

const MIN_DONATION = getMinDonationAmount();

const donationSchema = z.object({
  caixinhaId: z.string().cuid(),
  donorName: z.string().min(2).max(200),
  donorPhone: z.string().min(10).max(15),
  amount: z
    .number()
    .positive()
    .min(MIN_DONATION, `Valor mínimo: ${formatMinDonationAmount()}`),
  message: z.string().max(500).optional(),
  videoUrl: z.string().optional(),
  photoUrl: z.string().optional(),
  paymentMethod: z.enum(["PIX", "CREDIT_CARD"]),
  installments: z.number().int().min(1).max(12).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = donationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const caixinha = await prisma.caixinha.findUnique({
      where: { id: data.caixinhaId, isActive: true },
    });

    if (!caixinha) {
      return NextResponse.json(
        { error: "Caixinha não encontrada ou inativa." },
        { status: 404 }
      );
    }

    const installments = data.installments ?? 1;
    const { feePercent, feeAmount, totalAmount } = calculateFee(
      data.amount,
      data.paymentMethod as PaymentMethod,
      installments,
    );

    const donation = await prisma.donation.create({
      data: {
        donorName: data.donorName,
        donorPhone: data.donorPhone,
        amount: data.amount,
        feePercent,
        feeAmount,
        totalAmount,
        installments,
        message: data.message ?? null,
        videoUrl: data.videoUrl ?? null,
        photoUrl: data.photoUrl ?? null,
        paymentMethod: data.paymentMethod,
        paymentStatus: "PENDING",
        caixinhaId: data.caixinhaId,
      },
    });

    return NextResponse.json({ donation }, { status: 201 });
  } catch (error) {
    console.error("Create donation error:", error);
    return NextResponse.json({ error: "Erro ao registrar doação." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const caixinhaId = searchParams.get("caixinhaId");

  if (!caixinhaId) {
    return NextResponse.json({ error: "caixinhaId obrigatório." }, { status: 400 });
  }

  const donations = await prisma.donation.findMany({
    where: { caixinhaId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ donations });
}
