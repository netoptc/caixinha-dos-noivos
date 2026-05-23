import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const MAX_ATTEMPTS = 5;

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "O código deve ter 6 dígitos"),
  password: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase().trim();
    const { code, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "Código inválido ou expirado." },
        { status: 400 },
      );
    }

    const reset = await prisma.passwordReset.findFirst({
      where: {
        userId: user.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!reset) {
      return NextResponse.json(
        { error: "Código inválido ou expirado." },
        { status: 400 },
      );
    }

    if (reset.attempts >= MAX_ATTEMPTS) {
      await prisma.passwordReset.update({
        where: { id: reset.id },
        data: { usedAt: new Date() },
      });
      return NextResponse.json(
        {
          error:
            "Número máximo de tentativas atingido. Solicite um novo código.",
        },
        { status: 400 },
      );
    }

    const matches = await bcrypt.compare(code, reset.codeHash);
    if (!matches) {
      await prisma.passwordReset.update({
        where: { id: reset.id },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json(
        { error: "Código inválido ou expirado." },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      prisma.passwordReset.update({
        where: { id: reset.id },
        data: { usedAt: new Date() },
      }),
      // Invalida outros códigos pendentes deste usuário
      prisma.passwordReset.updateMany({
        where: { userId: user.id, usedAt: null, id: { not: reset.id } },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ message: "Senha atualizada com sucesso." });
  } catch (error) {
    console.error("reset-password error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 },
    );
  }
}
