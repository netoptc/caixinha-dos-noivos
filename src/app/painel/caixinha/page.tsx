import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ArrowLeft, Settings } from "lucide-react";
import { CaixinhaEditor } from "@/components/dashboard/CaixinhaEditor";

export default async function CaixinhaSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  return (
    <div className="max-w-5xl mx-auto font-sans">
      {/* Back button — explícito e visível */}
      <Link
        href="/painel"
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-foreground/70 bg-white border border-border/60 hover:text-foreground hover:bg-[#fbf7ee] hover:border-border transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao painel
      </Link>

      {/* Header */}
      <header className="flex items-center gap-3 mb-8">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: "hsl(var(--primary) / 0.15)",
            color: "hsl(var(--primary))",
          }}
        >
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl md:text-3xl text-foreground leading-tight">
            Personalizar caixinha
          </h1>
          <p className="text-sm text-foreground/65 mt-0.5">
            Edite cores, foto, descrição e meta da sua página.
          </p>
        </div>
      </header>

      <CaixinhaEditor />
    </div>
  );
}
