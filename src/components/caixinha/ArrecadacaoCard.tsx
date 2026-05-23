"use client";

import { useEffect, useState } from "react";
import { formatCurrency, calculateProgress } from "@/lib/utils";

interface ArrecadacaoCardProps {
  raised: number;
  goal: number;
  donorCount: number;
  primaryColor: string;
  hideTotalRaised?: boolean;
  hideGoal?: boolean;
}

export function ArrecadacaoCard({
  raised,
  goal,
  donorCount,
  primaryColor,
  hideTotalRaised = false,
  hideGoal = false,
}: ArrecadacaoCardProps) {
  const target = calculateProgress(raised, goal);

  const [pct, setPct] = useState(0);
  const [raisedDisplay, setRaisedDisplay] = useState(0);
  const [donorDisplay, setDonorDisplay] = useState(0);

  useEffect(() => {
    const start = setTimeout(() => {
      const duration = 1400;
      const startTime = performance.now();

      function tick(now: number) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);

        setPct(eased * target);
        setRaisedDisplay(Math.round(eased * raised));
        setDonorDisplay(Math.round(eased * donorCount));

        if (progress < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    }, 200);

    return () => clearTimeout(start);
  }, [target, raised, donorCount]);

  const pctRounded = Math.round(pct);

  return (
    <div className="rounded-2xl p-6 border border-[#ebe2cd] bg-[#f6efde]/70">
      {/* Topo: 3 colunas centralizadas — valor em cima, label embaixo */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
        {/* Arrecadado */}
        <div className="text-center min-w-0">
          <div
            className="text-[13px] sm:text-base font-semibold tabular-nums leading-tight whitespace-nowrap"
            style={{ color: primaryColor }}
          >
            {hideTotalRaised ? "—" : formatCurrency(raisedDisplay)}
          </div>
          <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.14em] text-foreground/55 mt-2">
            Arrecadado
          </div>
        </div>

        {/* Contribuintes */}
        <div className="text-center min-w-0 border-x border-[#ebe2cd]">
          <div className="text-[13px] sm:text-base font-semibold tabular-nums leading-tight whitespace-nowrap text-foreground/85">
            {donorDisplay}
          </div>
          <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.14em] text-foreground/55 mt-2">
            {donorCount === 1 ? "Pessoa" : "Pessoas"}
          </div>
        </div>

        {/* Meta */}
        <div className="text-center min-w-0">
          <div className="text-[13px] sm:text-base font-semibold tabular-nums leading-tight whitespace-nowrap text-foreground/85">
            {hideGoal ? "—" : formatCurrency(goal)}
          </div>
          <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.14em] text-foreground/55 mt-2">
            Meta
          </div>
        </div>
      </div>

      {/* Barra de progresso animada — sweep brilhante */}
      <div
        className="relative w-full h-2.5 rounded-full overflow-hidden"
        style={{ backgroundColor: `${primaryColor}1F` }}
      >
        <div
          className="h-full rounded-full relative overflow-hidden"
          style={{
            width: `${pct}%`,
            transition: "width 0.05s linear",
            backgroundColor: primaryColor,
          }}
        >
          {/* Camada de listras 45° deslizando horizontalmente (E→D) — loop perfeito */}
          <div
            className="absolute inset-y-0 right-0 pointer-events-none progress-stripes-h"
            style={{
              left: "-24px",
              backgroundImage: `repeating-linear-gradient(
                45deg,
                rgba(255,255,255,0.22) 0px,
                rgba(255,255,255,0.22) 7px,
                transparent 7px,
                transparent 14px
              )`,
            }}
          />

          {/* Sweep — listra brilhante varrendo */}
          <div
            className="absolute inset-y-0 w-1/2 pointer-events-none progress-sweep-active"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)",
            }}
          />
        </div>
      </div>

      {/* Porcentagem centralizada abaixo da barra */}
      <div className="flex justify-center mt-3">
        <span
          className="text-sm font-semibold tabular-nums"
          style={{ color: primaryColor }}
        >
          {pctRounded}% da meta
        </span>
      </div>
    </div>
  );
}
