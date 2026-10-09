import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("risa-portal-session", "", {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}