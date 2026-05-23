import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import { prisma } from "@/lib/db";
import { renderResetPasswordEmail, sendMail } from "@/lib/mail";

const CODE_TTL_MINUTES = 15;

const schema = z.object({
  email: z.string().email("E-mail inválido"),
});

function generateCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

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
    const user = await prisma.user.findUnique({ where: { email } });

    // Resposta neutra para não revelar quais e-mails existem
    const neutralResponse = NextResponse.json({
      message:
        "Se o e-mail informado estiver cadastrado, enviaremos um código em alguns instantes.",
    });

    if (!user) return neutralResponse;

    const code = generateCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60_000);

    // Invalida códigos pendentes anteriores deste usuário
    await prisma.passwordReset.updateMany({
      where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });

    await prisma.passwordReset.create({
      data: { userId: user.id, codeHash, expiresAt },
    });

    const { html, text } = renderResetPasswordEmail({
      name: user.name,
      code,
      expiresInMinutes: CODE_TTL_MINUTES,
    });

    try {
      await sendMail({
        to: user.email,
        subject: "Código para redefinir sua senha",
        html,
        text,
      });
    } catch (err) {
      console.error("Erro ao enviar e-mail de redefinição:", err);
      return NextResponse.json(
        { error: "Não foi possível enviar o e-mail. Tente novamente em instantes." },
        { status: 500 },
      );
    }

    return neutralResponse;
  } catch (error) {
    console.error("forgot-password error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 },
    );
  }
}
