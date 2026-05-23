import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ArrowLeft, User } from "lucide-react";
import { ProfileEditor } from "@/components/dashboard/ProfileEditor";

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/entrar");

  return (
    <div className="max-w-2xl mx-auto font-sans">
      <Link
        href="/painel"
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-foreground/70 bg-white border border-border/60 hover:text-foreground hover:bg-[#fbf7ee] hover:border-border transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao painel
      </Link>

      <header className="flex items-center gap-3 mb-8">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: "hsl(var(--primary) / 0.15)",
            color: "hsl(var(--primary))",
          }}
        >
          <User className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl md:text-3xl text-foreground leading-tight">
            Perfil do casal
          </h1>
          <p className="text-sm text-foreground/65 mt-0.5">
            Atualize suas informações de acesso.
          </p>
        </div>
      </header>

      <ProfileEditor
        initialName={session.user.name ?? ""}
        initialEmail={session.user.email ?? ""}
      />
    </div>
  );
}
