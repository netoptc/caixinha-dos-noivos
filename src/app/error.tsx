"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fbf7ee] px-6 text-center font-sans">
      <div className="max-w-md flex flex-col items-center gap-6 animate-reveal-up">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "hsl(var(--destructive) / 0.12)" }}
        >
          <AlertCircle className="w-7 h-7 text-destructive" />
        </div>

        <div>
          <p className="text-xs font-semibold text-destructive mb-2">Imprevisto</p>
          <h1 className="font-display text-3xl md:text-4xl text-foreground leading-tight">
            Algo não deu certo
          </h1>
        </div>

        <p className="text-base text-foreground/65 max-w-sm">
          Tivemos um problema ao carregar esta página. Pode ser temporário —
          tente novamente em um instante.
        </p>

        {error.digest && (
          <p className="text-xs text-foreground/45 font-mono">
            ref: {error.digest}
          </p>
        )}

        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-base font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          style={{ boxShadow: "0 12px 28px -10px hsl(var(--primary) / 0.5)" }}
        >
          <RotateCw className="w-4 h-4" />
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
