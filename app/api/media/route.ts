import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search")?.trim() || "";

  const where: any = {};
  if (search) {
    where.OR = [
      { originalName: { contains: search } },
      { filename: { contains: search } },
      { user: { name: { contains: search } } },
    ];
  }

  try {
    const images = await db.mediaImage.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, images });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to load media images" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: "No file uploaded" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { success: false, message: "Unsupported file type. Please upload JPG, PNG, WEBP, or GIF." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: "File size exceeds 5MB limit." },
        { status: 400 }
      );
    }

    // Determine extension
    let ext = "jpg";
    if (file.type === "image/png") ext = "png";
    else if (file.type === "image/webp") ext = "webp";
    else if (file.type === "image/gif") ext = "gif";
    else if (file.type === "image/jpeg") ext = "jpg";

    const cleanBaseName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 30);
    const filename = `${Date.now()}_${cleanBaseName || "img"}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await writeFile(filePath, buffer);

    const relativeUrl = `/uploads/${filename}`;

    const media = await db.mediaImage.create({
      data: {
        url: relativeUrl,
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        userId: user.id,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      success: true,
      image: media,
      message: "Image uploaded and saved to library successfully.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to process image upload" },
      { status: 500 }
    );
  }
}
