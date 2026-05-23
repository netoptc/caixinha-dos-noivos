import type { Metadata } from "next";
import { Fraunces, Manrope, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz", "SOFT"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "Caixinha dos Noivos — Caixinha para Casamentos",
    template: "%s | Caixinha dos Noivos",
  },
  description:
    "Crie sua página de arrecadação para o casamento. Receba contribuições dos seus convidados de forma simples e elegante.",
  keywords: ["casamento", "caixinha", "arrecadação", "noivos", "presente"],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "Caixinha dos Noivos",
    title: "Caixinha dos Noivos — Caixinha para Casamentos",
    description:
      "Crie sua página de arrecadação para o casamento. Receba contribuições dos seus convidados.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${fraunces.variable} ${manrope.variable} ${cormorant.variable}`}
    >
      <body className="font-sans antialiased">
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}
