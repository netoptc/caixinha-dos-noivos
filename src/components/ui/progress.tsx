import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  color?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, color, showLabel = false, size = "md", ...props }, ref) => {
    const heights = {
      sm: "h-2",
      md: "h-3",
      lg: "h-4",
    };

    return (
      <div
        ref={ref}
        className={cn("w-full", className)}
        {...props}
      >
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-full bg-gray-200",
            heights[size]
          )}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700 ease-out",
              !color && "bg-primary"
            )}
            style={{
              width: `${Math.min(100, Math.max(0, value))}%`,
              backgroundColor: color || undefined,
            }}
          />
        </div>
        {showLabel && (
          <div className="mt-1 text-right text-xs text-muted-foreground">
            {Math.round(value)}%
          </div>
        )}
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress };
