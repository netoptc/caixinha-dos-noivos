import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Heart,
  TrendingUp,
  Users,
  Video,
  CreditCard,
  Link2,
  UserPlus,
  Palette,
  Share2,
  Star,
  Check,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/painel");
  return (
    <div className="min-h-screen flex flex-col bg-[#fbf7ee] font-sans">
      <Navbar />

      {/* ============== HERO ============== */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, hsl(var(--primary) / 0.18) 0%, hsl(var(--primary) / 0.05) 100%)",
        }}
      >
        {/* Padrão de pontos sutil */}
        <div
          className="absolute inset-0 opacity-50 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(hsl(var(--primary) / 0.15) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative container mx-auto px-5 md:px-8 pt-20 md:pt-28 pb-20 md:pb-28">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-primary/30 mb-8 animate-fade-in">
              <Heart className="w-3.5 h-3.5 text-primary" fill="currentColor" />
              <span className="text-xs font-semibold text-primary">
                Caixinha de casamento digital
              </span>
            </div>

            <h1 className="font-display text-[clamp(2.5rem,7vw,4.5rem)] leading-[1.05] tracking-tight text-foreground mb-6 animate-reveal-up">
              O grande dia
              <br />
              merece leveza.
            </h1>

            <p className="text-lg md:text-xl text-foreground/70 leading-relaxed max-w-2xl mx-auto mb-10 animate-fade-in [animation-delay:200ms]">
              Crie uma página com a identidade do seu casamento e receba
              contribuições por Pix ou cartão — até parcelado. Sem gravata, sem
              lista, sem interrupção no meio da festa.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in [animation-delay:400ms]">
              <Link
                href="/criar-caixinha"
                className="group inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-2xl text-base font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                style={{ boxShadow: "0 12px 28px -10px hsl(var(--primary) / 0.5)" }}
              >
                Criar minha caixinha
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-white/80 border border-border text-foreground px-8 py-4 rounded-2xl text-base font-semibold transition-colors"
              >
                Ver exemplo
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 md:mt-20 grid grid-cols-3 gap-6 md:gap-12 max-w-2xl mx-auto animate-fade-in [animation-delay:600ms]">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="font-display text-3xl md:text-4xl text-foreground tabular-nums tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-xs text-foreground/55 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============== FEATURES ============== */}
      <section id="features" className="relative bg-white border-y border-border/60">
        <div className="container mx-auto px-5 md:px-8 py-20 md:py-28">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-display text-4xl md:text-5xl leading-[1.1] text-foreground mb-4">
              Tudo no lugar certo. Vocês no centro da festa.
            </h2>
            <p className="text-lg text-foreground/70 leading-relaxed">
              Sem listas, sem gravata, sem correria. A caixinha resolve a
              logística enquanto vocês curtem o dia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="bg-[#fbf7ee] rounded-2xl border border-border/60 p-7 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: "hsl(var(--primary) / 0.15)" }}
                >
                  <feature.icon
                    className="w-6 h-6"
                    style={{ color: "hsl(var(--primary))" }}
                  />
                </div>
                <h3 className="font-display text-xl text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-foreground/70 leading-relaxed">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============== HOW IT WORKS ============== */}
      <section id="como-funciona" className="relative">
        <div className="container mx-auto px-5 md:px-8 py-20 md:py-28">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-display text-4xl md:text-5xl leading-[1.1] text-foreground mb-4">
              Em 3 passos. Em poucos minutos.
            </h2>
            <p className="text-lg text-foreground/70 leading-relaxed">
              Da criação ao primeiro presente: o caminho mais curto até vocês
              poderem só curtir.
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={step.title} className="relative text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-md"
                  style={{
                    backgroundColor: "hsl(var(--primary))",
                    boxShadow: "0 12px 24px -10px hsl(var(--primary) / 0.4)",
                  }}
                >
                  <step.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+3rem)] right-[calc(-50%+3rem)] h-px bg-border" />
                )}
                <div className="text-xs font-semibold text-primary mb-2">
                  Passo {index + 1}
                </div>
                <h3 className="font-display text-xl text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-foreground/70 leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== CTA / GRATUITO ============== */}
      <section className="relative">
        <div className="container mx-auto px-5 md:px-8 pb-20 md:pb-28">
          <div
            className="relative overflow-hidden rounded-3xl p-10 md:p-16 text-center max-w-4xl mx-auto"
            style={{
              background:
                "linear-gradient(160deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.85) 100%)",
            }}
          >
            {/* Padrão de pontos no CTA */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />

            <div className="relative">
              <h2 className="font-display text-[clamp(1.75rem,7vw,2.25rem)] md:text-5xl leading-[1.15] md:leading-[1.05] text-primary-foreground mb-10 text-balance">
                Sem constrangimento. Sem complicação. Sem interrupção.
              </h2>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 mb-10 max-w-2xl mx-auto text-left">
                {benefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-start gap-2.5 text-sm text-primary-foreground"
                  >
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                    </div>
                    {benefit}
                  </li>
                ))}
              </ul>

              <Link
                href="/criar-caixinha"
                className="group inline-flex items-center justify-center gap-2 bg-white hover:bg-white/90 text-primary px-8 py-4 rounded-2xl text-base font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Criar minha caixinha
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============== TESTIMONIALS ============== */}
      <section className="relative bg-white border-t border-border/60">
        <div className="container mx-auto px-5 md:px-8 py-20 md:py-28">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-display text-4xl md:text-5xl leading-[1.1] text-foreground mb-4">
              Casais que viveram cada momento.
            </h2>
            <p className="text-lg text-foreground/70 leading-relaxed">
              Histórias de quem trocou logística por presença.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {testimonials.map((t) => (
              <article
                key={t.name}
                className="bg-[#fbf7ee] rounded-2xl border border-border/60 p-7 transition-all duration-300 hover:shadow-lg"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4"
                      style={{ color: "hsl(var(--primary))" }}
                      fill="currentColor"
                    />
                  ))}
                </div>
                <p className="text-base text-foreground/80 leading-relaxed mb-5">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="border-t border-border/60 pt-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">
                    {t.name}
                  </p>
                  <p className="text-xs text-foreground/55">{t.location}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

