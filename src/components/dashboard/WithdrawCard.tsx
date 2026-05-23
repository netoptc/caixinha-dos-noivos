"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight,
  Check,
  HelpCircle,
  Hourglass,
  Loader2,
  ShieldCheck,
  Wallet,
  X,
  Zap,
  Info,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";


interface AnticipationPreview {
  eligible: boolean;
  reason?: string;
  items?: Array<{
    paymentId: string;
    simulation: { value: number; fee: number; netValue: number };
  }>;
  totals?: { gross: number; fee: number; net: number };
}

type PixKeyType = "CPF" | "EMAIL" | "PHONE" | "EVP";

interface BalanceResponse {
  available: number;
  pending: number;
  total: number;
  error?: string;
}

interface WithdrawCardProps {
  fallbackTotal: number;
}

const PIX_TYPE_OPTIONS: Array<{ v: PixKeyType; l: string }> = [
  { v: "CPF", l: "CPF" },
  { v: "EMAIL", l: "E-mail" },
  { v: "PHONE", l: "Celular" },
  { v: "EVP", l: "Aleatória" },
];

function maskCpfInput(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function maskPhoneInput(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

function validateHolderData(
  cpf: string,
  pixKey: string,
  pixKeyType: PixKeyType,
): string | null {
  if (cpf.replace(/\D/g, "").length !== 11) return "CPF inválido";
  if (pixKey.trim().length < 3) return "Informe a chave PIX";
  if (pixKeyType === "CPF" && pixKey.replace(/\D/g, "").length !== 11)
    return "Chave CPF deve ter 11 dígitos";
  if (
    pixKeyType === "EMAIL" &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pixKey)
  )
    return "Chave de e-mail inválida";
  if (
    pixKeyType === "PHONE" &&
    pixKey.replace(/\D/g, "").length < 10
  )
    return "Telefone inválido";
  return null;
}

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Por que existem dois saldos diferentes?",
    a: "PIX cai no seu saldo em poucas horas — pronto para sacar. Cartão de crédito leva até 30 dias por parcela para liberar (prazo padrão do cartão: o banco do pagador só repassa o dinheiro depois disso). Enquanto não liberar, o valor fica em \"A liberar\".",
  },
  {
    q: "Posso receber o dinheiro do cartão antes do prazo?",
    a: "Sim, com antecipação. Quando houver saldo a liberar, aparece o botão \"Antecipar e sacar\". A taxa de antecipação é proporcional ao tempo adiantado (a partir de 1,25% ao mês) e é descontada do valor que cai na sua chave PIX.",
  },
  {
    q: "Quanto tempo leva o saque?",
    a: "Após clicar em \"Sacar\", o dinheiro é transferido via PIX para sua chave em poucos segundos (normalmente menos de 1 minuto). Saques com antecipação caem em até 2 dias úteis após aprovação.",
  },
  {
    q: "Posso sacar quantas vezes quiser?",
    a: "Sim. Não há limite de número de saques nem tempo mínimo entre eles. O mínimo por saque é R$ 1.",
  },
  {
    q: "Tem prazo limite para sacar?",
    a: "Não. Seu saldo fica disponível indefinidamente enquanto sua caixinha estiver ativa.",
  },
];

