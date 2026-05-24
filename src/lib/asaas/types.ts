export type AsaasBillingType = "PIX" | "CREDIT_CARD" | "BOLETO";

export type AsaasPaymentStatus =
  | "PENDING"
  | "RECEIVED"
  | "CONFIRMED"
  | "OVERDUE"
  | "REFUNDED"
  | "RECEIVED_IN_CASH"
  | "REFUND_REQUESTED"
  | "REFUND_IN_PROGRESS"
  | "CHARGEBACK_REQUESTED"
  | "CHARGEBACK_DISPUTE"
  | "AWAITING_CHARGEBACK_REVERSAL"
  | "DUNNING_REQUESTED"
  | "DUNNING_RECEIVED"
  | "AWAITING_RISK_ANALYSIS"
  | "FAILED";

export type AsaasPersonType = "FISICA" | "JURIDICA";

export type AsaasPixKeyType = "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "EVP";

export interface AsaasCustomer {
  id: string;
  name: string;
  cpfCnpj: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
}

export interface AsaasSplit {
  walletId: string;
  fixedValue?: number;
  percentualValue?: number;
}

export interface AsaasCreditCardInfo {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export interface AsaasCreditCardHolderInfo {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  addressComplement?: string;
  phone: string;
  mobilePhone?: string;
}

export interface AsaasCreatePaymentInput {
  customer: string;
  billingType: AsaasBillingType;
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
  installmentCount?: number;
  installmentValue?: number;
  creditCard?: AsaasCreditCardInfo;
  creditCardHolderInfo?: AsaasCreditCardHolderInfo;
  creditCardToken?: string;
  remoteIp?: string;
  split?: AsaasSplit[];
  notificationDisabled?: boolean;
}

export interface AsaasPayment {
  id: string;
  customer: string;
  value: number;
  netValue: number;
  status: AsaasPaymentStatus;
  billingType: AsaasBillingType;
  dueDate: string;
  creditDate?: string;
  invoiceUrl?: string;
  externalReference?: string;
  installment?: string;
  creditCard?: { creditCardToken: string; creditCardBrand: string; creditCardNumber: string };
}

export interface AsaasPixQrCode {
  encodedImage: string;
  payload: string;
  expirationDate: string;
}

export interface AsaasCreateSubAccountInput {
  name: string;
  email: string;
  cpfCnpj: string;
  birthDate?: string;
  companyType?: "MEI" | "LIMITED" | "INDIVIDUAL" | "ASSOCIATION";
  personType?: AsaasPersonType;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  incomeValue?: number;
}

export interface AsaasSubAccount {
  id: string;
  name: string;
  email: string;
  loginEmail?: string;
  cpfCnpj: string;
  walletId: string;
  apiKey: string;
  accountNumber?: { agency: string; account: string; accountDigit: string };
}

export interface AsaasBalance {
  totalBalance: number;
}

export interface AsaasCreateTransferInput {
  value: number;
  pixAddressKey: string;
  pixAddressKeyType: AsaasPixKeyType;
  description?: string;
}

export interface AsaasTransfer {
  id: string;
  value: number;
  netValue: number;
  status:
    | "PENDING"
    | "BANK_PROCESSING"
    | "DONE"
    | "CANCELLED"
    | "FAILED";
  transferDate?: string;
  scheduleDate?: string;
  type: "PIX" | "TED" | "INTERNAL";
  failReason?: string;
}

export interface AsaasAnticipation {
  id: string;
  payment?: string;
  status: "PENDING" | "SCHEDULED" | "APPROVED" | "DENIED" | "CANCELLED";
  value: number;
  netValue: number;
  fee: number;
  anticipationDate: string;
}

export interface AsaasErrorBody {
  errors?: { code: string; description: string }[];
}

export interface AsaasListResponse<T> {
  object: "list";
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: T[];
}

export type AsaasWebhookEvent =
  | "PAYMENT_CREATED"
  | "PAYMENT_UPDATED"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_RECEIVED"
  | "PAYMENT_OVERDUE"
  | "PAYMENT_DELETED"
  | "PAYMENT_REFUNDED"
  | "PAYMENT_RECEIVED_IN_CASH_UNDONE"
  | "PAYMENT_CHARGEBACK_REQUESTED"
  | "PAYMENT_CHARGEBACK_DISPUTE"
  | "PAYMENT_AWAITING_CHARGEBACK_REVERSAL"
  | "TRANSFER_CREATED"
  | "TRANSFER_PENDING"
  | "TRANSFER_IN_BANK_PROCESSING"
  | "TRANSFER_BLOCKED"
  | "TRANSFER_DONE"
  | "TRANSFER_FAILED"
  | "TRANSFER_CANCELLED";

export interface AsaasWebhookPayload {
  event: AsaasWebhookEvent;
  payment?: AsaasPayment & { externalReference?: string };
  transfer?: AsaasTransfer & { externalReference?: string };
}
