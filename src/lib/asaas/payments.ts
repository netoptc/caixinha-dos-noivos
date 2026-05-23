import { asaas, AsaasError } from "./client";
import type {
  AsaasCreatePaymentInput,
  AsaasPayment,
  AsaasPixQrCode,
} from "./types";

export async function createPayment(
  input: AsaasCreatePaymentInput,
): Promise<AsaasPayment> {
  return asaas.post<AsaasPayment>("/payments", input);
}

const NOT_READY_RE = /n[ãa]o\s+permite\s+pagamentos\s+via\s+pix/i;

/**
 * Asaas takes a couple seconds to wire the new PIX charge into the BACEN
 * directory after creation. Trying to fetch the QR Code immediately can
 * return a 400 with "Esta cobrança não permite pagamentos via Pix.". Retry
 * a few times with linear backoff before giving up.
 */
export async function getPixQrCode(paymentId: string): Promise<AsaasPixQrCode> {
  const maxAttempts = 6;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await asaas.get<AsaasPixQrCode>(`/payments/${paymentId}/pixQrCode`);
    } catch (err) {
      const isNotReady =
        err instanceof AsaasError &&
        err.status === 400 &&
        (NOT_READY_RE.test(err.message) ||
          NOT_READY_RE.test(err.body.errors?.[0]?.description ?? ""));
      if (!isNotReady || attempt === maxAttempts) throw err;
      await new Promise((r) => setTimeout(r, 600 * attempt));
    }
  }
  // unreachable
  throw new Error("Failed to fetch PIX QR Code");
}

export async function getPayment(paymentId: string): Promise<AsaasPayment> {
  return asaas.get<AsaasPayment>(`/payments/${paymentId}`);
}
