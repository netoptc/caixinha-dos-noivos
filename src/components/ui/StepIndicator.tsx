"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_PRIMARY_COLOR } from "@/lib/theme-swatches";

export interface StepIndicatorItem {
  id: string | number;
  label: string;
}

interface StepIndicatorProps {
  steps: readonly StepIndicatorItem[];
  currentIndex: number;
  primaryColor?: string;
  className?: string;
}

export function StepIndicator({
  steps,
  currentIndex,
  primaryColor = DEFAULT_PRIMARY_COLOR,
  className,
}: StepIndicatorProps) {
  const total = steps.length;
  if (total === 0) return null;

  return (
    <div className={cn("flex w-full items-start", className)}>
      {steps.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const reached = done || active;

        return (
          <div
            key={step.id}
            className="flex min-w-0 flex-1 flex-col items-center"
          >
            <div className="relative flex w-full items-center justify-center">
              {i > 0 && (
                <span
                  aria-hidden
                  className="absolute left-0 right-1/2 top-1/2 h-0.5 -translate-y-1/2 transition-colors duration-300"
                  style={{
                    backgroundColor:
                      i <= currentIndex
                        ? primaryColor
                        : "hsl(var(--border))",
                  }}
                />
              )}
              {i < total - 1 && (
                <span
                  aria-hidden
                  className="absolute left-1/2 right-0 top-1/2 h-0.5 -translate-y-1/2 transition-colors duration-300"
                  style={{
                    backgroundColor:
                      i < currentIndex
                        ? primaryColor
                        : "hsl(var(--border))",
                  }}
                />
              )}

              <div
                className={cn(
                  "relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-300",
                  !reached && "border bg-background",
                )}
                style={{
                  backgroundColor: reached ? primaryColor : undefined,
                  color: reached ? "#fff" : "hsl(var(--muted-foreground))",
                  borderColor: !reached ? "hsl(var(--border))" : undefined,
                }}
              >
                {done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
              </div>
            </div>

            <span
              className={cn(
                "mt-2 max-w-full truncate px-1 text-center text-[0.7rem] font-semibold transition-colors duration-300",
                !reached && "text-muted-foreground",
                done && "text-foreground/80",
              )}
              style={{
                color: active ? primaryColor : undefined,
              }}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
