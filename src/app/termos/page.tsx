import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Mail } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Termos de uso",
  description:
    "Termos de uso da plataforma Caixinha dos Noivos: regras de utilização, responsabilidades e condições do serviço.",
};

const LAST_UPDATE = "22 de maio de 2026";

const sections = [
  {
    title: "1. Aceite dos termos",
    body: (
      <>
        <p>
          Ao criar uma conta ou utilizar a plataforma{" "}
          <strong>Caixinha dos Noivos</strong> (&quot;plataforma&quot;,
          &quot;serviço&quot;, &quot;nós&quot;), você (&quot;usuário&quot;,
          &quot;noivos&quot;) declara ter lido, compreendido e aceito estes
          Termos de uso e a nossa{" "}
          <Link
            href="/privacidade"
            className="text-primary font-semibold hover:underline"
          >
            Política de privacidade
          </Link>
          .
        </p>
        <p>
          Caso não concorde com algum dos termos, você não deve utilizar a
          plataforma.
        </p>
      </>
    ),
  },
  {
    title: "2. Sobre o serviço",
    body: (
      <>
        <p>
          A Caixinha dos Noivos é uma plataforma digital que permite a casais
          criar uma página personalizada para receber contribuições financeiras
          (&quot;doações&quot;) de seus convidados, por meio de pagamento via
          Pix ou cartão de crédito.
        </p>
        <p>
          A plataforma não realiza diretamente o processamento financeiro: as
          transações são operadas por instituição de pagamento autorizada e
          regulada pelo Banco Central do Brasil.
        </p>
      </>
    ),
  },
  {
    title: "3. Cadastro e conta",
    body: (
      <>
        <p>
          Para utilizar o serviço, é necessário criar uma conta com informações
          verdadeiras, completas e atualizadas. Você é responsável por manter a
          confidencialidade da sua senha e por todas as atividades realizadas
          em sua conta.
        </p>
        <p>
          É preciso ter pelo menos 18 anos ou ser legalmente capaz para usar a
          plataforma. Em caso de detecção de fraude, falsidade ou má-fé, a
          conta pode ser suspensa ou encerrada sem aviso prévio.
        </p>
      </>
    ),
  },
  {
    title: "4. Taxas e pagamentos",
    body: (
      <>
        <p>
          A criação e o uso da página são <strong>gratuitos</strong>. As taxas
          são cobradas exclusivamente sobre cada transação processada:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Pix:</strong> 1,99% por doação.
          </li>
          <li>
            <strong>Cartão de crédito:</strong> 4,99% + R$ 0,49 por doação,
            com parcelamento em até 12x sem custo adicional para o noivo.
          </li>
        </ul>
        <p>
          As taxas podem ser atualizadas mediante aviso prévio de 30 dias por
          e-mail. O saldo arrecadado fica disponível para saque por Pix na
          conta bancária cadastrada pelo usuário.
        </p>
      </>
    ),
  },
  {
    title: "5. Responsabilidades do usuário",
    body: (
      <>
        <p>Ao usar a plataforma, você se compromete a:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            Fornecer informações verdadeiras sobre o casal e o evento.
          </li>
          <li>
            Não utilizar a plataforma para fins ilícitos, fraudulentos ou
            contrários à moral e aos bons costumes.
          </li>
          <li>
            Não publicar conteúdo ofensivo, difamatório, obsceno, ou que viole
            direitos de terceiros.
          </li>
          <li>
            Cumprir as obrigações tributárias decorrentes dos valores
            recebidos.
          </li>
          <li>
            Responder pela veracidade dos dados e por eventuais reclamações de
            doadores.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "6. Responsabilidades da plataforma",
    body: (
      <>
        <p>
          Empregamos todos os esforços razoáveis para manter o serviço
          disponível, seguro e funcional. Contudo, não nos responsabilizamos
          por:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            Interrupções decorrentes de manutenção programada, força maior ou
            falhas em serviços de terceiros (gateway, hospedagem, redes).
          </li>
          <li>
            Conteúdo publicado pelos usuários nas suas páginas personalizadas.
          </li>
          <li>
            Decisões e disputas entre noivos e seus convidados.
          </li>
          <li>
            Perda de senha ou acesso indevido decorrente de descuido do
            próprio usuário.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "7. Estornos e chargebacks",
    body: (
      <>
        <p>
          Doações realizadas estão sujeitas às regras dos meios de pagamento.
          Em caso de chargeback, estorno ou contestação de transação por parte
          do doador, o valor correspondente é debitado do saldo do noivo,
          incluindo eventuais taxas aplicáveis pelo adquirente.
        </p>
      </>
    ),
  },
  {
    title: "8. Propriedade intelectual",
    body: (
      <>
        <p>
          A marca, o nome, o layout, os textos, o código e demais elementos da
          plataforma são de propriedade da Caixinha dos Noivos e protegidos
          pelas leis de direitos autorais e marcas. É vedada qualquer
          reprodução, total ou parcial, sem autorização expressa.
        </p>
        <p>
          As fotos e textos enviados pelos noivos permanecem de propriedade dos
          mesmos. Ao publicá-los na plataforma, você concede uma licença não
          exclusiva para exibi-los na sua página enquanto a caixinha estiver
          ativa.
        </p>
      </>
    ),
  },
  {
    title: "9. Encerramento da conta",
    body: (
      <>
        <p>
          Você pode encerrar sua conta a qualquer momento, sacando o saldo
          disponível. Reservamo-nos o direito de suspender ou encerrar contas
          que violem estes Termos, sem prejuízo dos saldos legitimamente
          devidos ao usuário.
        </p>
      </>
    ),
  },
  {
    title: "10. Alterações dos termos",
    body: (
      <>
        <p>
          Podemos atualizar estes Termos a qualquer momento. Mudanças
          relevantes são comunicadas por e-mail com pelo menos 15 dias de
          antecedência. O uso contínuo da plataforma após a vigência implica
          aceite da nova versão.
        </p>
      </>
    ),
  },
  {
    title: "11. Legislação e foro",
    body: (
      <>
        <p>
          Estes Termos são regidos pelas leis da República Federativa do
          Brasil. Fica eleito o foro da comarca do domicílio do usuário para
          dirimir quaisquer controvérsias.
        </p>
      </>
    ),
  },
  {
    title: "12. Contato",
    body: (
      <>
        <p>
          Dúvidas, sugestões ou solicitações relacionadas a estes Termos podem
          ser enviadas para{" "}
          <a
            href="mailto:contato@caixinhadosnoivos.com.br"
            className="text-primary font-semibold hover:underline"
          >
            contato@caixinhadosnoivos.com.br
          </a>{" "}
          ou pelo nosso{" "}
          <Link
            href="/contato"
            className="text-primary font-semibold hover:underline"
          >
            canal de contato
          </Link>
          .
        </p>
      </>
    ),
  },
];

export default function TermosPage() {
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
            <FileText className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">Termos de uso</span>
          </div>
          <h1 className="font-display text-[clamp(2.25rem,6vw,3.5rem)] leading-[1.1] tracking-tight text-foreground mb-4">
            Sem letras pequenas.
          </h1>
          <p className="text-base md:text-lg text-foreground/70 leading-relaxed max-w-xl mx-auto">
            As regras que regulam o uso da Caixinha dos Noivos. Direto ao
            ponto.
          </p>
          <p className="text-xs text-foreground/55 mt-4">
            Última atualização: {LAST_UPDATE}
          </p>
        </div>
      </section>

      {/* CONTEÚDO */}
      <section className="flex-1">
        <div className="container mx-auto px-5 md:px-8 py-12 md:py-16 max-w-3xl">
          <article className="rounded-3xl bg-white border border-border/60 p-6 md:p-10 space-y-10">
            {sections.map((s) => (
              <section key={s.title}>
                <h2 className="font-display text-xl md:text-2xl text-foreground mb-3">
                  {s.title}
                </h2>
                <div className="text-sm md:text-base text-foreground/75 leading-relaxed space-y-3">
                  {s.body}
                </div>
              </section>
            ))}
          </article>

          {/* Rodapé info */}
          <div className="mt-10 flex items-center justify-center gap-2 text-xs text-foreground/55">
            <Mail className="w-3.5 h-3.5" />
            <span>
              Dúvidas?{" "}
              <Link
                href="/contato"
                className="text-primary font-semibold hover:underline"
              >
                Fale com a gente
              </Link>
            </span>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
