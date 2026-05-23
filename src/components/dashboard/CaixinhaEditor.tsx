"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Loader2,
  Upload,
  Eye,
  Copy,
  Check,
  Heart,
  Info,
  Link2,
  Palette,
  Image as ImageIcon,
  AlertCircle,
  Lock,
  X,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import { COLOR_SWATCHES, DEFAULT_PRIMARY_COLOR } from "@/lib/theme-swatches";

interface CaixinhaForm {
  title: string;
  coupleNames: string;
  weddingDate: string;
  slug: string;
  description: string;
  goalAmount: string;
  primaryColor: string;
  coupleImageUrl: string;
  hideDonorAmount: boolean;
  hideTotalRaised: boolean;
  hideGoal: boolean;
}

function maskDateInput(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d
    .replace(/(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{2})(\d)/, "$1/$2");
}

function weddingDateInputToISO(masked: string): string | null {
  const m = masked.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const date = new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getUTCFullYear();
  if (year < 1900 || year > 2100) return null;
  return `${yyyy}-${mm}-${dd}`;
}

function isoToDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "";
  const [, yyyy, mm, dd] = m;
  return `${dd}/${mm}/${yyyy}`;
}

// Cor da plataforma (sempre fixa no painel — independente da cor da caixinha)
const PLATFORM_PRIMARY = DEFAULT_PRIMARY_COLOR;

