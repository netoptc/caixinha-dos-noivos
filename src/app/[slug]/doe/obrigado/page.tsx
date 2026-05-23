import Link from "next/link";
import { Heart } from "lucide-react";
import { prisma } from "@/lib/db";
import { primaryToSecondary, primaryToSecondaryDark } from "@/lib/colors";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ nome?: string; valor?: string }>;
}

export const metadata: Metadata = { title: "Obrigado | Caixinha dos Noivos" };

export default async function ObrigadoPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { nome = "Doador", valor } = await searchParams;
  const valorNum = valor ? parseFloat(valor) : null;

  const caixinha = await prisma.caixinha.findUnique({
    where: { slug },
    select: { primaryColor: true },
  });

  const primary = caixinha?.primaryColor ?? "#d4a017";
  const secondary = primaryToSecondary(primary);
  const secondaryDark = primaryToSecondaryDark(primary);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 couple-page"
      style={{ background: `linear-gradient(135deg, ${secondary} 0%, ${secondaryDark} 100%)` }}
    >
      <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-2xl">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: `${primary}18` }}
        >
          <Heart className="w-12 h-12" style={{ color: primary }} fill="currentColor" />
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-2">Obrigado, {nome}!</h1>
        <p className="text-muted-foreground mb-8">
          {valorNum !== null ? (
            <>
              Sua contribuição de{" "}
              <span className="font-bold text-xl" style={{ color: primary }}>
                R$ {valorNum.toFixed(2).replace(".", ",")}
              </span>{" "}
              foi registrada com sucesso!
            </>
          ) : (
            "Sua contribuição foi registrada com sucesso!"
          )}
        </p>
        <Link
          href={`/${slug}`}
          className="block w-full py-3 rounded-xl text-white font-bold transition-opacity hover:opacity-90"
          style={{ backgroundColor: primary }}
        >
          Ver página da caixinha
        </Link>
      </div>
    </div>
  );
}
