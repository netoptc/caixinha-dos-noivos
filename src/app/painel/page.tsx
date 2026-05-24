import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatCurrency, calculateProgress } from "@/lib/utils";
import {
  ExternalLink,
  TrendingUp,
  Users,
  Target,
  Heart,
  Gift,
  History,
  Settings,
} from "lucide-react";
import { CaixinhaEditor } from "@/components/dashboard/CaixinhaEditor";
import { DonationsList } from "@/components/dashboard/DonationsList";
import { WithdrawCard } from "@/components/dashboard/WithdrawCard";
import { WithdrawalHistory } from "@/components/dashboard/WithdrawalHistory";
import { ShareButton } from "@/components/dashboard/ShareButton";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      caixinha: {
        include: {
          // Só doações confirmadas aparecem na lista. PENDING é tentativa de
          // pagamento (PIX gerado e não pago, cartão recusado, doador trocou
          // de método, recarregou a tela etc.) — não conta como "recebida".
          donations: {
            where: { paymentStatus: "CONFIRMED" },
            orderBy: { createdAt: "desc" },
          },
          _count: {
            select: { donations: { where: { paymentStatus: "CONFIRMED" } } },
          },
        },
      },
    },
  });

  const caixinha = user?.caixinha;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const caixinhaUrl = caixinha ? `${baseUrl}/${caixinha.slug}` : null;

  // ============ Empty state — usuário ainda não tem caixinha ============
  if (!caixinha) {
    return (
      <div className="max-w-3xl mx-auto py-12 font-sans">
        <div className="rounded-2xl bg-white border border-border/60 shadow-lg p-10 md:p-12 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: "hsl(var(--primary) / 0.15)" }}
          >
            <Heart
              className="w-7 h-7 text-primary"
              fill="currentColor"
            />
          </div>

          <h1 className="font-display text-3xl md:text-4xl text-foreground mb-3">
            Bem-vindo, {session.user.name?.split(" ")[0]}
          </h1>
          <p className="text-base text-foreground/70 max-w-md mx-auto mb-8">
            Crie sua caixinha abaixo para começar a receber contribuições para
            o casamento.
          </p>
        </div>

        {/* Editor inline para primeira criação */}
        <div className="mt-8">
          <CaixinhaEditor />
        </div>
      </div>
    );
  }

  const raisedAmount = Number(caixinha.raisedAmount);
  const goalAmount = Number(caixinha.goalAmount);
  const progress = calculateProgress(raisedAmount, goalAmount);
  const donorCount = caixinha._count.donations;

  // Serialize donations for client component
  const donations = caixinha.donations.map((d) => ({
    ...d,
    amount: Number(d.amount),
    feePercent: Number(d.feePercent),
    feeAmount: Number(d.feeAmount),
    totalAmount: Number(d.totalAmount),
    createdAt: d.createdAt.toISOString(),
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-10 font-sans">
      {/* ============ HEADER ============ */}
      <header className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <h1 className="font-display text-3xl md:text-4xl text-foreground leading-tight">
            Olá, {session.user.name?.split(" ")[0]}
          </h1>
          <p className="text-base text-foreground/65 mt-1">
            Acompanhe sua arrecadação e gerencie sua caixinha.
          </p>
        </div>
        <div className="flex flex-col w-full md:w-auto md:flex-row md:items-center gap-2 md:flex-wrap">
          <Link
            href="/painel/caixinha"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-foreground/70 bg-white border border-border/60 hover:text-foreground hover:bg-[#fbf7ee] hover:border-border transition-colors w-full md:w-auto"
          >
            <Settings className="w-4 h-4" />
            Personalizar caixinha
          </Link>
          <ShareButton url={caixinhaUrl ?? ""} />
          <Link
            href={`/${caixinha.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors shadow-sm w-full md:w-auto"
          >
            <ExternalLink className="w-4 h-4" />
            Ver caixinha
          </Link>
        </div>
      </header>

      {/* ============ STATS ============ */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Arrecadado"
          value={formatCurrency(raisedAmount)}
          primary
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Doadores"
          value={donorCount.toString()}
        />
        <StatCard
          icon={<Heart className="w-5 h-5" />}
          label="Progresso"
          value={`${progress}%`}
        />
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Meta"
          value={formatCurrency(goalAmount)}
        />
      </section>

      {/* ============ WITHDRAW (saque) ============ */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: "hsl(var(--primary) / 0.15)",
              color: "hsl(var(--primary))",
            }}
          >
            <Gift className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Saldo e saques
          </h2>
        </div>
        <WithdrawCard fallbackTotal={raisedAmount} />
      </section>

      {/* ============ WITHDRAWAL HISTORY ============ */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: "hsl(var(--primary) / 0.15)",
              color: "hsl(var(--primary))",
            }}
          >
            <History className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Histórico de saques
          </h2>
        </div>
        <WithdrawalHistory primaryColor={caixinha.primaryColor} />
      </section>

      {/* ============ DONATIONS LIST ============ */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: "hsl(var(--primary) / 0.15)",
              color: "hsl(var(--primary))",
            }}
          >
            <Gift className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Doações recebidas{" "}
            <span className="text-foreground/55 text-sm font-normal">
              ({donations.length})
            </span>
          </h2>
        </div>
        <DonationsList
          donations={donations}
          primaryColor={caixinha.primaryColor}
          coupleNames={caixinha.coupleNames}
          weddingDate={
            caixinha.weddingDate ? caixinha.weddingDate.toISOString() : null
          }
        />
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  primary,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  primary?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white border border-border/60 shadow-sm p-5">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
        style={{
          backgroundColor: primary
            ? "hsl(var(--primary) / 0.15)"
            : "hsl(var(--muted))",
          color: primary
            ? "hsl(var(--primary))"
            : "hsl(var(--muted-foreground))",
        }}
      >
        {icon}
      </div>
      <p
        className={`font-display text-xl md:text-2xl tabular-nums tracking-tight ${
          primary ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-foreground/55 mt-1">{label}</p>
    </div>
  );
}
