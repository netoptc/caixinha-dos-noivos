import { asaas } from "./client";
import { syntheticCpf } from "@/lib/cpf";
import type { AsaasCustomer, AsaasListResponse } from "./types";

export interface CreateCustomerInput {
  name: string;
  cpfCnpj?: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  externalReference?: string;
}

export async function findOrCreateCustomer(
  input: CreateCustomerInput,
): Promise<AsaasCustomer> {
  // Asaas requires a valid CPF/CNPJ on customers. For anonymous donors (PIX
  // gifts that don't collect CPF) we fall back to a synthetic CPF derived
  // from the donor's phone, so repeat donations from the same person reuse
  // the same customer record.
  const cpfCnpj =
    input.cpfCnpj && input.cpfCnpj.length >= 11
      ? input.cpfCnpj
      : syntheticCpf(input.phone ?? input.externalReference ?? input.name);

  const existing = await asaas.get<AsaasListResponse<AsaasCustomer>>(
    "/customers",
    { query: { cpfCnpj, limit: 1 } },
  );
  if (existing.data.length > 0) return existing.data[0];

  return asaas.post<AsaasCustomer>("/customers", {
    name: input.name,
    cpfCnpj,
    email: input.email,
    phone: input.phone,
    mobilePhone: input.mobilePhone,
    externalReference: input.externalReference,
  });
}
