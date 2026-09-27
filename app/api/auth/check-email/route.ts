import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body.email?.toLowerCase().trim();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Please enter an email address." },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Account not found" },
        { status: 404 }
      );
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.json(
        { success: false, message: "This account has been suspended. Please contact administrator." },
        { status: 403 }
      );
    }

    if (user.status === "DISABLED") {
      return NextResponse.json(
        { success: false, message: "This account is disabled. Please contact administrator." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      name: user.name,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
