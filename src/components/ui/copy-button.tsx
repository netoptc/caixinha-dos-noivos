"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="flex-shrink-0 inline-flex items-center gap-2 font-sans uppercase tracking-editorial text-[0.65rem] text-primary hover:text-foreground transition-colors"
      title="Copiar link"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3" />
          copiado
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          copiar
        </>
      )}
    </button>
  );
}
