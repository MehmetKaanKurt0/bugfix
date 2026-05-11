import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const protectedPaths = ["/admin/teams", "/admin/rounds", "/admin/grade", "/admin/finalize"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get("bugfix_admin_token");
  if (token?.value === "authenticated") return NextResponse.next();

  return NextResponse.redirect(new URL("/admin", request.url));
}

export const config = {
  matcher: ["/admin/:path+"],
};
