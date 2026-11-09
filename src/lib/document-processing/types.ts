export type DocumentFileType = "PDF" | "DOCX" | "Image";

export type ExtractionMethod = "pdf-text" | "ocr" | "mixed" | "docx" | "image";

export type PageMethod = Exclude<ExtractionMethod, "mixed">;

export type PageRotation = 0 | 90 | 180 | 270;

export type ExtractedPage = {
  pageNumber: number;
  text: string;
  method: PageMethod;
  confidence: number | null;
  uncertain: boolean;
  uncertainLines: string[];
  rotationApplied: PageRotation | null;
  duplicateOf: number | null;
};

export type ExtractionWarning = {
  pageNumber: number | null;
  message: string;
};

export type ExtractionQuality = {
  pageCount: number;
  textPages: number;
  scannedPages: number;
  ocrPages: number;
  lowConfidencePages: number;
  uncertainPages: number;
  duplicatePages: number;
  emptyPages: number;
  repeatedLinesRemoved: number;
  truncated: boolean;
};

export type ExtractionResult = {
  text: string;
  pageCount: number | null;
  truncated: boolean;
  pages: ExtractedPage[];
  method: ExtractionMethod;
  confidence: number | null;
  quality: ExtractionQuality;
  warnings: ExtractionWarning[];
  contentHash: string | null;
  mimeType: string;
  fileType: DocumentFileType;
};

export type ExtractionPhase = "reading" | "pages" | "ocr" | "finalizing";

export type ExtractionProgress = {
  phase: ExtractionPhase;
  page: number;
  pageCount: number;
  ratio: number;
  label: string;
};

export type ProgressHandler = (progress: ExtractionProgress) => void;

export type ProcessDocumentOptions = {
  onProgress?: ProgressHandler;
  signal?: AbortSignal;
  maxOcrPages?: number;
  maxCharacters?: number;
};

export type ExtractionErrorCode =
  | "unsupported"
  | "empty-file"
  | "invalid-file"
  | "encrypted"
  | "corrupted"
  | "no-text"
  | "ocr-unavailable"
  | "aborted"
  | "too-large";

export class ExtractionError extends Error {
  readonly code: ExtractionErrorCode;

  constructor(code: ExtractionErrorCode, message: string) {
    super(message);
    this.name = "ExtractionError";
    this.code = code;
  }
}
