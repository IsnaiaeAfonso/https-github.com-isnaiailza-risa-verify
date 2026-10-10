import type { DocumentQueueEntry } from "@/lib/documentQueue";
import { getPatientUploadDoctors } from "@/lib/patientUploadConfig";

export function isVisibleToConfiguredDoctor(document: DocumentQueueEntry): boolean {
  const configuredDoctors = getPatientUploadDoctors();
  const visibleAfter = Date.parse(process.env.PORTAL_UPLOADS_VISIBLE_AFTER ?? "");

  return document.status === "stored"
    && configuredDoctors.includes(document.doctorName ?? "")
    && (!Number.isFinite(visibleAfter) || Date.parse(document.createdAt) >= visibleAfter);
}