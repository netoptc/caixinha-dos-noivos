"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Loader2, AlertCircle } from "lucide-react";
import { PaymentSummary } from "./PaymentSummary";

const POLL_INTERVAL_MS = 4000;

interface PaymentPixProps {
  /** Valor que o casal recebe (sem a taxa) */
  subtotal: number;
  /** Taxa de serviço somada ao subtotal */
  fee: number;
  /** Valor total cobrado (subtotal + taxa) */
  amount: number;
  donationId: string;
  onSuccess: () => void;
  primaryColor?: string;
}

interface PixData {
  paymentId: string;
  pixQrCode: string; // copia-cola payload
  pixQrCodeImage: string; // base64 PNG
  status: string;
}

export function PaymentPix({
  subtotal,
  fee,
  amount,
  donationId,
  onSuccess,
  primaryColor = "#b8851f",
}: PaymentPixProps) {
  const [pix, setPix] = useState<PixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Create the PIX charge on the gateway as soon as this component mounts
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/payments/pix", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ donationId }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? "Não foi possível gerar o PIX.");
        } else {
          setPix({
            paymentId: data.paymentId,
            pixQrCode: data.pixQrCode,
            pixQrCodeImage: data.pixQrCodeImage,
            status: data.status,
          });
          if (data.status === "CONFIRMED") {
            onSuccess();
          }
        }
      } catch {
        if (!cancelled) setError("Sem conexão. Tente novamente em instantes.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [donationId, onSuccess]);

  // Poll donation status — webhook is the source of truth, this just refreshes the UI
  useEffect(() => {
    if (!pix || pix.status === "CONFIRMED") return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/donations/${donationId}/status`);
        if (!res.ok) return;
        const data = (await res.json()) as { status: string };
        if (data.status === "CONFIRMED") {
          clearInterval(interval);
          onSuccess();
        }
      } catch {
        // ignore
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [pix, donationId, onSuccess]);

  function copyCode() {
    if (!pix) return;
    navigator.clipboard.writeText(pix.pixQrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6 font-sans">
      <PaymentSummary
        subtotal={subtotal}
        fee={fee}
        total={amount}
        primaryColor={primaryColor}
      />

      {loading && (
        <div className="flex flex-col items-center gap-3 py-10">
          <Loader2
            className="w-7 h-7 animate-spin"
            style={{ color: primaryColor }}
          />
          <p className="text-sm text-foreground/65">Gerando seu QR Code…</p>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-2xl bg-destructive/5 border border-destructive/30 px-5 py-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">
              Não foi possível gerar o PIX
            </p>
            <p className="text-sm text-foreground/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {pix && !error && (
        <>
          <div className="flex justify-center">
            <div
              className="bg-white rounded-2xl p-5 shadow-md"
              style={{ border: `1px solid ${primaryColor}40` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/png;base64,${pix.pixQrCodeImage}`}
                alt="QR Code PIX"
                className="w-48 h-48"
              />
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-border/60 p-5 space-y-4">
            <div>
              <p className="text-xs font-semibold text-foreground/65 mb-2">
                Código copia e cola
              </p>
              <div className="flex items-center gap-3">
                <code className="flex-1 text-xs text-foreground/85 break-all font-mono">
                  {pix.pixQrCode.slice(0, 60)}…
                </code>
                <button
                  onClick={copyCode}
                  type="button"
                  className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
                  style={{
                    backgroundColor: copied
                      ? `${primaryColor}25`
                      : `${primaryColor}15`,
                    color: primaryColor,
                  }}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copiar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div
            className="rounded-2xl p-5"
            style={{
              backgroundColor: `${primaryColor}08`,
              border: `1px solid ${primaryColor}30`,
            }}
          >
            <p
              className="text-sm font-semibold mb-3"
              style={{ color: primaryColor }}
            >
              Como pagar
            </p>
            <ol className="space-y-2.5">
              {[
                "Abra o aplicativo do seu banco",
                'Escolha "pagar com PIX"',
                "Escaneie o QR ou cole o código acima",
                "Confirme o pagamento",
                "Aguarde a confirmação aqui (em segundos)",
              ].map((step, i) => (
                <li
                  key={i}
                  className="flex gap-3 text-sm text-foreground/80 leading-relaxed"
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold tabular-nums flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: primaryColor, color: "white" }}
                  >
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <WaitingForPayment primaryColor={primaryColor} />

          <p className="text-xs text-center text-foreground/55">
            Você pode fechar esta página — o casal receberá uma notificação assim
            que o pagamento for confirmado.
          </p>
        </>
      )}
    </div>
  );
}

function WaitingForPayment({ primaryColor }: { primaryColor: string }) {
  return (
    <div
      className="rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden"
      style={{
        backgroundColor: `${primaryColor}10`,
        border: `1px solid ${primaryColor}40`,
      }}
    >
      <div className="relative flex-shrink-0">
        <span
          className="absolute inset-0 rounded-full animate-ping opacity-60"
          style={{ backgroundColor: primaryColor }}
        />
        <span
          className="relative block w-3 h-3 rounded-full"
          style={{ backgroundColor: primaryColor }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold mb-0.5"
          style={{ color: primaryColor }}
        >
          Aguardando pagamento
        </p>
        <p className="text-xs text-foreground/70 leading-snug">
          Estamos verificando seu PIX em tempo real. A confirmação aparece aqui
          em poucos segundos após você pagar.
        </p>
      </div>
      <Loader2
        className="w-5 h-5 animate-spin flex-shrink-0"
        style={{ color: primaryColor }}
      />
    </div>
  );
}
