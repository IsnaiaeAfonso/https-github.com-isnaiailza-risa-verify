import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const COOKIE_NAME = "risa-portal-session";
const SESSION_MAX_AGE = 60 * 60 * 12;

export async function POST(request: NextRequest) {
  const secret = process.env.PORTAL_ACCESS_PASSWORD;
  if (!secret) return NextResponse.json({ error: "Acesso do portal não configurado." }, { status: 503 });

  let body: { username?: string; password?: string; next?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitação inválida." }, { status: 400 });
  }

  const expected = Buffer.from(secret);
  const supplied = Buffer.from(body.password ?? "");
  const passwordMatches = expected.length === supplied.length && timingSafeEqual(expected, supplied);
  if (body.username !== "risa" || !passwordMatches) {
    return NextResponse.json({ error: "Usuário ou senha incorretos." }, { status: 401 });
  }

  const expiresAt = String(Math.floor(Date.now() / 1000) + SESSION_MAX_AGE);
  const signature = createHmac("sha256", secret).update(expiresAt).digest("base64url");
  const response = NextResponse.json({
    ok: true,
    redirectTo: body.next?.startsWith("/") && !body.next.startsWith("//") ? body.next : "/dashboard",
  });
  response.cookies.set(COOKIE_NAME, `${expiresAt}.${signature}`, {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}