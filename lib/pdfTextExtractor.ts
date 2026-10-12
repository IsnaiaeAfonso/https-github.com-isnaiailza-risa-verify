export interface PdfTextExtraction {
  pages: string[];
  pageCount: number;
  ocrPages: number;
}

const MIN_SELECTABLE_TEXT_LENGTH = 40;

export async function extractPdfText(file: File): Promise<PdfTextExtraction> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.js");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.js",
    import.meta.url
  ).toString();

  const loadingTask = pdfjs.getDocument({ data: await file.arrayBuffer() });
  const pdf = await loadingTask.promise;
  const pages: string[] = [];
  let ocrPages = 0;
  let ocrWorker: Awaited<ReturnType<typeof import("tesseract.js")["createWorker"]>> | undefined;

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      let text = content.items
        .map((item) => {
          if (!("str" in item)) return "";
          return `${item.str}${item.hasEOL ? "\n" : " "}`;
        })
        .join("")
        .replace(/[ \t]+\n/g, "\n")
        .trim();

      if (text.length < MIN_SELECTABLE_TEXT_LENGTH) {
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext("2d");
        if (context) {
          await page.render({ canvasContext: context, viewport }).promise;
          if (!ocrWorker) {
            const { createWorker } = await import("tesseract.js");
            ocrWorker = await createWorker("por+eng");
          }
          const ocrText = (await ocrWorker.recognize(canvas)).data.text.trim();
          if (ocrText.length > text.length) {
            text = ocrText;
            if (text) ocrPages += 1;
          }
        }
        canvas.width = 0;
        canvas.height = 0;
      }

      pages.push(text);
      page.cleanup();
    }
    return { pages, pageCount: pdf.numPages, ocrPages };
  } finally {
    await ocrWorker?.terminate();
    await pdf.destroy();
  }
}