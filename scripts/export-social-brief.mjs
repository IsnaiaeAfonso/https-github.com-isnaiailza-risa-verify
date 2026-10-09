import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const sourcePath = resolve("SOCIAL_MEDIA_BRIEF_RISA_VERIFY.md");
const outputPath = resolve("SOCIAL_MEDIA_BRIEF_RISA_VERIFY.docx");
const markdown = await readFile(sourcePath, "utf8");

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function markdownToHtml(source) {
  const lines = source.split(/\r?\n/);
  const output = [];
  let listType = null;
  let paragraph = [];
  let quote = [];

  function flushParagraph() {
    if (paragraph.length) output.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  }
  function flushQuote() {
    if (quote.length) output.push(`<blockquote>${inlineMarkdown(quote.join(" "))}</blockquote>`);
    quote = [];
  }
  function closeList() {
    if (listType) output.push(`</${listType}>`);
    listType = null;
  }

  for (const line of lines) {
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    const unordered = line.match(/^\s*-\s+(.+)$/);
    const ordered = line.match(/^\s*\d+\.\s+(.+)$/);
    const blockQuote = line.match(/^>\s?(.*)$/);
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushQuote();
      closeList();
      continue;
    }
    if (heading) {
      flushParagraph(); flushQuote(); closeList();
      const level = heading[1].length;
      output.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }
    if (blockQuote) {
      flushParagraph(); closeList();
      quote.push(blockQuote[1]);
      continue;
    }
    if (unordered || ordered) {
      flushParagraph(); flushQuote();
      const nextType = unordered ? "ul" : "ol";
      if (listType !== nextType) {
        closeList();
        output.push(`<${nextType}>`);
        listType = nextType;
      }
      output.push(`<li>${inlineMarkdown((unordered ?? ordered)[1])}</li>`);
      continue;
    }
    flushQuote(); closeList();
    paragraph.push(trimmed);
  }

  flushParagraph(); flushQuote(); closeList();
  return output.join("\n");
}

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Briefing de comunicação — RISA Verify</title>
<style>
body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.45; color: #202938; margin: 2.2cm; }
h1 { color: #163b48; font-size: 24pt; margin: 0 0 18pt; }
h2 { color: #17657a; font-size: 16pt; margin: 22pt 0 8pt; border-bottom: 1px solid #d6e0e4; padding-bottom: 4pt; }
h3 { color: #244d5b; font-size: 13pt; margin: 16pt 0 6pt; }
p { margin: 6pt 0; }
li { margin: 4pt 0; }
blockquote { margin: 10pt 0; padding: 8pt 12pt; border-left: 3px solid #338196; background: #eef5f6; }
code { font-family: Menlo, monospace; font-size: 9pt; background: #f1f3f4; }
a { color: #17657a; }
</style></head><body>${markdownToHtml(markdown)}</body></html>`;

const tempDirectory = await mkdtemp(join(tmpdir(), "risa-brief-"));
const htmlPath = join(tempDirectory, "brief.html");
try {
  await writeFile(htmlPath, html, "utf8");
  execFileSync("textutil", ["-convert", "docx", htmlPath, "-output", outputPath], { stdio: "inherit" });
  console.log(`Documento criado: ${outputPath}`);
} finally {
  await rm(tempDirectory, { recursive: true, force: true });
}