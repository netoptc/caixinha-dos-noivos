const DEFAULT_MIN_DONATION = 10;
const DEFAULT_MIN_INSTALLMENT = 5;

function parsePositive(raw: string | undefined, fallback: number): number {
  const parsed = parseFloat(raw ?? "");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getMinDonationAmount(): number {
  return parsePositive(
    process.env.NEXT_PUBLIC_MIN_DONATION_AMOUNT,
    DEFAULT_MIN_DONATION,
  );
}

export function formatMinDonationAmount(): string {
  return getMinDonationAmount().toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

/**
 * Asaas exige um valor mínimo por parcela no cartão de crédito.
 * Não é regra nossa — vem do gateway.
 */
export function getMinInstallmentValue(): number {
  return parsePositive(
    process.env.NEXT_PUBLIC_MIN_INSTALLMENT_VALUE,
    DEFAULT_MIN_INSTALLMENT,
  );
}
