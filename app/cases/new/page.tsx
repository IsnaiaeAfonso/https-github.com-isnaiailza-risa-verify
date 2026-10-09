"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCaseStore } from "@/lib/store";
import { extractPdfText } from "@/lib/pdfTextExtractor";
import { uploadDocument } from "@/lib/cloudStorage";
import AppShell from "@/components/AppShell";
import { UploadCloud, FileText, X, LockKeyhole } from "lucide-react";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function NewCasePage() {
  const router = useRouter();
  const { createCase, addDocuments, runAnalysis } = useCaseStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const [label, setLabel] = useState("");
  const [files, setFiles] = useState<
    { file: File; name: string; sizeLabel: string }[]
  >([]);
  const [dragOver, setDragOver] = useState(false);
  const [creating, setCreating] = useState(false);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const next = Array.from(fileList).map((file) => ({
      file,
      name: file.name,
      sizeLabel: formatSize(file.size),
    }));
    setFiles((prev) => [...prev, ...next]);
  }

  function removeFile(name: string) {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  }

  async function handleAnalyze() {
    setCreating(true);
    const newCase = createCase(label.trim());
    const preparedFiles = await Promise.all(
      files.map(async ({ file, name, sizeLabel }) => {
        try {
          const storageResult = await uploadDocument(file, newCase.id);
          const extraction = await extractPdfText(file);
          const extractedPages = extraction.pages;
          return {
            name,
            sizeLabel,
            pages: extraction.pageCount,
            extractedPages,
            extractionStatus: extractedPages.some((page) => page.trim())
              ? ("text_extracted" as const)
              : ("no_text" as const),
            objectKey: storageResult.objectKey,
            storageProvider: storageResult.storageProvider,
            encryptionStatus: storageResult.encryptionStatus,
            sha256: storageResult.sha256,
          };
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Não foi possível processar o documento.";
          return {
            name,
            sizeLabel,
            pages: 0,
            extractedPages: [],
            extractionStatus: "unreadable" as const,
            storageProvider: "local-demo" as const,
            encryptionStatus: "local-demo" as const,
            sha256: undefined,
            processingError: message,
          };
        }
      }),
    );

    if (preparedFiles.length > 0) addDocuments(newCase.id, preparedFiles);
    runAnalysis(newCase.id);
    router.push(`/cases/${newCase.id}/analyzing`);
  }

  return (
    <AppShell>
      <main className="flex-1 bg-paper">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <h1 className="text-lg font-semibold text-ink mb-1">Novo caso</h1>
          <p className="text-sm text-muted mb-6">
            Adicione os documentos clínicos para análise.
          </p>

          <div className="mb-6">
            <label
              htmlFor="label"
              className="block text-sm font-medium text-ink mb-1.5"
            >
              Nome do caso
            </label>
            <input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Caso clínico #000"
              className="focus-ring w-full rounded-md border border-line bg-panel px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70"
            />
            <p className="text-xs text-muted mt-1.5">
              Use apenas rótulos fictícios ou já de-identificados.
            </p>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className={`cursor-pointer rounded-lg border-2 border-dashed transition-colors px-6 py-12 text-center ${
              dragOver
                ? "border-brand bg-brand-light/50"
                : "border-line bg-panel hover:border-brand/50"
            }`}
          >
            <UploadCloud className="mx-auto text-brand-dark" size={26} />
            <p className="text-sm text-ink font-medium mt-3">
              Arraste arquivos aqui
            </p>
            <p className="text-xs text-muted mt-1">ou selecione os PDFs</p>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {files.length > 0 && (
            <div className="mt-4 border border-line rounded-lg bg-panel divide-y divide-line shadow-card">
              <div className="px-4 py-2 text-xs text-muted border-b border-line">
                Documentos selecionados ({files.length})
              </div>
              {files.map((doc) => (
                <div
                  key={doc.name}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <FileText size={16} className="text-brand-dark shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink truncate">{doc.name}</p>
                    <p className="text-xs text-muted">
                      {doc.sizeLabel} · aguardando envio
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(doc.name);
                    }}
                    className="focus-ring text-muted hover:text-rust p-1 rounded"
                    aria-label={`Remover ${doc.name}`}
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex items-center gap-3">
            <button
              onClick={handleAnalyze}
              disabled={files.length === 0 || creating}
              className="focus-ring bg-brand hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white text-sm font-medium px-4 py-2.5 rounded-md shadow-card"
            >
              Analisar caso
            </button>
            {files.length === 0 && (
              <span className="text-xs text-muted">
                Envie ao menos um documento para continuar.
              </span>
            )}
          </div>
        </div>
      </main>
    </AppShell>
  );
}
