import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { AsaasWebhookPayload } from "@/lib/asaas";

const CONFIRMED_EVENTS = new Set([
  "PAYMENT_CONFIRMED",
  "PAYMENT_RECEIVED",
]);

const REFUNDED_EVENTS = new Set([
  "PAYMENT_REFUNDED",
  "PAYMENT_CHARGEBACK_REQUESTED",
  "PAYMENT_CHARGEBACK_DISPUTE",
]);

const FAILED_PAYMENT_EVENTS = new Set([
  "PAYMENT_OVERDUE",
  "PAYMENT_DELETED",
]);

const TRANSFER_DONE_EVENTS = new Set(["TRANSFER_DONE"]);
const TRANSFER_FAILED_EVENTS = new Set([
  "TRANSFER_FAILED",
  "TRANSFER_CANCELLED",
  "TRANSFER_BLOCKED",
]);

function validateToken(req: NextRequest): boolean {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!expected) return true; // dev mode without webhook token configured
  const token = req.headers.get("asaas-access-token");
  return token === expected;
}

export async function POST(req: NextRequest) {
  if (!validateToken(req)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  let payload: AsaasWebhookPayload;
  try {
    payload = (await req.json()) as AsaasWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    if (payload.payment) {
      await handlePaymentEvent(payload);
    } else if (payload.transfer) {
      await handleTransferEvent(payload);
    }
  } catch (err) {
    console.error("Asaas webhook handling error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentEvent(payload: AsaasWebhookPayload) {
  const p = payload.payment!;
  const donation = await prisma.donation.findFirst({
    where: {
      OR: [
        { asaasPaymentId: p.id },
        ...(p.externalReference ? [{ id: p.externalReference }] : []),
      ],
    },
  });
  if (!donation) {
    console.warn(`Webhook payment ${p.id} not matched to any donation`);
    return;
  }

  if (CONFIRMED_EVENTS.has(payload.event)) {
    const newCreditDate = p.creditDate ? new Date(p.creditDate) : null;

    // Idempotência: o filtro `paymentStatus: "PENDING"` no updateMany é
    // reavaliado pelo Postgres dentro do row lock, então só uma execução
    // concorrente consegue count = 1 e dispara o incremento da caixinha.
    const updated = await prisma.donation.updateMany({
      where: { id: donation.id, paymentStatus: "PENDING" },
      data: {
        paymentStatus: "CONFIRMED",
        asaasPaymentId: p.id,
        paymentId: p.id,
        creditDate: newCreditDate,
      },
    });
    if (updated.count === 1) {
      await prisma.caixinha.update({
        where: { id: donation.caixinhaId },
        data: { raisedAmount: { increment: donation.amount } },
      });
      return;
    }

    // Caso ja estivesse CONFIRMED (ex.: PAYMENT_RECEIVED depois de
    // PAYMENT_CONFIRMED, ou antecipação aprovada que adianta o creditDate):
    // só sincroniza o creditDate pra o saldo disponivel refletir a data real
    // de credito. Nao mexe em raisedAmount (que ja foi incrementado).
    if (newCreditDate) {
      await prisma.donation.update({
        where: { id: donation.id },
        data: { creditDate: newCreditDate },
      });
    }
    return;
  }

  if (REFUNDED_EVENTS.has(payload.event)) {
    const wasConfirmed = donation.paymentStatus === "CONFIRMED";
    const updated = await prisma.donation.updateMany({
      where: {
        id: donation.id,
        paymentStatus: { not: "REFUNDED" },
      },
      data: { paymentStatus: "REFUNDED" },
    });
    if (updated.count === 1 && wasConfirmed) {
      await prisma.caixinha.update({
        where: { id: donation.caixinhaId },
        data: { raisedAmount: { decrement: donation.amount } },
      });
    }
    return;
  }

  if (FAILED_PAYMENT_EVENTS.has(payload.event)) {
    await prisma.donation.updateMany({
      where: { id: donation.id, paymentStatus: "PENDING" },
      data: { paymentStatus: "FAILED" },
    });
  }
}

async function handleTransferEvent(payload: AsaasWebhookPayload) {
  const t = payload.transfer!;
  const withdrawal = await prisma.withdrawal.findUnique({
    where: { asaasTransferId: t.id },
  });
  if (!withdrawal) {
    console.warn(`Webhook transfer ${t.id} not matched to any withdrawal`);
    return;
  }

  if (TRANSFER_DONE_EVENTS.has(payload.event)) {
    if (withdrawal.status === "COMPLETED") return;
    await prisma.withdrawal.update({
      where: { id: withdrawal.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    return;
  }

  if (TRANSFER_FAILED_EVENTS.has(payload.event)) {
    if (withdrawal.status === "FAILED") return;
    await prisma.withdrawal.update({
      where: { id: withdrawal.id },
      data: {
        status: "FAILED",
        failureReason: t.failReason ?? payload.event,
      },
    });
  }
}
