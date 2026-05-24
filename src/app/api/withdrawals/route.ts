import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import {
  AsaasError,
  createAnticipation,
  createTransfer,
  simulateAnticipation,
} from "@/lib/asaas";
import { getCoupleBalance } from "@/lib/repasse/balance";

const onlyDigits = (s: string) => s.replace(/\D/g, "");

const withdrawalSchema = z
  .object({
    amount: z.number().positive().min(1, "Valor mínimo: R$ 1,00").optional(),
    anticipate: z.boolean().optional().default(false),
    cpf: z
      .string()
      .min(1, "Informe o CPF do titular")
      .transform(onlyDigits)
      .refine((v) => v.length === 11, "CPF inválido"),
    pixKey: z.string().min(3, "Informe a chave PIX").max(140),
    pixKeyType: z.enum(["CPF", "EMAIL", "PHONE", "EVP"]),
  })
  .refine(
    (d) => {
      if (d.pixKeyType === "CPF") return onlyDigits(d.pixKey).length === 11;
      if (d.pixKeyType === "EMAIL")
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.pixKey);
      if (d.pixKeyType === "PHONE") {
        const n = onlyDigits(d.pixKey).length;
        return n === 10 || n === 11;
      }
      return d.pixKey.trim().length >= 3;
    },
    { message: "Chave PIX inválida para o tipo selecionado", path: ["pixKey"] },
  );

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const withdrawals = await prisma.withdrawal.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ withdrawals });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = withdrawalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 },
    );
  }
  const {
    amount: requestedAmount,
    anticipate,
    cpf: holderCpf,
    pixKey,
    pixKeyType,
  } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  // Normaliza a chave para o formato esperado pelo Asaas (sem máscara em CPF/PHONE).
  const normalizedPixKey =
    pixKeyType === "CPF" || pixKeyType === "PHONE" ? onlyDigits(pixKey) : pixKey.trim();

  const pending = await prisma.withdrawal.findFirst({
    where: { userId: user.id, status: "PENDING" },
  });
  if (pending) {
    return NextResponse.json(
      {
        error:
          "Já existe um saque em andamento. Aguarde finalizar antes de solicitar outro.",
      },
      { status: 409 },
    );
  }

  try {
    let anticipationFee = 0;
    const anticipatedPaymentIds: string[] = [];

    if (anticipate) {
      const balance = await getCoupleBalance(user.id);
      if (balance.anticipatablePaymentIds.length === 0) {
        return NextResponse.json(
          { error: "Nenhum pagamento elegível para antecipação." },
          { status: 400 },
        );
      }

      // Anticipate every eligible card payment for this couple. The Asaas
      // API charges a per-payment fee; we sum all fees and bill them to the
      // couple via Withdrawal.anticipationFee so the platform stays neutral.
      for (const paymentId of balance.anticipatablePaymentIds) {
        const sim = await simulateAnticipation(paymentId);
        await createAnticipation(paymentId);
        anticipationFee += Number(sim.fee ?? 0);
        anticipatedPaymentIds.push(paymentId);
      }

      // Mark anticipated donations as liquidated from the couple's perspective:
      // funds will arrive on the master account in ~D+2 and we already
      // committed to release them to the couple now.
      await prisma.donation.updateMany({
        where: { asaasPaymentId: { in: anticipatedPaymentIds } },
        data: { creditDate: new Date() },
      });
    }

    const refreshedBalance = await getCoupleBalance(user.id);
    // Withdrawal amount = available balance minus the anticipation fee we
    // need to retain (since the fee is the couple's cost, not the platform's).
    const maxNet = Math.max(0, refreshedBalance.available - anticipationFee);

    const targetAmount =
      requestedAmount != null ? requestedAmount : maxNet;

    if (targetAmount < 1) {
      return NextResponse.json(
        { error: "Valor mínimo: R$ 1,00" },
        { status: 400 },
      );
    }

    if (targetAmount > maxNet + 0.0001) {
      return NextResponse.json(
        {
          error: `Saldo insuficiente. Disponível líquido: R$ ${maxNet.toFixed(2)}.`,
        },
        { status: 400 },
      );
    }

    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId: user.id,
        amount: targetAmount,
        holderCpf,
        pixKey: normalizedPixKey,
        pixKeyType,
        status: "PENDING",
        anticipated: anticipate,
        anticipationFee,
      },
    });

    try {
      const transfer = await createTransfer({
        value: targetAmount,
        pixAddressKey: normalizedPixKey,
        pixAddressKeyType: pixKeyType,
        description: `Repasse caixinha ${user.name}`,
        externalReference: withdrawal.id,
      });

      const completed = transfer.status === "DONE" ? new Date() : null;

      await prisma.withdrawal.update({
        where: { id: withdrawal.id },
        data: {
          asaasTransferId: transfer.id,
          status:
            transfer.status === "DONE"
              ? "COMPLETED"
              : transfer.status === "FAILED" || transfer.status === "CANCELLED"
                ? "FAILED"
                : "PENDING",
          completedAt: completed,
          failureReason: transfer.failReason ?? null,
        },
      });

      return NextResponse.json({
        success: true,
        withdrawal: {
          id: withdrawal.id,
          amount: targetAmount,
          anticipated: anticipate,
          anticipationFee,
          status: transfer.status,
        },
      });
    } catch (err) {
      await prisma.withdrawal.update({
        where: { id: withdrawal.id },
        data: {
          status: "FAILED",
          failureReason: err instanceof Error ? err.message : "Unknown",
        },
      });
      throw err;
    }
  } catch (err) {
    console.error("Withdrawal error:", err);
    if (err instanceof AsaasError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Erro ao processar saque. Tente novamente em instantes." },
      { status: 500 },
    );
  }
}

