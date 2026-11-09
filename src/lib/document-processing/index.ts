import {
  ExtractionError,
  type ExtractedPage,
  type ExtractionMethod,
  type ExtractionQuality,
  type ExtractionResult,
  type ExtractionWarning,
  type ProcessDocumentOptions,
} from "./types";
import { MAX_UPLOAD_BYTES, documentKind, type FileKind } from "./file-kind";
import { extractPdfPages } from "./pdf";
import { extractImagePage } from "./image";
import {
  MAX_EXTRACTED_CHARACTERS,
  aggregateConfidence,
  assembleDocumentText,
  collapseDuplicateLines,
  detectRepeatedLines,
  findDuplicatePage,
  hasMeaningfulText,
  normalizePageText,
  stripRepeatedLines,
  truncatePageText,
} from "./text";

function startsWith(bytes: Uint8Array, signature: number[], offset = 0) {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((value, index) => bytes[offset + index] === value);
}

function looksLikePdf(bytes: Uint8Array) {
  const limit = Math.min(bytes.length - 5, 1024);
  for (let index = 0; index <= limit; index += 1) {
    if (
      bytes[index] === 0x25 &&
      bytes[index + 1] === 0x50 &&
      bytes[index + 2] === 0x44 &&
      bytes[index + 3] === 0x46 &&
      bytes[index + 4] === 0x2d
    ) {
      return true;
    }
  }
  return false;
}

function verifySignature(kind: FileKind, bytes: Uint8Array) {
  const valid =
    kind.fileType === "PDF"
      ? looksLikePdf(bytes)
      : kind.fileType === "DOCX"
        ? startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]) ||
          startsWith(bytes, [0x50, 0x4b, 0x05, 0x06])
        : kind.mimeType === "image/png"
          ? startsWith(bytes, [0x89, 0x50, 0x4e, 0x47])
          : kind.mimeType === "image/jpeg"
            ? startsWith(bytes, [0xff, 0xd8, 0xff])
            : kind.mimeType === "image/webp"
              ? startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
                startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)
              : false;

  if (!valid) {
    throw new ExtractionError(
      "invalid-file",
      `The file contents do not match a ${kind.fileType === "Image" ? kind.mimeType.replace("image/", "").toUpperCase() : kind.fileType} file. It may be damaged or mislabeled.`
    );
  }
}

async function sha256(bytes: Uint8Array) {
  try {
    if (!globalThis.crypto?.subtle) return null;
    const copy = bytes.slice().buffer;
    const digest = await globalThis.crypto.subtle.digest("SHA-256", copy);
    return Array.from(new Uint8Array(digest))
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return null;
  }
}

export async function fileContentHash(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return sha256(bytes);
}

function docxError(error: unknown) {
  if (error instanceof ExtractionError) return error;
  return new ExtractionError(
    "corrupted",
    "This DOCX file could not be read. It may be damaged or saved in an unsupported format."
  );
}

async function extractDocx(
  arrayBuffer: ArrayBuffer,
  limit: number
): Promise<{ text: string; truncated: boolean }> {
  const mammoth = await import("mammoth");
  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    const full = normalizePageText(result.value ?? "");
    if (!full) {
      throw new ExtractionError("no-text", "No usable text was found in this DOCX file.");
    }
    return { text: full.slice(0, limit), truncated: full.length > limit };
  } catch (error) {
    throw docxError(error);
  }
}

function methodFor(pages: ExtractedPage[], scannedPages: number): ExtractionMethod {
  const textPages = pages.some((page) => page.method === "pdf-text" && hasMeaningfulText(page.text));
  const ocrPages = pages.some(
    (page) => (page.method === "ocr" || page.method === "image") && hasMeaningfulText(page.text)
  );
  if (pages.length === 0) return "docx";
  if (pages[0]?.method === "image") return "image";
  if (textPages && (ocrPages || scannedPages > 0)) return "mixed";
  if (ocrPages || scannedPages > 0) return "ocr";
  return "pdf-text";
}

function finishPages(pages: ExtractedPage[]) {
  let repeatedLinesRemoved = 0;
  let duplicateLinesRemoved = 0;

  const collapsed = pages.map((page) => {
    const { text, removed } = collapseDuplicateLines(page.text);
    duplicateLinesRemoved += removed;
    return { ...page, text };
  });

  const contentPages = collapsed.filter((page) => hasMeaningfulText(page.text));
  const repeated = detectRepeatedLines(contentPages.map((page) => page.text));

  const cleaned = collapsed.map((page) => {
    if (!hasMeaningfulText(page.text)) return page;
    const { text, removed } = stripRepeatedLines(page.text, repeated);
    repeatedLinesRemoved += removed;
    return { ...page, text };
  });

  const previous: string[] = [];
  const deduped = cleaned.map((page) => {
    const duplicateOf = hasMeaningfulText(page.text) ? findDuplicatePage(previous, page.text) : null;
    previous.push(page.text);
    return { ...page, duplicateOf };
  });

  return {
    pages: deduped,
    repeatedLinesRemoved,
    duplicateLinesRemoved,
  };
}

