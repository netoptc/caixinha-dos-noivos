"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  Eye,
  EyeOff,
  Heart,
  Loader2,
  Upload,
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { COLOR_SWATCHES, DEFAULT_PRIMARY_COLOR } from "@/lib/theme-swatches";
import { StepIndicator } from "@/components/ui/StepIndicator";

const PLATFORM_PRIMARY = DEFAULT_PRIMARY_COLOR;

const STEPS = [
  { id: 1, label: "O casal" },
  { id: 2, label: "Meta" },
  { id: 3, label: "Sua conta" },
] as const;

type Step = (typeof STEPS)[number]["id"];

interface FormState {
  coupleNames: string;
  weddingDate: string;
  description: string;
  goalAmount: string;
  primaryColor: string;
  hideDonorAmount: boolean;
  hideTotalRaised: boolean;
  hideGoal: boolean;
  email: string;
  password: string;
  confirmPassword: string;
}

const INITIAL_FORM: FormState = {
  coupleNames: "",
  weddingDate: "",
  description: "",
  goalAmount: "",
  primaryColor: DEFAULT_PRIMARY_COLOR,
  hideDonorAmount: true,
  hideTotalRaised: false,
  hideGoal: false,
  email: "",
  password: "",
  confirmPassword: "",
};

function maskBirthDate(v: string) {
  // accepts DD/MM/YYYY input from user
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d
    .replace(/(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{2})(\d)/, "$1/$2");
}

function weddingDateToISO(masked: string): string | null {
  // aceita data passada ou futura (alguns casais criam a caixinha após o casamento)
  const m = masked.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const date = new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getUTCFullYear();
  if (year < 1900 || year > 2100) return null;
  return `${yyyy}-${mm}-${dd}`;
}

