import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import {
  AsaasError,
  createPayment,
  findOrCreateCustomer,
} from "@/lib/asaas";
import { syntheticCpf } from "@/lib/cpf";
import { calculateFee } from "@/lib/fees";

const cardSchema = z.object({
  donationId: z.string().cuid(),
  cardNumber: z.string().length(16),
  holderName: z.string().min(3),
  expiry: z.string().regex(/^\d{2}\/\d{2}$/),
  cvv: z.string().min(3).max(4),
  installments: z.number().int().min(1).max(12).default(1),
  // Optional cardholder document (for KYC). Defaults to donor phone digits if absent.
  holderCpf: z
    .string()
    .optional()
    .transform((v) => v?.replace(/\D/g, "")),
  holderEmail: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = cardSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const donation = await prisma.donation.findUnique({
      where: { id: data.donationId },
      include: { caixinha: true },
    });

    if (!donation) {
      return NextResponse.json({ error: "Doação não encontrada." }, { status: 404 });
    }

    if (donation.paymentStatus === "CONFIRMED") {
      return NextResponse.json({
        success: true,
        paymentId: donation.asaasPaymentId ?? donation.paymentId,
        status: "CONFIRMED",
      });
    }

    const [expiryMonth, expiryYearShort] = data.expiry.split("/");
    const expiryYear =
      expiryYearShort.length === 2 ? `20${expiryYearShort}` : expiryYearShort;

    const customer = await findOrCreateCustomer({
      name: donation.donorName,
      phone: donation.donorPhone,
      mobilePhone: donation.donorPhone,
      cpfCnpj: data.holderCpf,
      externalReference: `donor:${donation.id}`,
    });

    const dueDate = new Date().toISOString().slice(0, 10);
    const remoteIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "127.0.0.1";

    const installments = Math.max(1, data.installments);

    // The Asaas card fee depends on the installment tier (1x, 2-6x, 7-12x).
    // Donation was created before the donor picked the tier, so re-price now
    // and persist the corrected totals before charging.
    const repriced = calculateFee(
      Number(donation.amount),
      "CREDIT_CARD",
      installments,
    );
    if (
      Math.abs(repriced.totalAmount - Number(donation.totalAmount)) > 0.005 ||
      donation.installments !== installments
    ) {
      await prisma.donation.update({
        where: { id: donation.id },
        data: {
          feePercent: repriced.feePercent,
          feeAmount: repriced.feeAmount,
          totalAmount: repriced.totalAmount,
          installments,
        },
      });
    }

    const payment = await createPayment({
      customer: customer.id,
      billingType: "CREDIT_CARD",
      value: repriced.totalAmount,
      dueDate,
      description: `Caixinha ${donation.caixinha.coupleNames}`,
      externalReference: donation.id,
      notificationDisabled: true,
      installmentCount: installments > 1 ? installments : undefined,
      installmentValue:
        installments > 1
          ? Math.round((repriced.totalAmount / installments) * 100) / 100
          : undefined,
      creditCard: {
        holderName: data.holderName,
        number: data.cardNumber,
        expiryMonth,
        expiryYear,
        ccv: data.cvv,
      },
      creditCardHolderInfo: {
        name: data.holderName,
        email: data.holderEmail ?? `${donation.donorPhone}@caixinha.local`,
        cpfCnpj:
          data.holderCpf && data.holderCpf.length === 11
            ? data.holderCpf
            : syntheticCpf(donation.donorPhone),
        postalCode: "01310100",
        addressNumber: "100",
        phone: donation.donorPhone,
        mobilePhone: donation.donorPhone,
      },
      remoteIp,
    });

    await prisma.donation.update({
      where: { id: data.donationId },
      data: {
        asaasPaymentId: payment.id,
        asaasInvoiceUrl: payment.invoiceUrl ?? null,
        installments,
        paymentId: payment.id,
      },
    });

    const lastFour = data.cardNumber.slice(-4);

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      status: payment.status,
      lastFour,
      installments,
      message:
        payment.status === "CONFIRMED"
          ? "Pagamento aprovado!"
          : "Pagamento em processamento.",
    });
  } catch (error) {
    console.error("Card payment error:", error);
    if (error instanceof AsaasError) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    return NextResponse.json({ error: "Erro ao processar pagamento." }, { status: 500 });
  }
}
