import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { generateUniqueCaixinhaCode } from "@/lib/caixinha-code";

const registerSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  coupleNames: z.string().min(3, "Nome do casal muito curto").max(200),
  title: z.string().min(3, "Título muito curto").max(200),
  weddingDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data do casamento inválida (use AAAA-MM-DD)"),
  description: z.string().max(1000).optional(),
  goalAmount: z.number().positive("Meta deve ser positiva"),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida")
    .default("#D4A017"),
  hideDonorAmount: z.boolean().optional(),
  hideTotalRaised: z.boolean().optional(),
  hideGoal: z.boolean().optional(),
});

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

async function parseBody(req: NextRequest): Promise<{
  fields: Record<string, unknown>;
  file: File | null;
}> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const fd = await req.formData();
    const file = fd.get("photo");
    const photo = file instanceof File && file.size > 0 ? file : null;

    const fields: Record<string, unknown> = {};
    for (const [key, value] of fd.entries()) {
      if (key === "photo") continue;
      if (typeof value !== "string") continue;
      if (key === "goalAmount") {
        const n = Number(value);
        fields[key] = Number.isFinite(n) ? n : value;
      } else if (
        key === "hideDonorAmount" ||
        key === "hideTotalRaised" ||
        key === "hideGoal"
      ) {
        fields[key] = value === "true";
      } else {
        fields[key] = value;
      }
    }
    return { fields, file: photo };
  }

  const json = await req.json();
  return { fields: json, file: null };
}

async function savePhoto(file: File): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Formato de imagem não suportado.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Imagem maior que 5MB.");
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "images");
  await mkdir(uploadDir, { recursive: true });

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const token = randomBytes(8).toString("hex");
  const filename = `register-${Date.now()}-${token}.${ext}`;
  const filepath = path.join(uploadDir, filename);

  const bytes = await file.arrayBuffer();
  await writeFile(filepath, Buffer.from(bytes));

  return `/uploads/images/${filename}`;
}

export async function POST(req: NextRequest) {
  try {
    const { fields, file } = await parseBody(req);
    const parsed = registerSchema.safeParse(fields);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json(
        { error: "Este e-mail já está em uso." },
        { status: 409 }
      );
    }

    const finalSlug = await generateUniqueCaixinhaCode();

    let coupleImageUrl: string | null = null;
    if (file) {
      try {
        coupleImageUrl = await savePhoto(file);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao processar a foto.";
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const [user, caixinha] = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name: data.coupleNames,
          email: data.email,
          password: hashedPassword,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });

      const createdCaixinha = await tx.caixinha.create({
        data: {
          title: data.title,
          coupleNames: data.coupleNames,
          weddingDate: new Date(`${data.weddingDate}T00:00:00.000Z`),
          slug: finalSlug,
          description: data.description || null,
          goalAmount: data.goalAmount,
          primaryColor: data.primaryColor,
          coupleImageUrl,
          hideDonorAmount: data.hideDonorAmount ?? true,
          hideTotalRaised: data.hideTotalRaised ?? false,
          hideGoal: data.hideGoal ?? false,
          userId: createdUser.id,
        },
        select: { id: true, slug: true },
      });

      return [createdUser, createdCaixinha] as const;
    });

    return NextResponse.json({ user, caixinha }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
