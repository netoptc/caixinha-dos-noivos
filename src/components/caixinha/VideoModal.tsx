"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight, Play, Heart, Download, Volume2, VolumeX, ArrowRight } from "lucide-react";
import { formatWeddingDate } from "@/lib/utils";

export type StoryItem =
  | {
      id: string;
      donorName: string;
      amount: number;
      type: "video";
      videoUrl: string;
    }
  | {
      id: string;
      donorName: string;
      amount: number;
      type: "text";
      message: string;
    }
  | {
      id: string;
      donorName: string;
      amount: number;
      type: "image";
      photoUrl: string;
    };

interface VideoModalProps {
  videos: StoryItem[];
  initialIndex?: number;
  primaryColor?: string;
  coupleNames?: string;
  /** ISO string da data do casamento — exibida abaixo do nome dos noivos */
  weddingDate?: string | null;
  /** Quando true, exibe o botão de baixar vídeo. Use apenas no painel dos noivos. */
  canDownload?: boolean;
  /** Quando true, exibe overlay de demonstração com badge "Demonstração" e CTA
   * "Criar minha caixinha" sobre todo story (usado apenas na pagina /demo). */
  demoCta?: boolean;
  onClose: () => void;
}

const IMAGE_STORY_DURATION_MS = 5_000;

function getTextStoryDurationMs(message: string) {
  return Math.min(10_000, Math.max(5_000, message.length * 60));
}

