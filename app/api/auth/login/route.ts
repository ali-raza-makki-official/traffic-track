import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, setSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body.email?.toLowerCase().trim();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, message: "Account is not active." },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Incorrect password. Please try again." },
        { status: 401 }
      );
    }

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create session cookie
    await setSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const redirectUrl =
      user.role === "SUPER_ADMIN" || user.role === "ADMIN"
        ? "/admin"
        : "/dashboard";

    return NextResponse.json({
      success: true,
      role: user.role,
      redirectUrl,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Login failed." },
      { status: 500 }
    );
  }
}