function qualityFor(
  pages: ExtractedPage[],
  options: {
    pageCount: number | null;
    scannedPages: number;
    truncated: boolean;
    repeatedLinesRemoved: number;
    duplicateLinesRemoved: number;
  }
): ExtractionQuality {
  const ocrPages = pages.filter(
    (page) => page.method === "ocr" || page.method === "image"
  );
  return {
    pageCount: options.pageCount ?? 0,
    textPages: pages.filter(
      (page) => page.method === "pdf-text" && hasMeaningfulText(page.text)
    ).length,
    scannedPages: options.scannedPages,
    ocrPages: ocrPages.filter((page) => hasMeaningfulText(page.text)).length,
    lowConfidencePages: ocrPages.filter(
      (page) => page.confidence !== null && page.confidence < 0.75
    ).length,
    uncertainPages: pages.filter((page) => page.uncertain).length,
    duplicatePages: pages.filter((page) => page.duplicateOf !== null).length,
    emptyPages: pages.filter((page) => !hasMeaningfulText(page.text)).length,
    repeatedLinesRemoved: options.repeatedLinesRemoved + options.duplicateLinesRemoved,
    truncated: options.truncated,
  };
}

export async function processDocument(
  file: File,
  options: ProcessDocumentOptions = {}
): Promise<ExtractionResult> {
  const kind = documentKind(file);
  if (!kind) {
    throw new ExtractionError(
      "unsupported",
      "Only PDF, DOCX, PNG, JPEG, and WebP files are accepted."
    );
  }
  if (file.size === 0) {
    throw new ExtractionError("empty-file", "The selected file is empty.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ExtractionError("too-large", "Files must be 20 MB or smaller.");
  }
  if (options.signal?.aborted) {
    throw new ExtractionError("aborted", "Document processing was cancelled.");
  }

  options.onProgress?.({
    phase: "reading",
    page: 0,
    pageCount: 0,
    ratio: 0.02,
    label: "Reading the file",
  });

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  verifySignature(kind, bytes);
  const contentHash = await sha256(bytes);

  const limit = Math.min(
    MAX_EXTRACTED_CHARACTERS,
    Math.max(1_000, options.maxCharacters ?? MAX_EXTRACTED_CHARACTERS)
  );

  if (kind.fileType === "DOCX") {
    const { text, truncated } = await extractDocx(buffer, limit);
    options.onProgress?.({
      phase: "finalizing",
      page: 1,
      pageCount: 1,
      ratio: 0.95,
      label: "Preparing the document text",
    });
    return {
      text,
      pageCount: null,
      truncated,
      pages: [],
      method: "docx",
      confidence: null,
      quality: {
        pageCount: 0,
        textPages: 0,
        scannedPages: 0,
        ocrPages: 0,
        lowConfidencePages: 0,
        uncertainPages: 0,
        duplicatePages: 0,
        emptyPages: 0,
        repeatedLinesRemoved: 0,
        truncated,
      },
      warnings: [],
      contentHash,
      mimeType: kind.mimeType,
      fileType: kind.fileType,
    };
  }

  let raw: { pages: ExtractedPage[]; warnings: ExtractionWarning[]; scannedPages: number };
  if (kind.fileType === "PDF") {
    raw = await extractPdfPages(bytes, {
      onProgress: options.onProgress,
      signal: options.signal,
      maxOcrPages: options.maxOcrPages,
    });
  } else {
    raw = await extractImagePage(new Blob([buffer], { type: kind.mimeType }), kind.mimeType, {
      onProgress: options.onProgress,
      signal: options.signal,
    });
  }

  if (options.signal?.aborted) {
    throw new ExtractionError("aborted", "Document processing was cancelled.");
  }

  const cleaned = finishPages(
    raw.pages.map((page) => ({
      ...page,
      text: normalizePageText(page.text),
    }))
  );

  if (!cleaned.pages.some((page) => hasMeaningfulText(page.text))) {
    throw new ExtractionError(
      "no-text",
      kind.fileType === "Image"
        ? "No readable text was found in this image."
        : "No readable text was found in this PDF. It may be blank, or the scan could not be recognized."
    );
  }

  options.onProgress?.({
    phase: "finalizing",
    page: raw.pages.length,
    pageCount: raw.pages.length,
    ratio: 0.96,
    label: "Preparing the document text",
  });

  const assembled = assembleDocumentText(cleaned.pages, limit);
  const pageCount = kind.fileType === "Image" ? 1 : raw.pages.length;
  const method = methodFor(cleaned.pages, raw.scannedPages);

  return {
    text: assembled.text,
    pageCount,
    truncated: assembled.truncated,
    pages: cleaned.pages,
    method,
    confidence: aggregateConfidence(
      cleaned.pages.filter((page) => page.confidence !== null)
    ),
    quality: qualityFor(cleaned.pages, {
      pageCount,
      scannedPages: raw.scannedPages,
      truncated: assembled.truncated,
      repeatedLinesRemoved: cleaned.repeatedLinesRemoved,
      duplicateLinesRemoved: cleaned.duplicateLinesRemoved,
    }),
    warnings: raw.warnings,
    contentHash,
    mimeType: kind.mimeType,
    fileType: kind.fileType,
  };
}

export { truncatePageText };
export {
  MAX_UPLOAD_BYTES,
  ACCEPTED_FILE_EXTENSIONS,
  documentKind,
  isSupportedDocument,
} from "./file-kind";
export type { FileKind } from "./file-kind";
export type {
  ExtractedPage,
  ExtractionMethod,
  ExtractionQuality,
  ExtractionResult,
  ExtractionProgress,
  ProcessDocumentOptions,
} from "./types";
