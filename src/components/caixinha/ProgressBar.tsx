"use client";

import { useEffect, useState } from "react";
import { formatCurrency, calculateProgress } from "@/lib/utils";

interface ProgressBarProps {
  raised: number;
  goal: number;
  primaryColor?: string;
  /** Quando false, mostra apenas a porcentagem (sem R$ arrecadado/meta/faltam) */
  showAmounts?: boolean;
}

export function ProgressBar({
  raised,
  goal,
  primaryColor = "#b8851f",
  showAmounts = true,
}: ProgressBarProps) {
  const target = calculateProgress(raised, goal);
  const [pct, setPct] = useState(0);
  const [raisedDisplay, setRaisedDisplay] = useState(0);

  useEffect(() => {
    const start = setTimeout(() => {
      const duration = 1100;
      const startTime = performance.now();

      function tick(now: number) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setPct(eased * target);
        setRaisedDisplay(Math.round(eased * raised));
        if (progress < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    }, 150);

    return () => clearTimeout(start);
  }, [target, raised]);

  const remaining = Math.max(0, goal - raised);

  return (
    <div className="w-full">
      {showAmounts ? (
        <div className="flex justify-between items-baseline mb-5">
          <span
            className="font-display text-3xl tabular-nums tracking-tight"
            style={{ color: primaryColor }}
          >
            {formatCurrency(raisedDisplay)}
          </span>
          <span className="text-base text-foreground/70 tabular-nums">
            {formatCurrency(goal)}
          </span>
        </div>
      ) : (
        <div className="text-center mb-5">
          <span
            className="font-display text-4xl tabular-nums tracking-tight"
            style={{ color: primaryColor }}
          >
            {Math.round(pct)}%
          </span>
          <p className="text-sm text-foreground/60 mt-1">do caminho percorrido</p>
        </div>
      )}

      {/* Thick bar with shimmer */}
      <div
        className="relative w-full h-3 rounded-full overflow-hidden"
        style={{ backgroundColor: `${primaryColor}1F` }}
      >
        <div
          className="h-full rounded-full relative overflow-hidden"
          style={{
            width: `${pct}%`,
            backgroundColor: primaryColor,
            transition: "width 0.05s linear",
          }}
        >
          {/* Shimmer overlay */}
          <div
            className="absolute inset-0 -skew-x-12"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
              animation: "shimmer 2.4s linear infinite",
            }}
          />
        </div>
      </div>

      {showAmounts && (
        <div className="flex justify-between items-baseline mt-4">
          <span
            className="text-sm font-semibold tabular-nums"
            style={{ color: primaryColor }}
          >
            {Math.round(pct)}% alcançado
          </span>
          <span className="text-sm tabular-nums text-foreground/60">
            Faltam {formatCurrency(remaining)}
          </span>
        </div>
      )}
    </div>
  );
}
