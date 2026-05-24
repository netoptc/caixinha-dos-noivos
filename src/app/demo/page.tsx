"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Users,
  Share2,
  Gift,
  ShieldCheck,
  Sparkles,
  X,
  ArrowRight,
  CreditCard,
  Zap,
  Play,
} from "lucide-react";
import { DonorRanking } from "@/components/caixinha/DonorRanking";
import { ArrecadacaoCard } from "@/components/caixinha/ArrecadacaoCard";
import { DemoStoriesModal } from "@/components/demo/DemoStoriesModal";

const DEMO = {
  coupleNames: "Ana & Pedro",
  description:
    "Vamos nos casar em junho de 2025. Cada contribuição nos ajuda a realizar esse sonho. ❤️",
  primaryColor: "#D4A017",
  coupleImageUrl: "/assets/imgs/92b5c04b-8bf7-4534-8c30-1df9975360ac.png",
  goalAmount: 15000,
  raisedAmount: 7850,
  hideTotalRaised: false,
  hideGoal: false,
  hideDonorAmount: false,
  donors: [
    { id: "1", donorName: "Roberto Alves", donorPhone: "11954321098", amount: 2000, message: "Para o casal mais lindo do mundo!", videoUrl: null, photoUrl: null, createdAt: new Date().toISOString() },
    { id: "2", donorName: "João Santos", donorPhone: "11976543210", amount: 1000, message: "Muito feliz por vocês!", videoUrl: null, photoUrl: null, createdAt: new Date().toISOString() },
    { id: "3", donorName: "Fernando Costa", donorPhone: "11932109876", amount: 750, message: "Felicidades a vocês dois!", videoUrl: null, photoUrl: null, createdAt: new Date().toISOString() },
    { id: "4", donorName: "Maria Silva", donorPhone: "11987654321", amount: 500, message: "Parabéns! Que seja eterno!", videoUrl: null, photoUrl: null, createdAt: new Date().toISOString() },
    { id: "5", donorName: "Camila Sousa", donorPhone: "11909876543", amount: 500, message: null, videoUrl: null, photoUrl: null, createdAt: new Date().toISOString() },
    { id: "6", donorName: "Marcos Ferreira", donorPhone: "11898765432", amount: 300, message: "Que vocês sejam muito felizes!", videoUrl: null, photoUrl: null, createdAt: new Date().toISOString() },
    { id: "7", donorName: "Luciana Martins", donorPhone: "11921098765", amount: 300, message: null, videoUrl: null, photoUrl: null, createdAt: new Date().toISOString() },
    { id: "8", donorName: "Carla Oliveira", donorPhone: "11965432109", amount: 250, message: "Que Deus abençoe a união de vocês!", videoUrl: null, photoUrl: null, createdAt: new Date().toISOString() },
    { id: "9", donorName: "Eduardo Rocha", donorPhone: "11910987654", amount: 150, message: "Com muito amor!", videoUrl: null, photoUrl: null, createdAt: new Date().toISOString() },
    { id: "10", donorName: "Patricia Lima", donorPhone: "11943210987", amount: 100, message: null, videoUrl: null, photoUrl: null, createdAt: new Date().toISOString() },
  ],
};

// Stories simuladas — cada doador tem sua própria foto. No modal aparece um
// CTA gigante "Criar minha caixinha" sobre a foto.
const DEMO_STORIES = [
  { id: "s1", donorName: "Tereza Mendes", photoUrl: "/assets/imgs/tereza.png" },
  { id: "s2", donorName: "Maria Silva", photoUrl: "/assets/imgs/maria.png" },
  { id: "s3", donorName: "Fernando Costa", photoUrl: "/assets/imgs/fernando.png" },
  { id: "s4", donorName: "Carla Oliveira", photoUrl: "/assets/imgs/carla.png" },
  { id: "s5", donorName: "Marcos Ferreira", photoUrl: "/assets/imgs/marcos.png" },
];

