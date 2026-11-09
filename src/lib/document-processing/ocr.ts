import {
  LOW_PAGE_CONFIDENCE,
  markUncertainLines,
  normalizePageText,
  type OcrLine,
} from "./text";

type OcrCanvas = HTMLCanvasElement | OffscreenCanvas;

type OcrBlock = {
  paragraphs?: {
    lines?: { text?: string; confidence?: number }[];
  }[];
};

export type OcrPageResult = {
  text: string;
  confidence: number;
  lines: OcrLine[];
  uncertain: boolean;
  uncertainLines: string[];
  rotationApplied: 0 | 90 | 180 | 270;
};

export type OcrEngine = {
  recognize(
    canvas: OcrCanvas,
    options?: { tryRotations?: boolean; onProgress?: (fraction: number) => void }
  ): Promise<OcrPageResult>;
  terminate(): Promise<void>;
};

const OCR_TIMEOUT_MS = 120_000;
// Any page below the review threshold is re-read at other orientations; sideways
// scans can still produce a middling confidence score in the wrong orientation.
const ROTATION_CONFIDENCE_FLOOR = LOW_PAGE_CONFIDENCE;

function withTimeout<T>(promise: Promise<T>, ms: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("The OCR engine took too long to read this page.")),
      ms
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

export function rotateCanvas(canvas: OcrCanvas, rotation: 90 | 180 | 270): OcrCanvas {
  const width = canvas.width;
  const height = canvas.height;
  const target =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(rotation === 180 ? width : height, rotation === 180 ? height : width)
      : Object.assign(document.createElement("canvas"), {
          width: rotation === 180 ? width : height,
          height: rotation === 180 ? height : width,
        });

  const context = target.getContext("2d") as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null;
  if (!context) throw new Error("The OCR canvas could not be prepared.");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, target.width, target.height);
  context.translate(target.width / 2, target.height / 2);
  context.rotate((rotation * Math.PI) / 180);
  context.drawImage(canvas as CanvasImageSource, -width / 2, -height / 2);

  return target;
}

function flattenLines(blocks: OcrBlock[] | null | undefined): OcrLine[] {
  if (!blocks || !Array.isArray(blocks)) return [];
  const lines: OcrLine[] = [];
  for (const block of blocks) {
    for (const paragraph of block.paragraphs ?? []) {
      for (const line of paragraph.lines ?? []) {
        const text = typeof line.text === "string" ? line.text.trim() : "";
        if (!text) continue;
        const confidence =
          typeof line.confidence === "number" && Number.isFinite(line.confidence)
            ? line.confidence
            : 0;
        lines.push({ text, confidence });
      }
    }
  }
  return lines;
}

export async function createOcrEngine(): Promise<OcrEngine> {
  const { createWorker, OEM } = await import("tesseract.js");

  let lastReport = 0;
  let reportProgress: ((fraction: number) => void) | null = null;

  const worker = await createWorker("eng", OEM.LSTM_ONLY, {
    logger: (message) => {
      if (message.status !== "recognizing text" || !reportProgress) return;
      const fraction = typeof message.progress === "number" ? message.progress : 0;
      const now = Date.now();
      if (now - lastReport < 120 && fraction < 1) return;
      lastReport = now;
      reportProgress(fraction);
    },
    errorHandler: (error) => {
      console.error("OCR worker error", error);
    },
  });

  const run = async (canvas: OcrCanvas, onProgress?: (fraction: number) => void) => {
    reportProgress = onProgress ?? null;
    lastReport = 0;
    try {
      const { data } = await withTimeout(
        worker.recognize(canvas, {}, { text: true, blocks: true }),
        OCR_TIMEOUT_MS
      );
      const text = normalizePageText(typeof data.text === "string" ? data.text : "");
      const confidence =
        typeof data.confidence === "number" && Number.isFinite(data.confidence)
          ? Math.min(1, Math.max(0, data.confidence / 100))
          : 0;
      const lines = flattenLines(data.blocks as OcrBlock[] | null);
      const { uncertain, uncertainLines } = markUncertainLines(
        lines.length > 0 ? lines : text.split("\n").map((line) => ({ text: line, confidence: confidence * 100 }))
      );
      return {
        text,
        confidence,
        lines,
        uncertain: uncertain || confidence < LOW_PAGE_CONFIDENCE,
        uncertainLines,
      };
    } finally {
      reportProgress = null;
    }
  };

  return {
    async recognize(canvas, options) {
      const primary = await run(canvas, options?.onProgress);
      const shouldTryRotations =
        options?.tryRotations !== false &&
        primary.confidence < ROTATION_CONFIDENCE_FLOOR &&
        Math.max(canvas.width, canvas.height) >= 400;

      if (!shouldTryRotations) {
        return { ...primary, rotationApplied: 0 };
      }

      let best: OcrPageResult = { ...primary, rotationApplied: 0 };
      for (const rotation of [90, 180, 270] as const) {
        try {
          const rotated = rotateCanvas(canvas, rotation);
          const result = await run(rotated);
          if (result.confidence > best.confidence + 0.05) {
            best = { ...result, rotationApplied: rotation };
          }
        } catch (error) {
          console.warn(`OCR rotation ${rotation} failed`, error);
        }
      }
      return best;
    },
    async terminate() {
      reportProgress = null;
      try {
        await worker.terminate();
      } catch (error) {
        console.warn("OCR worker termination failed", error);
      }
    },
  };
}
