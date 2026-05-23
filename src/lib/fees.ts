export type PaymentMethod = "PIX" | "CREDIT_CARD";

export function getFeePercent(method: PaymentMethod): number {
  switch (method) {
    case "PIX":
      return parseFloat(process.env.PLATFORM_FEE_PIX ?? "0.05");
    case "CREDIT_CARD":
      return parseFloat(process.env.PLATFORM_FEE_CREDIT_CARD ?? "0.05");
  }
}

function asaasPixFee(): number {
  return parseFloat(process.env.ASAAS_FEE_PIX ?? "1.99");
}

function asaasCardFixed(): number {
  return parseFloat(process.env.ASAAS_FEE_CARD_FIXED ?? "0.49");
}

/**
 * Asaas credit-card percentage charge varies by installment tier.
 * Values come from the dashboard (Configurações → Taxas).
 */
export function asaasCardPercentForInstallments(installments: number): number {
  if (installments <= 1) {
    return parseFloat(process.env.ASAAS_FEE_CARD_VISTA ?? "0.0299");
  }
  if (installments <= 6) {
    return parseFloat(process.env.ASAAS_FEE_CARD_2_6 ?? "0.0349");
  }
  return parseFloat(process.env.ASAAS_FEE_CARD_7_12 ?? "0.0399");
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Estimates the Asaas gateway fee for a given donation+installments tier.
 *
 * For credit cards: total = subtotal + fixed + total * pct (Asaas charges
 * % of the gross total), solved as: total = (subtotal + fixed) / (1 - pct).
 */
export function estimateAsaasFee(
  amount: number,
  platformFee: number,
  method: PaymentMethod,
  installments: number = 1,
): number {
  if (method === "PIX") {
    return round2(asaasPixFee());
  }
  const pct = asaasCardPercentForInstallments(installments);
  const fix = asaasCardFixed();
  const subtotal = amount + platformFee;
  const total = (subtotal + fix) / (1 - pct);
  return round2(total - subtotal);
}

/**
 * Full fee breakdown:
 *  - feeAmount   : platform's cut (kept by master account)
 *  - asaasFee    : estimated gateway fee charged by Asaas
 *  - totalAmount : what the donor actually pays
 *
 * The couple receives exactly `amount` via split.
 */
export function calculateFee(
  amount: number,
  method: PaymentMethod,
  installments: number = 1,
) {
  const feePercent = getFeePercent(method);
  const feeAmount = round2(amount * feePercent);
  const asaasFee = estimateAsaasFee(amount, feeAmount, method, installments);
  const totalAmount = round2(amount + feeAmount + asaasFee);
  return { feePercent, feeAmount, asaasFee, totalAmount };
}

export function getAllFeeRates() {
  return {
    PIX: getFeePercent("PIX"),
    CREDIT_CARD: getFeePercent("CREDIT_CARD"),
  };
}