export default function DemoPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [storyIndex, setStoryIndex] = useState<number | null>(null);

  const primary = DEMO.primaryColor;
  const raisedAmount = DEMO.raisedAmount;
  const goalAmount = DEMO.goalAmount;
  const donorCount = DEMO.donors.length;

  return (
    <div
      className="relative min-h-screen couple-page bg-[#fbf7ee] font-sans"
      style={
        {
          "--brand-primary": primary,
        } as React.CSSProperties
      }
    >
      {/* Selo "demonstração" */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground/85 text-white text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md shadow-lg whitespace-nowrap">
        <Sparkles className="w-3 h-3 flex-shrink-0" />
        Página de demonstração
      </div>

      {/* HERO */}
      <section className="relative w-full mx-auto max-w-md md:max-w-xl">
        <div className="relative w-full h-[280px] sm:h-[340px] md:h-[440px] overflow-hidden animate-fade-in">
          <Image
            src={DEMO.coupleImageUrl}
            alt={DEMO.coupleNames}
            fill
            className="object-cover"
            style={{ objectPosition: "center 30%" }}
            priority
            sizes="(max-width: 768px) 100vw, 512px"
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#fbf7ee] pointer-events-none" />
        </div>
      </section>

      <div className="relative z-10 container mx-auto px-5 pb-16 max-w-md">
        <div className="flex flex-col items-center text-center pt-10 mb-8 animate-reveal-up">
          <Gift className="mb-4 w-9 h-9" style={{ color: primary }} strokeWidth={2} />
          <h1 className="font-display italic text-5xl md:text-6xl leading-[0.95] tracking-tight text-[#2c2418]">
            {DEMO.coupleNames}
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-foreground/65 max-w-xs">
            {DEMO.description}
          </p>
        </div>

        <div
          className="mb-6 animate-fade-in"
          style={{ animationDelay: "300ms" }}
        >
          <ArrecadacaoCard
            raised={raisedAmount}
            goal={goalAmount}
            donorCount={donorCount}
            primaryColor={primary}
          />
        </div>

        {/* CTA — abre modal em vez de navegar */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="block w-full text-center py-5 rounded-2xl text-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md mb-5 animate-fade-in"
          style={{
            backgroundColor: primary,
            boxShadow: `0 12px 28px -10px ${primary}80`,
            animationDelay: "550ms",
          }}
        >
          <span className="inline-flex items-center gap-3">
            <Heart className="w-4 h-4" fill="currentColor" />
            <span className="text-base font-semibold">Contribuir agora</span>
          </span>
        </button>

        <div className="flex items-center justify-center gap-3 mb-3 text-[13px] text-foreground/70">
          <span className="inline-flex items-center gap-2">
            <Zap
              className="w-5 h-5"
              style={{ color: primary }}
              fill="currentColor"
              strokeWidth={1.5}
            />
            PIX
          </span>
          <span className="text-foreground/30">·</span>
          <span className="inline-flex items-center gap-2">
            <CreditCard
              className="w-5 h-5"
              style={{ color: primary }}
              strokeWidth={2}
            />
            Cartão de crédito
          </span>
        </div>

        <div className="flex items-center justify-center gap-2 text-[13px] text-foreground/70">
          <ShieldCheck className="w-5 h-5" style={{ color: primary }} />
          <span>Ambiente seguro · 100% confidencial</span>
        </div>

        <div
          className="rounded-2xl shadow-lg p-4 sm:p-6 mt-10 animate-fade-in transition-all duration-300 hover:shadow-xl"
          style={{ backgroundColor: `${primary}12`, animationDelay: "650ms" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: primary }} />
            <h2 className="font-display text-xl sm:text-2xl">Quem contribuiu</h2>
          </div>

          {/* Carrossel de stories — visualmente idêntico ao DonorRanking real.
             Cada tile usa <img> com play overlay para passar a sensação de
             vídeo. Ao clicar, abre o DemoStoriesModal (cópia do VideoModal
             com CTA central). */}
          <div className="mb-5">
            <p className="text-[11px] font-semibold text-foreground/60 mb-3">
              Mensagens
            </p>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              {DEMO_STORIES.map((story, i) => (
                <button
                  key={story.id}
                  type="button"
                  onClick={() => setStoryIndex(i)}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 group focus:outline-none"
                >
                  <div
                    className="p-[2px] rounded-full transition-transform group-hover:scale-105"
                    style={{ background: primary }}
                  >
                    <div className="bg-white p-[2px] rounded-full">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden flex items-center justify-center relative">
                        <Image
                          src={story.photoUrl}
                          alt={story.donorName}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Play
                            className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white drop-shadow"
                            fill="currentColor"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-foreground/70 max-w-[56px] truncate text-center">
                    {story.donorName.split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <DonorRanking
            donors={DEMO.donors}
            primaryColor={primary}
            coupleNames={DEMO.coupleNames}
            showAmounts
          />
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="mt-6 w-full inline-flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-base font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5 animate-fade-in"
          style={{
            background: `linear-gradient(160deg, ${primary}33 0%, ${primary}1A 100%)`,
            border: `1px solid ${primary}40`,
            color: primary,
            animationDelay: "850ms",
          }}
        >
          <Share2 className="w-4 h-4" />
          Compartilhar no WhatsApp
        </button>

        <p
          className="text-center text-xs mt-10 text-foreground/50 animate-fade-in"
          style={{ animationDelay: "950ms" }}
        >
          Feito com Caixinha dos Noivos
        </p>
      </div>

      {/* STORIES MODAL — abre quando clica em qualquer tile da carrossel */}
      {storyIndex !== null && (
        <DemoStoriesModal
          stories={DEMO_STORIES}
          initialIndex={storyIndex}
          primaryColor={primary}
          coupleNames={DEMO.coupleNames}
          onClose={() => setStoryIndex(null)}
        />
      )}

      {/* MODAL */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="demo-modal-title"
        >
          <div
            className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-7 md:p-8 animate-reveal-up">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-foreground/55 hover:text-foreground hover:bg-[#fbf7ee] transition-colors"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>

            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
              style={{ backgroundColor: "hsl(var(--primary) / 0.15)" }}
            >
              <Heart
                className="w-7 h-7 text-primary"
                fill="currentColor"
              />
            </div>

            <h2
              id="demo-modal-title"
              className="font-display text-2xl md:text-3xl text-foreground leading-tight mb-2"
            >
              Esta é uma demonstração
            </h2>
            <p className="text-sm text-foreground/65 leading-relaxed mb-6">
              Os noivos não existem — esta página serve para mostrar como ficaria
              a sua caixinha. Quer criar a sua em alguns minutos?
            </p>

            <Link
              href="/criar-caixinha"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors shadow-sm"
            >
              Quero criar minha caixinha agora
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="w-full text-center text-xs text-foreground/55 mt-4 hover:text-foreground/80 transition-colors"
            >
              Continuar vendo o exemplo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
