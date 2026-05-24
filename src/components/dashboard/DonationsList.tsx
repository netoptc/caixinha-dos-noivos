"use client";

import { useMemo, useState } from "react";
import { formatCurrency, formatPhone } from "@/lib/utils";
import { VideoModal } from "@/components/caixinha/VideoModal";
import { Eye, Gift } from "lucide-react";

const statusMap = {
  PENDING: { label: "Pendente", tone: "pending" as const },
  CONFIRMED: { label: "Confirmado", tone: "success" as const },
  FAILED: { label: "Recusado", tone: "danger" as const },
  REFUNDED: { label: "Estornado", tone: "neutral" as const },
};

const methodMap = {
  PIX: "PIX",
  CREDIT_CARD: "Crédito",
};

interface Donation {
  id: string;
  donorName: string;
  donorPhone: string;
  amount: number;
  feePercent: number;
  feeAmount: number;
  totalAmount: number;
  message: string | null;
  videoUrl: string | null;
  photoUrl: string | null;
  paymentMethod: "PIX" | "CREDIT_CARD";
  paymentStatus: "PENDING" | "CONFIRMED" | "FAILED" | "REFUNDED";
  createdAt: string;
}

const PLATFORM_PRIMARY = "#b8851f";

export function DonationsList({
  donations,
  primaryColor = PLATFORM_PRIMARY,
  coupleNames,
  weddingDate,
}: {
  donations: Donation[];
  primaryColor?: string;
  coupleNames?: string;
  weddingDate?: string | null;
}) {
  const [videoIndex, setVideoIndex] = useState<number | null>(null);

  const visible = useMemo(
    () => [...donations].sort((a, b) => b.amount - a.amount),
    [donations],
  );

  const videos = useMemo(
    () =>
      visible
        .filter((d): d is Donation & { videoUrl: string } => !!d.videoUrl)
        .map((d) => ({
          id: d.id,
          donorName: d.donorName,
          amount: d.amount,
          videoUrl: d.videoUrl,
        })),
    [visible],
  );

  function openVideo(donationId: string) {
    const idx = videos.findIndex((v) => v.id === donationId);
    if (idx !== -1) setVideoIndex(idx);
  }

  if (donations.length === 0) {
    return (
      <div className="text-center py-12 px-6 rounded-2xl bg-white border border-border/60 shadow-sm">
        <Gift className="w-10 h-10 text-foreground/40 mx-auto mb-3" />
        <p className="text-base font-semibold text-foreground/80 mb-1">
          Nenhuma doação ainda
        </p>
        <p className="text-sm text-foreground/60">
          Compartilhe seu link para começar a receber contribuições.
        </p>
      </div>
    );
  }

  return (
    <>
      {videoIndex !== null && (
        <VideoModal
          videos={videos}
          initialIndex={videoIndex}
          primaryColor={primaryColor}
          coupleNames={coupleNames}
          weddingDate={weddingDate}
          canDownload
          onClose={() => setVideoIndex(null)}
        />
      )}

      <div className="space-y-5">
        {/* Desktop table */}
        {visible.length > 0 && (
          <div className="hidden md:block rounded-2xl border border-border/60 bg-white overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/60" style={{ backgroundColor: "hsl(var(--primary) / 0.08)" }}>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/70">№</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/70">Doador</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/70">Contato</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/70">Método</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/70">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/70">Data</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/70">Vídeo</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/70">Valor</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((donation, idx) => {
                  const status = statusMap[donation.paymentStatus];
                  return (
                    <tr key={donation.id} className="border-b border-border/40 last:border-0 hover:bg-[#fbf7ee]/40 transition-colors">
                      <td className="px-5 py-4 text-sm text-foreground/55 tabular-nums">
                        {String(idx + 1).padStart(2, "0")}
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold text-foreground">
                          {donation.donorName}
                        </div>
                        {donation.message && (
                          <div className="text-xs text-foreground/60 mt-0.5 max-w-sm truncate">
                            {donation.message}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-foreground/65">
                        {formatPhone(donation.donorPhone)}
                      </td>
                      <td className="px-5 py-4 text-sm text-foreground/70">
                        {methodMap[donation.paymentMethod]}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                      </td>
                      <td className="px-5 py-4 text-xs text-foreground/65 tabular-nums">
                        {new Date(donation.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </td>
                      <td className="px-5 py-4">
                        {donation.videoUrl ? (
                          <button
                            onClick={() => openVideo(donation.id)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
                            style={{ color: primaryColor }}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Ver
                          </button>
                        ) : (
                          <span className="text-xs text-foreground/35">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div
                          className="text-base font-semibold tabular-nums"
                          style={{ color: primaryColor }}
                        >
                          {formatCurrency(donation.amount)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Mobile cards */}
        {visible.length > 0 && (
          <ul className="md:hidden space-y-3">
            {visible.map((donation) => {
              const status = statusMap[donation.paymentStatus];
              return (
                <li
                  key={donation.id}
                  className="rounded-2xl bg-white border border-border/60 p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {donation.donorName}
                      </p>
                      <p className="text-xs text-foreground/55 mt-0.5">
                        {formatPhone(donation.donorPhone)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p
                        className="text-base font-semibold tabular-nums"
                        style={{ color: primaryColor }}
                      >
                        {formatCurrency(donation.amount)}
                      </p>
                      <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground/55">
                    <span>{methodMap[donation.paymentMethod]}</span>
                    <span>·</span>
                    <span>
                      {new Date(donation.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  </div>
                  {donation.videoUrl && (
                    <button
                      onClick={() => openVideo(donation.id)}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold"
                      style={{ color: primaryColor }}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Ver vídeo
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
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
