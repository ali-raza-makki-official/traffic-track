import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMIN";
  const { id } = await params;

  const link = await db.link.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true, trafficPercentageOverride: true },
      },
    },
  });

  if (!link) {
    return NextResponse.json({ success: false, message: "Link not found" }, { status: 404 });
  }

  if (!isAdmin && link.userId !== user.id) {
    return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
  }

  return NextResponse.json({ success: true, link });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMIN";
  const { id } = await params;

  const existingLink = await db.link.findUnique({ where: { id } });
  if (!existingLink) {
    return NextResponse.json({ success: false, message: "Link not found" }, { status: 404 });
  }

  if (!isAdmin && existingLink.userId !== user.id) {
    return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const updateData: any = {};

    if (body.destinationUrl !== undefined) updateData.destinationUrl = body.destinationUrl.trim();
    if (body.previewTitle !== undefined) updateData.previewTitle = body.previewTitle?.trim() || null;
    if (body.previewDescription !== undefined) updateData.previewDescription = body.previewDescription?.trim() || null;
    if (body.previewImage !== undefined) updateData.previewImage = body.previewImage?.trim() || null;
    if (body.tags !== undefined) updateData.tags = body.tags?.trim() || null;
    if (body.internalNotes !== undefined) updateData.internalNotes = body.internalNotes?.trim() || null;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.isPinned !== undefined) updateData.isPinned = body.isPinned;
    if (body.fallbackUrl !== undefined) updateData.fallbackUrl = body.fallbackUrl?.trim() || null;

    // If admin is reassigning owner
    if (isAdmin && body.userId && body.userId !== existingLink.userId) {
      updateData.userId = body.userId;
      // Record audit log
      await db.auditLog.create({
        data: {
          adminUserId: user.id,
          action: "LINK_REASSIGNED",
          targetType: "LINK",
          targetId: existingLink.id,
          previousValue: existingLink.userId,
          newValue: body.userId,
        },
      });
    }

    const updated = await db.link.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, link: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to update link" },
      { status: 500 }
    );
  }
}
