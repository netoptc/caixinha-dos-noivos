"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Heart,
  Image as ImageIcon,
  Info,
  Link2,
  Loader2,
  Lock,
  Mail,
  Palette,
  Target,
  Upload,
  Users,
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { StepIndicator } from "@/components/ui/StepIndicator";

const PLATFORM_PRIMARY = "#b8851f";

const COLOR_SWATCHES = [
  { name: "Ouro Antigo", hex: "#b8851f" },
  { name: "Bordeaux", hex: "#7a2e2e" },
  { name: "Verde Musgo", hex: "#4a5c44" },
  { name: "Carvão", hex: "#1f1a14" },
  { name: "Terracota", hex: "#a85937" },
  { name: "Marinho", hex: "#1f3854" },
];

const STEPS = [
  { id: 1, label: "O casal" },
  { id: 2, label: "Sua página" },
  { id: 3, label: "Meta e privacidade" },
  { id: 4, label: "Sua conta" },
] as const;

type Step = (typeof STEPS)[number]["id"];

interface FormState {
  coupleNames: string;
  description: string;
  title: string;
  primaryColor: string;
  goalAmount: string;
  hideDonorAmount: boolean;
  hideTotalRaised: boolean;
  hideGoal: boolean;
  email: string;
  password: string;
  confirmPassword: string;
}

