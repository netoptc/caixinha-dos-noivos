import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export default async function SlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const caixinha = await prisma.caixinha.findUnique({
    where: { slug, isActive: true },
    select: { primaryColor: true },
  });
  if (!caixinha) notFound();

  return (
    <div
      style={
        {
          "--brand-primary": caixinha.primaryColor,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