export function CaixinhaEditor() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<CaixinhaForm>({
    title: "",
    coupleNames: "",
    weddingDate: "",
    slug: "",
    description: "",
    goalAmount: "",
    primaryColor: "#b8851f",
    coupleImageUrl: "",
    hideDonorAmount: true,
    hideTotalRaised: false,
    hideGoal: false,
  });

  const [isNew, setIsNew] = useState(true);

  useEffect(() => {
    async function loadCaixinha() {
      setLoading(true);
      try {
        const res = await fetch("/api/caixinhas");
        if (res.ok) {
          const data = await res.json();
          if (data.caixinha) {
            setIsNew(false);
            setForm({
              title: data.caixinha.title ?? "",
              coupleNames: data.caixinha.coupleNames ?? "",
              weddingDate: isoToDateInput(data.caixinha.weddingDate ?? null),
              slug: data.caixinha.slug ?? "",
              description: data.caixinha.description ?? "",
              goalAmount: data.caixinha.goalAmount?.toString() ?? "",
              primaryColor: data.caixinha.primaryColor ?? "#b8851f",
              coupleImageUrl: data.caixinha.coupleImageUrl ?? "",
              hideDonorAmount: data.caixinha.hideDonorAmount ?? true,
              hideTotalRaised: data.caixinha.hideTotalRaised ?? false,
              hideGoal: data.caixinha.hideGoal ?? false,
            });
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    if (session?.user) loadCaixinha();
  }, [session]);

  function handleCoupleName(value: string) {
    setForm((prev) => ({
      ...prev,
      coupleNames: value,
    }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 5MB.");
      return;
    }

    setUploadingImage(true);
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/upload/image", {
        method: "POST",
        body: fd,
      });
      if (res.ok) {
        const data = await res.json();
        setForm((prev) => ({ ...prev, coupleImageUrl: data.url }));
      } else {
        setError("Erro ao enviar a imagem.");
      }
    } catch {
      setError("Erro ao enviar a imagem.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    let weddingDateISO: string | null = null;
    if (form.weddingDate.trim()) {
      weddingDateISO = weddingDateInputToISO(form.weddingDate);
      if (!weddingDateISO) {
        setError("Data do casamento inválida. Use DD/MM/AAAA.");
        setSaving(false);
        return;
      }
    }

    const payload = {
      title: form.title,
      coupleNames: form.coupleNames,
      weddingDate: weddingDateISO ?? "",
      description: form.description,
      goalAmount: parseFloat(form.goalAmount),
      primaryColor: form.primaryColor,
      coupleImageUrl: form.coupleImageUrl,
      hideDonorAmount: form.hideDonorAmount,
      hideTotalRaised: form.hideTotalRaised,
      hideGoal: form.hideGoal,
    };

    try {
      const res = await fetch("/api/caixinhas", {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Não foi possível salvar agora. Tente novamente.");
      } else {
        setIsNew(false);
        if (data.caixinha?.slug) {
          setForm((prev) => ({ ...prev, slug: data.caixinha.slug }));
        }
        setSuccess(true);
      }
    } catch {
      setError("Sem conexão. Verifique e tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const caixinhaUrl = form.slug ? `${appUrl}/${form.slug}` : "";

  function copyLink() {
    navigator.clipboard.writeText(caixinhaUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2
          className="w-6 h-6 animate-spin"
          style={{ color: PLATFORM_PRIMARY }}
        />
        <p className="text-sm text-foreground/60">Carregando…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
        <SuccessModal
          slug={form.slug}
          onClose={() => setSuccess(false)}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
          <Section
            icon={<Info className="w-4 h-4" />}
            title="Informações"
            primaryColor={PLATFORM_PRIMARY}
          >
            <FormField
              label="Nome do casal"
              placeholder="Ex.: Ana e Pedro"
              value={form.coupleNames}
              onChange={handleCoupleName}
            />
            <FormField
              label="Data do casamento"
              placeholder="DD/MM/AAAA"
              value={form.weddingDate}
              onChange={(v) =>
                setForm({ ...form, weddingDate: maskDateInput(v) })
              }
              required={false}
            />
            <FormField
              label="Título da página"
              placeholder="Ex.: Ajude Ana e Pedro a realizarem o sonho"
              value={form.title}
              onChange={(v) => setForm({ ...form, title: v })}
            />
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Descrição
              </label>
              <textarea
                className="w-full rounded-xl bg-white border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/50 resize-none transition-colors"
                rows={3}
                placeholder="Conte como a caixinha vai ajudar vocês a realizarem o sonho…"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <FormField
              label="Meta de arrecadação (R$)"
              type="number"
              placeholder="Ex.: 10000"
              value={form.goalAmount}
              onChange={(v) => setForm({ ...form, goalAmount: v })}
            />
          </Section>

          {form.slug && (
            <Section
              icon={<Link2 className="w-4 h-4" />}
              title="Endereço da página"
              primaryColor={PLATFORM_PRIMARY}
            >
              <p className="text-xs text-foreground/55 mb-2">
                O código da sua caixinha é gerado automaticamente e não pode
                ser alterado.
              </p>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#fbf7ee] border border-border/60">
                <Link2 className="w-4 h-4 text-foreground/55 flex-shrink-0" />
                <p className="flex-1 text-sm text-foreground/70 truncate">
                  {caixinhaUrl}
                </p>
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-80"
                  style={{ color: PLATFORM_PRIMARY }}
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied ? "Copiado" : "Copiar"}
                </button>
                <a
                  href={caixinhaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-80"
                  style={{ color: PLATFORM_PRIMARY }}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Ver
                </a>
              </div>
            </Section>
          )}

          <Section
            icon={<Palette className="w-4 h-4" />}
            title="Cor principal"
            primaryColor={PLATFORM_PRIMARY}
          >
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {COLOR_SWATCHES.map((swatch) => {
                const selected =
                  form.primaryColor.toLowerCase() === swatch.hex.toLowerCase();
                return (
                  <button
                    key={swatch.hex}
                    type="button"
                    onClick={() =>
                      setForm({ ...form, primaryColor: swatch.hex })
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
                    setForm({ ...form, primaryColor: e.target.value })
                  }
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </label>
              <input
                type="text"
                value={form.primaryColor}
                onChange={(e) =>
                  setForm({ ...form, primaryColor: e.target.value })
                }
                className="flex-1 min-w-0 font-mono text-sm rounded-xl bg-white border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 px-3 py-2 transition-colors"
                maxLength={7}
                size={7}
              />
            </div>
          </Section>

          <Section
            icon={<ImageIcon className="w-4 h-4" />}
            title="Foto do casal"
            primaryColor={PLATFORM_PRIMARY}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            {form.coupleImageUrl ? (
              <div className="flex items-center gap-5 p-4 rounded-xl bg-[#fbf7ee] border border-border/60">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.coupleImageUrl}
                  alt="Foto do casal"
                  className="w-24 h-24 rounded-full object-cover flex-shrink-0"
                  style={{ border: `2px solid ${PLATFORM_PRIMARY}` }}
                />
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">
                    Foto carregada
                  </p>
                  <p className="text-xs text-foreground/60 mb-3">
                    Sua foto está pronta para a página.
                  </p>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="text-sm font-semibold transition-colors hover:opacity-80"
                    style={{ color: PLATFORM_PRIMARY }}
                  >
                    Trocar foto
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploadingImage}
                className="w-full rounded-2xl bg-[#fbf7ee] border-2 border-dashed border-border/60 hover:border-primary py-10 flex flex-col items-center gap-3 transition-colors group"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors"
                  style={{ backgroundColor: `${PLATFORM_PRIMARY}15` }}
                >
                  {uploadingImage ? (
                    <Loader2
                      className="w-6 h-6 animate-spin"
                      style={{ color: PLATFORM_PRIMARY }}
                    />
                  ) : (
                    <Upload
                      className="w-6 h-6"
                      style={{ color: PLATFORM_PRIMARY }}
                    />
                  )}
                </div>
                <p className="text-base font-semibold text-foreground">
                  {uploadingImage
                    ? "Enviando…"
                    : "Clique para enviar uma foto"}
                </p>
                <p className="text-xs text-foreground/55">
                  JPG, PNG ou WebP · máximo 5MB
                </p>
              </button>
            )}
          </Section>

          <Section
            icon={<Lock className="w-4 h-4" />}
            title="Privacidade"
            primaryColor={PLATFORM_PRIMARY}
          >
            <ToggleField
              label="Ocultar valor que cada pessoa contribuiu"
              description="Quando ativado, o valor de cada pessoa não aparece no ranking público."
              checked={form.hideDonorAmount}
              onChange={(v) => setForm({ ...form, hideDonorAmount: v })}
              primaryColor={PLATFORM_PRIMARY}
            />
            <ToggleField
              label="Ocultar total arrecadado"
              description="Quando ativado, o valor total arrecadado não aparece no card público."
              checked={form.hideTotalRaised}
              onChange={(v) => setForm({ ...form, hideTotalRaised: v })}
              primaryColor={PLATFORM_PRIMARY}
            />
            <ToggleField
              label="Ocultar meta"
              description="Quando ativado, o valor da meta não aparece no card público."
              checked={form.hideGoal}
              onChange={(v) => setForm({ ...form, hideGoal: v })}
              primaryColor={PLATFORM_PRIMARY}
            />
          </Section>

          <button
            type="submit"
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-white text-base font-semibold transition-all disabled:opacity-60 hover:shadow-xl hover:-translate-y-0.5 shadow-lg"
            style={{
              backgroundColor: PLATFORM_PRIMARY,
              boxShadow: `0 12px 28px -10px ${PLATFORM_PRIMARY}80`,
            }}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando…
              </>
            ) : (
              <>
                <Heart className="w-4 h-4" fill="currentColor" />
                {isNew ? "Criar minha caixinha" : "Salvar alterações"}
              </>
            )}
          </button>
      </form>
    </div>
  );
}

function Section({
  icon,
  title,
  primaryColor,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  primaryColor: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white border border-border/60 p-6 shadow-sm">
      <div className="flex items-center gap-2.5 mb-5">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: `${primaryColor}15`,
            color: primaryColor,
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

function SuccessModal({
  slug,
  onClose,
}: {
  slug: string;
  onClose: () => void;
}) {
  // Bloqueia scroll do body
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Fecha com ESC
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-reveal-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center text-foreground/55 hover:text-foreground hover:bg-[#fbf7ee] transition-colors z-10"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 md:p-10 text-center">
          {/* Success icon */}
          <div className="flex justify-center mb-5">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: `${PLATFORM_PRIMARY}15`,
              }}
            >
              <Check
                className="w-8 h-8"
                style={{ color: PLATFORM_PRIMARY }}
                strokeWidth={2.5}
              />
            </div>
          </div>

          <h3 className="font-display text-2xl md:text-3xl text-foreground mb-2">
            Caixinha salva
          </h3>
          <p className="text-base text-foreground/65 mb-7">
            Suas alterações foram aplicadas com sucesso.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href={`/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-white text-base font-semibold transition-all hover:shadow-xl hover:-translate-y-0.5 shadow-lg"
              style={{
                backgroundColor: PLATFORM_PRIMARY,
                boxShadow: `0 12px 28px -10px ${PLATFORM_PRIMARY}80`,
              }}
            >
              <ExternalLink className="w-4 h-4" />
              Ver caixinha
            </Link>
            <Link
              href="/painel"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-border/70 text-foreground/70 hover:text-foreground hover:bg-[#fbf7ee] hover:border-border text-base font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao painel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
  primaryColor,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  primaryColor: string;
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
          backgroundColor: checked ? primaryColor : "hsl(var(--border))",
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

function FormField({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  required = true,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
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
        required={required}
        className="w-full rounded-xl bg-white border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/50 transition-colors"
      />
    </div>
  );
}
