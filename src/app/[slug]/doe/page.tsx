import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Heart } from "lucide-react";
import { DonationStepper } from "@/components/donation/DonationStepper";
import { primaryToSecondary } from "@/lib/colors";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ nome?: string; valor?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const caixinha = await prisma.caixinha.findUnique({ where: { slug } });
  if (!caixinha) return { title: "Página não encontrada" };
  return { title: `Contribuir com ${caixinha.coupleNames} | Caixinha dos Noivos` };
}

export default async function DoePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  const caixinha = await prisma.caixinha.findUnique({
    where: { slug, isActive: true },
    select: {
      id: true,
      slug: true,
      title: true,
      coupleNames: true,
      primaryColor: true,
    },
  });

  if (!caixinha) notFound();

  if (sp.nome && sp.valor) {
    return (
      <ThankYouPage
        nome={sp.nome}
        valor={parseFloat(sp.valor)}
        slug={slug}
        coupleNames={caixinha.coupleNames}
        primaryColor={caixinha.primaryColor}
      />
    );
  }

  return (
    <div
      className="relative min-h-screen donation-page couple-page bg-[#fbf9f3]"
      style={
        {
          "--brand-primary": caixinha.primaryColor,
          "--brand-secondary": primaryToSecondary(caixinha.primaryColor),
        } as React.CSSProperties
      }
    >
      {/* Subtle dot pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `radial-gradient(${caixinha.primaryColor}1A 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
          top: "73px",
        }}
      />

      <DonationStepper caixinha={caixinha} />
    </div>
  );
}

function ThankYouPage({
  nome,
  valor,
  slug,
  coupleNames,
  primaryColor,
}: {
  nome: string;
  valor: number;
  slug: string;
  coupleNames: string;
  primaryColor: string;
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-5 py-16 relative overflow-hidden"
      style={{
        background: `linear-gradient(160deg, ${primaryColor}33 0%, ${primaryColor}1A 100%), #fbf7ee`,
      }}
    >
      {/* Padrão de pontos */}
      <div
        className="absolute inset-0 opacity-50 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(${primaryColor}1F 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative max-w-md w-full font-sans">
        <div
          className="bg-white rounded-2xl shadow-2xl p-9 md:p-10 text-center animate-reveal-up"
          style={{ boxShadow: `0 30px 60px -20px ${primaryColor}40` }}
        >
          {/* Heart icon com anel duplo */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  border: `2px solid ${primaryColor}`,
                  backgroundColor: `${primaryColor}15`,
                }}
              >
                <Heart
                  className="w-10 h-10"
                  style={{ color: primaryColor }}
                  fill="currentColor"
                />
              </div>
              <div
                className="absolute -inset-1.5 rounded-full pointer-events-none"
                style={{ border: `1px solid ${primaryColor}40` }}
              />
            </div>
          </div>

          <p
            className="text-base font-medium mb-1"
            style={{ color: primaryColor }}
          >
            Obrigado,
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-foreground leading-[1] mb-3">
            {nome}.
          </h1>

          <p className="text-sm text-foreground/60 mt-4 mb-7">
            Sua contribuição foi registrada com sucesso
          </p>

          {/* Valor card destaque */}
          <div
            className="rounded-xl p-5 mb-7"
            style={{
              background: `linear-gradient(to right, ${primaryColor}1f, transparent)`,
              border: `1px solid ${primaryColor}80`,
            }}
          >
            <p
              className="text-xs font-semibold mb-2"
              style={{ color: primaryColor }}
            >
              Sua contribuição
            </p>
            <p
              className="font-display text-4xl tabular-nums tracking-tight"
              style={{ color: primaryColor }}
            >
              R$ {valor.toFixed(2).replace(".", ",")}
            </p>
          </div>

          <p className="text-sm text-foreground/70 leading-relaxed mb-8">
            {coupleNames} ficarão muito felizes em saber que você fez parte
            deste momento.
          </p>

          {/* Botões CTA rounded */}
          <div className="flex flex-col gap-3">
            <Link
              href={`/${slug}`}
              className="block w-full text-center py-4 rounded-2xl text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 text-base font-semibold"
              style={{
                backgroundColor: primaryColor,
                boxShadow: `0 12px 28px -10px ${primaryColor}80`,
              }}
            >
              Voltar à caixinha
            </Link>
            <Link
              href="/"
              className="block w-full text-center py-4 rounded-2xl border border-border/70 text-foreground/70 hover:text-foreground hover:border-border transition-colors text-base"
            >
              Ir ao início
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-foreground/50 mt-6">
          Feito com Caixinha dos Noivos
        </p>
      </div>
    </div>
  );
}
