import type { PDFPageProxy } from "pdfjs-dist";

import {
  ExtractionError,
  type ExtractedPage,
  type ExtractionWarning,
  type PageRotation,
  type ProgressHandler,
} from "./types";
import { createOcrEngine, type OcrEngine } from "./ocr";
import { hasMeaningfulText, normalizePageText, orderTextItems } from "./text";

type PdfTextItem = {
  str: string;
  transform: number[];
  width?: number;
  height?: number;
  hasEOL?: boolean;
};

export type PdfExtraction = {
  pages: ExtractedPage[];
  warnings: ExtractionWarning[];
  scannedPages: number;
  ocrLimitReached: boolean;
};

export type PdfExtractionOptions = {
  onProgress?: ProgressHandler;
  signal?: AbortSignal;
  maxOcrPages?: number;
  ocrEngine?: OcrEngine;
};

const RENDER_TARGET_WIDTH = 1700;
const MAX_RENDER_PIXELS = 9_000_000;
const DEFAULT_MAX_OCR_PAGES = 80;

export function normalizeRotation(value: number | undefined): PageRotation {
  const normalized = ((Math.round(value ?? 0) % 360) + 360) % 360;
  if (normalized === 90 || normalized === 180 || normalized === 270) return normalized;
  return 0;
}

function ensureNotAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new ExtractionError("aborted", "Document processing was cancelled.");
  }
}

function pdfError(error: unknown): ExtractionError {
  if (error instanceof ExtractionError) return error;
  const name = (error as { name?: string } | null)?.name;

  if (name === "PasswordException") {
    return new ExtractionError(
      "encrypted",
      "This PDF is password-protected. Remove the password and upload it again."
    );
  }
  if (name === "InvalidPDFException") {
    return new ExtractionError(
      "corrupted",
      "This PDF appears to be damaged or is not a valid PDF file."
    );
  }
  if (name === "MissingPDFException") {
    return new ExtractionError("invalid-file", "The uploaded PDF file could not be read.");
  }
  const message = error instanceof Error ? error.message : "";
  if (/password/i.test(message)) {
    return new ExtractionError(
      "encrypted",
      "This PDF is password-protected. Remove the password and upload it again."
    );
  }
  return new ExtractionError(
    "corrupted",
    "This PDF could not be read. It may be damaged or use an unsupported feature."
  );
}

async function renderPageToCanvas(page: PDFPageProxy) {
  const base = page.getViewport({ scale: 1 });
  let scale = Math.min(3.2, Math.max(1, RENDER_TARGET_WIDTH / Math.max(1, base.width)));
  let viewport = page.getViewport({ scale });
  if (viewport.width * viewport.height > MAX_RENDER_PIXELS) {
    scale *= Math.sqrt(MAX_RENDER_PIXELS / (viewport.width * viewport.height));
    viewport = page.getViewport({ scale });
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const context = canvas.getContext("2d");
  if (!context) throw new ExtractionError("ocr-unavailable", "A drawing canvas is unavailable.");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: context, canvas, viewport }).promise;
  return canvas;
}

