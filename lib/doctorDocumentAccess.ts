import type { DocumentQueueEntry } from "@/lib/documentQueue";

export function isVisibleToConfiguredDoctor(document: DocumentQueueEntry): boolean {
  const configuredDoctors = (process.env.PATIENT_UPLOAD_DOCTOR_NAMES ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  const visibleAfter = Date.parse(process.env.PORTAL_UPLOADS_VISIBLE_AFTER ?? "");

  return document.status === "stored"
    && configuredDoctors.includes(document.doctorName ?? "")
    && Number.isFinite(visibleAfter)
    && Date.parse(document.createdAt) >= visibleAfter;
}