export default function CriarCaixinhaPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors({ photo: "A imagem deve ter no máximo 5MB." });
      return;
    }

    if (photoPreview) URL.revokeObjectURL(photoPreview);
    const previewUrl = URL.createObjectURL(file);
    setPhotoFile(file);
    setPhotoPreview(previewUrl);
    setErrors({});
  }

  function clearPhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function validateStep1() {
    const errs: Record<string, string> = {};
    if (form.coupleNames.trim().length < 3)
      errs.coupleNames = "Conte o nome do casal";
    if (!weddingDateToISO(form.weddingDate))
      errs.weddingDate = "Use DD/MM/AAAA (ex.: 14/06/2026)";
    if (!/^#[0-9a-fA-F]{6}$/.test(form.primaryColor))
      errs.primaryColor = "Use um hex válido, ex.: #B8851F";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep2() {
    const errs: Record<string, string> = {};
    const goal = parseFloat(form.goalAmount);
    if (!goal || goal <= 0) errs.goalAmount = "Defina uma meta maior que zero";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep3() {
    const errs: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "E-mail inválido";
    if (form.password.length < 6)
      errs.password = "A senha precisa ter pelo menos 6 caracteres";
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = "As senhas não coincidem";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function goNext() {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setErrors({});
    setStep((s) => (s < 3 ? ((s + 1) as Step) : s));
  }

  function goBack() {
    setErrors({});
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s));
  }

  async function handleSubmit() {
    if (!validateStep3()) return;
    setLoading(true);

    const title = form.coupleNames;

    try {
      const fd = new FormData();
      fd.append("email", form.email);
      fd.append("password", form.password);
      fd.append("coupleNames", form.coupleNames);
      fd.append("title", title);
      fd.append("weddingDate", weddingDateToISO(form.weddingDate) ?? "");
      if (form.description) fd.append("description", form.description);
      fd.append("goalAmount", form.goalAmount);
      fd.append("primaryColor", form.primaryColor);
      fd.append("hideDonorAmount", String(form.hideDonorAmount));
      fd.append("hideTotalRaised", String(form.hideTotalRaised));
      fd.append("hideGoal", String(form.hideGoal));
      if (photoFile) fd.append("photo", photoFile);

      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        body: fd,
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        setErrors({
          submit: registerData.error || "Não foi possível criar sua caixinha.",
        });
        setLoading(false);
        return;
      }

      const signInResult = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (!signInResult?.ok) {
        router.push("/entrar");
        return;
      }

      // Sucesso — abre modal pra escolher próximo destino
      const finalSlug: string | undefined = registerData?.caixinha?.slug;
      if (!finalSlug) {
        setErrors({ submit: "Não foi possível recuperar o código da caixinha." });
        setLoading(false);
        return;
      }
      setCreatedSlug(finalSlug);
      setLoading(false);
    } catch {
      setErrors({
        submit: "Sem conexão. Verifique sua internet e tente novamente.",
      });
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start px-5 py-12 font-sans relative overflow-hidden"
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
        <Link
          href="/"
          className="flex items-center mb-8 justify-center group"
        >
          <Logo size="lg" />
        </Link>

        <StepIndicator
          steps={STEPS}
          currentIndex={step - 1}
          className="mb-10"
        />

        {step === 1 && (
          <div className="space-y-7 animate-fade-in">
            <div>
              <p
                className="text-xs font-semibold mb-2"
                style={{ color: PLATFORM_PRIMARY }}
              >
                Passo 1
              </p>
              <h2 className="font-display text-2xl md:text-3xl text-foreground leading-tight">
                Conte sobre o casal
              </h2>
              <p className="text-sm text-foreground/65 mt-2">
                Essas informações ficam na página da sua caixinha.
              </p>
            </div>

            <Field
              label="Nome do casal"
              placeholder="Ex.: Ana e Pedro"
              value={form.coupleNames}
              onChange={(v) => setForm((p) => ({ ...p, coupleNames: v }))}
              error={errors.coupleNames}
            />

            <Field
              label="Data do casamento"
              placeholder="DD/MM/AAAA"
              value={form.weddingDate}
              onChange={(v) =>
                setForm((p) => ({ ...p, weddingDate: maskBirthDate(v) }))
              }
              error={errors.weddingDate}
            />

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Descrição da caixinha
              </label>
              <textarea
                className="w-full rounded-xl bg-white border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/50 resize-none transition-colors"
                rows={4}
                placeholder="Conte como a caixinha vai ajudar vocês a realizarem o sonho…"
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                maxLength={500}
              />
              <p className="text-xs text-foreground/55 mt-1.5">
                {form.description.length}/500
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Foto do casal{" "}
                <span className="font-normal text-foreground/55">
                  (opcional)
                </span>
              </label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelect}
              />
              {photoPreview ? (
                <div className="flex items-center gap-5 p-4 rounded-2xl bg-white border border-border/60">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoPreview}
                    alt="Pré-visualização"
                    className="w-20 h-20 rounded-full object-cover flex-shrink-0"
                    style={{ border: `2px solid ${PLATFORM_PRIMARY}` }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground mb-2">
                      Foto pronta
                    </p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="text-sm font-semibold transition-colors hover:opacity-80"
                        style={{ color: PLATFORM_PRIMARY }}
                      >
                        Trocar
                      </button>
                      <button
                        type="button"
                        onClick={clearPhoto}
                        className="text-sm font-semibold text-foreground/55 hover:text-destructive transition-colors"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full rounded-2xl bg-white border-2 border-dashed border-border/60 hover:border-primary py-8 flex flex-col items-center gap-2.5 transition-colors"
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${PLATFORM_PRIMARY}15` }}
                  >
                    <Upload
                      className="w-6 h-6"
                      style={{ color: PLATFORM_PRIMARY }}
                    />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    Clique para enviar
                  </p>
                  <p className="text-xs text-foreground/55">
                    JPG, PNG ou WebP · até 5MB
                  </p>
                </button>
              )}
              {errors.photo && (
                <p className="mt-2 text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.photo}
                </p>
              )}
            </div>

            <ThemePicker
              value={form.primaryColor}
              onChange={(v) => setForm((p) => ({ ...p, primaryColor: v }))}
              error={errors.primaryColor}
            />

            <PrimaryButton onClick={goNext}>
              Continuar
              <ArrowRight className="w-4 h-4" />
            </PrimaryButton>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <BackButton onClick={goBack}>Voltar</BackButton>

            <div>
              <p
                className="text-xs font-semibold mb-2"
                style={{ color: PLATFORM_PRIMARY }}
              >
                Passo 2
              </p>
              <h2 className="font-display text-2xl md:text-3xl text-foreground leading-tight">
                Meta e privacidade
              </h2>
              <p className="text-sm text-foreground/65 mt-2">
                Quanto vocês querem arrecadar e o que aparece na página.
              </p>
            </div>

            <Field
              label="Meta de arrecadação (R$)"
              type="number"
              placeholder="Ex.: 10000"
              value={form.goalAmount}
              onChange={(v) => setForm((p) => ({ ...p, goalAmount: v }))}
              error={errors.goalAmount}
            />

            <ToggleField
              label="Ocultar valor que cada pessoa contribuiu"
              description="Quando ativo, o valor de cada pessoa não aparece no ranking público."
              checked={form.hideDonorAmount}
              onChange={(v) =>
                setForm((p) => ({ ...p, hideDonorAmount: v }))
              }
            />

            <ToggleField
              label="Ocultar total arrecadado"
              description="Quando ativo, o valor total arrecadado não aparece no card público."
              checked={form.hideTotalRaised}
              onChange={(v) =>
                setForm((p) => ({ ...p, hideTotalRaised: v }))
              }
            />

            <ToggleField
              label="Ocultar meta"
              description="Quando ativo, o valor da meta não aparece no card público."
              checked={form.hideGoal}
              onChange={(v) => setForm((p) => ({ ...p, hideGoal: v }))}
            />

            <PrimaryButton onClick={goNext}>
              Continuar
              <ArrowRight className="w-4 h-4" />
            </PrimaryButton>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <BackButton onClick={goBack}>Voltar</BackButton>

            <div>
              <p
                className="text-xs font-semibold mb-2"
                style={{ color: PLATFORM_PRIMARY }}
              >
                Passo 3
              </p>
              <h2 className="font-display text-2xl md:text-3xl text-foreground leading-tight">
                Sua conta
              </h2>
              <p className="text-sm text-foreground/65 mt-2">
                Use esses dados para acessar o painel depois. Os dados para
                receber os saques serão pedidos só no momento de sacar.
              </p>
            </div>

            {errors.submit && (
              <div
                className="rounded-2xl bg-destructive/5 border border-destructive/30 px-5 py-4 flex items-start gap-3"
                role="alert"
              >
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-destructive">
                    Algo não deu certo
                  </p>
                  <p className="text-sm text-foreground/80 mt-0.5">
                    {errors.submit}
                  </p>
                </div>
              </div>
            )}

            <Field
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={(v) => setForm((p) => ({ ...p, email: v }))}
              autoComplete="email"
              error={errors.email}
            />

            <PasswordField
              label="Senha"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={(v) => setForm((p) => ({ ...p, password: v }))}
              show={showPassword}
              onToggle={() => setShowPassword((s) => !s)}
              autoComplete="new-password"
              error={errors.password}
            />

            <PasswordField
              label="Confirmar senha"
              placeholder="Repita a senha"
              value={form.confirmPassword}
              onChange={(v) => setForm((p) => ({ ...p, confirmPassword: v }))}
              show={showPassword}
              onToggle={() => setShowPassword((s) => !s)}
              autoComplete="new-password"
              error={errors.confirmPassword}
            />

            <p className="text-xs text-foreground/55 leading-relaxed">
              Ao criar sua caixinha, você concorda com nossos{" "}
              <Link
                href="/termos"
                className="font-semibold hover:underline"
                style={{ color: PLATFORM_PRIMARY }}
              >
                Termos de uso
              </Link>{" "}
              e{" "}
              <Link
                href="/privacidade"
                className="font-semibold hover:underline"
                style={{ color: PLATFORM_PRIMARY }}
              >
                Política de privacidade
              </Link>
              .
            </p>

            <PrimaryButton onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Criando caixinha…
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4" fill="currentColor" />
                  Criar minha caixinha
                </>
              )}
            </PrimaryButton>
          </div>
        )}

        <p className="text-center text-sm text-foreground/65 mt-8">
          Já tem uma conta?{" "}
          <Link
            href="/entrar"
            className="font-semibold hover:underline"
            style={{ color: PLATFORM_PRIMARY }}
          >
            Entrar
          </Link>
        </p>
      </div>

      {createdSlug && (
        <SuccessModal
          slug={createdSlug}
          coupleNames={form.coupleNames}
          primaryColor={form.primaryColor}
        />
      )}
    </div>
  );
}

function SuccessModal({
  slug,
  coupleNames,
  primaryColor,
}: {
  slug: string;
  coupleNames: string;
  primaryColor: string;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-5 animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-7 shadow-2xl">
        <div
          className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}1A` }}
        >
          <Heart
            className="w-7 h-7"
            style={{ color: primaryColor }}
            fill="currentColor"
          />
        </div>

        <h2 className="text-center font-display text-2xl text-foreground mb-2">
          Caixinha criada!
        </h2>
        <p className="text-center text-sm text-foreground/65 mb-6">
          Tudo pronto para {coupleNames || "vocês"} começarem a receber
          contribuições.
        </p>

        <div className="space-y-2.5">
          <Link
            href={`/${slug}`}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-white text-base font-semibold transition-all hover:shadow-xl hover:-translate-y-0.5 shadow-lg"
            style={{
              backgroundColor: primaryColor,
              boxShadow: `0 12px 28px -10px ${primaryColor}80`,
            }}
          >
            Ver minha caixinha
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/painel"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-foreground/80 text-base font-semibold border border-border hover:bg-[#fbf7ee] transition-colors"
          >
            Ir para o painel
          </Link>
        </div>
      </div>
    </div>
  );
}

function BackButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-foreground/65 hover:text-foreground hover:bg-[#fbf7ee] transition-colors"
    >
      <ChevronLeft className="w-4 h-4" />
      {children}
    </button>
  );
}

function PrimaryButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type="button"
      className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-white text-base font-semibold transition-all hover:shadow-xl hover:-translate-y-0.5 shadow-lg disabled:opacity-60 disabled:hover:translate-y-0"
      style={{
        backgroundColor: PLATFORM_PRIMARY,
        boxShadow: `0 12px 28px -10px ${PLATFORM_PRIMARY}80`,
      }}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  autoComplete,
  error,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-foreground mb-2">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="w-full rounded-xl bg-white border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/50 transition-colors"
      />
      {error && (
        <p className="mt-2 text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

function PasswordField({
  label,
  placeholder,
  value,
  onChange,
  show,
  onToggle,
  autoComplete,
  error,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-foreground mb-2">
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="w-full rounded-xl bg-white border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 px-4 py-3 pr-12 text-base text-foreground placeholder:text-muted-foreground/50 transition-colors"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? "ocultar senha" : "mostrar senha"}
          className="absolute right-3.5 text-foreground/50 hover:text-foreground transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

function ThemePicker({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-foreground mb-2">
        Tema da página
      </label>
      <p className="text-xs text-foreground/55 mb-3">
        Escolha a cor principal da sua caixinha. Você pode trocar depois no
        painel.
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {COLOR_SWATCHES.map((swatch) => {
          const selected = value.toLowerCase() === swatch.hex.toLowerCase();
          return (
            <button
              key={swatch.hex}
              type="button"
              onClick={() => onChange(swatch.hex)}
              className="group flex flex-col items-center gap-2"
              aria-label={`Tema ${swatch.name}`}
              aria-pressed={selected}
            >
              <span
                className="w-full aspect-square rounded-xl transition-all group-hover:scale-95"
                style={{
                  backgroundColor: swatch.hex,
                  boxShadow: selected
                    ? `0 0 0 2px white, 0 0 0 4px ${swatch.hex}, 0 8px 16px -6px ${swatch.hex}80`
                    : "0 2px 4px rgba(0,0,0,0.08)",
                }}
              />
              <span
                className="text-[0.7rem] leading-tight text-center"
                style={{
                  color: selected
                    ? swatch.hex
                    : "hsl(var(--muted-foreground))",
                  fontWeight: selected ? 600 : 400,
                }}
              >
                {swatch.name}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-3 pt-5 mt-4 border-t border-border/40">
        <p className="text-sm font-semibold text-foreground/70 flex-shrink-0">
          Personalizada:
        </p>
        <label
          className="relative w-10 h-10 flex-shrink-0 cursor-pointer rounded-lg border border-border/60 overflow-hidden block shadow-sm"
          style={{ backgroundColor: value }}
          aria-label="Escolher cor personalizada"
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Cor personalizada em hexadecimal"
          maxLength={7}
          size={7}
          className="flex-1 min-w-0 font-mono text-sm rounded-xl bg-white border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 px-3 py-2 transition-colors"
        />
      </div>
      {error && (
        <p className="mt-2 text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-white border border-border/60">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-foreground/60 mt-1 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5"
        style={{
          backgroundColor: checked ? PLATFORM_PRIMARY : "hsl(var(--border))",
        }}
      >
        <span
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform"
          style={{ left: checked ? "calc(100% - 22px)" : "2px" }}
        />
      </button>
    </div>
  );
}
