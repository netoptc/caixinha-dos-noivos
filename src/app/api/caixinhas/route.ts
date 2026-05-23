import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { generateUniqueCaixinhaCode } from "@/lib/caixinha-code";

const caixinhaSchema = z.object({
  title: z.string().min(3, "Título muito curto").max(200),
  coupleNames: z.string().min(3).max(200),
  weddingDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data do casamento inválida (use AAAA-MM-DD)")
    .optional()
    .or(z.literal("")),
  description: z.string().max(1000).optional(),
  goalAmount: z.number().positive("Meta deve ser positiva"),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#D4A017"),
  coupleImageUrl: z.string().optional().or(z.literal("")),
  coverImageUrl: z.string().optional().or(z.literal("")),
  hideDonorAmount: z.boolean().optional(),
  hideTotalRaised: z.boolean().optional(),
  hideGoal: z.boolean().optional(),
});

// GET - fetch the logged in user's caixinha
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const caixinha = await prisma.caixinha.findUnique({
    where: { userId: session.user.id },
    include: {
      _count: {
        select: { donations: { where: { paymentStatus: "CONFIRMED" } } },
      },
    },
  });

  return NextResponse.json({ caixinha });
}

// POST - create caixinha
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Verify user exists (guards against stale JWTs after DB resets)
  const userExists = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });
  if (!userExists) {
    return NextResponse.json({ error: "Sessão inválida. Faça login novamente." }, { status: 401 });
  }

  // Check if user already has a caixinha
  const existing = await prisma.caixinha.findUnique({
    where: { userId: session.user.id },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Você já tem uma caixinha. Use PATCH para atualizar." },
      { status: 409 }
    );
  }

  try {
    const body = await req.json();
    const parsed = caixinhaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const slug = await generateUniqueCaixinhaCode();

    const caixinha = await prisma.caixinha.create({
      data: {
        title: data.title,
        coupleNames: data.coupleNames,
        weddingDate: data.weddingDate
          ? new Date(`${data.weddingDate}T00:00:00.000Z`)
          : null,
        slug,
        description: data.description || null,
        goalAmount: data.goalAmount,
        primaryColor: data.primaryColor,
        coupleImageUrl: data.coupleImageUrl || null,
        coverImageUrl: data.coverImageUrl || null,
        hideDonorAmount: data.hideDonorAmount ?? true,
        hideTotalRaised: data.hideTotalRaised ?? false,
        hideGoal: data.hideGoal ?? false,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ caixinha }, { status: 201 });
  } catch (error) {
    console.error("Create caixinha error:", error);
    return NextResponse.json({ error: "Erro ao criar caixinha." }, { status: 500 });
  }
}

// PATCH - update caixinha (slug is immutable)
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = caixinhaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const caixinha = await prisma.caixinha.findUnique({
      where: { userId: session.user.id },
    });

    if (!caixinha) {
      return NextResponse.json({ error: "Caixinha não encontrada." }, { status: 404 });
    }

    const updated = await prisma.caixinha.update({
      where: { userId: session.user.id },
      data: {
        title: data.title,
        coupleNames: data.coupleNames,
        ...(data.weddingDate !== undefined
          ? {
              weddingDate: data.weddingDate
                ? new Date(`${data.weddingDate}T00:00:00.000Z`)
                : null,
            }
          : {}),
        description: data.description || null,
        goalAmount: data.goalAmount,
        primaryColor: data.primaryColor,
        coupleImageUrl: data.coupleImageUrl || null,
        coverImageUrl: data.coverImageUrl || null,
        ...(data.hideDonorAmount !== undefined ? { hideDonorAmount: data.hideDonorAmount } : {}),
        ...(data.hideTotalRaised !== undefined ? { hideTotalRaised: data.hideTotalRaised } : {}),
        ...(data.hideGoal !== undefined ? { hideGoal: data.hideGoal } : {}),
      },
    });

    return NextResponse.json({ caixinha: updated });
  } catch (error) {
    console.error("Update caixinha error:", error);
    return NextResponse.json({ error: "Erro ao atualizar caixinha." }, { status: 500 });
  }
}
