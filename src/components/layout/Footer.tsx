import Link from "next/link";
import { Heart } from "lucide-react";
import { Logo } from "./Logo";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#fbf7ee] border-t border-border/60 font-sans">
      <div className="container mx-auto px-5 md:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-5">
            <Link href="/" className="inline-flex items-center mb-4 group">
              <Logo size="md" />
            </Link>
            <p className="text-sm text-foreground/65 leading-relaxed max-w-sm">
              A caixinha digital que devolve o grande dia para os noivos. Sem
              gravata, sem lista, sem complicação.
            </p>
          </div>

          <div className="md:col-span-3 md:col-start-7">
            <h4 className="text-sm font-semibold text-foreground mb-4">
              Plataforma
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <FooterLink href="/criar-caixinha">Criar conta</FooterLink>
              </li>
              <li>
                <FooterLink href="/entrar">Entrar</FooterLink>
              </li>
              <li>
                <FooterLink href="/painel">Painel</FooterLink>
              </li>
              <li>
                <FooterLink href="/demo">Ver exemplo</FooterLink>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-sm font-semibold text-foreground mb-4">
              Apoio
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <FooterLink href="/ajuda">Central de ajuda</FooterLink>
              </li>
              <li>
                <FooterLink href="/termos">Termos de uso</FooterLink>
              </li>
              <li>
                <FooterLink href="/privacidade">Privacidade</FooterLink>
              </li>
              <li>
                <FooterLink href="/contato">Contato</FooterLink>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/50 pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <p className="text-xs text-foreground/55">
            © {year} Caixinha dos Noivos. Todos os direitos reservados.
          </p>
          <p className="text-xs text-foreground/55 flex items-center gap-1">
            Feito com{" "}
            <Heart
              className="w-3 h-3 text-primary inline"
              fill="currentColor"
            />{" "}
            para casais que querem curtir cada momento
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-foreground/65 hover:text-primary transition-colors"
    >
      {children}
    </Link>
  );
}
