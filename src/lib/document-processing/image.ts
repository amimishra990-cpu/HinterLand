import { ExtractionError, type ExtractedPage, type ExtractionWarning, type ProgressHandler } from "./types";
import { createOcrEngine, type OcrEngine } from "./ocr";
import { hasMeaningfulText, normalizePageText } from "./text";

export type ImageExtraction = {
  pages: ExtractedPage[];
  warnings: ExtractionWarning[];
  scannedPages: number;
};

export type ImageExtractionOptions = {
  onProgress?: ProgressHandler;
  signal?: AbortSignal;
  ocrEngine?: OcrEngine;
};

const MAX_IMAGE_DIMENSION = 2200;
const MIN_IMAGE_DIMENSION = 1200;
const MAX_CANVAS_PIXELS = 7_500_000;

function ensureNotAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new ExtractionError("aborted", "Document processing was cancelled.");
  }
}

async function drawBitmap(bitmap: ImageBitmap) {
  let scale = 1;
  const longest = Math.max(bitmap.width, bitmap.height);
  if (longest > MAX_IMAGE_DIMENSION) scale = MAX_IMAGE_DIMENSION / longest;
  if (longest * scale < MIN_IMAGE_DIMENSION) {
    scale = Math.min(2, MIN_IMAGE_DIMENSION / Math.max(1, longest));
  }

  let width = Math.max(1, Math.round(bitmap.width * scale));
  let height = Math.max(1, Math.round(bitmap.height * scale));
  if (width * height > MAX_CANVAS_PIXELS) {
    const shrink = Math.sqrt(MAX_CANVAS_PIXELS / (width * height));
    width = Math.max(1, Math.round(width * shrink));
    height = Math.max(1, Math.round(height * shrink));
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new ExtractionError("ocr-unavailable", "A drawing canvas is unavailable.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, width, height);
  return canvas;
}

export async function extractImagePage(
  file: Blob,
  mimeType: string,
  options: ImageExtractionOptions = {}
): Promise<ImageExtraction> {
  ensureNotAborted(options.signal);

  options.onProgress?.({
    phase: "reading",
    page: 1,
    pageCount: 1,
    ratio: 0.05,
    label: "Preparing the image",
  });

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new ExtractionError(
      "invalid-file",
      `This ${mimeType || "image"} file could not be opened. Use a PNG, JPEG, or WebP image.`
    );
  }

  let ocr = options.ocrEngine ?? null;
  const ownsOcr = !ocr;
  const warnings: ExtractionWarning[] = [];

  try {
    const canvas = await drawBitmap(bitmap);
    if (!ocr) ocr = await createOcrEngine();

    options.onProgress?.({
      phase: "ocr",
      page: 1,
      pageCount: 1,
      ratio: 0.15,
      label: "Recognizing text in the image",
    });

    const result = await ocr.recognize(canvas, {
      tryRotations: true,
      onProgress: (fraction) => {
        options.onProgress?.({
          phase: "ocr",
          page: 1,
          pageCount: 1,
          ratio: Math.min(1, 0.15 + fraction * 0.8),
          label: `Recognizing text in the image (${Math.round(fraction * 100)}%)`,
        });
      },
    });

    canvas.width = 0;
    canvas.height = 0;

    const text = normalizePageText(result.text);
    if (!hasMeaningfulText(text)) {
      throw new ExtractionError(
        "no-text",
        "No readable text was found in this image. Try a sharper photo with the page filling the frame."
      );
    }

    if (result.uncertain) {
      warnings.push({
        pageNumber: 1,
        message: "Some text was recognized with low confidence. Review the marked lines before relying on it.",
      });
    }

    const pages: ExtractedPage[] = [
      {
        pageNumber: 1,
        text,
        method: "image",
        confidence: result.confidence,
        uncertain: result.uncertain,
        uncertainLines: result.uncertainLines,
        rotationApplied: result.rotationApplied,
        duplicateOf: null,
      },
    ];

    return { pages, warnings, scannedPages: 1 };
  } finally {
    bitmap.close();
    if (ownsOcr && ocr) await ocr.terminate();
  }
}
