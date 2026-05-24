"use client";

import { useEffect, useState } from "react";
import { Loader2, Wallet } from "lucide-react";
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
  { label: string; tone: StatusTone }
> = {
  PENDING: { label: "Em processamento", tone: "pending" },
  COMPLETED: { label: "Concluído", tone: "success" },
  FAILED: { label: "Falhou", tone: "danger" },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PLATFORM_PRIMARY = "#b8851f";

export function WithdrawalHistory({
  primaryColor = PLATFORM_PRIMARY,
}: {
  primaryColor?: string;
}) {
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
      <div className="text-center py-12 px-6 rounded-2xl bg-white border border-border/60 shadow-sm">
        <Wallet className="w-10 h-10 text-foreground/40 mx-auto mb-3" />
        <p className="text-base font-semibold text-foreground/80 mb-1">
          Nenhum saque ainda
        </p>
        <p className="text-sm text-foreground/60">
          Quando você sacar, o histórico aparece aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Desktop table */}
      <div className="hidden md:block rounded-2xl border border-border/60 bg-white overflow-hidden">
        <table className="w-full">
          <thead>
            <tr
              className="border-b border-border/60"
              style={{ backgroundColor: "hsl(var(--primary) / 0.08)" }}
            >
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/70">
                №
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/70">
                Chave PIX
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/70">
                Solicitado
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/70">
                Concluído
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/70">
                Status
              </th>
              <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/70">
                Valor
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((w, idx) => {
              const status = statusMap[w.status];
              return (
                <tr
                  key={w.id}
                  className="border-b border-border/40 last:border-0 hover:bg-[#fbf7ee]/40 transition-colors"
                >
                  <td className="px-5 py-4 text-sm text-foreground/55 tabular-nums">
                    {String(idx + 1).padStart(2, "0")}
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-sm font-semibold text-foreground">
                      PIX {PIX_TYPE_LABEL[w.pixKeyType]}
                    </div>
                    <div className="text-xs text-foreground/60 mt-0.5">
                      {maskPixKey(w.pixKey, w.pixKeyType)}
                    </div>
                    {w.failureReason && (
                      <div className="text-xs text-destructive mt-1 max-w-sm truncate">
                        {w.failureReason}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs text-foreground/65 tabular-nums">
                    {fmtDate(w.createdAt)}
                  </td>
                  <td className="px-5 py-4 text-xs text-foreground/65 tabular-nums">
                    {w.completedAt ? fmtDate(w.completedAt) : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div
                      className="text-base font-semibold tabular-nums"
                      style={{ color: primaryColor }}
                    >
                      {formatCurrency(Number(w.amount))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="md:hidden space-y-3">
        {items.map((w) => {
          const status = statusMap[w.status];
          return (
            <li
              key={w.id}
              className="rounded-2xl bg-white border border-border/60 p-4"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    PIX {PIX_TYPE_LABEL[w.pixKeyType]}
                  </p>
                  <p className="text-xs text-foreground/55 mt-0.5">
                    {maskPixKey(w.pixKey, w.pixKeyType)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p
                    className="text-base font-semibold tabular-nums"
                    style={{ color: primaryColor }}
                  >
                    {formatCurrency(Number(w.amount))}
                  </p>
                  <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-foreground/55">
                <span>Solicitado {fmtDateTime(w.createdAt)}</span>
                {w.completedAt && (
                  <>
                    <span>·</span>
                    <span>Concluído {fmtDateTime(w.completedAt)}</span>
                  </>
                )}
              </div>
              {w.failureReason && (
                <p className="text-xs text-destructive mt-2">
                  {w.failureReason}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type StatusTone = "pending" | "success" | "danger" | "neutral";

function StatusBadge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: StatusTone;
}) {
  const styles: Record<
    StatusTone,
    { bg: string; color: string; border: string; dot: string; pulse: boolean }
  > = {
    pending: {
      bg: "#fef6dd",
      color: "#854d0e",
      border: "#f6c75e66",
      dot: "#eab308",
      pulse: true,
    },
    success: {
      bg: "#dcfce7",
      color: "#166534",
      border: "#16a34a40",
      dot: "#16a34a",
      pulse: false,
    },
    danger: {
      bg: "#fee2e2",
      color: "#991b1b",
      border: "#dc262640",
      dot: "#dc2626",
      pulse: false,
    },
    neutral: {
      bg: "#f1f5f9",
      color: "#475569",
      border: "#94a3b840",
      dot: "#94a3b8",
      pulse: false,
    },
  };
  const { bg, color, border, dot, pulse } = styles[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold leading-none py-1 pl-1.5 pr-2 rounded-full border whitespace-nowrap"
      style={{ backgroundColor: bg, color, borderColor: border }}
    >
      <span className="relative flex items-center justify-center w-1.5 h-1.5">
        {pulse && (
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-75"
            style={{ backgroundColor: dot }}
          />
        )}
        <span
          className="relative w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: dot }}
        />
      </span>
      {children}
    </span>
  );
}