export async function extractPdfPages(
  data: Uint8Array,
  options: PdfExtractionOptions = {}
): Promise<PdfExtraction> {
  ensureNotAborted(options.signal);
  const maxOcrPages = Math.max(1, options.maxOcrPages ?? DEFAULT_MAX_OCR_PAGES);
  const warnings: ExtractionWarning[] = [];
  const pages: ExtractedPage[] = [];
  let scannedPages = 0;
  let ocrLimitReached = false;

  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  let document: Awaited<ReturnType<typeof pdfjs.getDocument>["promise"]> | null = null;
  let ocr = options.ocrEngine ?? null;
  let ownsOcr = false;

  try {
    try {
      document = await pdfjs.getDocument({
        data,
        isEvalSupported: false,
        useSystemFonts: false,
      }).promise;
    } catch (error) {
      throw pdfError(error);
    }

    if (!document || document.numPages < 1) {
      throw new ExtractionError("no-text", "This PDF has no pages to read.");
    }

    const pageCount = document.numPages;

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      ensureNotAborted(options.signal);
      const baseRatio = (pageNumber - 1) / pageCount;

      let pageMethod: ExtractedPage["method"] = "pdf-text";
      let text = "";
      let confidence: number | null = null;
      let uncertain = false;
      let uncertainLines: string[] = [];
      let rotationApplied: PageRotation | null = null;

      try {
        options.onProgress?.({
          phase: "pages",
          page: pageNumber,
          pageCount,
          ratio: baseRatio,
          label: `Reading page ${pageNumber} of ${pageCount}`,
        });

        const page = await document.getPage(pageNumber);
        const content = await page.getTextContent();
        const items = (content.items as PdfTextItem[]).filter(
          (item) => typeof item.str === "string" && item.str.trim().length > 0
        );
        const ordered = orderTextItems(
          items.map((item) => ({
            text: item.str,
            x: Array.isArray(item.transform) ? item.transform[4] ?? 0 : 0,
            y: Array.isArray(item.transform) ? item.transform[5] ?? 0 : 0,
            width: item.width,
            height: item.height,
            hasEOL: item.hasEOL,
          }))
        );
        text = normalizePageText(ordered);
        rotationApplied = normalizeRotation(page.rotate);

        if (!hasMeaningfulText(text)) {
          pageMethod = "ocr";
          scannedPages += 1;

          if (scannedPages > maxOcrPages) {
            ocrLimitReached = true;
            text = "";
            page.cleanup();
          } else {
            options.onProgress?.({
              phase: "ocr",
              page: pageNumber,
              pageCount,
              ratio: baseRatio,
              label: `Reading scanned page ${pageNumber} of ${pageCount}`,
            });

            if (!ocr) {
              ocr = await createOcrEngine();
              ownsOcr = true;
            }

            const canvas = await renderPageToCanvas(page);
            try {
              options.onProgress?.({
                phase: "ocr",
                page: pageNumber,
                pageCount,
                ratio: baseRatio,
                label: `Recognizing text on page ${pageNumber} of ${pageCount}`,
              });
              const result = await ocr.recognize(canvas, {
                tryRotations: true,
                onProgress: (fraction) => {
                  options.onProgress?.({
                    phase: "ocr",
                    page: pageNumber,
                    pageCount,
                    ratio: Math.min(1, baseRatio + fraction / pageCount),
                    label: `Recognizing text on page ${pageNumber} of ${pageCount} (${Math.round(
                      fraction * 100
                    )}%)`,
                  });
                },
              });
              text = normalizePageText(result.text);
              confidence = result.confidence;
              uncertain = result.uncertain;
              uncertainLines = result.uncertainLines;
              rotationApplied = normalizeRotation(
                (rotationApplied ?? 0) + result.rotationApplied
              );
            } finally {
              canvas.width = 0;
              canvas.height = 0;
              page.cleanup();
            }
          }
        } else {
          page.cleanup();
        }

        if (!hasMeaningfulText(text)) {
          warnings.push({
            pageNumber,
            message:
              pageMethod === "ocr"
                ? `Page ${pageNumber} did not contain readable text after OCR.`
                : `Page ${pageNumber} is empty or has no selectable text.`,
          });
        }

        pages.push({
          pageNumber,
          text,
          method: pageMethod,
          confidence,
          uncertain,
          uncertainLines,
          rotationApplied,
          duplicateOf: null,
        });
      } catch (error) {
        if (error instanceof ExtractionError && error.code === "aborted") throw error;
        const reason =
          error instanceof Error && error.message
            ? error.message
            : "The page could not be read.";
        warnings.push({ pageNumber, message: `Page ${pageNumber}: ${reason}` });
        pages.push({
          pageNumber,
          text: "",
          method: "pdf-text",
          confidence: null,
          uncertain: false,
          uncertainLines: [],
          rotationApplied: null,
          duplicateOf: null,
        });
      }

      options.onProgress?.({
        phase: scannedPages > 0 ? "ocr" : "pages",
        page: pageNumber,
        pageCount,
        ratio: pageNumber / pageCount,
        label: `Finished page ${pageNumber} of ${pageCount}`,
      });
    }

    if (ocrLimitReached) {
      warnings.push({
        pageNumber: null,
        message: `OCR stopped after ${maxOcrPages} scanned pages. Remaining scanned pages were left without text.`,
      });
    }

    return { pages, warnings, scannedPages, ocrLimitReached };
  } finally {
    if (ocr && ownsOcr) await ocr.terminate();
    if (document) {
      try {
        await document.destroy();
      } catch {
        // The document is already unusable; nothing else to release.
      }
    }
  }
}
