import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, linkIds, status, newUserId } = body;

    if (!Array.isArray(linkIds) || linkIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "No links selected" },
        { status: 400 }
      );
    }

    const isAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMIN";

    // Where clause ensures employees can only modify their own links
    const baseWhere: any = {
      id: { in: linkIds },
    };
    if (!isAdmin) {
      baseWhere.userId = user.id;
    }

    if (action === "SET_STATUS") {
      if (!status || !["ACTIVE", "PAUSED", "ARCHIVED"].includes(status)) {
        return NextResponse.json(
          { success: false, message: "Invalid status" },
          { status: 400 }
        );
      }

      const result = await db.link.updateMany({
        where: baseWhere,
        data: { status },
      });

      // Audit log
      if (isAdmin) {
        await db.auditLog.create({
          data: {
            adminUserId: user.id,
            action: "BULK_UPDATE_LINK_STATUS",
            targetType: "LINK",
            newValue: `Changed status to ${status} for ${result.count} links`,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Successfully updated ${result.count} links to ${status}`,
        count: result.count,
      });
    }

    if (action === "DELETE") {
      const result = await db.link.deleteMany({
        where: baseWhere,
      });

      // Audit log
      if (isAdmin) {
        await db.auditLog.create({
          data: {
            adminUserId: user.id,
            action: "BULK_DELETE_LINKS",
            targetType: "LINK",
            newValue: `Deleted ${result.count} links`,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Successfully deleted ${result.count} links`,
        count: result.count,
      });
    }

    if (action === "REASSIGN") {
      if (!isAdmin) {
        return NextResponse.json(
          { success: false, message: "Forbidden: Admin required" },
          { status: 403 }
        );
      }

      if (!newUserId) {
        return NextResponse.json(
          { success: false, message: "Target employee required" },
          { status: 400 }
        );
      }

      const result = await db.link.updateMany({
        where: baseWhere,
        data: { userId: newUserId },
      });

      // Audit log
      await db.auditLog.create({
        data: {
          adminUserId: user.id,
          action: "BULK_REASSIGN_LINKS",
          targetType: "LINK",
          newValue: `Reassigned ${result.count} links to user ${newUserId}`,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully reassigned ${result.count} links`,
        count: result.count,
      });
    }

    return NextResponse.json(
      { success: false, message: "Unknown action" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Bulk link error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
