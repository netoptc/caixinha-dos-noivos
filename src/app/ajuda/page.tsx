import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronDown,
  HelpCircle,
  CreditCard,
  Banknote,
  ShieldCheck,
  Settings,
  Mail,
  ArrowRight,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { formatMinDonationAmount } from "@/lib/donation-limits";

const MIN_DONATION_LABEL = formatMinDonationAmount();

export const metadata: Metadata = {
  title: "Central de ajuda",
  description:
    "Tire dúvidas sobre como criar sua caixinha, receber doações, taxas, saques e segurança.",
};

const categories = [
  {
    icon: HelpCircle,
    title: "Começando",
    items: [
      {
        q: "Como funciona a Caixinha dos Noivos?",
        a: "Vocês criam uma página personalizada para o casamento, compartilham o link com os convidados e recebem contribuições por Pix ou cartão de crédito. O saldo fica disponível para saque na sua conta bancária.",
      },
      {
        q: "Quanto custa criar uma caixinha?",
        a: "Criar a página é totalmente gratuito. Não há mensalidade, taxa de adesão nem letras pequenas. Cobramos apenas uma taxa por transação paga pelo convidado no momento da doação.",
      },
      {
        q: "Quanto tempo leva pra colocar a página no ar?",
        a: "Menos de 5 minutos. Você escolhe o nome do casal, faz upload de uma foto, define a meta e o link já fica ativo pra compartilhar.",
      },
      {
        q: "Posso personalizar a aparência da página?",
        a: "Sim. Você escolhe a cor principal, a foto do casal, o texto de boas-vindas e o slug do link (ex.: caixinha.com.br/joao-e-maria).",
      },
    ],
  },
  {
    icon: CreditCard,
    title: "Pagamentos e doações",
    items: [
      {
        q: "Quais formas de pagamento os convidados podem usar?",
        a: "Pix (com confirmação imediata) e cartão de crédito (parcelado em até 12x). Toda a operação financeira é processada com criptografia e em conformidade com o PCI-DSS.",
      },
      {
        q: "Qual o valor mínimo de uma doação?",
        a: `${MIN_DONATION_LABEL}. Não há valor máximo — o convidado pode contribuir com o que quiser.`,
      },
      {
        q: "O convidado precisa criar uma conta pra doar?",
        a: "Não. Ele acessa o link, escolhe o valor, opcionalmente deixa um recado e finaliza o pagamento. Tudo em uma página única e rápida.",
      },
      {
        q: "Posso ver quem doou?",
        a: "Sim. Em tempo real, no painel, você acompanha cada doação com nome do convidado, valor, recado e forma de pagamento.",
      },
    ],
  },
  {
    icon: Banknote,
    title: "Saques e taxas",
    items: [
      {
        q: "Como saco o dinheiro arrecadado?",
        a: "Pelo painel, você solicita o saque por Pix para a conta bancária cadastrada. O valor cai em até 1 dia útil após a solicitação.",
      },
      {
        q: "Existe um valor mínimo para saque?",
        a: "Não. Você pode sacar qualquer valor disponível, quantas vezes quiser. Não há taxa de saque.",
      },
      {
        q: "Quais são as taxas cobradas?",
        a: "Pix: 1,99% por doação. Cartão de crédito: 4,99% + R$ 0,49 por doação (parcelamento em até 12x sem custo extra). As taxas são abatidas no momento da doação — o valor líquido cai na sua conta.",
      },
      {
        q: "Em quanto tempo o valor fica disponível?",
        a: "Doações por Pix ficam disponíveis na hora. Doações por cartão liberam em D+1 (antecipação automática).",
      },
    ],
  },
  {
    icon: ShieldCheck,
    title: "Segurança",
    items: [
      {
        q: "Meus dados estão seguros?",
        a: "Sim. Todos os dados são criptografados em trânsito (TLS 1.3) e em repouso. Não armazenamos dados de cartão — eles ficam apenas com o gateway certificado PCI-DSS.",
      },
      {
        q: "E se acontecer algum problema com uma doação?",
        a: "Entre em contato pelo suporte. Casos de chargeback ou estorno são tratados conforme as regras do meio de pagamento, e você é notificado por e-mail.",
      },
      {
        q: "Vocês compartilham meus dados com terceiros?",
        a: "Não. Compartilhamos apenas com o gateway de pagamento (necessário pra processar transações) e quando exigido por lei. Detalhes na nossa Política de privacidade.",
      },
    ],
  },
  {
    icon: Settings,
    title: "Conta e configurações",
    items: [
      {
        q: "Posso editar a página depois de criar?",
        a: "Sim. Você pode alterar foto, cor, texto, meta e slug a qualquer momento pelo painel — as mudanças aparecem na hora pros visitantes.",
      },
      {
        q: "Como funciona a privacidade da página?",
        a: "Por padrão, a página é pública (qualquer pessoa com o link acessa). Você pode marcar como não-listada (não aparece em buscas internas) ou ocultar a meta de arrecadação.",
      },
      {
        q: "Posso encerrar a caixinha e pegar o saldo?",
        a: "Sim. A qualquer momento você saca o saldo restante e arquiva a página — o link continua acessível mas as doações ficam bloqueadas.",
      },
      {
        q: "Esqueci minha senha. E agora?",
        a: 'Use o link "Esqueci minha senha" na tela de login. Você recebe um e-mail com instruções pra criar uma nova senha em menos de 1 minuto.',
      },
    ],
  },
];

