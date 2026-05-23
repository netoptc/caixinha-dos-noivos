import { Gift } from "lucide-react";
import { cn } from "@/lib/utils";

type LogoSize = "sm" | "md" | "lg";

const SIZE_MAP: Record<
  LogoSize,
  {
    icon: string;
    primary: string;
    script: string;
    gap: string;
    stackGap: string;
  }
> = {
  sm: {
    icon: "w-6 h-6",
    primary: "text-sm",
    script: "text-[0.78rem]",
    gap: "gap-1.5",
    stackGap: "-mt-px",
  },
  md: {
    icon: "w-7 h-7",
    primary: "text-base",
    script: "text-[0.95rem]",
    gap: "gap-2",
    stackGap: "-mt-px",
  },
  lg: {
    icon: "w-9 h-9",
    primary: "text-xl",
    script: "text-[1.15rem]",
    gap: "gap-2.5",
    stackGap: "mt-0",
  },
};

interface LogoProps {
  size?: LogoSize;
  iconOnly?: boolean;
  className?: string;
  textClassName?: string;
  interactive?: boolean;
}

export function Logo({
  size = "md",
  iconOnly = false,
  className,
  textClassName,
  interactive = true,
}: LogoProps) {
  const s = SIZE_MAP[size];

  return (
    <span className={cn("inline-flex items-center", s.gap, "group", className)}>
      <Gift
        className={cn(
          s.icon,
          "flex-shrink-0",
          interactive && "transition-transform group-hover:scale-105"
        )}
        style={{ color: "hsl(var(--primary))" }}
        strokeWidth={2.25}
      />
      {!iconOnly && (
        <span
          className={cn("flex flex-col leading-none", textClassName)}
        >
          <span
            className={cn(
              "font-display font-semibold tracking-tight text-foreground",
              s.primary
            )}
          >
            Caixinha
          </span>
          <span
            className={cn(
              "font-script italic font-medium tracking-[0.06em] text-foreground/90",
              s.script,
              s.stackGap
            )}
          >
            dos Noivos
          </span>
        </span>
      )}
    </span>
  );
}
