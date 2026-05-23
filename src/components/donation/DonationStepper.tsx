"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  CreditCard,
} from "lucide-react";

// Ícone PIX inline (usa currentColor pra puxar a cor primária da caixinha)
function PixIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M11.917 11.71a2.046 2.046 0 0 1-1.454-.602l-2.1-2.1a.4.4 0 0 0-.551 0l-2.108 2.108a2.044 2.044 0 0 1-1.454.602h-.414l2.66 2.66c.83.83 2.177.83 3.007 0l2.667-2.668h-.253zM4.25 4.282c.55 0 1.066.214 1.454.602l2.108 2.108a.39.39 0 0 0 .552 0l2.1-2.1a2.044 2.044 0 0 1 1.453-.602h.253L9.503 1.623a2.127 2.127 0 0 0-3.007 0l-2.66 2.66h.414z" />
      <path d="m14.377 6.496-1.612-1.612a.307.307 0 0 1-.114.023h-.733c-.379 0-.75.154-1.017.422l-2.1 2.1a1.005 1.005 0 0 1-1.425 0L5.268 5.32a1.448 1.448 0 0 0-1.018-.422h-.9a.306.306 0 0 1-.109-.021L1.623 6.496c-.83.83-.83 2.177 0 3.008l1.618 1.618a.305.305 0 0 1 .108-.022h.901c.38 0 .75-.153 1.018-.421L7.375 8.57a1.034 1.034 0 0 1 1.426 0l2.1 2.1c.267.268.638.421 1.017.421h.733c.04 0 .079.01.114.024l1.612-1.612c.83-.83.83-2.178 0-3.008z" />
    </svg>
  );
}
import { PaymentPix } from "./PaymentPix";
import { PaymentCard } from "./PaymentCard";
import { MediaCapture } from "./MediaCapture";
import { formatCurrency, maskPhone } from "@/lib/utils";
import { StepIndicator } from "@/components/ui/StepIndicator";

interface CaixinhaInfo {
  slug: string;
  title: string;
  coupleNames: string;
  primaryColor: string;
  id: string;
}

interface DonationStepperProps {
  caixinha: CaixinhaInfo;
}

type PaymentMethod = "PIX" | "CREDIT_CARD";
type Step = "amount" | "info" | "video" | "method" | "pix" | "card";

interface GatewayFees {
  pixFixed: number;
  cardFixed: number;
  cardVistaPct: number;
  card2to6Pct: number;
  card7to12Pct: number;
}

interface FeeRates {
  PIX: number;
  CREDIT_CARD: number;
  gateway?: GatewayFees;
}

const PRESET_AMOUNTS = [50, 100, 200, 500];

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function calcTotal(
  amount: number,
  feePercent: number,
  method: PaymentMethod,
  gateway?: GatewayFees,
) {
  const platformFee = round2(amount * feePercent);
  let asaasFee = 0;
  if (gateway) {
    if (method === "PIX") {
      asaasFee = round2(gateway.pixFixed);
    } else {
      // Show the "à vista" total on the method picker. The card form lets the
      // donor pick an installment tier and recomputes the total with the right
      // Asaas percentage there.
      const subtotal = amount + platformFee;
      const total = (subtotal + gateway.cardFixed) / (1 - gateway.cardVistaPct);
      asaasFee = round2(total - subtotal);
    }
  }
  return {
    fee: round2(platformFee + asaasFee),
    platformFee,
    asaasFee,
    total: round2(amount + platformFee + asaasFee),
  };
}

const STEPS: { id: "amount" | "info" | "video" | "method"; label: string }[] = [
  { id: "amount", label: "Valor" },
  { id: "info", label: "Sobre você" },
  { id: "video", label: "Vídeo" },
  { id: "method", label: "Pagamento" },
];

