"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";

export function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-[#fbf7ee]/85 backdrop-blur-md border-b border-border/60 font-sans">
      <div className="container mx-auto px-5 md:px-8">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <Logo size="md" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink href="/#como-funciona">Como funciona</NavLink>
            <NavLink href="/#features">Recursos</NavLink>
            {session ? (
              <>
                <NavLink href="/painel">Painel</NavLink>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-sm text-foreground/65 hover:text-foreground transition-colors"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <NavLink href="/entrar">Entrar</NavLink>
                <Link
                  href="/criar-caixinha"
                  className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full text-primary-foreground bg-primary hover:bg-primary/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                  style={{
                    boxShadow: "0 8px 16px -6px hsl(var(--primary) / 0.4)",
                  }}
                >
                  Criar caixinha
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-foreground/70 hover:text-foreground"
            aria-label="menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border/60 bg-[#fbf7ee] animate-fade-in">
          <div className="container mx-auto px-5 py-6 flex flex-col gap-5">
            <Link
              href="/#como-funciona"
              className="text-base text-foreground/80"
              onClick={() => setMenuOpen(false)}
            >
              Como funciona
            </Link>
            <Link
              href="/#features"
              className="text-base text-foreground/80"
              onClick={() => setMenuOpen(false)}
            >
              Recursos
            </Link>
            {session ? (
              <>
                <Link
                  href="/painel"
                  className="text-base text-foreground/80"
                  onClick={() => setMenuOpen(false)}
                >
                  Painel
                </Link>
                <button
                  onClick={() => {
                    signOut({ callbackUrl: "/" });
                    setMenuOpen(false);
                  }}
                  className="text-left text-base text-foreground/80"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/entrar"
                  className="text-base text-foreground/80"
                  onClick={() => setMenuOpen(false)}
                >
                  Entrar
                </Link>
                <Link
                  href="/criar-caixinha"
                  className="inline-flex items-center justify-center gap-2 text-base font-semibold w-full px-5 py-3 rounded-full text-primary-foreground bg-primary"
                  onClick={() => setMenuOpen(false)}
                >
                  Criar caixinha
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="relative text-sm text-foreground/65 hover:text-foreground transition-colors after:absolute after:left-0 after:-bottom-1 after:h-px after:w-0 after:bg-primary hover:after:w-full after:transition-all after:duration-300"
    >
      {children}
    </Link>
  );
}
