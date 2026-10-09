import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getConsent, registerConsent, type ConsentStatus } from "@/lib/consentStore";

const DEMO_CASE_ID = "CV-DEMO-00123";
const TERMS_VERSION = "MVP-DEMO-2026-10";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { caseId?: string; action?: ConsentStatus };
    const action = body.action;
    if (!action || !["ACCEPTED", "CANCELLED"].includes(action)) {
      return NextResponse.json({ error: "Ação de consentimento inválida." }, { status: 400 });
    }

    const consentId = randomUUID();
    const record = await registerConsent({
      consentId,
      caseId: body.caseId ?? DEMO_CASE_ID,
      termsVersion: TERMS_VERSION,
      timestamp: new Date().toISOString(),
      consentStatus: action,
      action,
    });
    return NextResponse.json(record, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Não foi possível registrar o consentimento." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const consentId = new URL(request.url).searchParams.get("consentId")?.trim();
  if (!consentId) return NextResponse.json({ error: "Consent ID obrigatório." }, { status: 400 });
  const record = await getConsent(consentId);
  if (!record) return NextResponse.json({ error: "Consentimento não encontrado." }, { status: 404 });
  return NextResponse.json(record);
}
