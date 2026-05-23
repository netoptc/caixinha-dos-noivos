"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Copy,
  Check,
  HelpCircle,
  Mail,
  X,
} from "lucide-react";

const SUPPORT_EMAIL = "contato@caixinhadosnoivos.com.br";
const SUBJECT = "Suporte — Caixinha dos Noivos";

type SupportButtonProps = {
  caixinhaUrl?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  userPhone?: string | null;
};

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function SupportButton({
  caixinhaUrl,
  userName,
  userEmail,
  userPhone,
}: SupportButtonProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  async function copyToClipboard(field: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1800);
    } catch {
      /* ignore */
    }
  }

  const phoneFmt = userPhone ? formatPhone(userPhone) : "(seu telefone)";

  const bodyTemplate = [
    "Olá, equipe da Caixinha dos Noivos!",
    "",
    "Preciso de ajuda com a minha caixinha. Seguem meus dados:",
    "",
    `Nome: ${userName ?? "(seu nome completo)"}`,
    `Telefone: ${phoneFmt}`,
    `E-mail: ${userEmail ?? "(seu e-mail cadastrado)"}`,
    `Link da caixinha: ${caixinhaUrl ?? "(cole o link da sua caixinha)"}`,
    "",
    "Descrição do problema:",
    "(descreva aqui, com o máximo de detalhes possível, o que está acontecendo)",
    "",
    "Obrigado!",
  ].join("\n");

  const mailtoHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    SUBJECT,
  )}&body=${encodeURIComponent(bodyTemplate)}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-foreground/70 bg-[#fbf7ee] hover:bg-[#f0e8d6] hover:text-foreground transition-colors"
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Falar com o suporte"
      >
        <HelpCircle className="w-4 h-4" />
        <span className="hidden sm:inline">Suporte</span>
      </button>

      {open &&
        mounted &&
        createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="support-dialog-title"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            className="relative w-full max-w-lg my-auto bg-white rounded-2xl shadow-2xl border border-border/60 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-foreground/55 hover:text-foreground hover:bg-[#fbf7ee] transition-colors z-10"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="px-6 md:px-8 pt-8 pb-2">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{
                  backgroundColor: "hsl(var(--primary) / 0.15)",
                  color: "hsl(var(--primary))",
                }}
              >
                <HelpCircle className="w-6 h-6" />
              </div>
              <h2
                id="support-dialog-title"
                className="font-display text-2xl text-foreground mb-1"
              >
                Precisa de ajuda?
              </h2>
              <p className="text-sm text-foreground/65">
                Para falar com o suporte, envie um e-mail para o endereço abaixo
                usando o modelo de assunto e corpo de mensagem sugeridos. Você
                pode clicar em <span className="font-semibold">Abrir e-mail</span>{" "}
                para que o seu aplicativo de e-mail já abra preenchido.
              </p>
            </div>

            <div className="px-6 md:px-8 py-5 space-y-4">
              {/* Email de destino */}
              <div>
                <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-1.5">
                  Enviar para
                </p>
                <div className="rounded-xl bg-[#fbf7ee] border border-border/60 p-3 flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                  <p className="flex-1 text-sm font-semibold text-foreground truncate">
                    {SUPPORT_EMAIL}
                  </p>
                  <CopyChip
                    copied={copiedField === "email"}
                    onClick={() => copyToClipboard("email", SUPPORT_EMAIL)}
                  />
                </div>
              </div>

              {/* Assunto */}
              <div>
                <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-1.5">
                  Assunto
                </p>
                <div className="rounded-xl bg-[#fbf7ee] border border-border/60 p-3 flex items-center gap-3">
                  <p className="flex-1 text-sm font-semibold text-foreground truncate">
                    {SUBJECT}
                  </p>
                  <CopyChip
                    copied={copiedField === "subject"}
                    onClick={() => copyToClipboard("subject", SUBJECT)}
                  />
                </div>
              </div>

              {/* Corpo */}
              <div>
                <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-1.5">
                  Corpo da mensagem
                </p>
                <div className="rounded-xl bg-[#fbf7ee] border border-border/60 p-4">
                  <pre className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap font-mono overflow-x-auto max-h-64">
                    {bodyTemplate}
                  </pre>
                  <div className="mt-3 flex justify-end">
                    <CopyChip
                      copied={copiedField === "body"}
                      onClick={() => copyToClipboard("body", bodyTemplate)}
                      label="Copiar mensagem"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 md:px-8 pb-6 pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 border-t border-border/40">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-foreground/70 bg-white border border-border/60 hover:text-foreground hover:bg-[#fbf7ee] transition-colors"
              >
                Fechar
              </button>
              <a
                href={mailtoHref}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors shadow-sm"
              >
                <Mail className="w-4 h-4" />
                Abrir e-mail
              </a>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

function CopyChip({
  copied,
  onClick,
  label = "Copiar",
}: {
  copied: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-foreground/70 bg-white border border-border/60 hover:text-foreground hover:bg-[#fbf7ee] transition-colors flex-shrink-0"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          Copiado
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          {label}
        </>
      )}
    </button>
  );
}