export function WithdrawCard({ fallbackTotal }: WithdrawCardProps) {
  const primaryColor = "#b8851f";
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Dados do destinatário (sempre solicitados em cada saque)
  const [holderCpf, setHolderCpf] = useState("");
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>("CPF");
  const [pixKey, setPixKey] = useState("");

  // Anticipation
  const [anticipation, setAnticipation] = useState<AnticipationPreview | null>(
    null,
  );
  const [anticipOpen, setAnticipOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [anticipSubmitting, setAnticipSubmitting] = useState(false);
  const [anticipDone, setAnticipDone] = useState(false);
  const [anticipError, setAnticipError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    setLoadingBalance(true);
    try {
      const res = await fetch("/api/balance");
      if (res.ok) {
        setBalance((await res.json()) as BalanceResponse);
      }
    } catch {
      // ignore — UI shows N/A
    } finally {
      setLoadingBalance(false);
    }
  }, []);

  const fetchAnticipation = useCallback(async () => {
    try {
      const res = await fetch("/api/anticipations");
      if (res.ok) {
        setAnticipation((await res.json()) as AnticipationPreview);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void fetchBalance();
    void fetchAnticipation();
  }, [fetchBalance, fetchAnticipation]);

  const available = balance?.available ?? 0;
  const pending = balance?.pending ?? 0;
  const total = balance?.total ?? fallbackTotal;

  const canWithdraw = available >= 1;

  function openModal() {
    setAmount(available.toFixed(2));
    setHolderCpf("");
    setPixKeyType("CPF");
    setPixKey("");
    setError(null);
    setDone(false);
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setAmount("");
    setHolderCpf("");
    setPixKey("");
    setError(null);
    setDone(false);
  }

  async function submitAnticipation() {
    const holderErr = validateHolderData(holderCpf, pixKey, pixKeyType);
    if (holderErr) {
      setAnticipError(holderErr);
      return;
    }
    setAnticipSubmitting(true);
    setAnticipError(null);
    try {
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anticipate: true,
          cpf: holderCpf,
          pixKey,
          pixKeyType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAnticipError(data.error ?? "Não foi possível antecipar agora.");
        setAnticipSubmitting(false);
        return;
      }
      setAnticipDone(true);
      setAnticipSubmitting(false);
      void fetchBalance();
      void fetchAnticipation();
    } catch {
      setAnticipError("Sem conexão. Tente novamente.");
      setAnticipSubmitting(false);
    }
  }

  function closeAnticipModal() {
    setAnticipOpen(false);
    setAnticipDone(false);
    setAnticipError(null);
  }

  async function submitWithdrawal(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = parseFloat(amount.replace(",", "."));
    if (!parsed || parsed < 1) {
      setError("Valor mínimo: R$ 1,00");
      return;
    }
    if (parsed > available + 0.0001) {
      setError(
        `Saldo insuficiente. Disponível: ${formatCurrency(available)}.`,
      );
      return;
    }

    const holderErr = validateHolderData(holderCpf, pixKey, pixKeyType);
    if (holderErr) {
      setError(holderErr);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsed,
          anticipate: false,
          cpf: holderCpf,
          pixKey,
          pixKeyType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível processar o saque.");
        setSubmitting(false);
        return;
      }
      setDone(true);
      setSubmitting(false);
      void fetchBalance();
    } catch {
      setError("Sem conexão. Tente novamente em instantes.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="space-y-5">
        {/* ============ 3 BALANCE CARDS ============ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BalanceCell
            icon={<Wallet className="w-4 h-4" />}
            label="Total arrecadado"
            value={total}
            hint="Tudo que já caiu na caixinha"
            loading={loadingBalance}
            muted
          />
          <BalanceCell
            icon={<Hourglass className="w-4 h-4" />}
            label="A liberar"
            value={pending}
            hint="Cartão sendo liberado (até 30 dias)"
            loading={loadingBalance}
            muted
            action={
              pending > 0 &&
              anticipation?.eligible &&
              (anticipation.totals?.gross ?? 0) > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setAnticipOpen(true);
                    setAnticipDone(false);
                    setAnticipError(null);
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  style={{
                    backgroundColor: `${primaryColor}15`,
                    color: primaryColor,
                  }}
                >
                  <Zap className="w-3.5 h-3.5" />
                  Antecipar
                </button>
              ) : null
            }
          />
          <BalanceCell
            icon={<ShieldCheck className="w-4 h-4" />}
            label="Disponível para saque"
            value={available}
            hint="Pronto para sacar via PIX agora"
            loading={loadingBalance}
            highlight
            primaryColor={primaryColor}
          />
        </div>

        {/* ============ ACTION BLOCK ============ */}
        <div
          className="rounded-2xl p-5 md:p-6 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
          }}
        >
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="text-white">
              <p className="text-xs opacity-80 mb-0.5">Pronto para sacar?</p>
              <p className="text-base font-semibold">
                Informe a chave PIX no momento do saque
              </p>
              <p className="text-xs opacity-75 mt-1">
                Cai via PIX em poucos segundos
              </p>
            </div>
            <button
              type="button"
              onClick={openModal}
              disabled={!canWithdraw}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white text-base font-semibold transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              style={{ color: primaryColor }}
              title={available < 1 ? "Sem saldo disponível para saque" : undefined}
            >
              <ArrowUpRight className="w-4 h-4" />
              Sacar
            </button>
          </div>
        </div>

        {/* ============ FAQ TRIGGER ============ */}
        <button
          type="button"
          onClick={() => setFaqOpen(true)}
          className="w-full md:w-auto md:self-start inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold text-foreground/75 bg-white border border-border/60 hover:text-foreground hover:bg-[#fbf7ee] hover:border-border transition-colors"
          aria-haspopup="dialog"
          aria-expanded={faqOpen}
        >
          <HelpCircle className="w-4 h-4" style={{ color: primaryColor }} />
          Entenda os prazos e taxas
        </button>
      </div>

      {/* ============ MODAL FAQ ============ */}
      {faqOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="withdraw-faq-title"
          className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setFaqOpen(false);
          }}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl animate-reveal-up overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 md:px-7 pt-7 pb-4 flex items-start justify-between gap-4">
              <div>
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{
                    backgroundColor: `${primaryColor}26`,
                    color: primaryColor,
                  }}
                >
                  <HelpCircle className="w-6 h-6" />
                </div>
                <h3
                  id="withdraw-faq-title"
                  className="font-display text-2xl text-foreground"
                >
                  Prazos e taxas
                </h3>
                <p className="text-sm text-foreground/65 mt-1">
                  Tudo o que você precisa saber sobre saldos, antecipação e
                  saque.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFaqOpen(false)}
                className="text-foreground/55 hover:text-foreground p-1 -mr-1 -mt-1 flex-shrink-0"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 md:px-7 pb-2 space-y-5 overflow-y-auto">
              {FAQ_ITEMS.map((item) => (
                <div key={item.q}>
                  <p className="text-sm font-semibold text-foreground mb-1">
                    {item.q}
                  </p>
                  <p className="text-sm text-foreground/70 leading-relaxed">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>

            <div className="px-6 md:px-7 py-4 mt-2 border-t border-border/40 flex justify-end">
              <button
                type="button"
                onClick={() => setFaqOpen(false)}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
                style={{ backgroundColor: primaryColor }}
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL ANTECIPAR ============ */}
      {anticipOpen && anticipation?.totals && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
          onClick={closeAnticipModal}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-reveal-up"
            onClick={(e) => e.stopPropagation()}
          >
            {anticipDone ? (
              <div className="p-8 text-center">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <Check
                    className="w-7 h-7"
                    style={{ color: primaryColor }}
                    strokeWidth={3}
                  />
                </div>
                <h3 className="font-display text-2xl text-foreground mb-2">
                  Saque solicitado
                </h3>
                <p className="text-sm text-foreground/65 mb-6">
                  Antecipamos os pagamentos pendentes — o valor líquido cai na
                  sua chave PIX em até 2 dias úteis.
                </p>
                <button
                  onClick={closeAnticipModal}
                  className="w-full px-6 py-3 rounded-2xl text-white text-base font-semibold transition-all hover:opacity-90"
                  style={{ backgroundColor: primaryColor }}
                >
                  Fechar
                </button>
              </div>
            ) : (
              <div className="p-6 md:p-7">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="font-display text-2xl text-foreground">
                      Antecipar e sacar tudo
                    </h3>
                    <p className="text-sm text-foreground/65 mt-1">
                      Receba seu cartão de crédito antes do prazo de 30 dias e
                      saque tudo na sua chave PIX agora.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeAnticipModal}
                    className="text-foreground/55 hover:text-foreground p-1 -mr-1 -mt-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 mb-5">
                  {available > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground/65">Saldo já disponível</span>
                      <span className="font-semibold tabular-nums">
                        {formatCurrency(available)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground/65">Valor a antecipar</span>
                    <span className="font-semibold tabular-nums">
                      {formatCurrency(anticipation.totals.gross)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground/65">Taxa de antecipação</span>
                    <span
                      className="font-semibold tabular-nums"
                      style={{ color: "#b91c1c" }}
                    >
                      − {formatCurrency(anticipation.totals.fee)}
                    </span>
                  </div>
                  <div className="border-t border-border/60 pt-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">
                      Cai na sua chave PIX
                    </span>
                    <span
                      className="font-display text-2xl tabular-nums"
                      style={{ color: primaryColor }}
                    >
                      {formatCurrency(available + anticipation.totals.net)}
                    </span>
                  </div>
                </div>

                <HolderFields
                  holderCpf={holderCpf}
                  setHolderCpf={setHolderCpf}
                  pixKeyType={pixKeyType}
                  setPixKeyType={setPixKeyType}
                  pixKey={pixKey}
                  setPixKey={setPixKey}
                  primaryColor={primaryColor}
                />

                <div className="rounded-xl bg-[#fbf7ee] border border-border/60 p-3 mb-5 flex gap-2">
                  <Info className="w-4 h-4 text-foreground/55 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground/70 leading-relaxed">
                    O valor cai na chave informada em até 2 dias úteis após a
                    aprovação da antecipação. Não é possível cancelar depois de
                    confirmada.
                  </p>
                </div>

                {anticipError && (
                  <div className="rounded-xl bg-destructive/5 border border-destructive/30 px-4 py-3 mb-4 text-sm text-destructive">
                    {anticipError}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeAnticipModal}
                    className="flex-1 px-6 py-3 rounded-2xl border border-border/70 text-foreground/70 hover:text-foreground hover:bg-[#fbf7ee] text-base font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={submitAnticipation}
                    disabled={anticipSubmitting}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-white text-base font-semibold transition-all disabled:opacity-50 hover:shadow-lg"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {anticipSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processando…
                      </>
                    ) : (
                      "Confirmar"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ MODAL SAQUE ============ */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-reveal-up"
            onClick={(e) => e.stopPropagation()}
          >
            {done ? (
              <div className="p-8 text-center">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <Check
                    className="w-7 h-7"
                    style={{ color: primaryColor }}
                    strokeWidth={3}
                  />
                </div>
                <h3 className="font-display text-2xl text-foreground mb-2">
                  Saque solicitado
                </h3>
                <p className="text-sm text-foreground/65 mb-6">
                  O dinheiro cai na sua chave PIX em poucos segundos.
                </p>
                <button
                  onClick={closeModal}
                  className="w-full px-6 py-3 rounded-2xl text-white text-base font-semibold transition-all hover:opacity-90"
                  style={{ backgroundColor: primaryColor }}
                >
                  Fechar
                </button>
              </div>
            ) : (
              <form onSubmit={submitWithdrawal} className="p-6 md:p-7">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="font-display text-2xl text-foreground">
                      Confirmar saque
                    </h3>
                    <p className="text-sm text-foreground/65 mt-1">
                      Saldo disponível: {formatCurrency(available)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="text-foreground/55 hover:text-foreground p-1 -mr-1 -mt-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Valor a sacar
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
                      step="0.01"
                      min="1"
                      max={available}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full rounded-xl bg-white border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 pl-12 pr-20 py-3 text-base text-foreground tabular-nums transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setAmount(available.toFixed(2))}
                      className="absolute right-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                      style={{
                        backgroundColor: `${primaryColor}15`,
                        color: primaryColor,
                      }}
                    >
                      Tudo
                    </button>
                  </div>
                </div>

                <HolderFields
                  holderCpf={holderCpf}
                  setHolderCpf={setHolderCpf}
                  pixKeyType={pixKeyType}
                  setPixKeyType={setPixKeyType}
                  pixKey={pixKey}
                  setPixKey={setPixKey}
                  primaryColor={primaryColor}
                />

                <div className="rounded-lg bg-[#fbf7ee] border border-border/60 p-3 mb-5 text-xs text-foreground/70">
                  <p className="font-semibold mb-0.5">Cai em poucos segundos</p>
                  <p className="opacity-80">
                    Transferência via PIX para a chave informada.
                  </p>
                </div>

                {error && (
                  <div className="rounded-xl bg-destructive/5 border border-destructive/30 px-4 py-3 mb-4 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-6 py-3 rounded-2xl border border-border/70 text-foreground/70 hover:text-foreground hover:bg-[#fbf7ee] text-base font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-white text-base font-semibold transition-all disabled:opacity-50 hover:shadow-lg"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processando…
                      </>
                    ) : (
                      "Confirmar saque"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function HolderFields({
  holderCpf,
  setHolderCpf,
  pixKeyType,
  setPixKeyType,
  pixKey,
  setPixKey,
  primaryColor,
}: {
  holderCpf: string;
  setHolderCpf: (v: string) => void;
  pixKeyType: PixKeyType;
  setPixKeyType: (v: PixKeyType) => void;
  pixKey: string;
  setPixKey: (v: string) => void;
  primaryColor: string;
}) {
  return (
    <div className="space-y-4 mb-5">
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          CPF do titular
        </label>
        <input
          type="text"
          inputMode="numeric"
          placeholder="000.000.000-00"
          value={holderCpf}
          onChange={(e) => setHolderCpf(maskCpfInput(e.target.value))}
          className="w-full rounded-xl bg-white border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 px-4 py-3 text-base text-foreground tabular-nums transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          Tipo de chave PIX
        </label>
        <div className="grid grid-cols-4 gap-2">
          {PIX_TYPE_OPTIONS.map((opt) => {
            const selected = pixKeyType === opt.v;
            return (
              <button
                key={opt.v}
                type="button"
                onClick={() => {
                  setPixKeyType(opt.v);
                  setPixKey(opt.v === "CPF" ? holderCpf : "");
                }}
                className="rounded-xl py-2 text-xs font-semibold transition-all"
                style={{
                  backgroundColor: selected ? primaryColor : "white",
                  color: selected ? "#fff" : "hsl(var(--foreground))",
                  border: `1px solid ${selected ? primaryColor : "hsl(var(--border))"}`,
                }}
              >
                {opt.l}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          Chave PIX
        </label>
        <input
          type="text"
          placeholder={
            pixKeyType === "CPF"
              ? "000.000.000-00"
              : pixKeyType === "EMAIL"
                ? "seu@email.com"
                : pixKeyType === "PHONE"
                  ? "(11) 99999-9999"
                  : "chave aleatória"
          }
          value={pixKey}
          onChange={(e) => {
            let next = e.target.value;
            if (pixKeyType === "CPF") next = maskCpfInput(next);
            else if (pixKeyType === "PHONE") next = maskPhoneInput(next);
            setPixKey(next);
          }}
          className="w-full rounded-xl bg-white border border-input focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 px-4 py-3 text-base text-foreground transition-colors"
        />
      </div>
    </div>
  );
}

function BalanceCell({
  icon,
  label,
  value,
  hint,
  loading,
  highlight,
  muted,
  primaryColor = "#b8851f",
  action,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint: string;
  loading: boolean;
  highlight?: boolean;
  muted?: boolean;
  primaryColor?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl p-5 ${highlight ? "" : "bg-white"} border`}
      style={{
        borderColor: highlight ? primaryColor : "hsl(var(--border) / 0.6)",
        borderWidth: highlight ? 2 : 1,
        backgroundColor: highlight ? `${primaryColor}08` : undefined,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{
            backgroundColor: highlight
              ? `${primaryColor}20`
              : "hsl(var(--muted))",
            color: highlight ? primaryColor : "hsl(var(--muted-foreground))",
          }}
        >
          {icon}
        </div>
        <p
          className="text-xs font-semibold"
          style={{
            color: highlight
              ? primaryColor
              : muted
                ? "hsl(var(--muted-foreground))"
                : undefined,
          }}
        >
          {label}
        </p>
      </div>
      <p
        className="font-display text-2xl tabular-nums tracking-tight"
        style={{
          color: highlight ? primaryColor : "hsl(var(--foreground))",
        }}
      >
        {loading ? "—" : formatCurrency(value)}
      </p>
      <p className="text-xs text-foreground/55 mt-1.5 leading-snug">{hint}</p>
      {action}
    </div>
  );
}