const INITIAL_FORM: FormState = {
  coupleNames: "",
  description: "",
  title: "",
  primaryColor: "#b8851f",
  goalAmount: "",
  hideDonorAmount: true,
  hideTotalRaised: false,
  hideGoal: false,
  email: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  function updateCoupleName(value: string) {
    setForm((prev) => ({
      ...prev,
      coupleNames: value,
      title: prev.title || (value ? `Ajude ${value} a realizarem o sonho` : ""),
    }));
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 5MB.");
      return;
    }

    if (photoPreview) URL.revokeObjectURL(photoPreview);
    const previewUrl = URL.createObjectURL(file);
    setPhotoFile(file);
    setPhotoPreview(previewUrl);
    setError("");
  }

  function clearPhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function validateStep(current: Step): string | null {
    if (current === 1) {
      if (form.coupleNames.trim().length < 3) {
        return "Conte o nome do casal (mín. 3 caracteres).";
      }
    }
    if (current === 2) {
      if (form.title.trim().length < 3) {
        return "Informe um título para a página.";
      }
    }
    if (current === 3) {
      const goal = parseFloat(form.goalAmount);
      if (!goal || goal <= 0) {
        return "Defina uma meta maior que zero.";
      }
    }
    if (current === 4) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        return "E-mail inválido.";
      }
      if (form.password.length < 6) {
        return "A senha precisa ter pelo menos 6 caracteres.";
      }
      if (form.password !== form.confirmPassword) {
        return "As senhas não coincidem.";
      }
    }
    return null;
  }

  function goNext() {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setStep((s) => (s < 4 ? ((s + 1) as Step) : s));
  }

  function goBack() {
    setError("");
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validateStep(4);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setLoading(true);

    try {
      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          coupleNames: form.coupleNames,
          title: form.title,
          description: form.description || undefined,
          goalAmount: parseFloat(form.goalAmount),
          primaryColor: form.primaryColor,
          hideDonorAmount: form.hideDonorAmount,
          hideTotalRaised: form.hideTotalRaised,
          hideGoal: form.hideGoal,
        }),
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        setError(registerData.error || "Não foi possível criar sua caixinha. Tente novamente.");
        setLoading(false);
        return;
      }

      if (!registerData.caixinha?.slug) {
        setError("Não foi possível recuperar o código da caixinha.");
        setLoading(false);
        return;
      }

      const signInResult = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (!signInResult?.ok) {
        router.push("/auth/login");
        return;
      }

      if (photoFile) {
        try {
          const fd = new FormData();
          fd.append("file", photoFile);
          const uploadRes = await fetch("/api/upload/image", {
            method: "POST",
            body: fd,
          });
          if (uploadRes.ok) {
            const { url } = await uploadRes.json();
            await fetch("/api/caixinhas", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: form.title,
                coupleNames: form.coupleNames,
                description: form.description || undefined,
                goalAmount: parseFloat(form.goalAmount),
                primaryColor: form.primaryColor,
                coupleImageUrl: url,
                hideDonorAmount: form.hideDonorAmount,
                hideTotalRaised: form.hideTotalRaised,
                hideGoal: form.hideGoal,
              }),
            });
          }
        } catch {
          // foto falhou — caixinha já existe, segue para o painel
        }
      }

      router.push("/painel");
      router.refresh();
    } catch {
      setError("Sem conexão. Verifique sua internet e tente novamente.");
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

      <div className="relative w-full max-w-xl">
        <Link
          href="/"
          className="flex items-center mb-6 justify-center group"
        >
          <Logo size="lg" />
        </Link>

        <div className="bg-white rounded-2xl shadow-xl border border-border/60 p-8 md:p-10">
          <div className="mb-7">
            <h1 className="font-display text-3xl text-foreground mb-2">
              Criar sua caixinha
            </h1>
            <p className="text-sm text-foreground/65">
              Preencha em poucos passos. No final criamos sua conta.
            </p>
          </div>

          <StepIndicator
            steps={STEPS}
            currentIndex={step - 1}
            className="mb-7"
          />

          {error && (
            <div className="rounded-xl bg-destructive/5 border border-destructive/30 px-4 py-3 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-destructive">
                  Algo não deu certo
                </p>
                <p className="text-sm text-foreground/80 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {step !== 4 ? (
            <div className="space-y-6">
              <StepContent
                step={step}
                form={form}
                setForm={setForm}
                updateCoupleName={updateCoupleName}
                photoPreview={photoPreview}
                handlePhotoSelect={handlePhotoSelect}
                clearPhoto={clearPhoto}
                fileRef={fileRef}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
              />
              <StepNav
                step={step}
                loading={false}
                onBack={goBack}
                onNext={goNext}
              />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <StepContent
                step={step}
                form={form}
                setForm={setForm}
                updateCoupleName={updateCoupleName}
                photoPreview={photoPreview}
                handlePhotoSelect={handlePhotoSelect}
                clearPhoto={clearPhoto}
                fileRef={fileRef}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
              />
              <StepNav
                step={step}
                loading={loading}
                onBack={goBack}
                onNext={goNext}
              />
            </form>
          )}
        </div>

        <p className="text-center text-sm text-foreground/65 mt-6">
          Já tem uma conta?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-primary hover:underline"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}

function StepNav({
  step,
  loading,
  onBack,
  onNext,
}: {
  step: Step;
  loading: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center gap-3 pt-2">
      {step > 1 && (
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl border border-border/70 text-foreground/70 hover:text-foreground hover:bg-[#fbf7ee] hover:border-border text-base font-semibold transition-colors disabled:opacity-60"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
      )}
      {step < 4 ? (
        <button
          type="button"
          onClick={onNext}
          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-white text-base font-semibold transition-all hover:shadow-xl hover:-translate-y-0.5 shadow-lg"
          style={{
            backgroundColor: PLATFORM_PRIMARY,
            boxShadow: `0 12px 28px -10px ${PLATFORM_PRIMARY}80`,
          }}
        >
          Continuar
          <ArrowRight className="w-4 h-4" />
        </button>
      ) : (
        <button
          type="submit"
          disabled={loading}
          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-white text-base font-semibold transition-all disabled:opacity-60 hover:shadow-xl hover:-translate-y-0.5 shadow-lg"
          style={{
            backgroundColor: PLATFORM_PRIMARY,
            boxShadow: `0 12px 28px -10px ${PLATFORM_PRIMARY}80`,
          }}
        >
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
        </button>
      )}
    </div>
  );
}

function StepContent({
  step,
  form,
  setForm,
  updateCoupleName,
  photoPreview,
  handlePhotoSelect,
  clearPhoto,
  fileRef,
  showPassword,
  setShowPassword,
}: {
  step: Step;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  updateCoupleName: (v: string) => void;
  photoPreview: string;
  handlePhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearPhoto: () => void;
  fileRef: React.RefObject<HTMLInputElement | null>;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
}) {
  if (step === 1) {
    return (
      <Section icon={<Users className="w-4 h-4" />} title="O casal">
        <FormField
          label="Nome do casal"
          placeholder="Ex.: Ana e Pedro"
          value={form.coupleNames}
          onChange={updateCoupleName}
        />
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Sobre vocês <span className="font-normal text-foreground/55">(opcional)</span>
          </label>
          <textarea
            className="w-full rounded-xl bg-white border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/50 resize-none transition-colors"
            rows={3}
            placeholder="Conte como a caixinha vai ajudar vocês a realizarem o sonho…"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Foto do casal <span className="font-normal text-foreground/55">(opcional)</span>
          </label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoSelect}
          />
          {photoPreview ? (
            <div className="flex items-center gap-5 p-4 rounded-xl bg-[#fbf7ee] border border-border/60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoPreview}
                alt="Pré-visualização"
                className="w-24 h-24 rounded-full object-cover flex-shrink-0"
                style={{ border: `2px solid ${PLATFORM_PRIMARY}` }}
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground mb-1">
                  Foto pronta
                </p>
                <p className="text-xs text-foreground/60 mb-3">
                  Será enviada quando você concluir o cadastro.
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
              className="w-full rounded-2xl bg-[#fbf7ee] border-2 border-dashed border-border/60 hover:border-primary py-8 flex flex-col items-center gap-2.5 transition-colors"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: `${PLATFORM_PRIMARY}15` }}
              >
                <Upload className="w-6 h-6" style={{ color: PLATFORM_PRIMARY }} />
              </div>
              <p className="text-base font-semibold text-foreground">
                Clique para enviar uma foto
              </p>
              <p className="text-xs text-foreground/55">
                JPG, PNG ou WebP · máximo 5MB
              </p>
            </button>
          )}
        </div>
      </Section>
    );
  }

  if (step === 2) {
    return (
      <>
        <Section icon={<Info className="w-4 h-4" />} title="Sua página">
          <FormField
            label="Título da página"
            placeholder="Ex.: Ajude Ana e Pedro a realizarem o sonho"
            value={form.title}
            onChange={(v) => setForm((p) => ({ ...p, title: v }))}
          />
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#fbf7ee] border border-border/60">
            <Link2 className="w-4 h-4 text-foreground/55 flex-shrink-0" />
            <p className="flex-1 text-sm text-foreground/70">
              O link da sua caixinha será gerado automaticamente após o cadastro
              (um código curto e único).
            </p>
          </div>
        </Section>
        <Section icon={<Palette className="w-4 h-4" />} title="Cor principal">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {COLOR_SWATCHES.map((swatch) => {
              const selected =
                form.primaryColor.toLowerCase() === swatch.hex.toLowerCase();
              return (
                <button
                  key={swatch.hex}
                  type="button"
                  onClick={() =>
                    setForm((p) => ({ ...p, primaryColor: swatch.hex }))
                  }
                  className="group flex flex-col items-center gap-2"
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
                    className="text-xs leading-tight text-center"
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
          <div className="flex items-center gap-3 pt-5 mt-2 border-t border-border/40">
            <p className="text-sm font-semibold text-foreground/70 flex-shrink-0">
              Personalizada:
            </p>
            <label
              className="relative w-10 h-10 flex-shrink-0 cursor-pointer rounded-lg border border-border/60 overflow-hidden block shadow-sm"
              style={{ backgroundColor: form.primaryColor }}
              aria-label="Escolher cor personalizada"
            >
              <input
                type="color"
                value={form.primaryColor}
                onChange={(e) =>
                  setForm((p) => ({ ...p, primaryColor: e.target.value }))
                }
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </label>
            <input
              type="text"
              value={form.primaryColor}
              onChange={(e) =>
                setForm((p) => ({ ...p, primaryColor: e.target.value }))
              }
              className="flex-1 min-w-0 font-mono text-sm rounded-xl bg-white border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 px-3 py-2 transition-colors"
              maxLength={7}
              size={7}
            />
          </div>
        </Section>
      </>
    );
  }

  if (step === 3) {
    return (
      <>
        <Section icon={<Target className="w-4 h-4" />} title="Meta de arrecadação">
          <FormField
            label="Quanto vocês querem arrecadar? (R$)"
            type="number"
            placeholder="Ex.: 10000"
            value={form.goalAmount}
            onChange={(v) => setForm((p) => ({ ...p, goalAmount: v }))}
          />
        </Section>
        <Section icon={<Lock className="w-4 h-4" />} title="Privacidade">
          <ToggleField
            label="Ocultar valor que cada pessoa contribuiu"
            description="Quando ativado, o valor de cada pessoa não aparece no ranking público."
            checked={form.hideDonorAmount}
            onChange={(v) => setForm((p) => ({ ...p, hideDonorAmount: v }))}
          />
          <ToggleField
            label="Ocultar total arrecadado"
            description="Quando ativado, o valor total arrecadado não aparece no card público."
            checked={form.hideTotalRaised}
            onChange={(v) => setForm((p) => ({ ...p, hideTotalRaised: v }))}
          />
          <ToggleField
            label="Ocultar meta"
            description="Quando ativado, o valor da meta não aparece no card público."
            checked={form.hideGoal}
            onChange={(v) => setForm((p) => ({ ...p, hideGoal: v }))}
          />
        </Section>
      </>
    );
  }

  return (
    <Section icon={<Mail className="w-4 h-4" />} title="Sua conta">
      <p className="text-sm text-foreground/65 -mt-1">
        Use esses dados para acessar o painel e gerenciar sua caixinha depois.
      </p>
      <AuthField
        label="E-mail"
        type="email"
        placeholder="seu@email.com"
        value={form.email}
        onChange={(v) => setForm((p) => ({ ...p, email: v }))}
        autoComplete="email"
        icon={<Mail className="w-4 h-4" />}
      />
      <AuthField
        label="Senha"
        type={showPassword ? "text" : "password"}
        placeholder="Mínimo 6 caracteres"
        value={form.password}
        onChange={(v) => setForm((p) => ({ ...p, password: v }))}
        autoComplete="new-password"
        minLength={6}
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
      <AuthField
        label="Confirmar senha"
        type={showPassword ? "text" : "password"}
        placeholder="Repita a senha"
        value={form.confirmPassword}
        onChange={(v) => setForm((p) => ({ ...p, confirmPassword: v }))}
        autoComplete="new-password"
        icon={<Lock className="w-4 h-4" />}
      />
      <p className="text-xs text-foreground/55 leading-relaxed">
        Ao criar sua caixinha, você concorda com nossos{" "}
        <Link href="/termos" className="text-primary font-medium hover:underline">
          Termos de uso
        </Link>{" "}
        e{" "}
        <Link href="/privacidade" className="text-primary font-medium hover:underline">
          Política de privacidade
        </Link>
        .
      </p>
    </Section>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white border border-border/60 p-5 md:p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: `${PLATFORM_PRIMARY}15`,
            color: PLATFORM_PRIMARY,
          }}
        >
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function FormField({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
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
        className="w-full rounded-xl bg-white border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/50 transition-colors"
      />
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
    <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-[#fbf7ee] border border-border/60">
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
          style={{
            left: checked ? "calc(100% - 22px)" : "2px",
          }}
        />
      </button>
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
          className={`w-full rounded-xl bg-white border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 py-3 text-base text-foreground placeholder:text-muted-foreground/50 transition-colors ${
            icon ? "pl-10" : "pl-4"
          } ${trailing ? "pr-12" : "pr-4"}`}
        />
        {trailing && <div className="absolute right-3.5">{trailing}</div>}
      </div>
    </div>
  );
}
