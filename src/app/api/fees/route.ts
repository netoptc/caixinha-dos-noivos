import { NextResponse } from "next/server";
import { getAllFeeRates } from "@/lib/fees";

export async function GET() {
  const platform = getAllFeeRates();
  return NextResponse.json({
    // legacy keys (percentages) for backwards compat
    PIX: platform.PIX,
    CREDIT_CARD: platform.CREDIT_CARD,
    platform,
    gateway: {
      pixFixed: parseFloat(process.env.ASAAS_FEE_PIX ?? "1.99"),
      cardFixed: parseFloat(process.env.ASAAS_FEE_CARD_FIXED ?? "0.49"),
      cardVistaPct: parseFloat(process.env.ASAAS_FEE_CARD_VISTA ?? "0.0299"),
      card2to6Pct: parseFloat(process.env.ASAAS_FEE_CARD_2_6 ?? "0.0349"),
      card7to12Pct: parseFloat(process.env.ASAAS_FEE_CARD_7_12 ?? "0.0399"),
    },
  });
}