const stats = [
  { value: "500+", label: "Casamentos celebrados" },
  { value: "R$ 2M", label: "Já recebidos pelos noivos" },
  { value: "98%", label: "Satisfação dos casais" },
];

const features = [
  {
    icon: Heart,
    title: "Página personalizada",
    description:
      "Cores, foto, nomes e história — tudo com a identidade de vocês. Cada caixinha é única, como o casamento que ela celebra.",
  },
  {
    icon: TrendingUp,
    title: "Meta de arrecadação",
    description:
      "Defina o quanto querem juntar e acompanhe a barra crescer em tempo real, a cada gesto de carinho.",
  },
  {
    icon: Users,
    title: "Ranking de doadores",
    description:
      "Os convidados mais generosos ganham destaque com medalhas — uma forma elegante de agradecer sem passar a gravata.",
  },
  {
    icon: Video,
    title: "Mensagens em vídeo",
    description:
      "Convidados gravam recados curtos que ficam guardados como pequenas memórias do grande dia.",
  },
  {
    icon: CreditCard,
    title: "Pix e cartão",
    description:
      "Aceite Pix e cartão de crédito, até parcelado. A taxa fica com quem doa — vocês recebem o valor cheio.",
  },
  {
    icon: Link2,
    title: "Link único",
    description:
      "Compartilhe um endereço próprio no WhatsApp, no Instagram e no convite digital. Os convidados contribuem de onde estiverem.",
  },
];

const steps = [
  {
    icon: UserPlus,
    title: "Crie sua conta",
    description: "Cadastro em menos de um minuto. Só e-mail e senha.",
  },
  {
    icon: Palette,
    title: "Personalize a caixinha",
    description:
      "Coloque nomes, foto, cores e meta. A página fica pronta na hora, com a cara de vocês.",
  },
  {
    icon: Share2,
    title: "Compartilhe e receba",
    description:
      "Envie o link aos convidados e acompanhe cada contribuição em tempo real.",
  },
];

const benefits = [
  "Página com a identidade do seu casamento",
  "Link único para WhatsApp, Instagram e convite",
  "Pix e cartão de crédito (até parcelado)",
  "Mensagens e vídeos dos convidados",
  "Acompanhamento em tempo real",
  "Ranking de doadores com medalhas",
  "Sem taxa de criação ou mensalidade",
  "Suporte humano e dedicado",
];

const testimonials = [
  {
    text: "Conseguimos arrecadar mais de R$ 15.000 em menos de uma semana. Os vídeos dos convidados foram emocionantes.",
    name: "Ana e Pedro",
    location: "São Paulo",
  },
  {
    text: "Muito fácil de configurar. Os convidados adoraram a experiência, e nossa página ficou no estilo do nosso casamento.",
    name: "Carla e Marcos",
    location: "Rio de Janeiro",
  },
  {
    text: "O ranking dos doadores criou uma competição saudável. A meta foi superada em três dias.",
    name: "Julia e Rafael",
    location: "Curitiba",
  },
];
