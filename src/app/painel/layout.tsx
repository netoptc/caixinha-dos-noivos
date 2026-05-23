import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserMenu } from "@/components/dashboard/UserMenu";
import { SupportButton } from "@/components/dashboard/SupportButton";
import { Logo } from "@/components/layout/Logo";
import { prisma } from "@/lib/db";

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/entrar");
  }

  const caixinha = await prisma.caixinha.findUnique({
    where: { userId: session.user.id },
    select: { slug: true },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const caixinhaUrl = caixinha ? `${baseUrl}/${caixinha.slug}` : null;

  return (
    <div className="min-h-screen bg-[#fbf7ee] font-sans flex flex-col">
      {/* ========== Topbar ========== */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-border/60">
        <div className="container mx-auto px-5 md:px-8 max-w-6xl flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center group">
            <Logo size="md" />
          </Link>

          <div className="flex items-center gap-2">
            <SupportButton
              caixinhaUrl={caixinhaUrl}
              userName={session.user.name}
              userEmail={session.user.email}
              userPhone={null}
            />
            <UserMenu name={session.user.name} email={session.user.email} />
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 md:px-8 py-8 md:py-12">{children}</main>
    </div>
  );
}
