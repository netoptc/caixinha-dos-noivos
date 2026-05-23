import { asaas } from "./client";
import type {
  AsaasCreateSubAccountInput,
  AsaasListResponse,
  AsaasSubAccount,
} from "./types";

export async function createSubAccount(
  input: AsaasCreateSubAccountInput,
): Promise<AsaasSubAccount> {
  return asaas.post<AsaasSubAccount>("/accounts", input);
}

export async function getSubAccount(id: string): Promise<AsaasSubAccount> {
  return asaas.get<AsaasSubAccount>(`/accounts/${id}`);
}

export async function findSubAccountByCpfCnpj(
  cpfCnpj: string,
): Promise<AsaasSubAccount | null> {
  const res = await asaas.get<AsaasListResponse<AsaasSubAccount>>("/accounts", {
    query: { cpfCnpj, limit: 1 },
  });
  return res.data[0] ?? null;
}
