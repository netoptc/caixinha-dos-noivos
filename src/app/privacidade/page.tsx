import type { Metadata } from "next";
import Link from "next/link";
import { Lock, Mail } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description:
    "Como a Caixinha dos Noivos coleta, usa e protege seus dados pessoais — em conformidade com a LGPD.",
};

const LAST_UPDATE = "22 de maio de 2026";

const sections = [
  {
    title: "1. Quem somos",
    body: (
      <>
        <p>
          A <strong>Caixinha dos Noivos</strong> é a controladora dos dados
          pessoais tratados pela plataforma. Esta Política descreve como
          coletamos, usamos, armazenamos e protegemos seus dados, em
          conformidade com a <strong>Lei nº 13.709/2018 (LGPD)</strong>.
        </p>
      </>
    ),
  },
  {
    title: "2. Dados que coletamos",
    body: (
      <>
        <p>Coletamos as seguintes categorias de dados pessoais:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Dados cadastrais (noivos):</strong> nome completo, e-mail,
            telefone, CPF, data do casamento, foto, dados bancários para
            saque.
          </li>
          <li>
            <strong>Dados de doadores:</strong> nome (opcional), e-mail
            (opcional), recado, valor doado, forma de pagamento.
          </li>
          <li>
            <strong>Dados de navegação:</strong> endereço IP, tipo de
            dispositivo, navegador, páginas acessadas, cookies.
          </li>
          <li>
            <strong>Dados de pagamento:</strong> tratados diretamente pelo
            gateway de pagamento certificado PCI-DSS — não armazenamos dados
            sensíveis de cartão.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "3. Como usamos seus dados",
    body: (
      <>
        <p>Utilizamos os dados pessoais para as seguintes finalidades:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            Criar e manter sua conta, exibir sua página personalizada e
            processar doações recebidas.
          </li>
          <li>
            Comunicar atualizações, novidades, alertas de segurança e suporte.
          </li>
          <li>
            Cumprir obrigações legais, regulatórias e fiscais.
          </li>
          <li>
            Prevenir fraudes, abusos e atividades ilícitas.
          </li>
          <li>
            Melhorar a experiência e funcionalidades da plataforma (analytics
            agregado).
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "4. Base legal",
    body: (
      <>
        <p>O tratamento dos dados se apoia nas seguintes bases legais da LGPD:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Execução de contrato</strong> (art. 7º, V) — para prestação
            do serviço.
          </li>
          <li>
            <strong>Cumprimento de obrigação legal</strong> (art. 7º, II) —
            obrigações fiscais e regulatórias.
          </li>
          <li>
            <strong>Legítimo interesse</strong> (art. 7º, IX) — prevenção a
            fraudes, segurança e melhorias.
          </li>
          <li>
            <strong>Consentimento</strong> (art. 7º, I) — comunicações de
            marketing, quando aplicável.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "5. Compartilhamento de dados",
    body: (
      <>
        <p>Compartilhamos dados pessoais apenas quando estritamente necessário:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Gateway de pagamento</strong> — para processar transações
            (Pix e cartão).
          </li>
          <li>
            <strong>Provedores de infraestrutura</strong> — hospedagem,
            armazenamento de imagens, envio de e-mail.
          </li>
          <li>
            <strong>Autoridades públicas</strong> — quando exigido por lei,
            decisão judicial ou para defesa de direitos.
          </li>
        </ul>
        <p>
          Não vendemos, alugamos nem cedemos seus dados pessoais para
          terceiros com finalidades comerciais.
        </p>
      </>
    ),
  },
  {
    title: "6. Armazenamento e segurança",
    body: (
      <>
        <p>
          Os dados são armazenados em servidores localizados no Brasil ou em
          países com nível adequado de proteção, com medidas técnicas e
          organizacionais para garantir a segurança:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Criptografia em trânsito (TLS 1.3) e em repouso.</li>
          <li>Controle de acesso baseado em função (RBAC).</li>
          <li>Backups periódicos e segregados.</li>
          <li>Monitoramento contínuo e auditoria de eventos.</li>
        </ul>
        <p>
          Apesar do nosso empenho, nenhum sistema é 100% imune a falhas. Em
          caso de incidente envolvendo dados pessoais, notificaremos a ANPD e
          os titulares afetados conforme determina a LGPD.
        </p>
      </>
    ),
  },
  {
    title: "7. Prazo de retenção",
    body: (
      <>
        <p>
          Mantemos os dados pessoais pelo tempo necessário ao cumprimento das
          finalidades descritas, observando os prazos legais aplicáveis:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            Dados cadastrais: enquanto a conta estiver ativa, e por até 5 anos
            após o encerramento (obrigações tributárias).
          </li>
          <li>
            Dados de transações: 10 anos (legislação fiscal e contábil).
          </li>
          <li>
            Dados de navegação e cookies: até 12 meses.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "8. Seus direitos (LGPD)",
    body: (
      <>
        <p>Como titular dos dados, você pode, a qualquer momento:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Confirmar a existência de tratamento dos seus dados.</li>
          <li>Acessar seus dados pessoais.</li>
          <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
          <li>
            Solicitar a anonimização, bloqueio ou eliminação de dados
            desnecessários ou excessivos.
          </li>
          <li>Solicitar a portabilidade dos seus dados.</li>
          <li>
            Revogar o consentimento, quando o tratamento for baseado nele.
          </li>
          <li>
            Informações sobre as entidades com as quais compartilhamos seus
            dados.
          </li>
        </ul>
        <p>
          Para exercer qualquer um desses direitos, escreva para{" "}
          <a
            href="mailto:privacidade@caixinhadosnoivos.com.br"
            className="text-primary font-semibold hover:underline"
          >
            privacidade@caixinhadosnoivos.com.br
          </a>
          .
        </p>
      </>
    ),
  },
  {
    title: "9. Cookies",
    body: (
      <>
        <p>
          Utilizamos cookies essenciais (necessários ao funcionamento da
          plataforma, como sessão e autenticação) e cookies de medição
          (analytics agregado, anônimo). Você pode gerenciar os cookies pelas
          configurações do seu navegador, mas a desativação de cookies
          essenciais pode comprometer o uso da plataforma.
        </p>
      </>
    ),
  },
  {
    title: "10. Crianças e adolescentes",
    body: (
      <>
        <p>
          A plataforma é destinada exclusivamente a maiores de 18 anos. Não
          coletamos intencionalmente dados de menores. Caso identifiquemos
          esse tipo de tratamento, excluiremos os registros imediatamente.
        </p>
      </>
    ),
  },
  {
    title: "11. Alterações desta política",
    body: (
      <>
        <p>
          Podemos atualizar esta Política periodicamente. Mudanças
          significativas são comunicadas por e-mail e/ou destaque na
          plataforma com pelo menos 15 dias de antecedência. A versão vigente
          é sempre a publicada nesta página.
        </p>
      </>
    ),
  },
  {
    title: "12. Encarregado pelos dados (DPO)",
    body: (
      <>
        <p>
          Para tratar de questões relativas a dados pessoais, entre em contato
          com nosso encarregado:
        </p>
        <p>
          E-mail:{" "}
          <a
            href="mailto:privacidade@caixinhadosnoivos.com.br"
            className="text-primary font-semibold hover:underline"
          >
            privacidade@caixinhadosnoivos.com.br
          </a>
        </p>
      </>
    ),
  },
];

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fbf7ee] font-sans">
      <Navbar />

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
            <Lock className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">
              Política de privacidade
            </span>
          </div>
          <h1 className="font-display text-[clamp(2.25rem,6vw,3.5rem)] leading-[1.1] tracking-tight text-foreground mb-4">
            Seus dados sob controle.
          </h1>
          <p className="text-base md:text-lg text-foreground/70 leading-relaxed max-w-xl mx-auto">
            Como tratamos suas informações, em conformidade com a LGPD.
          </p>
          <p className="text-xs text-foreground/55 mt-4">
            Última atualização: {LAST_UPDATE}
          </p>
        </div>
      </section>

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
