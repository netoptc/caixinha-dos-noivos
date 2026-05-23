import Link from "next/link";
import { ArrowRight, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fbf7ee] px-6 text-center font-sans">
      <div className="max-w-md flex flex-col items-center gap-6 animate-reveal-up">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "hsl(var(--primary) / 0.15)" }}
        >
          <FileQuestion className="w-7 h-7 text-primary" />
        </div>

        <div>
          <p className="text-xs font-semibold text-primary mb-2">Erro 404</p>
          <h1 className="font-display text-4xl md:text-5xl text-foreground leading-tight">
            Página não encontrada
          </h1>
        </div>

        <p className="text-base text-foreground/65 max-w-sm">
          O endereço que você procurou não existe ou foi movido. Talvez tenha
          sido um erro de digitação.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-base font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          style={{ boxShadow: "0 12px 28px -10px hsl(var(--primary) / 0.5)" }}
        >
          Voltar ao início
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