export function DonationStepper({ caixinha }: DonationStepperProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [donorName, setDonorName] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [donationId, setDonationId] = useState<string | null>(null);
  const [donationTotal, setDonationTotal] = useState<number>(0);
  const [creatingDonation, setCreatingDonation] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feeRates, setFeeRates] = useState<FeeRates>({
    PIX: 0.02,
    CREDIT_CARD: 0.05,
  });

  useEffect(() => {
    fetch("/api/fees")
      .then((r) => r.json())
      .then((data: FeeRates) => setFeeRates(data))
      .catch(() => {});
  }, []);

  const finalAmount = amount ?? (customAmount ? parseFloat(customAmount) : 0);
  const { primaryColor } = caixinha;

  function validateStep1() {
    if (!finalAmount || finalAmount < 5) {
      setErrors({ amount: "Valor mínimo: R$ 5,00" });
      return false;
    }
    setErrors({});
    return true;
  }

  function validateStep2() {
    const errs: Record<string, string> = {};
    if (!donorName.trim() || donorName.trim().length < 2)
      errs.name = "Informe seu nome";
    const phoneDigits = donorPhone.replace(/\D/g, "");
    if (phoneDigits.length < 10) errs.phone = "Informe um telefone válido";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // Step 3 (vídeo) é opcional — não tem validação obrigatória.

  async function createDonationAndProceed(method: PaymentMethod) {
    setCreatingDonation(true);
    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caixinhaId: caixinha.id,
          donorName: donorName.trim(),
          donorPhone: donorPhone.replace(/\D/g, ""),
          amount: finalAmount,
          videoUrl: videoUrl || undefined,
          paymentMethod: method,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setDonationId(data.donation.id);
        setDonationTotal(Number(data.donation.totalAmount));
        setPaymentMethod(method);
        setStep(method === "PIX" ? "pix" : "card");
      } else {
        setErrors({
          payment:
            data.error ||
            "Não conseguimos processar agora. Tente novamente em um instante.",
        });
      }
    } catch {
      setErrors({
        payment: "Sem conexão. Verifique sua internet e tente novamente.",
      });
    } finally {
      setCreatingDonation(false);
    }
  }

  function handleSuccess() {
    router.push(
      `/${caixinha.slug}/doe/obrigado?nome=${encodeURIComponent(donorName)}&valor=${finalAmount}`
    );
  }

  const indicatorPos: 0 | 1 | 2 | 3 =
    step === "amount" ? 0 : step === "info" ? 1 : step === "video" ? 2 : 3;

  function goBack() {
    setErrors({});
    switch (step) {
      case "amount":
        router.push(`/${caixinha.slug}`);
        return;
      case "info":
        setStep("amount");
        return;
      case "video":
        setStep("info");
        return;
      case "method":
        setStep("video");
        return;
      case "pix":
      case "card":
        setStep("method");
        setDonationId(null);
        return;
    }
  }

  return (
    <>
      <header className="border-b border-border/60 bg-background/85 backdrop-blur-md sticky top-0 z-30 font-sans">
        <div className="container mx-auto max-w-2xl px-5 md:px-8 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-foreground/65 hover:text-foreground hover:bg-[#fbf7ee] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Voltar</span>
          </button>
          <div className="text-right">
            <p className="text-sm font-semibold text-foreground leading-tight truncate max-w-[200px]">
              {caixinha.coupleNames}
            </p>
            <p className="text-xs mt-0.5" style={{ color: primaryColor }}>
              Contribuição
            </p>
          </div>
        </div>
      </header>

      <div className="relative container mx-auto max-w-md px-5 md:px-8 py-12 md:py-16 font-sans">
      <StepIndicator
        steps={STEPS}
        currentIndex={indicatorPos}
        primaryColor={primaryColor}
        className="mb-10"
      />

      {/* ============ STEP: AMOUNT ============ */}
      {step === "amount" && (
        <div className="space-y-7 animate-fade-in">
          <div>
            <p
              className="text-xs font-semibold mb-2"
              style={{ color: primaryColor }}
            >
              Passo 1
            </p>
            <h2 className="font-display text-2xl md:text-3xl text-foreground leading-tight">
              Quanto você quer contribuir?
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {PRESET_AMOUNTS.map((preset) => {
              const selected = amount === preset && !customMode;
              return (
                <button
                  key={preset}
                  onClick={() => {
                    setAmount(preset);
                    setCustomAmount("");
                    setCustomMode(false);
                    setErrors({});
                  }}
                  className="rounded-2xl py-5 px-4 text-center transition-all hover:-translate-y-0.5"
                  style={{
                    backgroundColor: selected ? primaryColor : "white",
                    color: selected ? "#fff" : "hsl(var(--foreground))",
                    border: `1px solid ${selected ? primaryColor : "hsl(var(--border))"}`,
                    boxShadow: selected
                      ? `0 8px 20px -8px ${primaryColor}80`
                      : "none",
                  }}
                >
                  <span className="font-display text-2xl tabular-nums tracking-tight block">
                    {formatCurrency(preset)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Outro valor — botão que abre o input */}
          <button
            type="button"
            onClick={() => {
              setCustomMode(true);
              setAmount(null);
              setErrors({});
            }}
            className="w-full rounded-2xl py-4 text-center text-base font-semibold transition-all hover:-translate-y-0.5"
            style={{
              backgroundColor: customMode ? primaryColor : "white",
              color: customMode ? "#fff" : "hsl(var(--foreground))",
              border: `1px solid ${customMode ? primaryColor : "hsl(var(--border))"}`,
              boxShadow: customMode
                ? `0 8px 20px -8px ${primaryColor}80`
                : "none",
            }}
          >
            Outro valor
          </button>

          {customMode && (
            <div className="animate-fade-in">
              <label className="block text-sm font-semibold text-foreground mb-2">
                Quanto você quer contribuir?
              </label>
              <div className="relative flex items-center">
                <span
                  className="absolute left-4 text-base font-semibold pointer-events-none"
                  style={{ color: primaryColor }}
                >
                  R$
                </span>
                <input
                  type="number"
                  min="5"
                  step="0.01"
                  placeholder="0,00"
                  autoFocus
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setErrors({});
                  }}
                  className="w-full rounded-xl bg-white border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 pl-12 pr-4 py-3 text-base text-foreground placeholder:text-muted-foreground/50 tabular-nums transition-colors"
                />
              </div>
            </div>
          )}

          {errors.amount && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.amount}
            </p>
          )}

          {finalAmount > 0 && (
            <div
              className="rounded-2xl px-5 py-4 flex items-center justify-between animate-fade-in"
              style={{
                backgroundColor: `${primaryColor}10`,
                border: `1px solid ${primaryColor}40`,
              }}
            >
              <span className="text-sm text-foreground/70">
                Você vai contribuir com
              </span>
              <span
                className="font-display text-xl tabular-nums"
                style={{ color: primaryColor }}
              >
                {formatCurrency(finalAmount)}
              </span>
            </div>
          )}

          <button
            onClick={() => validateStep1() && setStep("info")}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-white text-base font-semibold transition-all hover:shadow-xl hover:-translate-y-0.5 shadow-lg"
            style={{
              backgroundColor: primaryColor,
              boxShadow: `0 12px 28px -10px ${primaryColor}80`,
            }}
          >
            Continuar
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ============ STEP: INFO ============ */}
      {step === "info" && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <p
              className="text-xs font-semibold mb-2"
              style={{ color: primaryColor }}
            >
              Passo 2
            </p>
            <h2 className="font-display text-2xl md:text-3xl text-foreground leading-tight">
              Sobre você
            </h2>
            <p className="text-sm text-foreground/65 mt-2">
              Para que o casal saiba quem deixou esse carinho.
            </p>
          </div>

          <div
            className="rounded-2xl px-5 py-4 flex items-center justify-between"
            style={{
              backgroundColor: `${primaryColor}10`,
              border: `1px solid ${primaryColor}40`,
            }}
          >
            <span className="text-sm text-foreground/70">Sua contribuição</span>
            <span
              className="font-display text-lg tabular-nums"
              style={{ color: primaryColor }}
            >
              {formatCurrency(finalAmount)}
            </span>
          </div>

          <Field
            label="Seu nome"
            placeholder="Como vai aparecer no ranking"
            value={donorName}
            onChange={setDonorName}
            error={errors.name}
          />

          <Field
            label="WhatsApp"
            type="tel"
            placeholder="(11) 99999-9999"
            value={donorPhone}
            onChange={(v) => setDonorPhone(maskPhone(v))}
            error={errors.phone}
          />

          <button
            onClick={() => validateStep2() && setStep("video")}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-white text-base font-semibold transition-all hover:shadow-xl hover:-translate-y-0.5 shadow-lg"
            style={{
              backgroundColor: primaryColor,
              boxShadow: `0 12px 28px -10px ${primaryColor}80`,
            }}
          >
            Continuar
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ============ STEP: VIDEO ============ */}
      {step === "video" && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <p
              className="text-xs font-semibold mb-2"
              style={{ color: primaryColor }}
            >
              Passo 3
            </p>
            <h2 className="font-display text-2xl md:text-3xl text-foreground leading-tight">
              Grave um vídeo
            </h2>
            <p className="text-sm text-foreground/65 mt-2">
              Deixe uma mensagem em vídeo pro casal. É opcional.
            </p>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-2">
              <label className="block text-sm font-semibold text-foreground">
                Vídeo (até 10s)
              </label>
              {videoUrl && (
                <span
                  className="text-xs font-semibold"
                  style={{ color: primaryColor }}
                >
                  Vídeo anexado ✓
                </span>
              )}
            </div>
            <p className="text-xs text-foreground/55 mb-3">
              Grave um vídeo curto direto pela câmera.
            </p>
            <MediaCapture
              onVideoReady={setVideoUrl}
              primaryColor={primaryColor}
            />
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => setStep("method")}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-white text-base font-semibold transition-all hover:shadow-xl hover:-translate-y-0.5 shadow-lg"
              style={{
                backgroundColor: primaryColor,
                boxShadow: `0 12px 28px -10px ${primaryColor}80`,
              }}
            >
              Continuar
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setVideoUrl(null);
                setStep("method");
              }}
              type="button"
              className="w-full px-6 py-3 rounded-2xl text-sm font-semibold text-foreground/65 hover:text-foreground hover:bg-[#fbf7ee] transition-colors"
            >
              Pular esta etapa
            </button>
          </div>
        </div>
      )}

      {/* ============ STEP: METHOD ============ */}
      {step === "method" && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <p
              className="text-xs font-semibold mb-2"
              style={{ color: primaryColor }}
            >
              Passo 4
            </p>
            <h2 className="font-display text-2xl md:text-3xl text-foreground leading-tight">
              Como você vai pagar?
            </h2>
            <p className="text-sm text-foreground/65 mt-2">
              Uma pequena taxa de serviço será adicionada ao total.
            </p>
          </div>

          {errors.payment && (
            <div
              className="rounded-2xl bg-destructive/5 border border-destructive/30 px-5 py-4 flex items-start gap-3"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-destructive">
                  Não foi dessa vez
                </p>
                <p className="text-sm text-foreground/80 mt-0.5">
                  {errors.payment}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {(
              [
                {
                  method: "PIX" as PaymentMethod,
                  label: "PIX",
                  subtitle: "Pagamento instantâneo",
                  icon: <PixIcon className="w-5 h-5" />,
                },
                {
                  method: "CREDIT_CARD" as PaymentMethod,
                  label: "Cartão de Crédito",
                  subtitle: "Até 12x sem juros",
                  icon: <CreditCard className="w-5 h-5" />,
                },
              ] as const
            ).map(({ method, label, subtitle, icon }) => {
              const { fee, total } = calcTotal(
                finalAmount,
                feeRates[method],
                method,
                feeRates.gateway,
              );
              return (
                <PaymentOption
                  key={method}
                  label={label}
                  subtitle={subtitle}
                  icon={icon}
                  fee={fee}
                  total={total}
                  primaryColor={primaryColor}
                  isLoading={creatingDonation}
                  onClick={() => createDonationAndProceed(method)}
                />
              );
            })}
          </div>

          <p className="text-xs text-foreground/55 text-center leading-relaxed">
            A taxa cobre custos de processamento e fica com o serviço, não com
            o casal.
          </p>
        </div>
      )}

      {/* ============ STEP: PIX ============ */}
      {step === "pix" && donationId && (
        <div className="animate-fade-in space-y-6">
          <h2 className="font-display text-2xl md:text-3xl text-foreground leading-tight">
            Pagar com PIX
          </h2>
          <PaymentPix
            amount={donationTotal}
            donationId={donationId}
            onSuccess={handleSuccess}
            primaryColor={primaryColor}
          />
        </div>
      )}

      {/* ============ STEP: CARD ============ */}
      {step === "card" && donationId && paymentMethod === "CREDIT_CARD" && (
        <div className="animate-fade-in space-y-6">
          <h2 className="font-display text-2xl md:text-3xl text-foreground leading-tight">
            Cartão de crédito
          </h2>
          {feeRates.gateway && (
            <PaymentCard
              baseAmount={finalAmount}
              platformFeePct={feeRates.CREDIT_CARD}
              gateway={feeRates.gateway}
              donationId={donationId}
              onSuccess={handleSuccess}
              primaryColor={primaryColor}
            />
          )}
        </div>
      )}
      </div>
    </>
  );
}