export default function AjudaPage() {
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
        <div className="relative container mx-auto px-5 md:px-8 pt-16 md:pt-24 pb-12 md:pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-primary/30 mb-6">
            <HelpCircle className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">
              Central de ajuda
            </span>
          </div>
          <h1 className="font-display text-[clamp(2.25rem,6vw,3.5rem)] leading-[1.1] tracking-tight text-foreground mb-4">
            Como podemos ajudar?
          </h1>
          <p className="text-base md:text-lg text-foreground/70 leading-relaxed max-w-xl mx-auto">
            Respostas pras dúvidas mais comuns sobre criar a caixinha, receber
            doações, taxas e saques.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="flex-1">
        <div className="container mx-auto px-5 md:px-8 py-16 md:py-20 max-w-3xl">
          <div className="space-y-12">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.title}>
                  <div className="flex items-center gap-3 mb-5">
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor: "hsl(var(--primary) / 0.12)",
                      }}
                    >
                      <Icon className="w-5 h-5 text-primary" />
                    </span>
                    <h2 className="font-display text-2xl md:text-3xl text-foreground">
                      {cat.title}
                    </h2>
                  </div>
                  <div className="space-y-2">
                    {cat.items.map((item) => (
                      <details
                        key={item.q}
                        className="group rounded-2xl bg-white border border-border/60 transition-colors open:border-primary/40 open:shadow-sm"
                      >
                        <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                          <span className="text-sm md:text-base font-semibold text-foreground pr-2">
                            {item.q}
                          </span>
                          <ChevronDown className="w-4 h-4 flex-shrink-0 text-foreground/55 transition-transform group-open:rotate-180" />
                        </summary>
                        <div className="px-5 pb-5 pt-0 text-sm md:text-base text-foreground/70 leading-relaxed">
                          {item.a}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA contato */}
          <div className="mt-16 md:mt-20 rounded-3xl bg-white border border-border/60 p-8 md:p-10 text-center">
            <span
              className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
              style={{ backgroundColor: "hsl(var(--primary) / 0.12)" }}
            >
              <Mail className="w-5 h-5 text-primary" />
            </span>
            <h3 className="font-display text-2xl md:text-3xl text-foreground mb-2">
              Não achou o que procurava?
            </h3>
            <p className="text-sm md:text-base text-foreground/70 mb-6 max-w-md mx-auto">
              Nossa equipe responde por e-mail em até 1 dia útil. Sem chatbot,
              sem fila.
            </p>
            <Link
              href="/contato"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-2xl text-sm font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
              style={{
                boxShadow: "0 8px 16px -6px hsl(var(--primary) / 0.4)",
              }}
            >
              Falar com o suporte
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
