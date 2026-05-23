import { prisma } from "@/lib/db";

export interface CoupleBalance {
  // Liquidated donations minus already-withdrawn amounts. Safe to transfer now.
  available: number;
  // Confirmed donations whose Asaas credit date is still in the future.
  // Can be brought forward via anticipation (with a fee deducted from the couple).
  pending: number;
  // Sum of every confirmed donation, including refunded reversals subtracted.
  totalConfirmed: number;
  // Sum of withdrawal.amount for non-failed withdrawals (i.e. money already
  // committed to the couple). anticipationFee is the platform-side cost and
  // is NOT included in `withdrawn`.
  withdrawn: number;
  // List of Asaas payment IDs that can be anticipated to release `pending`.
  anticipatablePaymentIds: string[];
}

/**
 * Computes a couple's balance from the database. The platform operates with a
 * single Asaas master account, so per-couple accounting lives entirely here:
 *   - Donations track when each payment liquidates on the master account.
 *   - Withdrawals track what we already paid out to the couple's PIX key.
 */
export async function getCoupleBalance(userId: string): Promise<CoupleBalance> {
  const caixinha = await prisma.caixinha.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!caixinha) {
    return {
      available: 0,
      pending: 0,
      totalConfirmed: 0,
      withdrawn: 0,
      anticipatablePaymentIds: [],
    };
  }

  const now = new Date();

  const [donations, withdrawals] = await Promise.all([
    prisma.donation.findMany({
      where: {
        caixinhaId: caixinha.id,
        paymentStatus: "CONFIRMED",
      },
      select: {
        amount: true,
        creditDate: true,
        asaasPaymentId: true,
        paymentMethod: true,
      },
    }),
    prisma.withdrawal.findMany({
      where: {
        userId,
        status: { in: ["PENDING", "COMPLETED"] },
      },
      select: { amount: true, anticipationFee: true },
    }),
  ]);

  let liquidated = 0;
  let pending = 0;
  let totalConfirmed = 0;
  const anticipatablePaymentIds: string[] = [];

  for (const d of donations) {
    const value = Number(d.amount);
    totalConfirmed += value;
    const liquidatedAlready =
      !d.creditDate || d.creditDate <= now;
    if (liquidatedAlready) {
      liquidated += value;
    } else {
      pending += value;
      if (d.paymentMethod === "CREDIT_CARD" && d.asaasPaymentId) {
        anticipatablePaymentIds.push(d.asaasPaymentId);
      }
    }
  }

  // Both the net paid out AND the anticipation fee charged to the couple
  // count against the couple's share of the master balance.
  const withdrawn = withdrawals.reduce(
    (sum, w) => sum + Number(w.amount) + Number(w.anticipationFee),
    0,
  );

  return {
    available: Math.max(0, liquidated - withdrawn),
    pending,
    totalConfirmed,
    withdrawn,
    anticipatablePaymentIds,
  };
}
