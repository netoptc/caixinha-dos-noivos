import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path: parts } = await ctx.params;
  if (!parts || parts.length === 0) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const relative = parts.join("/");
  const fullPath = path.join(UPLOADS_ROOT, relative);
  const normalized = path.normalize(fullPath);
  if (!normalized.startsWith(UPLOADS_ROOT + path.sep)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  try {
    const info = await stat(normalized);
    if (!info.isFile()) {
      return new NextResponse("Not Found", { status: 404 });
    }
    const buf = await readFile(normalized);
    const ext = path.extname(normalized).toLowerCase();
    const contentType = MIME_BY_EXT[ext] ?? "application/octet-stream";
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(info.size),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}
