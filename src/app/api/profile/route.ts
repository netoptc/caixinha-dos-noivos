import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(2, "Nome muito curto").max(100),
  email: z.string().email("E-mail inválido"),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "Nova senha precisa de 6+ caracteres").optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = profileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, currentPassword, newPassword } = parsed.data;

    // Carrega user atual
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado." },
        { status: 404 }
      );
    }

    // Se mudou e-mail, garantir que não está em uso por outro usuário
    if (email !== user.email) {
      const conflict = await prisma.user.findUnique({ where: { email } });
      if (conflict && conflict.id !== user.id) {
        return NextResponse.json(
          { error: "Este e-mail já está em uso." },
          { status: 409 }
        );
      }
    }

    // Trocar senha (se solicitado)
    let hashedPassword: string | undefined;
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Informe a senha atual para trocar a senha." },
          { status: 400 }
        );
      }
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) {
        return NextResponse.json(
          { error: "Senha atual incorreta." },
          { status: 400 }
        );
      }
      hashedPassword = await bcrypt.hash(newPassword, 12);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        email,
        ...(hashedPassword ? { password: hashedPassword } : {}),
      },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