export function VideoModal({
  videos,
  initialIndex = 0,
  primaryColor = "#D4A017",
  coupleNames,
  weddingDate,
  canDownload = false,
  demoCta = false,
  onClose,
}: VideoModalProps) {
  const [index, setIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pausedRef = useRef(false);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // Garante que portal só rende no client (não SSR)
  useEffect(() => {
    setMounted(true);
  }, []);

  const current = videos[index];

  const goNext = useCallback(() => {
    if (index < videos.length - 1) {
      setIndex((i) => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [index, videos.length, onClose]);

  const goPrev = useCallback(() => {
    if (index > 0) {
      setIndex((i) => i - 1);
      setProgress(0);
    }
  }, [index]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, goNext, goPrev]);

  useEffect(() => {
    setProgress(0);
    setPaused(false);

    let rafId = 0;
    let cancelled = false;
    let advanceTimer: ReturnType<typeof setTimeout> | null = null;
    let advanced = false;

    const advance = () => {
      if (advanced || cancelled) return;
      advanced = true;
      setProgress(100);
      advanceTimer = setTimeout(() => {
        if (!cancelled) goNext();
      }, 300);
    };

    // ─── Caminho TEXTO/IMAGEM: timer linear (texto baseado em comprimento,
    // imagem com duracao fixa) ───
    if (current.type === "text" || current.type === "image") {
      const durationMs =
        current.type === "text"
          ? getTextStoryDurationMs(current.message)
          : IMAGE_STORY_DURATION_MS;
      let startedAt = performance.now();
      let elapsedAccum = 0;
      let lastPausedSnapshot = false;

      const tickText = (now: number) => {
        if (cancelled) return;
        if (pausedRef.current) {
          if (!lastPausedSnapshot) {
            // Acabou de pausar: congela o acumulado
            elapsedAccum += now - startedAt;
            lastPausedSnapshot = true;
          }
        } else {
          if (lastPausedSnapshot) {
            // Acabou de retomar: reinicia o relógio
            startedAt = now;
            lastPausedSnapshot = false;
          }
          const elapsed = elapsedAccum + (now - startedAt);
          const pct = Math.min(100, (elapsed / durationMs) * 100);
          setProgress(pct);
          if (elapsed >= durationMs) {
            advance();
            return;
          }
        }
        rafId = requestAnimationFrame(tickText);
      };
      rafId = requestAnimationFrame(tickText);

      return () => {
        cancelled = true;
        cancelAnimationFrame(rafId);
        if (advanceTimer) clearTimeout(advanceTimer);
      };
    }

    // ─── Caminho VÍDEO ───
    const video = videoRef.current;
    if (!video) return;

    let knownDuration = 0;
    let durationFixed = false;

    const tick = () => {
      if (cancelled) return;
      const dur = knownDuration || video.duration;
      if (dur && isFinite(dur) && dur > 0) {
        const pct = Math.min(100, (video.currentTime / dur) * 100);
        setProgress(pct);
        // Fallback caso 'ended' não dispare (acontece com webm sem header
        // de duração depois do hack abaixo).
        if (!video.paused && video.currentTime >= dur - 0.15) {
          advance();
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    const startPlayback = () => {
      if (cancelled) return;
      video.muted = true;
      const p = video.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
      rafId = requestAnimationFrame(tick);
    };

    const handleEnded = () => advance();

    // WebM gravado pelo MediaRecorder não traz cue de duração no header
    // (video.duration vira Infinity). O hack é seekar pra um tempo
    // absurdamente alto pra forçar o decoder a calcular a duração real.
    // Pausamos antes pra evitar corrida com o autoplay — sem isso, o
    // timeupdate natural do autoplay às vezes dispara antes do seek e
    // a duração nunca é capturada (problema do "primeiro vídeo").
    const fixDurationThenPlay = () => {
      if (durationFixed) return;
      durationFixed = true;

      if (isFinite(video.duration) && video.duration > 0) {
        knownDuration = video.duration;
        startPlayback();
        return;
      }

      try {
        video.pause();
      } catch {}

      const cleanup = () => {
        video.removeEventListener("durationchange", onDurationChange);
        video.removeEventListener("loadeddata", onLoadedData);
      };

      const onDurationChange = () => {
        if (isFinite(video.duration) && video.duration > 0) {
          knownDuration = video.duration;
          cleanup();
          try {
            video.currentTime = 0;
          } catch {}
          startPlayback();
        }
      };

      // Em alguns navegadores o seek pra 1e101 não dispara 'durationchange'
      // mas dispara 'loadeddata' depois de re-bufferizar. Cobrimos os dois.
      const onLoadedData = () => {
        if (isFinite(video.duration) && video.duration > 0) {
          knownDuration = video.duration;
          cleanup();
          try {
            video.currentTime = 0;
          } catch {}
          startPlayback();
        }
      };

      video.addEventListener("durationchange", onDurationChange);
      video.addEventListener("loadeddata", onLoadedData);

      try {
        video.currentTime = 1e101;
      } catch {
        cleanup();
        startPlayback();
      }
    };

    const handleLoadedMeta = () => fixDurationThenPlay();

    video.addEventListener("loadedmetadata", handleLoadedMeta);
    video.addEventListener("ended", handleEnded);

    // Se o metadata já carregou antes do efeito (cache do navegador),
    // dispara o hack manualmente.
    if (video.readyState >= 1) {
      fixDurationThenPlay();
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      if (advanceTimer) clearTimeout(advanceTimer);
      video.removeEventListener("loadedmetadata", handleLoadedMeta);
      video.removeEventListener("ended", handleEnded);
    };
  }, [index, goNext, current]);

  function toggleMute(e: React.MouseEvent) {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    const next = !muted;
    video.muted = next;
    setMuted(next);
    if (!next && video.paused) {
      video.play().catch(() => {});
      setPaused(false);
    }
  }

  async function handleDownload(e?: React.MouseEvent) {
    e?.stopPropagation();
    if (downloadLoading) return;
    if (current.type !== "video") return;
    setDownloadLoading(true);

    try {
      const res = await fetch(current.videoUrl);
      if (!res.ok) throw new Error(`fetch ${res.status}`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      const ext = blob.type.includes("webm") ? "webm" : "mp4";
      a.download = `caixinha-${current.donorName.replace(/\s+/g, "-").toLowerCase()}-${current.id}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
    } catch (err) {
      console.error("download error:", err);
    } finally {
      setDownloadLoading(false);
    }
  }

  function togglePause() {
    if (current.type !== "video") {
      setPaused((p) => !p);
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
  }

  const initials = current.donorName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  if (!mounted) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        // Fundo cheio na cor do casal — sólido para nao revelar o body atras
        // (com alpha as bordas mostravam o creme #fbf7ee e dava sensacao de
        // transparente especialmente nos slides de texto).
        background: primaryColor,
      }}
      onClick={onClose}
    >
      {/* Textura sutil de pontos brancos sobre o fundo */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Glow ambiente */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top, rgba(255,255,255,0.12) 0%, transparent 60%)`,
        }}
      />

      <div
        className="relative flex flex-col overflow-hidden"
        style={{
          width: "min(100vw, 400px)",
          height: "min(100dvh, 760px)",
          borderRadius: "24px",
        }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── TOP: progress bars + nome do casal + ações ── */}
        <div className="relative z-20 px-4 pt-4 flex-shrink-0">
          {/* Progress bars */}
          <div className="flex gap-1 mb-4">
            {videos.map((s, i) => (
              <div
                key={s.id}
                className="flex-1 h-0.5 rounded-full overflow-hidden bg-white/25"
              >
                <div
                  className="h-full rounded-full bg-white"
                  style={{
                    width: i < index ? "100%" : i === index ? `${progress}%` : "0%",
                    transition: i === index ? "none" : undefined,
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header: contador (esq) e ações (dir) */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/70 text-[0.7rem] font-medium tracking-wider uppercase">
              {index + 1} de {videos.length}
            </span>
            <div className="flex items-center gap-1">
              {current.type === "video" && (
                <button
                  onClick={toggleMute}
                  className="w-9 h-9 flex items-center justify-center text-white/80 hover:text-white rounded-full hover:bg-white/15 transition-colors"
                  aria-label={muted ? "Ativar som" : "Desativar som"}
                  title={muted ? "Ativar som" : "Desativar som"}
                >
                  {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              )}
              {canDownload && current.type === "video" && (
                <button
                  onClick={handleDownload}
                  disabled={downloadLoading}
                  className="w-9 h-9 flex items-center justify-center text-white/80 hover:text-white rounded-full hover:bg-white/15 transition-colors relative disabled:opacity-60"
                  aria-label="Baixar mídia"
                  title="Baixar mídia"
                >
                  {downloadLoading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                </button>
              )}
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center text-white/80 hover:text-white rounded-full hover:bg-white/15 transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Nome do casal — centralizado, em destaque */}
          {coupleNames && (
            <div className="text-center mb-2">
              <h2
                className="text-white text-2xl font-semibold leading-tight"
                style={{
                  fontFamily: "Georgia, serif",
                  textShadow: "0 2px 12px rgba(0,0,0,0.25)",
                }}
              >
                {coupleNames}
              </h2>
              {weddingDate && (
                <p
                  className="text-white/85 text-[11px] font-medium mt-1 uppercase tracking-[0.18em]"
                  style={{ textShadow: "0 1px 8px rgba(0,0,0,0.25)" }}
                >
                  {formatWeddingDate(weddingDate)}
                </p>
              )}
              <div
                className="mx-auto mt-1.5 h-px w-12 bg-white/40"
              />
            </div>
          )}
        </div>

        {/* ── MEIO: vídeo ── */}
        <div className="relative z-10 flex-1 px-4 pt-2 pb-3 min-h-0">
          <div
            className="relative w-full h-full overflow-hidden"
            style={{
              borderRadius: "20px",
              border: "2px solid rgba(255,255,255,0.5)",
              boxShadow:
                "0 0 32px rgba(255,255,255,0.15), 0 20px 50px rgba(0,0,0,0.25)",
            }}
          >
            {current.type === "video" && (
              <video
                key={current.id}
                ref={videoRef}
                src={current.videoUrl}
                className="w-full h-full object-cover cursor-pointer"
                preload="auto"
                playsInline
                muted={muted}
                onClick={togglePause}
              />
            )}
            {current.type === "text" && (
              <TextStory
                key={current.id}
                message={current.message}
                primaryColor={primaryColor}
                onClick={togglePause}
              />
            )}
            {current.type === "image" && (
              <div
                key={current.id}
                className="w-full h-full cursor-pointer relative"
                onClick={togglePause}
              >
                <Image
                  src={current.photoUrl}
                  alt={current.donorName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 400px"
                  priority
                />
              </div>
            )}
            {paused && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-sm"
                  style={{ background: `${primaryColor}99` }}
                >
                  <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                </div>
              </div>
            )}

            {/* CTA central de demonstracao (apenas /demo) */}
            {demoCta && (
              <>
                {/* Gradiente p/ legibilidade sobre conteudo claro (foto/video) */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/60 pointer-events-none z-[15]" />
                <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-6 pb-8 z-20 pointer-events-none">
                  <div className="text-center mb-4 px-4 py-2 rounded-full backdrop-blur-md bg-black/30 border border-white/15">
                    <p className="text-white/90 text-[10px] font-semibold uppercase tracking-[0.18em]">
                      Demonstração
                    </p>
                  </div>
                  <p
                    className="text-white text-center font-semibold text-base leading-tight mb-4 max-w-[18rem]"
                    style={{ textShadow: "0 2px 12px rgba(0,0,0,0.45)" }}
                  >
                    Quer ter mensagens assim no seu casamento?
                  </p>
                  <Link
                    href="/criar-caixinha"
                    onClick={(e) => e.stopPropagation()}
                    className="pointer-events-auto inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white text-sm font-semibold shadow-2xl transition-all hover:-translate-y-0.5"
                    style={{ color: primaryColor }}
                  >
                    Criar minha caixinha
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </>
            )}

            {/* Tap zones */}
            <button
              className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              aria-label="Anterior"
            />
            <button
              className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              aria-label="Próximo"
            />
          </div>
        </div>

        {/* ── BAIXO: perfil do doador + logo da plataforma ── */}
        <div className="relative z-20 flex-shrink-0 px-4 pb-4 flex flex-col items-center gap-3">
          {/* Doador */}
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 max-w-full">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs flex-shrink-0 bg-white"
              style={{ color: primaryColor }}
            >
              {initials}
            </div>
            <p className="text-white font-medium text-sm leading-tight truncate pr-1">
              {current.donorName}
            </p>
          </div>

          {/* Logo Caixinha dos Noivos */}
          <div className="flex items-center gap-1.5 opacity-70">
            <Heart
              className="w-3 h-3 text-white"
              fill="currentColor"
            />
            <span className="text-white text-[0.65rem] font-medium tracking-wider uppercase">
              Caixinha dos Noivos
            </span>
          </div>
        </div>

        {/* Desktop arrows */}
        {index > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-[-52px] top-1/2 -translate-y-1/2 z-20 hidden md:flex w-10 h-10 items-center justify-center rounded-full bg-white/20 hover:bg-white/35 text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {index < videos.length - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-[-52px] top-1/2 -translate-y-1/2 z-20 hidden md:flex w-10 h-10 items-center justify-center rounded-full bg-white/20 hover:bg-white/35 text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );

  // Portal direto pra body — escapa de qualquer stacking context dos pais
  return createPortal(modal, document.body);
}

function TextStory({
  message,
  primaryColor,
  onClick,
}: {
  message: string;
  primaryColor: string;
  onClick: () => void;
}) {
  // Tamanho da fonte responde ao comprimento do texto — mensagens curtas
  // ganham fonte maior, mensagens longas reduzem para sempre caber.
  const len = message.length;
  const fontSize =
    len <= 60
      ? "clamp(1.75rem, 6vw, 2.25rem)"
      : len <= 140
        ? "clamp(1.4rem, 5vw, 1.85rem)"
        : "clamp(1.15rem, 4.2vw, 1.55rem)";

  return (
    <div
      onClick={onClick}
      className="w-full h-full cursor-pointer flex items-center justify-center px-6 py-8 relative"
      style={{
        // cor sólida (sem alpha) — assim o fundo do modal de texto não revela
        // o gradient ambiente atrás e fica visualmente igual ao do vídeo cheio
        background: primaryColor,
      }}
    >
      <div
        className="absolute top-6 left-6 text-white/30 font-serif leading-none select-none"
        style={{ fontSize: "5rem", fontFamily: "Georgia, serif" }}
        aria-hidden
      >
        “
      </div>
      <p
        className="text-white text-center font-medium leading-snug max-w-full break-words"
        style={{
          fontFamily: "Georgia, serif",
          fontSize,
          textShadow: "0 2px 12px rgba(0,0,0,0.25)",
        }}
      >
        {message}
      </p>
      <div
        className="absolute bottom-6 right-6 text-white/30 font-serif leading-none select-none"
        style={{ fontSize: "5rem", fontFamily: "Georgia, serif" }}
        aria-hidden
      >
        ”
      </div>
    </div>
  );
}
