import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Users,
  Share2,
  Gift,
  ShieldCheck,
  LayoutDashboard,
  CreditCard,
  Zap,
} from "lucide-react";
import { ArrecadacaoCard } from "@/components/caixinha/ArrecadacaoCard";
import { DonorRanking } from "@/components/caixinha/DonorRanking";
import { formatWeddingDate } from "@/lib/utils";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const caixinha = await prisma.caixinha.findUnique({ where: { slug } });
  if (!caixinha) return { title: "Página não encontrada" };

  return {
    title: `${caixinha.title} | Caixinha dos Noivos`,
    description: caixinha.description ?? `Contribua com ${caixinha.coupleNames} para o casamento!`,
    openGraph: {
      title: caixinha.title,
      description: caixinha.description ?? `Contribua com ${caixinha.coupleNames}!`,
      images: caixinha.coupleImageUrl ? [{ url: caixinha.coupleImageUrl }] : [],
    },
  };
}

export default async function CaixinhaPage({ params }: Props) {
  const { slug } = await params;

  const caixinha = await prisma.caixinha.findUnique({
    where: { slug, isActive: true },
    include: {
      donations: {
        where: { paymentStatus: "CONFIRMED" },
        orderBy: [{ amount: "desc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!caixinha) notFound();

  const session = await auth();
  const isOwner = !!session?.user?.id && session.user.id === caixinha.userId;

  const raisedAmount = Number(caixinha.raisedAmount);
  const goalAmount = Number(caixinha.goalAmount);
  const donorCount = caixinha.donations.length;

  const donors = caixinha.donations.map((d) => ({
    id: d.id,
    donorName: d.donorName,
    donorPhone: d.donorPhone,
    amount: Number(d.amount),
    message: d.message,
    videoUrl: d.videoUrl,
    photoUrl: d.photoUrl,
    createdAt: d.createdAt.toISOString(),
  }));

  const primary = caixinha.primaryColor;
  const initials = caixinha.coupleNames
    .split(/\s|&/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className="relative min-h-screen couple-page bg-[#fbf7ee] font-sans"
      style={
        {
          "--brand-primary": primary,
        } as React.CSSProperties
      }
    >
      {/* Botão flutuante "Ir para o painel" — só para o casal dono da caixinha */}
      {isOwner && (
        <Link
          href="/painel"
          className="fixed top-4 right-4 z-30 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 hover:bg-primary/90 transition-all backdrop-blur-md"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Ir para o painel</span>
        </Link>
      )}

      {/* ================= HERO IMAGE ================= */}
      <section className="relative w-full mx-auto max-w-md md:max-w-xl">
        <div className="relative w-full h-[280px] sm:h-[340px] md:h-[440px] overflow-hidden animate-fade-in">
          {caixinha.coupleImageUrl ? (
            <Image
              src={caixinha.coupleImageUrl}
              alt={caixinha.coupleNames}
              fill
              className="object-cover"
              style={{ objectPosition: "center 30%" }}
              priority
              sizes="(max-width: 768px) 100vw, 512px"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background: `linear-gradient(160deg, ${primary}33 0%, ${primary}1A 100%)`,
              }}
            >
              {initials ? (
                <span
                  className="font-display text-7xl"
                  style={{ color: primary }}
                >
                  {initials}
                </span>
              ) : (
                <Heart
                  className="w-20 h-20"
                  style={{ color: primary }}
                  fill="currentColor"
                />
              )}
            </div>
          )}
          {/* Fade suave para o bg na borda inferior */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#fbf7ee] pointer-events-none" />
        </div>
      </section>

      {/* ================= MAIN CONTENT ================= */}
      <div className="relative z-10 container mx-auto px-5 pb-16 max-w-md">
        {/* Bloco do título — ícone de presente + nome do casal em serif itálico + descrição */}
        <div className="flex flex-col items-center text-center pt-10 mb-8 animate-reveal-up">
          <Gift
            className="mb-4 w-9 h-9"
            style={{ color: primary }}
            strokeWidth={2}
          />

          <h1 className="font-display italic text-5xl md:text-6xl leading-[0.95] tracking-tight text-[#2c2418]">
            {caixinha.coupleNames}
          </h1>

          {caixinha.weddingDate && (
            <p
              className="mt-3 text-[13px] font-medium uppercase tracking-[0.18em]"
              style={{ color: primary }}
            >
              {formatWeddingDate(caixinha.weddingDate)}
            </p>
          )}

          {caixinha.description && (
            <p className="mt-5 text-[15px] leading-relaxed text-foreground/65 max-w-xs">
              {caixinha.description}
            </p>
          )}
        </div>

        {/* Card de Arrecadação — Arrecadado | Pessoas | Meta + barra animada */}
        <div
          className="mb-6 animate-fade-in"
          style={{ animationDelay: "300ms" }}
        >
          <ArrecadacaoCard
            raised={raisedAmount}
            goal={goalAmount}
            donorCount={donorCount}
            primaryColor={primary}
            hideTotalRaised={caixinha.hideTotalRaised}
            hideGoal={caixinha.hideGoal}
          />
        </div>

        {/* CTA */}
        <Link
          href={`/${caixinha.slug}/doe`}
          className="block w-full text-center py-5 rounded-2xl text-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md mb-5 animate-fade-in"
          style={{
            backgroundColor: primary,
            boxShadow: `0 12px 28px -10px ${primary}80`,
            animationDelay: "550ms",
          }}
        >
          <span className="inline-flex items-center gap-3">
            <Heart className="w-4 h-4" fill="currentColor" />
            <span className="text-base font-semibold">
              Contribuir agora
            </span>
          </span>
        </Link>

        {/* Formas de pagamento aceitas */}
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

        {/* Selo de segurança discreto */}
        <div className="flex items-center justify-center gap-2 text-[13px] text-foreground/70">
          <ShieldCheck className="w-5 h-5" style={{ color: primary }} />
          <span>Ambiente seguro · 100% confidencial</span>
        </div>

        {/* Ranking card */}
        {donors.length > 0 && (
          <div
            className="rounded-2xl shadow-lg p-4 sm:p-6 mt-10 animate-fade-in transition-all duration-300 hover:shadow-xl"
            style={{
              backgroundColor: `${primary}12`,
              animationDelay: "650ms",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: primary }} />
              <h2 className="font-display text-xl sm:text-2xl">
                Quem contribuiu
              </h2>
            </div>
            <DonorRanking
              donors={donors}
              primaryColor={primary}
              coupleNames={caixinha.coupleNames}
              weddingDate={
                caixinha.weddingDate
                  ? caixinha.weddingDate.toISOString()
                  : null
              }
              showAmounts={!caixinha.hideDonorAmount}
            />
          </div>
        )}

        {/* Share card — botão WhatsApp com mesmo gradient do header */}
        <a
          href={`https://wa.me/?text=${encodeURIComponent(
            `${caixinha.title} — Contribua com ${process.env.NEXT_PUBLIC_APP_URL ?? ""}/${caixinha.slug}`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
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
        </a>

        <p
          className="text-center text-xs mt-10 text-foreground/50 animate-fade-in"
          style={{ animationDelay: "950ms" }}
        >
          Feito com Caixinha dos Noivos
        </p>
      </div>
    </div>
  );
}
