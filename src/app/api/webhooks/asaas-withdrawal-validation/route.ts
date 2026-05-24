import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCoupleBalance } from "@/lib/repasse/balance";

/**
 * Webhook de validação de saque do Asaas.
 *
 * Configurado em: Asaas → Configurações → Validação de saque via Webhook.
 * URL aqui: /api/webhooks/asaas-withdrawal-validation
 *
 * Cada vez que alguém solicita transfer/bill/pix-qr/recarga/refund na conta
 * Asaas, o Asaas chama esse endpoint pra perguntar se aprova. Aprovamos só
 * transferências PIX que casem com um Withdrawal PENDING do nosso banco com
 * saldo suficiente. Qualquer outro tipo de operação é rejeitada (defesa
 * contra API key comprometida).
 *
 * Resposta esperada pelo Asaas (HTTP 200):
 *   { "status": "APPROVED" }  ou  { "status": "REFUSED", "refuseReason": "..." }
 *
 * Após 3 falhas/refusals consecutivos, o Asaas cancela a transferência
 * automaticamente — a app reage via o webhook PAYMENT/TRANSFER normal.
 */

interface ValidationPayload {
  type?: string;
  transfer?: {
    id?: string;
    value?: number;
    externalReference?: string;
    bankAccount?: unknown;
    operationType?: string;
    pixAddressKey?: string;
  };
  // outros tipos (bill, pixQrCode, mobilePhoneRecharge, pixRefund) não usados
}

function validateToken(req: NextRequest): boolean {
  const expected = process.env.ASAAS_WITHDRAWAL_WEBHOOK_TOKEN;
  if (!expected) {
    // Sem token configurado: permite (modo dev). Em prod o secret é exigido.
    return true;
  }
  const token = req.headers.get("asaas-access-token");
  return token === expected;
}

function refused(reason: string) {
  return NextResponse.json({ status: "REFUSED", refuseReason: reason });
}

function approved() {
  return NextResponse.json({ status: "APPROVED" });
}

export async function POST(req: NextRequest) {
  if (!validateToken(req)) {
    return NextResponse.json(
      { status: "REFUSED", refuseReason: "Token inválido" },
      { status: 401 },
    );
  }

  let payload: ValidationPayload;
  try {
    payload = (await req.json()) as ValidationPayload;
  } catch {
    return refused("Payload inválido");
  }

  // Só aprovamos transferências. Pague Contas, recarga, refund Pix etc.
  // são rejeitados — a plataforma só faz saque via PIX pros casais.
  if (payload.type !== "TRANSFER") {
    return refused(
      `Operação "${payload.type}" não autorizada por esta plataforma.`,
    );
  }

  const t = payload.transfer;
  if (!t) return refused("Transfer ausente no payload");

  // Tenta casar pelo externalReference (que a app sempre passa = withdrawal.id).
  // Fallback: por valor + chave pix + status PENDING recente, caso o Asaas
  // tenha disparado o webhook antes do app salvar asaasTransferId.
  let withdrawal = null;

  if (t.externalReference) {
    withdrawal = await prisma.withdrawal.findUnique({
      where: { id: t.externalReference },
    });
  }

  if (!withdrawal && t.value && t.pixAddressKey) {
    const cutoff = new Date(Date.now() - 5 * 60_000);
    withdrawal = await prisma.withdrawal.findFirst({
      where: {
        amount: t.value,
        pixKey: t.pixAddressKey,
        status: "PENDING",
        createdAt: { gte: cutoff },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  if (!withdrawal) {
    return refused("Saque não encontrado no banco da plataforma");
  }

  if (withdrawal.status !== "PENDING") {
    return refused(
      `Saque já está em estado "${withdrawal.status}" — não pode ser executado novamente.`,
    );
  }

  if (t.value !== undefined && Number(withdrawal.amount) !== t.value) {
    return refused(
      `Valor diverge: cadastrado R$ ${withdrawal.amount}, recebido R$ ${t.value}.`,
    );
  }

  // Saldo do casal precisa cobrir o valor. Inclui o próprio Withdrawal pendente
  // (que getCoupleBalance considera em `withdrawn`), então a verificação é
  // "available >= 0" depois do débito implícito do PENDING — ou seja, available
  // já foi calculado descontando esse withdrawal. Se tiver valor negativo ou
  // o usuário tentou sacar mais do que tem, refuse.
  const balance = await getCoupleBalance(withdrawal.userId);
  if (balance.available < 0) {
    return refused("Saldo insuficiente no momento da validação");
  }

  return approved();
}
