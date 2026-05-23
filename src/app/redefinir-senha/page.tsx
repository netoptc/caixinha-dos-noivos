"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";

function ResetPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailFromUrl = searchParams.get("email") ?? "";
  const [email, setEmail] = useState(emailFromUrl);
  const emailLocked = emailFromUrl.length > 0;
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resending, setResending] = useState(false);

  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  function setDigit(idx: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setCode((prev) => {
      const next = [...prev];
      next[idx] = digit;
      return next;
    });
    if (digit && idx < 5) inputsRef.current[idx + 1]?.focus();
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowRight" && idx < 5) {
      inputsRef.current[idx + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setCode(next);
    const focusIdx = Math.min(pasted.length, 5);
    inputsRef.current[focusIdx]?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const joinedCode = code.join("");
    if (joinedCode.length !== 6) {
      setError("Informe os 6 dígitos do código recebido por e-mail.");
      return;
    }
    if (password.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: joinedCode, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Não foi possível redefinir a senha.");
        setLoading(false);
        return;
      }

      setSuccess("Senha alterada com sucesso! Redirecionando ao login…");
      setTimeout(() => router.push("/entrar"), 1500);
    } catch {
      setError("Falha na conexão. Tente novamente.");
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email) {
      setError("Informe seu e-mail para reenviar o código.");
      return;
    }
    setResending(true);
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
        setError(data.error ?? "Não foi possível reenviar o código.");
      } else {
        setSuccess(data.message ?? "Novo código enviado por e-mail.");
      }
    } catch {
      setError("Falha na conexão. Tente novamente.");
    } finally {
      setResending(false);
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
              Redefinir senha
            </h1>
            <p className="text-sm text-foreground/65">
              Insira o código de 6 dígitos enviado para o seu e-mail e escolha
              uma nova senha.
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  readOnly={emailLocked}
                  aria-readonly={emailLocked}
                  className={`w-full rounded-xl border border-input py-3 pl-10 pr-4 text-base text-foreground transition-colors ${
                    emailLocked
                      ? "bg-[#fbf7ee] cursor-not-allowed text-foreground/70"
                      : "bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Código de 6 dígitos
              </label>
              <div className="flex justify-between gap-2">
                {code.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputsRef.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => setDigit(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    className="w-12 h-14 rounded-xl bg-white border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-center text-2xl font-semibold text-foreground transition-colors"
                  />
                ))}
              </div>
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-xs font-semibold text-primary hover:underline disabled:opacity-60"
                >
                  {resending ? "Reenviando…" : "Reenviar código"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Nova senha
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-foreground/40 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  autoComplete="new-password"
                  required
                  className="w-full rounded-xl bg-white border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 py-3 pl-10 pr-12 text-base text-foreground transition-colors"
                />
                <button
                  type="button"
                  className="absolute right-3.5 text-foreground/50 hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "ocultar senha" : "mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Confirmar nova senha
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-foreground/40 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  minLength={6}
                  autoComplete="new-password"
                  required
                  className="w-full rounded-xl bg-white border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 py-3 pl-10 pr-4 text-base text-foreground transition-colors"
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
                  Salvando…
                </>
              ) : (
                <>
                  Redefinir senha
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

          <div className="mt-6 text-center">
            <Link
              href="/entrar"
              className="text-sm text-foreground/65 hover:text-primary transition-colors"
            >
              Voltar ao login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      }
    >
      <ResetPasswordPageContent />
    </Suspense>
  );
}
