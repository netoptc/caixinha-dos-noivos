"use client";

import { useState } from "react";
import { formatCurrency, formatWeddingDate } from "@/lib/utils";
import { VideoModal } from "./VideoModal";

interface Donor {
  id: string;
  donorName: string;
  donorPhone: string;
  amount: number;
  message?: string | null;
  videoUrl?: string | null;
  photoUrl?: string | null;
  createdAt: string;
}

interface DonorRankingProps {
  donors: Donor[];
  primaryColor?: string;
  coupleNames?: string;
  /** ISO string da data do casamento — exibida no header dos stories e do ranking */
  weddingDate?: string | null;
  limit?: number;
  /** Quando false, esconde o valor da doação ao lado de cada doador */
  showAmounts?: boolean;
}

export function DonorRanking({
  donors,
  primaryColor = "#b8851f",
  coupleNames,
  weddingDate,
  limit = 10,
  showAmounts = true,
}: DonorRankingProps) {
  const [videoIndex, setVideoIndex] = useState<number | null>(null);

  const sortedDonors = [...donors]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);

  // Apenas doadores que gravaram vídeo aparecem no carrossel/modal de mensagens
  const videos = sortedDonors
    .filter((d): d is Donor & { videoUrl: string } => !!d.videoUrl)
    .map((d) => ({
      id: d.id,
      donorName: d.donorName,
      amount: d.amount,
      videoUrl: d.videoUrl,
    }));

  function getInitials(name: string) {
    return name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }

  if (sortedDonors.length === 0) {
    return (
      <div className="text-center py-12 px-6 rounded-xl bg-white/40 border border-dashed border-border/70">
        <p className="text-base font-medium text-foreground/80 mb-1">
          Ainda sem contribuições
        </p>
        <p className="text-sm text-foreground/60">
          Seja a primeira pessoa a contribuir.
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
          onClose={() => setVideoIndex(null)}
        />
      )}

      {/* Carrossel de mensagens */}
      {videos.length > 0 && (
        <div className="mb-5">
          <p className="text-[11px] font-semibold text-foreground/60 mb-3">
            Mensagens
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
            {videos.map((video, i) => (
              <button
                key={video.id}
                onClick={() => setVideoIndex(i)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
              >
                <div
                  className="p-[2px] rounded-full transition-transform group-hover:scale-105"
                  style={{ background: primaryColor }}
                >
                  <div className="bg-white p-[2px] rounded-full">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden flex items-center justify-center">
                      <video
                        src={video.videoUrl}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                        onLoadedMetadata={(e) => {
                          (e.currentTarget as HTMLVideoElement).currentTime = 0.5;
                        }}
                      />
                    </div>
                  </div>
                </div>
                <span className="text-[11px] text-foreground/70 max-w-[56px] truncate text-center">
                  {video.donorName.split(" ")[0]}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Ranking */}
      <div className="space-y-2">
        {sortedDonors.map((donor, index) => {
          const isTop3 = index < 3;
          const hasVideo = !!donor.videoUrl;
          const initials = getInitials(donor.donorName);

          return (
            <div
              key={donor.id}
              className="flex items-center gap-2.5 sm:gap-3 p-2 sm:p-2.5 rounded-xl animate-fade-in transition-colors duration-300 hover:bg-white/40"
              style={{
                animationDelay: `${index * 40}ms`,
                ...(isTop3
                  ? {
                      background: `linear-gradient(to right, ${primaryColor}1f, transparent)`,
                      border: `1px solid ${primaryColor}80`,
                    }
                  : {
                      backgroundColor: "rgba(255,255,255,0.7)",
                    }),
              }}
            >
              {/* Posição */}
              <div className="w-6 sm:w-7 flex-shrink-0 text-center">
                <span
                  className="text-[11px] sm:text-xs font-bold tabular-nums"
                  style={{
                    color:
                      index === 0
                        ? "#D4AF37"
                        : index === 1
                        ? "#9CA3AF"
                        : index === 2
                        ? "#B87333"
                        : "hsl(var(--foreground) / 0.55)",
                  }}
                >
                  #{index + 1}
                </span>
              </div>

              {/* Avatar — com ring dourado SÓ se tiver vídeo (clica e abre modal) */}
              {hasVideo ? (
                <button
                  onClick={() => {
                    const idx = videos.findIndex((v) => v.id === donor.id);
                    if (idx !== -1) setVideoIndex(idx);
                  }}
                  className="flex-shrink-0 focus:outline-none"
                  title="Ver mensagem"
                >
                  <div
                    className="p-0.5 rounded-full"
                    style={{ background: primaryColor }}
                  >
                    <div className="bg-white p-0.5 rounded-full">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden flex items-center justify-center">
                        <video
                          src={donor.videoUrl!}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                          onLoadedMetadata={(e) => {
                            (e.currentTarget as HTMLVideoElement).currentTime = 0.5;
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </button>
              ) : (
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-semibold flex-shrink-0"
                  style={{
                    backgroundColor: `${primaryColor}26`,
                    color: primaryColor,
                  }}
                >
                  {initials}
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-[12px] sm:text-sm font-semibold text-foreground truncate">
                  {donor.donorName}
                </div>
              </div>

              {/* Valor */}
              {showAmounts && (
                <div className="text-right flex-shrink-0">
                  <div
                    className="text-[12px] sm:text-sm font-semibold tabular-nums whitespace-nowrap"
                    style={{
                      color: isTop3 ? primaryColor : "hsl(var(--foreground))",
                    }}
                  >
                    {formatCurrency(donor.amount)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
