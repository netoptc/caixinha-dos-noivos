import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  AsaasError,
  createPayment,
  findOrCreateCustomer,
  getPixQrCode,
} from "@/lib/asaas";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { donationId } = body;

    if (!donationId) {
      return NextResponse.json({ error: "donationId obrigatório." }, { status: 400 });
    }

    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      include: {
        caixinha: true,
      },
    });

    if (!donation) {
      return NextResponse.json({ error: "Doação não encontrada." }, { status: 404 });
    }

    if (donation.paymentStatus === "CONFIRMED") {
      return NextResponse.json({
        success: true,
        paymentId: donation.asaasPaymentId ?? donation.paymentId,
        pixQrCode: donation.pixQrCode,
        pixQrCodeImage: donation.pixQrCodeImage,
        status: "CONFIRMED",
      });
    }

    // 1) Find or create the donor as an Asaas customer
    const customer = await findOrCreateCustomer({
      name: donation.donorName,
      phone: donation.donorPhone,
      mobilePhone: donation.donorPhone,
      externalReference: `donor:${donation.id}`,
    });

    // 2) Create the PIX charge. Everything lands in the platform's master
    // account; the per-couple amount is reconciled in the database via
    // donation.amount and repassed on withdrawal request.
    const dueDate = new Date().toISOString().slice(0, 10);

    const payment = await createPayment({
      customer: customer.id,
      billingType: "PIX",
      value: Number(donation.totalAmount),
      dueDate,
      description: `Caixinha ${donation.caixinha.coupleNames}`,
      externalReference: donation.id,
      notificationDisabled: true,
    });

    // 3) Fetch the QR Code
    const qr = await getPixQrCode(payment.id);

    await prisma.donation.update({
      where: { id: donationId },
      data: {
        asaasPaymentId: payment.id,
        asaasInvoiceUrl: payment.invoiceUrl ?? null,
        pixQrCode: qr.payload,
        pixQrCodeImage: qr.encodedImage,
        paymentId: payment.id,
      },
    });

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      pixQrCode: qr.payload,
      pixQrCodeImage: qr.encodedImage,
      invoiceUrl: payment.invoiceUrl,
      status: "PENDING",
    });
  } catch (error) {
    console.error("PIX payment error:", error);
    if (error instanceof AsaasError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status >= 400 && error.status < 500 ? 400 : 502 },
      );
    }
    return NextResponse.json({ error: "Erro ao processar pagamento PIX." }, { status: 500 });
  }
}
