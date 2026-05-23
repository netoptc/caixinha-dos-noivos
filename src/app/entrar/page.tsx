"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Usuário ou senha incorretos.");
      setLoading(false);
      return;
    }

    const session = await getSession();
    const isAdmin = session?.user?.role === "ADMIN";
    const target = callbackUrl || (isAdmin ? "/admin" : "/painel");
    router.push(target);
    router.refresh();
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-12 font-sans relative overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg, hsl(var(--primary) / 0.12) 0%, #fbf7ee 60%)",
      }}
    >
      {/* Padrão de pontos sutil */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(hsl(var(--primary) / 0.15) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center mb-8 justify-center group"
        >
          <Logo size="lg" />
        </Link>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-border/60 p-8 md:p-10">
          <div className="mb-7">
            <h1 className="font-display text-3xl text-foreground mb-2">
              Bem-vindo de volta
            </h1>
            <p className="text-sm text-foreground/65">
              Entre na sua conta para gerenciar sua caixinha.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AuthField
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              autoComplete="email"
              icon={<Mail className="w-4 h-4" />}
            />

            <AuthField
              label="Senha"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
              autoComplete="current-password"
              icon={<Lock className="w-4 h-4" />}
              trailing={
                <button
                  type="button"
                  className="text-foreground/50 hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "ocultar senha" : "mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
            />

            <div className="text-center">
              <Link
                href="/esqueci-senha"
                className="text-sm text-foreground/65 hover:text-primary transition-colors"
              >
                Esqueci minha senha
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-base font-semibold transition-all disabled:opacity-60 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              style={{
                boxShadow: "0 12px 28px -10px hsl(var(--primary) / 0.5)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Entrando…
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {error && (
              <div className="rounded-xl bg-destructive/5 border border-destructive/30 px-4 py-3 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                <p className="text-sm font-semibold text-destructive">{error}</p>
              </div>
            )}
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center text-sm text-foreground/65 mt-6">
          Ainda não tem conta?{" "}
          <Link
            href="/criar-caixinha"
            className="font-semibold text-primary hover:underline"
          >
            Criar caixinha
          </Link>
        </p>
      </div>
    </div>
  );
}

function AuthField({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  autoComplete,
  icon,
  trailing,
  minLength,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  minLength?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-foreground mb-2">
        {label}
      </label>
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3.5 text-foreground/40 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          minLength={minLength}
          required
          className={`w-full rounded-xl bg-white border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 py-3 text-base text-foreground placeholder:text-muted-foreground/50 transition-colors ${
            icon ? "pl-10" : "pl-4"
          } ${trailing ? "pr-12" : "pr-4"}`}
        />
        {trailing && (
          <div className="absolute right-3.5">{trailing}</div>
        )}
      </div>
    </div>
  );
}
