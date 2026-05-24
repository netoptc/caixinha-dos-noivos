"use client";

import { formatCurrency } from "@/lib/utils";

interface PaymentSummaryProps {
  /** Valor da doação que o casal recebe (escolhido pelo doador) */
  subtotal: number;
  /** Taxa de serviço (plataforma + gateway), o que é somado em cima */
  fee: number;
  /** Valor total que o doador paga */
  total: number;
  primaryColor?: string;
  /** Texto auxiliar abaixo do total (ex: "3× de R$ 50,00") */
  hint?: string;
}

export function PaymentSummary({
  subtotal,
  fee,
  total,
  primaryColor = "#b8851f",
  hint,
}: PaymentSummaryProps) {
  return (
    <div
      className="rounded-2xl px-5 py-4"
      style={{
        backgroundColor: `${primaryColor}10`,
        border: `1px solid ${primaryColor}40`,
      }}
    >
      <div className="space-y-2 text-sm">
        <div className="flex items-baseline justify-between">
          <span className="text-foreground/65">Subtotal</span>
          <span className="tabular-nums text-foreground/85 font-medium">
            {formatCurrency(subtotal)}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-foreground/65">Taxa de serviço</span>
          <span className="tabular-nums text-foreground/85 font-medium">
            {formatCurrency(fee)}
          </span>
        </div>
        <div
          className="pt-2.5 mt-1 border-t"
          style={{ borderColor: `${primaryColor}30` }}
        >
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-semibold text-foreground">Total a pagar</span>
            <span
              className="font-display text-2xl tabular-nums tracking-tight leading-none"
              style={{ color: primaryColor }}
            >
              {formatCurrency(total)}
            </span>
          </div>
          {hint && (
            <p className="text-xs text-foreground/60 mt-1 text-right">
              {hint}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
