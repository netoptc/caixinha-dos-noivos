import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { AdminUserMenu } from "@/components/admin/AdminUserMenu";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/entrar");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/painel");
  }

  return (
    <div className="min-h-screen bg-[#fbf7ee] font-sans flex flex-col">
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-border/60">
        <div className="container mx-auto px-5 md:px-8 max-w-6xl flex items-center justify-between h-16">
          <Link href="/" className="inline-flex items-center group">
            <Logo size="md" />
          </Link>
          <AdminUserMenu name={session.user.name} email={session.user.email} />
        </div>
      </header>

      <main className="flex-1 px-5 md:px-8 py-8 md:py-12">{children}</main>
    </div>
  );
}
