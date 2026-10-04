export interface PdfTextExtraction {
  pages: string[];
  pageCount: number;
}

export async function extractPdfText(file: File): Promise<PdfTextExtraction> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.mjs",
    import.meta.url
  ).toString();

  const loadingTask = pdfjs.getDocument({ data: await file.arrayBuffer() });
  const pdf = await loadingTask.promise;
  const pages: string[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => {
          if (!("str" in item)) return "";
          return `${item.str}${item.hasEOL ? "\n" : " "}`;
        })
        .join("")
        .replace(/[ \t]+\n/g, "\n")
        .trim();
      pages.push(text);
      page.cleanup();
    }
    return { pages, pageCount: pdf.numPages };
  } finally {
    await pdf.destroy();
  }
}