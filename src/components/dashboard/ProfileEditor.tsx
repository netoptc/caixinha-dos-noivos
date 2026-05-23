"use client";

import { useState } from "react";
import {
  Loader2,
  Check,
  AlertCircle,
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

export function ProfileEditor({
  initialName,
  initialEmail,
}: {
  initialName: string;
  initialEmail: string;
}) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validações de senha (apenas se o usuário preencheu)
    const wantsPasswordChange =
      currentPassword || newPassword || confirmPassword;
    if (wantsPasswordChange) {
      if (!currentPassword) {
        setError("Informe sua senha atual para trocar a senha.");
        return;
      }
      if (newPassword.length < 6) {
        setError("A nova senha precisa ter pelo menos 6 caracteres.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("A confirmação da nova senha não confere.");
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          ...(wantsPasswordChange
            ? { currentPassword, newPassword }
            : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Não foi possível atualizar agora. Tente novamente.");
        return;
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Sem conexão. Tente novamente em instantes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-2xl bg-destructive/5 border border-destructive/30 px-5 py-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">
              Algo não deu certo
            </p>
            <p className="text-sm text-foreground/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-2xl bg-primary/10 border border-primary/40 px-5 py-4 flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          </div>
          <p className="text-sm font-semibold text-primary">
            Perfil atualizado com sucesso
          </p>
        </div>
      )}

      {/* Section: dados básicos */}
      <section className="rounded-2xl bg-white border border-border/60 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-5">
          Dados do casal
        </h2>
        <div className="space-y-5">
          <Field
            label="Nome do casal"
            type="text"
            value={name}
            onChange={setName}
            icon={<UserIcon className="w-4 h-4" />}
            required
          />
          <Field
            label="E-mail"
            type="email"
            value={email}
            onChange={setEmail}
            icon={<Mail className="w-4 h-4" />}
            required
          />
        </div>
      </section>

      {/* Section: senha */}
      <section className="rounded-2xl bg-white border border-border/60 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Trocar senha
        </h2>
        <p className="text-sm text-foreground/65 mb-5">
          Deixe em branco se não quiser trocar.
        </p>
        <div className="space-y-5">
          <Field
            label="Senha atual"
            type={showPassword ? "text" : "password"}
            value={currentPassword}
            onChange={setCurrentPassword}
            icon={<Lock className="w-4 h-4" />}
            placeholder="••••••••"
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-foreground/50 hover:text-foreground transition-colors"
                aria-label={showPassword ? "ocultar" : "mostrar"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            }
          />
          <Field
            label="Nova senha"
            type={showPassword ? "text" : "password"}
            value={newPassword}
            onChange={setNewPassword}
            icon={<Lock className="w-4 h-4" />}
            placeholder="Mínimo 6 caracteres"
          />
          <Field
            label="Confirmar nova senha"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={setConfirmPassword}
            icon={<Lock className="w-4 h-4" />}
            placeholder="Repita a nova senha"
          />
        </div>
      </section>

      <button
        type="submit"
        disabled={saving}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-base font-semibold transition-all disabled:opacity-60 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        style={{ boxShadow: "0 12px 28px -10px hsl(var(--primary) / 0.5)" }}
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Salvando…
          </>
        ) : (
          "Salvar alterações"
        )}
      </button>
    </form>
  );
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  icon,
  trailing,
  placeholder,
  required,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  placeholder?: string;
  required?: boolean;
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
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
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
