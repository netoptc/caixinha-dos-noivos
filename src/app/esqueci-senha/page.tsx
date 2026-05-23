"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Não foi possível enviar o código.");
        setLoading(false);
        return;
      }

      setSuccess(data.message ?? "Enviamos um código para o seu e-mail.");
      setTimeout(() => {
        router.push(
          `/redefinir-senha?email=${encodeURIComponent(email)}`,
        );
      }, 1200);
    } catch {
      setError("Falha na conexão. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-12 font-sans relative overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg, hsl(var(--primary) / 0.12) 0%, #fbf7ee 60%)",
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

      <div className="relative w-full max-w-md">
        <Link href="/" className="flex items-center mb-8 justify-center group">
          <Logo size="lg" />
        </Link>

        <div className="bg-white rounded-2xl shadow-xl border border-border/60 p-8 md:p-10">
          <div className="mb-7">
            <h1 className="font-display text-3xl text-foreground mb-2">
              Esqueceu sua senha?
            </h1>
            <p className="text-sm text-foreground/65">
              Informe seu e-mail e enviaremos um código de 6 dígitos para
              redefinir sua senha.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                E-mail
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-foreground/40 pointer-events-none">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="w-full rounded-xl bg-white border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 py-3 pl-10 pr-4 text-base text-foreground placeholder:text-muted-foreground/50 transition-colors"
                />
              </div>
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
                  Enviando…
                </>
              ) : (
                <>
                  Enviar código
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

            {success && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-300 px-4 py-3 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <p className="text-sm font-semibold text-emerald-700">{success}</p>
              </div>
            )}
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <Link
              href="/entrar"
              className="text-foreground/65 hover:text-primary transition-colors"
            >
              Voltar ao login
            </Link>
            <Link
              href={`/redefinir-senha${email ? `?email=${encodeURIComponent(email)}` : ""}`}
              className="font-semibold text-primary hover:underline"
            >
              Já tenho um código
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