function Field({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
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

function PaymentOption({
  label,
  subtitle,
  icon,
  fee,
  total,
  primaryColor,
  isLoading,
  onClick,
}: {
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  fee: number;
  total: number;
  primaryColor: string;
  isLoading: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={isLoading}
      type="button"
      className="w-full rounded-2xl bg-white p-5 text-left transition-all hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      style={{
        border: `1px solid ${hovered ? primaryColor : "hsl(var(--border) / 0.6)"}`,
      }}
    >
      <div className="flex items-center gap-4 mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: `${primaryColor}15`,
            color: primaryColor,
          }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-foreground">{label}</p>
          <p className="text-xs text-foreground/65">{subtitle}</p>
        </div>
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-foreground/55" />
        ) : (
          <ArrowRight
            className="w-4 h-4 transition-colors"
            style={{ color: hovered ? primaryColor : "hsl(var(--foreground) / 0.55)" }}
          />
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/40">
        <div>
          <p className="text-xs text-foreground/55 mb-0.5">Taxa de serviço</p>
          <p className="text-sm font-semibold tabular-nums text-foreground/80">
            {formatCurrency(fee)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-foreground/55 mb-0.5">Total a pagar</p>
          <p
            className="text-base font-semibold tabular-nums"
            style={{ color: primaryColor }}
          >
            {formatCurrency(total)}
          </p>
        </div>
      </div>
    </button>
  );
}
