import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    // Validate type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato não suportado. Use JPG, PNG ou WebP." },
        { status: 400 }
      );
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Imagem muito grande. Máximo 5MB." }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "images");
    await mkdir(uploadDir, { recursive: true });

    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const filename = `${session.user.id}-${Date.now()}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const url = `/uploads/images/${filename}`;
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json({ error: "Erro ao fazer upload." }, { status: 500 });
  }
}
