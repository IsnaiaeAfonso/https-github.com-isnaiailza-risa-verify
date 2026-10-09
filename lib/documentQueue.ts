import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export type DocumentQueueStatus = "queued" | "stored" | "failed";

export interface DocumentQueueEntry {
  id: string;
  caseId: string;
  doctorName?: string;
  fileName: string;
  size: number;
  sha256: string;
  consentId: string;
  termsVersion: string;
  source: string;
  status: DocumentQueueStatus;
  storageProvider: string;
  objectKey?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

const queuePath = join(process.cwd(), "data", "document-queue.json");

async function readQueue(): Promise<DocumentQueueEntry[]> {
  try {
    const raw = await readFile(queuePath, "utf8");
    const parsed = JSON.parse(raw) as DocumentQueueEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    return [];
  }
}

async function writeQueue(entries: DocumentQueueEntry[]): Promise<void> {
  await mkdir(join(process.cwd(), "data"), { recursive: true });
  await writeFile(queuePath, JSON.stringify(entries, null, 2), "utf8");
}

export async function addDocumentToQueue(entry: Omit<DocumentQueueEntry, "id" | "createdAt" | "updatedAt">): Promise<DocumentQueueEntry> {
  const now = new Date().toISOString();
  const storedEntry: DocumentQueueEntry = {
    ...entry,
    id: `${now.replace(/[:.]/g, "-")}-${Math.random().toString(36).slice(2, 12)}`,
    createdAt: now,
    updatedAt: now,
  };
  const queue = await readQueue();
  await writeQueue([storedEntry, ...queue]);
  return storedEntry;
}

export async function updateDocumentQueue(
  id: string,
  changes: Partial<Pick<DocumentQueueEntry, "status" | "storageProvider" | "objectKey" | "error">>,
): Promise<DocumentQueueEntry | undefined> {
  const queue = await readQueue();
  const index = queue.findIndex((entry) => entry.id === id);
  if (index < 0) return undefined;

  queue[index] = {
    ...queue[index],
    ...changes,
    updatedAt: new Date().toISOString(),
  };
  await writeQueue(queue);
  return queue[index];
}

export async function getDocumentQueue(): Promise<DocumentQueueEntry[]> {
  return readQueue();
}

export async function getDocumentQueueItem(id: string): Promise<DocumentQueueEntry | undefined> {
  const queue = await readQueue();
  return queue.find((entry) => entry.id === id);
}
