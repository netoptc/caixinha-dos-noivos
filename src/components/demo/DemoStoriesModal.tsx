"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Heart, X } from "lucide-react";
import { formatWeddingDate } from "@/lib/utils";

interface DemoStory {
  id: string;
  donorName: string;
  photoUrl: string;
}

interface DemoStoriesModalProps {
  stories: DemoStory[];
  initialIndex?: number;
  primaryColor?: string;
  coupleNames?: string;
  weddingDate?: string | null;
  onClose: () => void;
}

export function DemoStoriesModal({
  stories,
  initialIndex = 0,
  primaryColor = "#D4A017",
  coupleNames,
  weddingDate,
  onClose,
}: DemoStoriesModalProps) {
  const [index, setIndex] = useState(initialIndex);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const current = stories[index];

  const goNext = useCallback(() => {
    if (index < stories.length - 1) {
      setIndex((i) => i + 1);
    } else {
      onClose();
    }
  }, [index, stories.length, onClose]);

  const goPrev = useCallback(() => {
    if (index > 0) setIndex((i) => i - 1);
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
      style={{ background: primaryColor }}
      onClick={onClose}
    >
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />
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
        {/* TOP: progress bars + header */}
        <div className="relative z-20 px-4 pt-4 flex-shrink-0">
          <div className="flex gap-1 mb-4">
            {stories.map((s, i) => (
              <div
                key={s.id}
                className="flex-1 h-0.5 rounded-full overflow-hidden bg-white/25"
              >
                <div
                  className="h-full rounded-full bg-white"
                  style={{
                    width: i < index ? "100%" : i === index ? "100%" : "0%",
                  }}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mb-3">
            <span className="text-white/70 text-[0.7rem] font-medium tracking-wider uppercase">
              {index + 1} de {stories.length}
            </span>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center text-white/80 hover:text-white rounded-full hover:bg-white/15 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

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
              <div className="mx-auto mt-1.5 h-px w-12 bg-white/40" />
            </div>
          )}
        </div>

        {/* MIDDLE: photo + CTA overlay */}
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
            <Image
              key={current.id}
              src={current.photoUrl}
              alt={current.donorName}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
              priority
            />

            {/* CTA central — empurra para criar a caixinha */}
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 z-10 pointer-events-none">
              <div
                className="text-center mb-5 px-5 py-2.5 rounded-full backdrop-blur-md bg-black/30 border border-white/15"
              >
                <p className="text-white/90 text-[11px] font-semibold uppercase tracking-[0.18em]">
                  Demonstração
                </p>
              </div>
              <p
                className="text-white text-center font-semibold text-lg leading-tight mb-5 max-w-[18rem]"
                style={{ textShadow: "0 2px 12px rgba(0,0,0,0.45)" }}
              >
                Quer ter mensagens assim no seu casamento?
              </p>
              <Link
                href="/criar-caixinha"
                className="pointer-events-auto inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white text-sm font-semibold shadow-2xl transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.4)]"
                style={{ color: primaryColor }}
              >
                Criar minha caixinha
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Gradiente para legibilidade do CTA sobre a foto */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/35 to-black/45 pointer-events-none" />

            {/* Tap zones (debaixo do CTA, por isso z menor) */}
            <button
              className="absolute left-0 top-0 bottom-0 w-1/3 z-0"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              aria-label="Anterior"
            />
            <button
              className="absolute right-0 top-0 bottom-0 w-1/3 z-0"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              aria-label="Próximo"
            />
          </div>
        </div>

        {/* BOTTOM: avatar + nome + assinatura */}
        <div className="relative z-20 flex-shrink-0 px-4 pb-4 flex flex-col items-center gap-3">
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

          <div className="flex items-center gap-1.5 opacity-70">
            <Heart className="w-3 h-3 text-white" fill="currentColor" />
            <span className="text-white text-[0.65rem] font-medium tracking-wider uppercase">
              Caixinha dos Noivos
            </span>
          </div>
        </div>

        {/* Desktop arrows */}
        {index > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-[-52px] top-1/2 -translate-y-1/2 z-20 hidden md:flex w-10 h-10 items-center justify-center rounded-full bg-white/20 hover:bg-white/35 text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {index < stories.length - 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-[-52px] top-1/2 -translate-y-1/2 z-20 hidden md:flex w-10 h-10 items-center justify-center rounded-full bg-white/20 hover:bg-white/35 text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
