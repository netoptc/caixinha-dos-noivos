"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, Share2, X } from "lucide-react";

type ShareButtonProps = {
  url: string;
};

export function ShareButton({ url }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

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

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-foreground/70 bg-white border border-border/60 hover:text-foreground hover:bg-[#fbf7ee] hover:border-border transition-colors w-full md:w-auto"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Share2 className="w-4 h-4" />
        Compartilhar
      </button>

      {open &&
        mounted &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-dialog-title"
            className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <div
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-border/60 overflow-hidden animate-reveal-up"
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

              <div className="px-6 md:px-7 pt-7 pb-2">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{
                    backgroundColor: "hsl(var(--primary) / 0.15)",
                    color: "hsl(var(--primary))",
                  }}
                >
                  <Share2 className="w-6 h-6" />
                </div>
                <h2
                  id="share-dialog-title"
                  className="font-display text-2xl text-foreground mb-1"
                >
                  Compartilhar caixinha
                </h2>
                <p className="text-sm text-foreground/65">
                  Envie esse link para os convidados por WhatsApp, redes
                  sociais ou e-mail.
                </p>
              </div>

              <div className="px-6 md:px-7 py-5 space-y-3">
                <div className="rounded-xl bg-[#fbf7ee] border border-border/60 p-3 flex items-center gap-3">
                  <p className="flex-1 text-sm font-semibold text-foreground truncate">
                    {url}
                  </p>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-foreground/70 bg-white border border-border/60 hover:text-foreground hover:bg-white transition-colors flex-shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copiar
                      </>
                    )}
                  </button>
                </div>

              </div>

              <div className="px-6 md:px-7 pb-6 pt-2 flex justify-end border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-foreground/70 bg-white border border-border/60 hover:text-foreground hover:bg-[#fbf7ee] transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
