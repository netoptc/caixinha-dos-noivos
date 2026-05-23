import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const video = formData.get("video") as File | null;

    if (!video) {
      return NextResponse.json({ error: "Nenhum vídeo enviado." }, { status: 400 });
    }

    if (video.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "Vídeo muito grande. Máximo 50MB." }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "videos");
    await mkdir(uploadDir, { recursive: true });

    const ext = video.type === "video/webm" ? "webm" : "mp4";
    const filename = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 6)}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    const bytes = await video.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const videoUrl = `/uploads/videos/${filename}`;
    return NextResponse.json({ videoUrl });
  } catch (error) {
    console.error("Video upload error:", error);
    return NextResponse.json({ error: "Erro ao fazer upload do vídeo." }, { status: 500 });
  }
}
