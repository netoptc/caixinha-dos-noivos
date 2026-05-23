import { asaas } from "./client";
import type {
  AsaasAnticipation,
  AsaasListResponse,
  AsaasPayment,
} from "./types";

// All anticipation operations run on the platform's master account now that
// each couple shares the single Asaas account; `apiKey` is omitted so the
// client falls back to ASAAS_API_KEY.

export async function createAnticipation(
  paymentId: string,
): Promise<AsaasAnticipation> {
  return asaas.post<AsaasAnticipation>("/anticipations", { payment: paymentId });
}

export interface AsaasAnticipationSimulation {
  value: number;
  fee: number;
  netValue: number;
  totalDays?: number;
}

export async function simulateAnticipation(
  paymentId: string,
): Promise<AsaasAnticipationSimulation> {
  return asaas.post<AsaasAnticipationSimulation>("/anticipations/simulate", {
    payment: paymentId,
  });
}

/**
 * Lists CONFIRMED card payments on the master account that are still in the
 * "to be released" state (i.e. eligible for anticipation).
 */
export async function listAnticipatablePayments(): Promise<AsaasPayment[]> {
  const res = await asaas.get<AsaasListResponse<AsaasPayment>>("/payments", {
    query: {
      status: "CONFIRMED",
      billingType: "CREDIT_CARD",
      anticipated: false,
      limit: 100,
    },
  });
  return res.data;
}
