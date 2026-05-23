import { asaas } from "./client";
import type {
  AsaasCreateTransferInput,
  AsaasTransfer,
} from "./types";

// Transfers always run from the platform's master account; no per-couple key.

export async function createTransfer(
  input: AsaasCreateTransferInput,
): Promise<AsaasTransfer> {
  return asaas.post<AsaasTransfer>("/transfers", input);
}

export async function getTransfer(
  transferId: string,
): Promise<AsaasTransfer> {
  return asaas.get<AsaasTransfer>(`/transfers/${transferId}`);
}
