import { createHash } from "crypto";

function computeDV(digits: number[], factor: number): number {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * (factor - i);
  }
  const rem = sum % 11;
  return rem < 2 ? 0 : 11 - rem;
}

/**
 * Generates a synthetic CPF (digits-only) that passes the official check-digit
 * algorithm. Determined by a seed string so the same donor (phone) maps to the
 * same fake CPF — letting us reuse the Asaas customer across donations.
 *
 * Not a real person's CPF; used as a placeholder for Asaas customers when the
 * donor's CPF wasn't collected (e.g. anonymous PIX gifts).
 */
export function syntheticCpf(seed: string): string {
  const hash = createHash("sha256").update(seed).digest();
  const digits: number[] = [];
  for (let i = 0; i < 9; i++) {
    digits.push(hash[i] % 10);
  }
  // Avoid common rejected patterns like all-same-digit
  if (digits.every((d) => d === digits[0])) {
    digits[0] = (digits[0] + 1) % 10;
  }
  digits.push(computeDV(digits, 10));
  digits.push(computeDV(digits, 11));
  return digits.join("");
}
