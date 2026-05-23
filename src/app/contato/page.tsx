import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Clock, HelpCircle, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Fale com a equipe da Caixinha dos Noivos. Suporte por e-mail com respostas em até 1 dia útil.",
};

const SUPPORT_EMAIL = "contato@caixinhadosnoivos.com.br";

export default function ContatoPage() {
  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    "Contato — Caixinha dos Noivos",
  )}`;

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf7ee] font-sans">
      <Navbar />

      {/* HERO */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, hsl(var(--primary) / 0.18) 0%, hsl(var(--primary) / 0.05) 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(hsl(var(--primary) / 0.15) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative container mx-auto px-5 md:px-8 pt-16 md:pt-24 pb-12 md:pb-16 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-primary/30 mb-6">
            <Mail className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">Contato</span>
          </div>
          <h1 className="font-display text-[clamp(2.25rem,6vw,3.5rem)] leading-[1.1] tracking-tight text-foreground mb-4">
            A gente responde.
          </h1>
          <p className="text-base md:text-lg text-foreground/70 leading-relaxed max-w-xl mx-auto">
            Sem chatbot, sem fila. Nosso time responde por e-mail em até 1 dia
            útil.
          </p>
        </div>
      </section>

      {/* CANAIS */}
      <section className="flex-1">
        <div className="container mx-auto px-5 md:px-8 py-12 md:py-16 max-w-3xl">
          <a
            href={mailto}
            className="group block rounded-3xl bg-white border border-border/60 p-6 md:p-8 hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 transition-all mb-10"
          >
            <span
              className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
              style={{ backgroundColor: "hsl(var(--primary) / 0.12)" }}
            >
              <Mail className="w-5 h-5 text-primary" />
            </span>
            <h3 className="font-display text-xl md:text-2xl text-foreground mb-2">
              E-mail
            </h3>
            <p className="text-sm text-foreground/70 mb-4 leading-relaxed">
              Pra dúvidas, sugestões ou qualquer assunto que precise de mais
              contexto.
            </p>
            <p className="text-sm font-semibold text-primary flex items-center gap-1.5 group-hover:gap-2.5 transition-all break-all">
              {SUPPORT_EMAIL}
              <ArrowRight className="w-4 h-4 flex-shrink-0" />
            </p>
          </a>

          {/* Horário */}
          <div className="rounded-3xl bg-white border border-border/60 p-6 md:p-8 flex items-start md:items-center gap-4 md:gap-5 flex-col md:flex-row mb-6">
            <span
              className="inline-flex items-center justify-center w-12 h-12 rounded-2xl flex-shrink-0"
              style={{ backgroundColor: "hsl(var(--primary) / 0.12)" }}
            >
              <Clock className="w-5 h-5 text-primary" />
            </span>
            <div className="flex-1">
              <h3 className="font-display text-lg md:text-xl text-foreground mb-1">
                Horário de atendimento
              </h3>
              <p className="text-sm text-foreground/70 leading-relaxed">
                Segunda a sexta, das 9h às 18h (horário de Brasília). Mensagens
                fora desse horário são respondidas no próximo dia útil.
              </p>
            </div>
          </div>

          {/* CTA ajuda */}
          <div className="rounded-3xl bg-gradient-to-br from-white to-[#fbf7ee] border border-border/60 p-6 md:p-8 flex items-start md:items-center gap-4 md:gap-5 flex-col md:flex-row">
            <span
              className="inline-flex items-center justify-center w-12 h-12 rounded-2xl flex-shrink-0"
              style={{ backgroundColor: "hsl(var(--primary) / 0.12)" }}
            >
              <HelpCircle className="w-5 h-5 text-primary" />
            </span>
            <div className="flex-1">
              <h3 className="font-display text-lg md:text-xl text-foreground mb-1">
                Antes, dá uma olhada na Central de ajuda
              </h3>
              <p className="text-sm text-foreground/70 leading-relaxed">
                A maioria das dúvidas já tem resposta lá — funcionamento,
                taxas, saques, segurança.
              </p>
            </div>
            <Link
              href="/ajuda"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all flex-shrink-0"
            >
              Ver Central
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
