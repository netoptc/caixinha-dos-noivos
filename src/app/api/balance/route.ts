import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCoupleBalance } from "@/lib/repasse/balance";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const balance = await getCoupleBalance(session.user.id);

  return NextResponse.json({
    available: balance.available,
    pending: balance.pending,
    total: balance.totalConfirmed,
    // Field kept for client compatibility — every couple is "provisioned" now
    // that there are no per-couple subaccounts blocking the flow.
    provisioned: true,
  });
}
