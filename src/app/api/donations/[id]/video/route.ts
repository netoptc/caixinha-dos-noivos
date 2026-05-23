import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const formData = await req.formData();
    const video = formData.get("video") as File | null;

    if (!video) {
      return NextResponse.json({ error: "Nenhum vídeo enviado." }, { status: 400 });
    }

    // Validate file size (50MB max)
    if (video.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "Vídeo muito grande. Máximo 50MB." }, { status: 400 });
    }

    // Validate mime type
    const allowedTypes = ["video/webm", "video/mp4", "video/quicktime", "video/x-msvideo"];
    if (!allowedTypes.includes(video.type)) {
      return NextResponse.json({ error: "Formato de vídeo não suportado." }, { status: 400 });
    }

    const donation = await prisma.donation.findUnique({ where: { id } });
    if (!donation) {
      return NextResponse.json({ error: "Doação não encontrada." }, { status: 404 });
    }

    // Save file
    const uploadDir = path.join(process.cwd(), "public", "uploads", "videos");
    await mkdir(uploadDir, { recursive: true });

    const ext = video.type === "video/webm" ? "webm" : video.type === "video/mp4" ? "mp4" : "mov";
    const filename = `${id}-${Date.now()}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    const bytes = await video.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const videoUrl = `/uploads/videos/${filename}`;

    await prisma.donation.update({
      where: { id },
      data: { videoUrl },
    });

    return NextResponse.json({ videoUrl });
  } catch (error) {
    console.error("Video upload error:", error);
    return NextResponse.json({ error: "Erro ao salvar vídeo." }, { status: 500 });
  }
}
