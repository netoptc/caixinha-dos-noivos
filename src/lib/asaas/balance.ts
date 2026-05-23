import { asaas } from "./client";
import type { AsaasBalance } from "./types";

// Reports the platform's master account balance available to transfer out.
export async function getMasterAvailableBalance(): Promise<number> {
  const res = await asaas.get<AsaasBalance>("/finance/balance");
  return res.totalBalance ?? 0;
}
