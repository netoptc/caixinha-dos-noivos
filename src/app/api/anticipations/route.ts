import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  AsaasError,
  simulateAnticipation,
} from "@/lib/asaas";
import { getCoupleBalance } from "@/lib/repasse/balance";

/**
 * GET /api/anticipations — preview of how much the couple can anticipate from
 * the platform's master account. Returns per-payment simulations summed up so
 * the UI can show the gross/fee/net before the user commits.
 *
 * Anticipation is *triggered* via POST /api/withdrawals { anticipate: true }
 * so a single round-trip both releases the funds and pays the couple.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const balance = await getCoupleBalance(session.user.id);
    if (balance.anticipatablePaymentIds.length === 0) {
      return NextResponse.json({
        eligible: true,
        items: [],
        totals: { gross: 0, fee: 0, net: 0 },
      });
    }

    const simulations = await Promise.allSettled(
      balance.anticipatablePaymentIds.map((paymentId) =>
        simulateAnticipation(paymentId).then((s) => ({
          paymentId,
          simulation: s,
        })),
      ),
    );

    const items = simulations
      .filter(
        (
          s,
        ): s is PromiseFulfilledResult<{
          paymentId: string;
          simulation: { value: number; fee: number; netValue: number };
        }> => s.status === "fulfilled",
      )
      .map((s) => s.value);

    const totals = items.reduce(
      (acc, it) => ({
        gross: acc.gross + (it.simulation.value ?? 0),
        fee: acc.fee + (it.simulation.fee ?? 0),
        net: acc.net + (it.simulation.netValue ?? 0),
      }),
      { gross: 0, fee: 0, net: 0 },
    );

    return NextResponse.json({ eligible: true, items, totals });
  } catch (err) {
    const msg = err instanceof AsaasError ? err.message : "Erro";
    return NextResponse.json(
      { eligible: false, reason: msg },
      { status: 200 },
    );
  }
}

// Standalone anticipation (without immediate withdrawal) has been removed —
// the couple now anticipates and withdraws in a single step via POST
// /api/withdrawals { anticipate: true }.
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Endpoint descontinuado. Use POST /api/withdrawals com anticipate: true.",
    },
    { status: 410 },
  );
}
