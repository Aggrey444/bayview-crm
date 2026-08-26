import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });

  const isLoggedIn = !!token;
  const pathname = request.nextUrl.pathname;

  const isOnAuth = pathname.startsWith("/auth");
  const isOnApiAuth = pathname.startsWith("/api/auth");
  const isOnDashboard = pathname.startsWith("/dashboard");
  const isPublicRoute = pathname.startsWith("/lead-capture") || pathname.startsWith("/api/public");
  const isHealthCheck = pathname === "/api/health";

  if (isOnApiAuth || isPublicRoute || isHealthCheck) {
    return NextResponse.next();
  }

  if (isOnAuth && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
  }

  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/login", request.nextUrl));
  }

  if (pathname.startsWith("/api/") && !isLoggedIn) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
};
