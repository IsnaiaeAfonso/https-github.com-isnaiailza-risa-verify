export const DEFAULT_PATIENT_UPLOAD_DOCTORS = [
  "Dra. Laura Santos",
  "Dr. Rafael Neto",
  "Dr. Gustavo Medeiros",
  "Dr. Omar Faria",
  "Dr. Caio Mendes",
  "Dr. Vinícius Prado",
  "Dr. Fernando Costa",
  "Dr. Theo Santos",
  "Dr. Ana Rocha",
  "Dr. Camila Lopes",
];

export function getPatientUploadDoctors(): string[] {
  const configuredDoctors = (process.env.PATIENT_UPLOAD_DOCTOR_NAMES ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  return configuredDoctors.length ? configuredDoctors : DEFAULT_PATIENT_UPLOAD_DOCTORS;
}

export function isVercelRuntime(): boolean {
  return process.env.VERCEL === "1";
}

export function hasVercelBlobToken(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function getPatientUploadMode(): "vercel-blob" | "server" | "unavailable" {
  if (isVercelRuntime()) return hasVercelBlobToken() ? "vercel-blob" : "unavailable";
  return "server";
}

export function isPatientUploadStorageReady(): boolean {
  return !isVercelRuntime() || hasVercelBlobToken();
}