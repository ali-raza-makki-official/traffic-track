import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename: rawFilename } = await params;
    const filename = path.basename(rawFilename);
    const filePath = path.join(process.cwd(), "public", "uploads", filename);

    const fileBuffer = await readFile(filePath);

    let contentType = "application/octet-stream";
    if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) contentType = "image/jpeg";
    else if (filename.endsWith(".png")) contentType = "image/png";
    else if (filename.endsWith(".webp")) contentType = "image/webp";
    else if (filename.endsWith(".gif")) contentType = "image/gif";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    return new NextResponse("Not Found", { status: 404 });
  }
}
