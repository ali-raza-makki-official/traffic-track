import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "tt_session";

function decodeJwtPayload(token: string): { userId: string; email: string; role: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    // Standard base64 decoding compatible with Edge runtime
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  const session = token ? decodeJwtPayload(token) : null;

  // If visiting login page while authenticated
  if (pathname === "/") {
    if (session) {
      if (session.role === "SUPER_ADMIN" || session.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Admin routes protection
  if (pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Employee internal routes protection
  const protectedRoutes = ["/dashboard", "/links", "/analytics", "/profile"];
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtected) {
    if (!session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/admin/:path*",
    "/dashboard/:path*",
    "/links/:path*",
    "/analytics/:path*",
    "/profile/:path*",
  ],
};
