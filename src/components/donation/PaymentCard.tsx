"use client";

import { useEffect, useMemo, useState } from "react";
import { CreditCard, Lock, Loader2, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getMinInstallmentValue } from "@/lib/donation-limits";
import { PaymentSummary } from "./PaymentSummary";

const MIN_INSTALLMENT_VALUE = getMinInstallmentValue();

interface GatewayFees {
  pixFixed: number;
  cardPercent?: number;
  cardFixed: number;
  cardVistaPct: number;
  card2to6Pct: number;
  card7to12Pct: number;
}

interface PaymentCardProps {
  /** Net donation amount (couple receives this exact value) */
  baseAmount: number;
  /** Platform fee percentage (e.g. 0.05) */
  platformFeePct: number;
  /** Gateway (Asaas) fee config used to compute total per installment tier */
  gateway: GatewayFees;
  donationId: string;
  onSuccess: () => void;
  primaryColor?: string;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function asaasPctForInstallments(installments: number, g: GatewayFees) {
  if (installments <= 1) return g.cardVistaPct;
  if (installments <= 6) return g.card2to6Pct;
  return g.card7to12Pct;
}

function computeTotal(
  baseAmount: number,
  platformFeePct: number,
  installments: number,
  g: GatewayFees,
) {
  const platformFee = round2(baseAmount * platformFeePct);
  const subtotal = baseAmount + platformFee;
  const pct = asaasPctForInstallments(installments, g);
  const total = (subtotal + g.cardFixed) / (1 - pct);
  return round2(total);
}

function maskCardNumber(value: string) {
  const cleaned = value.replace(/\D/g, "").slice(0, 16);
  return cleaned.replace(/(.{4})/g, "$1 ").trim();
}

function maskExpiry(value: string) {
  const cleaned = value.replace(/\D/g, "").slice(0, 4);
  if (cleaned.length >= 3) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
  }
  return cleaned;
}

