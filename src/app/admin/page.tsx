import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatCurrency, calculateProgress } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { getMasterAvailableBalance } from "@/lib/asaas";
import {
  ExternalLink,
  Heart,
  ShieldCheck,
  TrendingUp,
  Users,
  Activity,
  Wallet,
  ArrowUpRight,
} from "lucide-react";

export const metadata = {
  title: "Painel administrativo",
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const [caixinhas, sums, withdrawalsAgg, recentWithdrawals, masterBalance] =
    await Promise.all([
      prisma.caixinha.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          _count: {
            select: { donations: { where: { paymentStatus: "CONFIRMED" } } },
          },
        },
      }),
      prisma.donation.groupBy({
        by: ["caixinhaId"],
        where: { paymentStatus: "CONFIRMED" },
        _sum: { amount: true },
      }),
      prisma.withdrawal.groupBy({
        by: ["status"],
        _sum: { amount: true, anticipationFee: true },
      }),
      prisma.withdrawal.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: { select: { name: true, email: true } } },
      }),
      // The master Asaas balance is a live API call; surface failures inline
      // rather than crash the whole page if the gateway is unreachable.
      getMasterAvailableBalance().catch(() => null),
    ]);

  const totalRepassed = withdrawalsAgg
    .filter((w) => w.status === "COMPLETED")
    .reduce((sum, w) => sum + Number(w._sum.amount ?? 0), 0);
  const totalPendingRepasse = withdrawalsAgg
    .filter((w) => w.status === "PENDING")
    .reduce((sum, w) => sum + Number(w._sum.amount ?? 0), 0);

  const sumByCaixinha = new Map<string, number>(
    sums.map((s) => [s.caixinhaId, Number(s._sum.amount ?? 0)])
  );

  const rows = caixinhas.map((c) => {
    const raised = sumByCaixinha.get(c.id) ?? 0;
    const goal = Number(c.goalAmount);
    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      coupleNames: c.coupleNames,
      ownerName: c.user.name,
      ownerEmail: c.user.email,
      donorCount: c._count.donations,
      raised,
      goal,
      progress: calculateProgress(raised, goal),
      isActive: c.isActive,
      createdAt: c.createdAt,
    };
  });

  const totalRaised = rows.reduce((acc, r) => acc + r.raised, 0);
  const totalDonors = rows.reduce((acc, r) => acc + r.donorCount, 0);
  const totalActive = rows.filter((r) => r.isActive).length;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="max-w-6xl mx-auto space-y-10 font-sans">
      <header className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-primary font-semibold inline-flex items-center gap-1.5 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Painel administrativo
          </p>
          <h1 className="font-display text-3xl md:text-4xl text-foreground leading-tight">
            Todas as caixinhas
          </h1>
          <p className="text-base text-foreground/65 mt-1">
            {rows.length === 0
              ? "Nenhuma caixinha cadastrada ainda."
              : `Visão consolidada de ${rows.length} ${
                  rows.length === 1 ? "caixinha" : "caixinhas"
                } na plataforma.`}
          </p>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Heart className="w-5 h-5" />}
          label="Caixinhas"
          value={rows.length.toString()}
          primary
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Doadores"
          value={totalDonors.toString()}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Arrecadado total"
          value={formatCurrency(totalRaised)}
        />
        <StatCard
          icon={<Activity className="w-5 h-5" />}
          label="Ativas"
          value={`${totalActive} / ${rows.length}`}
        />
      </section>

      {/* ============ FINANCEIRO MASTER ============ */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={<Wallet className="w-5 h-5" />}
          label="Saldo Asaas master"
          value={
            masterBalance == null ? "—" : formatCurrency(masterBalance)
          }
        />
        <StatCard
          icon={<ArrowUpRight className="w-5 h-5" />}
          label="Já repassado"
          value={formatCurrency(totalRepassed)}
        />
        <StatCard
          icon={<Activity className="w-5 h-5" />}
          label="Repasses em andamento"
          value={formatCurrency(totalPendingRepasse)}
        />
      </section>

      {/* ============ ÚLTIMOS REPASSES ============ */}
      {recentWithdrawals.length > 0 && (
        <section className="rounded-2xl bg-white border border-border/60 shadow-sm overflow-hidden">
          <header className="px-5 py-4 border-b border-border/60 bg-[#fbf7ee]/60">
            <h2 className="text-base font-semibold text-foreground">
              Últimos repasses
            </h2>
            <p className="text-xs text-foreground/55 mt-0.5">
              10 transferências mais recentes
            </p>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border/60">
                  <th className="px-5 py-3 font-semibold text-foreground/70 text-xs uppercase tracking-wider">
                    Casal
                  </th>
                  <th className="px-5 py-3 font-semibold text-foreground/70 text-xs uppercase tracking-wider text-right">
                    Valor
                  </th>
                  <th className="px-5 py-3 font-semibold text-foreground/70 text-xs uppercase tracking-wider text-right">
                    Taxa antecip.
                  </th>
                  <th className="px-5 py-3 font-semibold text-foreground/70 text-xs uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 font-semibold text-foreground/70 text-xs uppercase tracking-wider">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentWithdrawals.map((w) => (
                  <tr
                    key={w.id}
                    className="border-b border-border/40 last:border-0"
                  >
                    <td className="px-5 py-3 align-top">
                      <p className="font-semibold text-foreground/85">
                        {w.user.name}
                      </p>
                      <p className="text-xs text-foreground/55 mt-0.5 truncate max-w-[220px]">
                        {w.user.email}
                      </p>
                    </td>
                    <td className="px-5 py-3 align-top text-right tabular-nums font-semibold text-foreground">
                      {formatCurrency(Number(w.amount))}
                    </td>
                    <td className="px-5 py-3 align-top text-right tabular-nums text-foreground/70">
                      {Number(w.anticipationFee) > 0
                        ? formatCurrency(Number(w.anticipationFee))
                        : "—"}
                    </td>
                    <td className="px-5 py-3 align-top">
                      <Badge
                        variant={
                          w.status === "COMPLETED"
                            ? "success"
                            : w.status === "FAILED"
                              ? "outline"
                              : "outline"
                        }
                      >
                        {w.status === "COMPLETED"
                          ? "Concluído"
                          : w.status === "FAILED"
                            ? "Falhou"
                            : "Em andamento"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 align-top text-foreground/75 whitespace-nowrap">
                      {dateFormatter.format(w.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {rows.length === 0 ? (
        <div className="rounded-2xl bg-white border border-border/60 shadow-sm p-10 text-center">
          <p className="text-foreground/65">
            Nenhuma caixinha foi criada ainda. Assim que houver caixinhas
            cadastradas, elas aparecerão aqui.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <section className="hidden md:block rounded-2xl bg-white border border-border/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-border/60 bg-[#fbf7ee]/60">
                    <th className="px-5 py-3.5 font-semibold text-foreground/70 text-xs uppercase tracking-wider">
                      Caixinha
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-foreground/70 text-xs uppercase tracking-wider">
                      Dono
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-foreground/70 text-xs uppercase tracking-wider text-right">
                      Doadores
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-foreground/70 text-xs uppercase tracking-wider text-right">
                      Arrecadado
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-foreground/70 text-xs uppercase tracking-wider">
                      Meta
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-foreground/70 text-xs uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-foreground/70 text-xs uppercase tracking-wider">
                      Criada
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-foreground/70 text-xs uppercase tracking-wider text-right">
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-border/40 last:border-0 hover:bg-[#fbf7ee]/40 transition-colors"
                    >
                      <td className="px-5 py-4 align-top">
                        <p className="font-semibold text-foreground leading-snug">
                          {row.coupleNames}
                        </p>
                        <p className="text-xs text-foreground/55 mt-0.5">
                          /{row.slug}
                        </p>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <p className="text-foreground/85 leading-snug">
                          {row.ownerName}
                        </p>
                        <p className="text-xs text-foreground/55 mt-0.5 truncate max-w-[220px]">
                          {row.ownerEmail}
                        </p>
                      </td>
                      <td className="px-5 py-4 align-top text-right tabular-nums font-semibold text-foreground">
                        {row.donorCount}
                      </td>
                      <td className="px-5 py-4 align-top text-right tabular-nums font-semibold text-primary">
                        {formatCurrency(row.raised)}
                      </td>
                      <td className="px-5 py-4 align-top min-w-[180px]">
                        <p className="tabular-nums text-foreground/85">
                          {formatCurrency(row.goal)}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <div
                            className="flex-1 h-1.5 rounded-full overflow-hidden"
                            style={{
                              backgroundColor: "hsl(var(--primary) / 0.15)",
                            }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${row.progress}%`,
                                backgroundColor: "hsl(var(--primary))",
                              }}
                            />
                          </div>
                          <span className="text-xs text-foreground/55 tabular-nums w-9 text-right">
                            {row.progress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <Badge variant={row.isActive ? "success" : "outline"}>
                          {row.isActive ? "Ativa" : "Inativa"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 align-top text-foreground/75 whitespace-nowrap">
                        {dateFormatter.format(row.createdAt)}
                      </td>
                      <td className="px-5 py-4 align-top text-right">
                        <Link
                          href={`/${row.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Mobile cards */}
          <section className="md:hidden space-y-3">
            {rows.map((row) => (
              <div
                key={row.id}
                className="rounded-2xl bg-white border border-border/60 shadow-sm p-5"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground leading-snug truncate">
                      {row.coupleNames}
                    </p>
                    <p className="text-xs text-foreground/55 mt-0.5 truncate">
                      /{row.slug}
                    </p>
                  </div>
                  <Badge variant={row.isActive ? "success" : "outline"}>
                    {row.isActive ? "Ativa" : "Inativa"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-foreground/55 font-semibold">
                      Doadores
                    </p>
                    <p className="font-semibold text-foreground tabular-nums">
                      {row.donorCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-foreground/55 font-semibold">
                      Arrecadado
                    </p>
                    <p className="font-semibold text-primary tabular-nums">
                      {formatCurrency(row.raised)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-foreground/55 font-semibold">
                      Meta
                    </p>
                    <p className="font-semibold text-foreground/85 tabular-nums">
                      {formatCurrency(row.goal)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-foreground/55 font-semibold">
                      Criada
                    </p>
                    <p className="text-foreground/85">
                      {dateFormatter.format(row.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] uppercase tracking-wider text-foreground/55 font-semibold">
                      Progresso
                    </p>
                    <p className="text-xs text-foreground/55 tabular-nums">
                      {row.progress}%
                    </p>
                  </div>
                  <div
                    className="w-full h-1.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: "hsl(var(--primary) / 0.15)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${row.progress}%`,
                        backgroundColor: "hsl(var(--primary))",
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/40">
                  <div className="min-w-0">
                    <p className="text-xs text-foreground/85 truncate">
                      {row.ownerName}
                    </p>
                    <p className="text-[11px] text-foreground/55 truncate">
                      {row.ownerEmail}
                    </p>
                  </div>
                  <Link
                    href={`/${row.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors flex-shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Ver
                  </Link>
                </div>
              </div>
            ))}
          </section>

          <p className="text-xs text-foreground/55">
            Base: <span className="font-mono">{baseUrl}</span>
          </p>
        </>
      )}
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
