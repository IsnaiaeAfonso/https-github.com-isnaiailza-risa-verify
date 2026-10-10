import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  /^\/risa-mark\.svg$/,
  /^\/api\/health$/,
  /^\/api\/auth\/login$/,
  /^\/api\/auth\/logout$/,
  /^\/login(?:\/|$)/,
  /^\/patient-upload(?:\/|$)/,
  /^\/api\/patient-upload$/,
  /^\/api\/patient-upload\/blob$/,
  /^\/api\/consent$/,
  /^\/(?:terms|privacy)(?:\/|$)/,
];

const SESSION_COOKIE = "risa-portal-session";

function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

async function isValidSession(value: string | undefined, secret: string) {
  if (!value) return false;
  const [expiresAt, signature] = value.split(".");
  if (!expiresAt || !signature || Number(expiresAt) <= Math.floor(Date.now() / 1000)) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(expiresAt));
  return constantTimeEqual(base64Url(new Uint8Array(digest)), signature);
}

function safeRedirect(path: string) {
  return path.startsWith("/") && !path.startsWith("//") ? path : "/dashboard";
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (PUBLIC_PATHS.some((path) => path.test(pathname))) return NextResponse.next();

  const secret = process.env.PORTAL_ACCESS_PASSWORD;
  if (!secret) {
    return new NextResponse("Portal médico indisponível: acesso protegido não configurado.", { status: 503 });
  }

  if (await isValidSession(request.cookies.get(SESSION_COOKIE)?.value, secret)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Autenticação necessária para acessar o portal médico." }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", safeRedirect(`${pathname}${request.nextUrl.search}`));
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};