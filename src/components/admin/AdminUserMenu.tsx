"use client";

import { useState, useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import { ChevronDown, LogOut, ShieldCheck } from "lucide-react";

export function AdminUserMenu({
  name,
  email,
}: {
  name?: string | null;
  email?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initial = name?.charAt(0).toUpperCase() ?? "·";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#fbf7ee] hover:bg-[#f0e8d6] transition-colors group"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
          style={{
            backgroundColor: "hsl(var(--primary) / 0.18)",
            color: "hsl(var(--primary))",
          }}
        >
          {initial}
        </div>
        <span className="text-sm font-medium text-foreground hidden sm:inline truncate max-w-[160px]">
          {name}
        </span>
        <ChevronDown
          className="w-3.5 h-3.5 text-foreground/55 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-border/60 overflow-hidden animate-fade-in z-50"
        >
          <div className="px-4 py-3 border-b border-border/40 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-base font-semibold flex-shrink-0"
              style={{
                backgroundColor: "hsl(var(--primary) / 0.18)",
                color: "hsl(var(--primary))",
              }}
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">
                {name}
              </p>
              <p className="text-xs text-foreground/55 truncate">{email}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mt-0.5 inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Admin
              </p>
            </div>
          </div>

          <div className="py-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                signOut({ callbackUrl: "/" });
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:text-foreground hover:bg-[#fbf7ee] transition-colors"
            >
              <LogOut className="w-4 h-4 text-foreground/55" />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
