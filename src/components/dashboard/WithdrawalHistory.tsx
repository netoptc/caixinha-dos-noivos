"use client";

import { useEffect, useState } from "react";
import { Check, Clock, X, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type WithdrawalStatus = "PENDING" | "COMPLETED" | "FAILED";
type PixKeyType = "CPF" | "EMAIL" | "PHONE" | "EVP";

interface Withdrawal {
  id: string;
  amount: string;
  status: WithdrawalStatus;
  failureReason: string | null;
  createdAt: string;
  completedAt: string | null;
  pixKey: string;
  pixKeyType: PixKeyType;
}

function maskPixKey(key: string, type: PixKeyType): string {
  if (type === "EMAIL") {
    const [user, domain] = key.split("@");
    return user.length <= 3
      ? `${user[0] ?? ""}***@${domain ?? ""}`
      : `${user.slice(0, 2)}***@${domain ?? ""}`;
  }
  if (type === "PHONE" || type === "CPF") {
    const digits = key.replace(/\D/g, "");
    if (digits.length < 4) return "***";
    return `***${digits.slice(-4)}`;
  }
  return key.length <= 6 ? "***" : `${key.slice(0, 4)}…${key.slice(-3)}`;
}

const PIX_TYPE_LABEL: Record<PixKeyType, string> = {
  CPF: "CPF",
  EMAIL: "E-mail",
  PHONE: "Celular",
  EVP: "Aleatória",
};

const statusMap: Record<
  WithdrawalStatus,
  { label: string; tone: "primary" | "muted" | "destructive"; icon: React.ReactNode }
> = {
  PENDING: {
    label: "Em processamento",
    tone: "muted",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  COMPLETED: {
    label: "Concluído",
    tone: "primary",
    icon: <Check className="w-3.5 h-3.5" />,
  },
  FAILED: {
    label: "Falhou",
    tone: "destructive",
    icon: <X className="w-3.5 h-3.5" />,
  },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function WithdrawalHistory() {
  const [items, setItems] = useState<Withdrawal[] | null>(null);

  useEffect(() => {
    void fetch("/api/withdrawals")
      .then((r) => (r.ok ? r.json() : { withdrawals: [] }))
      .then((data) => setItems(data.withdrawals ?? []))
      .catch(() => setItems([]));
  }, []);

  if (items === null) {
    return (
      <div className="rounded-2xl bg-white border border-border/60 p-6 text-center text-foreground/55">
        <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
        <p className="text-sm">Carregando saques…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-white border border-border/60 p-6 text-center">
        <p className="text-sm text-foreground/65">
          Nenhum saque por aqui ainda. Quando você sacar, o histórico aparece aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-border/60 divide-y divide-border/40 overflow-hidden">
      {items.map((w) => {
        const status = statusMap[w.status];
        const toneClass =
          status.tone === "primary"
            ? "bg-primary/10 text-primary"
            : status.tone === "destructive"
              ? "bg-destructive/10 text-destructive"
              : "bg-muted text-muted-foreground";
        return (
          <div
            key={w.id}
            className="flex items-center justify-between gap-4 px-5 py-4"
          >
            <div className="min-w-0">
              <p className="text-base font-semibold text-foreground tabular-nums">
                {formatCurrency(Number(w.amount))}
              </p>
              <p className="text-xs text-foreground/65 mt-0.5">
                PIX {PIX_TYPE_LABEL[w.pixKeyType]} · {maskPixKey(w.pixKey, w.pixKeyType)}
              </p>
              <p className="text-xs text-foreground/55 mt-0.5">
                Solicitado em {fmtDate(w.createdAt)}
                {w.completedAt
                  ? ` · Concluído em ${fmtDate(w.completedAt)}`
                  : ""}
              </p>
              {w.failureReason && (
                <p className="text-xs text-destructive mt-1">
                  {w.failureReason}
                </p>
              )}
            </div>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${toneClass}`}
            >
              {status.icon}
              {status.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