export function PaymentCard({
  baseAmount,
  platformFeePct,
  gateway,
  donationId,
  onSuccess,
  primaryColor = "#b8851f",
}: PaymentCardProps) {

  const [form, setForm] = useState({
    cardNumber: "",
    holderName: "",
    expiry: "",
    cvv: "",
    installments: "1",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);

  function validate() {
    const errs: Record<string, string> = {};
    const cardDigits = form.cardNumber.replace(/\D/g, "");
    if (cardDigits.length !== 16) errs.cardNumber = "Número do cartão inválido";
    if (form.holderName.trim().length < 3) errs.holderName = "Nome inválido";
    if (form.expiry.length !== 5) errs.expiry = "Data inválida";
    if (form.cvv.length < 3) errs.cvv = "CVV inválido";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setProcessing(true);
    try {
      const res = await fetch("/api/payments/card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donationId,
          cardNumber: form.cardNumber.replace(/\D/g, ""),
          holderName: form.holderName,
          expiry: form.expiry,
          cvv: form.cvv,
          installments: parseInt(form.installments),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrors({
          form: data.error || "Cartão recusado. Verifique os dados e tente novamente.",
        });
        setProcessing(false);
        return;
      }

      onSuccess();
    } catch {
      setErrors({ form: "Sem conexão. Tente novamente em instantes." });
      setProcessing(false);
    }
  }

  const cardDigits = form.cardNumber.replace(/\D/g, "");
  const maskedCard =
    cardDigits.length > 0
      ? cardDigits.padEnd(16, "•").replace(/(.{4})/g, "$1 ").trim()
      : "•••• •••• •••• ••••";

  // Only show installments where each parcel is >= R$ 5,00 (Asaas minimum).
  const allowedInstallments = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => i + 1).filter((n) => {
      const t = computeTotal(baseAmount, platformFeePct, n, gateway);
      return t / n >= MIN_INSTALLMENT_VALUE;
    });
  }, [baseAmount, platformFeePct, gateway]);

  const currentInstallments = parseInt(form.installments) || 1;

  // If the user-selected value got out of range (e.g. baseAmount shrank), snap
  // back to the largest allowed.
  useEffect(() => {
    if (allowedInstallments.length === 0) return;
    if (!allowedInstallments.includes(currentInstallments)) {
      setForm((f) => ({
        ...f,
        installments: String(allowedInstallments[allowedInstallments.length - 1]),
      }));
    }
  }, [allowedInstallments, currentInstallments]);

  const installmentsCount = allowedInstallments.includes(currentInstallments)
    ? currentInstallments
    : (allowedInstallments[allowedInstallments.length - 1] ?? 1);

  const total = computeTotal(
    baseAmount,
    platformFeePct,
    installmentsCount,
    gateway,
  );
  const fee = round2(total - baseAmount);
  const installmentValue = round2(total / installmentsCount);

  return (
    <div className="space-y-6 font-sans">
      <PaymentSummary
        subtotal={baseAmount}
        fee={fee}
        total={total}
        primaryColor={primaryColor}
        hint={
          installmentsCount > 1
            ? `${installmentsCount}× de ${formatCurrency(installmentValue)}`
            : undefined
        }
      />

      {/* Card visual mockup */}
      <div
        className="relative w-full max-w-sm mx-auto p-6 rounded-2xl text-white overflow-hidden shadow-xl"
        style={{
          aspectRatio: "85.6 / 53.98",
          background: `linear-gradient(135deg, ${primaryColor} 0%, color-mix(in srgb, ${primaryColor} 55%, black) 100%)`,
          boxShadow: `0 16px 32px -12px ${primaryColor}80`,
        }}
      >
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute -top-8 -right-8 w-44 h-44 rounded-full bg-white" />
          <div className="absolute top-12 right-16 w-28 h-28 rounded-full bg-white" />
        </div>

        <div className="relative h-full flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div
              className="w-10 h-8 rounded-md flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #d4af37, #f5e17a, #b8960c)",
              }}
            >
              <div className="grid grid-cols-3 gap-px w-7 h-5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-sm opacity-60"
                    style={{ background: "#7a5c00" }}
                  />
                ))}
              </div>
            </div>
            <span className="text-xs font-semibold opacity-80">
              Crédito
            </span>
          </div>

          <div className="font-mono text-lg tracking-[0.2em]">{maskedCard}</div>

          <div className="flex justify-between items-end gap-4">
            <div className="min-w-0">
              <p className="text-[0.6rem] opacity-70 mb-1">TITULAR</p>
              <p className="text-sm font-semibold uppercase truncate">
                {form.holderName || "SEU NOME"}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[0.6rem] opacity-70 mb-1">VALIDADE</p>
              <p className="text-sm font-semibold tabular-nums">
                {form.expiry || "MM/AA"}
              </p>
            </div>
            <CreditCard className="w-7 h-7 opacity-50 flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {errors.form && (
          <div className="rounded-2xl bg-destructive/5 border border-destructive/30 px-5 py-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-destructive">
                Cartão recusado
              </p>
              <p className="text-sm text-foreground/80 mt-0.5">{errors.form}</p>
            </div>
          </div>
        )}

        <CardField
          label="Número do cartão"
          inputMode="numeric"
          placeholder="0000 0000 0000 0000"
          value={form.cardNumber}
          onChange={(v) => setForm({ ...form, cardNumber: maskCardNumber(v) })}
          maxLength={19}
          mono
          error={errors.cardNumber}
        />

        <CardField
          label="Nome do titular"
          placeholder="Como está no cartão"
          value={form.holderName}
          onChange={(v) => setForm({ ...form, holderName: v.toUpperCase() })}
          error={errors.holderName}
        />

        <div className="grid grid-cols-2 gap-4">
          <CardField
            label="Validade"
            inputMode="numeric"
            placeholder="MM/AA"
            value={form.expiry}
            onChange={(v) => setForm({ ...form, expiry: maskExpiry(v) })}
            maxLength={5}
            mono
            error={errors.expiry}
          />
          <CardField
            label="CVV"
            inputMode="numeric"
            placeholder="123"
            value={form.cvv}
            onChange={(v) =>
              setForm({ ...form, cvv: v.replace(/\D/g, "").slice(0, 4) })
            }
            maxLength={4}
            mono
            error={errors.cvv}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Parcelamento
          </label>
          <select
            value={form.installments}
            onChange={(e) =>
              setForm({ ...form, installments: e.target.value })
            }
            className="w-full rounded-xl bg-white border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 px-4 py-3 text-base text-foreground transition-colors"
          >
            {allowedInstallments.map((n) => {
              const t = computeTotal(baseAmount, platformFeePct, n, gateway);
              return (
                <option key={n} value={n}>
                  {n}× de {formatCurrency(t / n)}
                </option>
              );
            })}
          </select>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-foreground/55">
          <Lock className="w-3 h-3" />
          <span>Seus dados estão protegidos com criptografia SSL</span>
        </div>

        <button
          type="submit"
          disabled={processing}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-white text-base font-semibold transition-all hover:shadow-xl hover:-translate-y-0.5 shadow-lg disabled:opacity-60"
          style={{
            backgroundColor: primaryColor,
            boxShadow: `0 12px 28px -10px ${primaryColor}80`,
          }}
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processando…
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Pagar {formatCurrency(total)}
            </>
          )}
        </button>
      </form>

      <p className="text-xs text-center text-foreground/45">
        Ambiente de demonstração · nenhuma cobrança real será feita
      </p>
    </div>
  );
}

function CardField({
  label,
  placeholder,
  value,
  onChange,
  inputMode,
  maxLength,
  mono,
  error,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  inputMode?: "numeric" | "text";
  maxLength?: number;
  mono?: boolean;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-foreground mb-2">
        {label}
      </label>
      <input
        type="text"
        inputMode={inputMode}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        className={`w-full rounded-xl bg-white border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/50 transition-colors ${
          mono ? "font-mono tracking-wider" : ""
        } ${error ? "border-destructive" : "border-input"}`}
      />
      {error && (
        <p className="mt-1.5 text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}
