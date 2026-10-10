import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { readPrivateBlobJson, writePrivateBlobJson } from "@/lib/privateBlobJson";
import { hasVercelBlobToken, isVercelRuntime } from "@/lib/patientUploadConfig";

export type ConsentStatus = "ACCEPTED" | "CANCELLED";

export interface ConsentRecord {
  consentId: string;
  caseId: string;
  doctorName?: string;
  termsVersion: string;
  timestamp: string;
  consentStatus: ConsentStatus;
  action: ConsentStatus;
}

const consentPath = join(process.cwd(), "data", "consents.json");

async function readConsents(): Promise<Record<string, ConsentRecord>> {
  try {
    const raw = await readFile(consentPath, "utf8");
    const parsed = JSON.parse(raw) as Record<string, ConsentRecord>;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export async function registerConsent(record: ConsentRecord): Promise<ConsentRecord> {
  if (isVercelRuntime()) {
    if (!hasVercelBlobToken()) throw new Error("Vercel Blob privado não está configurado.");
    await writePrivateBlobJson(`risa-verify/consents/${record.consentId}.json`, record);
    return record;
  }

  const records = await readConsents();
  records[record.consentId] = record;
  await mkdir(join(process.cwd(), "data"), { recursive: true });
  await writeFile(consentPath, JSON.stringify(records, null, 2), "utf8");
  return record;
}

export async function getConsent(consentId: string): Promise<ConsentRecord | undefined> {
  if (isVercelRuntime()) {
    if (!hasVercelBlobToken()) throw new Error("Vercel Blob privado não está configurado.");
    return readPrivateBlobJson<ConsentRecord>(`risa-verify/consents/${consentId}.json`);
  }

  const records = await readConsents();
  return records[consentId];
}
