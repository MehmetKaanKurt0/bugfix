import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  const isValid = password === process.env.ADMIN_PASSWORD;

  if (!isValid) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const response = NextResponse.json({ authenticated: true });
  response.cookies.set("bugfix_admin_token", "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("bugfix_admin_token");
  return response;
}
