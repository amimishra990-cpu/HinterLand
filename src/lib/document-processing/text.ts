export const MAX_EXTRACTED_CHARACTERS = 50_000;
export const MAX_STORED_PAGE_CHARACTERS = 30_000;
export const MEANINGFUL_TEXT_THRESHOLD = 24;
export const LOW_LINE_CONFIDENCE = 70;
export const LOW_PAGE_CONFIDENCE = 0.75;

const ALPHANUMERIC = /[A-Za-z0-9\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF]/g;
const PAGE_MARKER = /\[\[page (\d+)\]\]/gi;

export function meaningfulCharacterCount(text: string) {
  return (text.match(ALPHANUMERIC) ?? []).length;
}

export function hasMeaningfulText(
  text: string,
  threshold = MEANINGFUL_TEXT_THRESHOLD
) {
  return meaningfulCharacterCount(text) >= threshold;
}

export function normalizePageText(text: string) {
  return text
    .replace(/\u0000/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export type PositionedItem = {
  text: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  hasEOL?: boolean;
};

function medianHeight(items: PositionedItem[]) {
  const heights = items
    .map((item) => item.height ?? 0)
    .filter((height) => height > 0)
    .sort((a, b) => a - b);
  if (heights.length === 0) return 0;
  return heights[Math.floor(heights.length / 2)];
}

export function orderTextItems(items: PositionedItem[]) {
  const usable = items.filter((item) => item.text.trim().length > 0);
  if (usable.length === 0) return "";

  const tolerance = Math.min(12, Math.max(2, medianHeight(usable) * 0.5));
  // PDF user space has its origin at the bottom-left, so higher y is earlier.
  const sorted = [...usable].sort((a, b) => (a.y === b.y ? a.x - b.x : b.y - a.y));

  const lines: PositionedItem[][] = [];
  for (const item of sorted) {
    const line = lines[lines.length - 1];
    if (line && Math.abs(line[0].y - item.y) <= tolerance) {
      line.push(item);
    } else {
      lines.push([item]);
    }
  }

  return normalizePageText(
    lines
      .map((line) =>
        [...line]
          .sort((a, b) => a.x - b.x)
          .map((item) => item.text.trim())
          .filter(Boolean)
          .join(" ")
      )
      .filter(Boolean)
      .join("\n")
  );
}

function lineKey(line: string) {
  return line.trim().replace(/\s+/g, " ").toLowerCase();
}

export function collapseDuplicateLines(text: string) {
  const lines = text.split("\n");
  const kept: string[] = [];
  let removed = 0;
  let previous = "";

  for (const line of lines) {
    const key = lineKey(line);
    if (key && key === previous) {
      removed += 1;
      continue;
    }
    kept.push(line);
    previous = key;
  }

  return { text: kept.join("\n"), removed };
}

function edgeLines(text: string, edgeSize = 3) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length <= edgeSize * 2) return lines;
  return [...lines.slice(0, edgeSize), ...lines.slice(-edgeSize)];
}

/**
 * Finds short lines repeated on the top or bottom of most pages (running headers
 * and footers). Body paragraphs that repeat across pages are deliberately ignored.
 */
export function detectRepeatedLines(pageTexts: string[]) {
  const repeated = new Set<string>();
  if (pageTexts.length < 3) return repeated;

  const threshold = Math.max(3, Math.ceil(pageTexts.length * 0.6));
  const counts = new Map<string, number>();

  for (const text of pageTexts) {
    const seen = new Set<string>();
    for (const line of edgeLines(text)) {
      const key = lineKey(line);
      if (!key || key.length > 120 || seen.has(key)) continue;
      seen.add(key);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  for (const [key, count] of counts) {
    if (count >= threshold) repeated.add(key);
  }
  return repeated;
}

export function stripRepeatedLines(text: string, repeated: Set<string>) {
  if (repeated.size === 0) return { text, removed: 0 };
  const lines = text.split("\n");
  const kept: string[] = [];
  let removed = 0;

  lines.forEach((line, index) => {
    const isEdge = index < 3 || index >= lines.length - 3;
    if (isEdge && repeated.has(lineKey(line))) {
      removed += 1;
      return;
    }
    kept.push(line);
  });

  return { text: normalizePageText(kept.join("\n")), removed };
}

function comparableWords(text: string) {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\u00C0-\u024F]+/g, " ")
      .split(" ")
      // Numbers matter: consecutive pages often differ only by page or section
      // numbers, so dropping them would mark distinct pages as duplicates.
      .filter((word) => word.length > 2 || /^\d+$/.test(word))
  );
}

function wordSimilarity(a: Set<string>, b: Set<string>) {
  if (a.size === 0 || b.size === 0) return 0;
  let overlap = 0;
  for (const word of a) {
    if (b.has(word)) overlap += 1;
  }
  return (2 * overlap) / (a.size + b.size);
}

function numberSignature(text: string) {
  return (text.match(/\d+/g) ?? []).join(",");
}

export function findDuplicatePage(previousTexts: string[], text: string) {
  const normalized = text.trim().replace(/\s+/g, " ").toLowerCase();
  if (normalized.length < 200) return null;

  const words = comparableWords(text);
  const numbers = numberSignature(text);
  for (let index = 0; index < previousTexts.length; index += 1) {
    const candidate = previousTexts[index].trim().replace(/\s+/g, " ").toLowerCase();
    if (candidate.length < 200) continue;
    if (candidate === normalized) return index + 1;
    // Consecutive pages often differ only by a page or section number. If the
    // numbers differ, treat the pages as distinct even when the wording matches.
    if (numberSignature(previousTexts[index]) !== numbers) continue;
    if (Math.abs(candidate.length - normalized.length) <= normalized.length * 0.08) {
      if (wordSimilarity(words, comparableWords(previousTexts[index])) >= 0.97) {
        return index + 1;
      }
    }
  }
  return null;
}

export type OcrLine = { text: string; confidence: number };

export function markUncertainLines(
  lines: OcrLine[],
  threshold = LOW_LINE_CONFIDENCE
) {
  const uncertainLines = lines
    .filter((line) => line.text.trim().length > 0 && line.confidence < threshold)
    .map((line) => line.text.trim().slice(0, 200))
    .slice(0, 25);

  return {
    uncertain: uncertainLines.length > 0,
    uncertainLines,
  };
}

export function aggregateConfidence(
  pages: { text: string; confidence: number | null }[]
) {
  let weighted = 0;
  let weight = 0;
  for (const page of pages) {
    if (page.confidence === null) continue;
    const pageWeight = Math.max(1, meaningfulCharacterCount(page.text));
    weighted += page.confidence * pageWeight;
    weight += pageWeight;
  }
  if (weight === 0) return null;
  return Math.round((weighted / weight) * 1000) / 1000;
}

export function truncatePageText(text: string, limit = MAX_STORED_PAGE_CHARACTERS) {
  return text.length > limit ? text.slice(0, limit) : text;
}

export function assembleDocumentText(
  pages: { pageNumber: number; text: string }[],
  limit = MAX_EXTRACTED_CHARACTERS
) {
  const chunks: string[] = [];
  let used = 0;
  let truncated = false;

  for (const page of pages) {
    const text = page.text.trim();
    if (!text) continue;
    const marker = `[[page ${page.pageNumber}]] `;
    const remaining = limit - used;
    if (remaining <= marker.length) {
      truncated = true;
      break;
    }
    if (marker.length + text.length > remaining) {
      chunks.push(`${marker}${text.slice(0, remaining - marker.length)}`);
      truncated = true;
      break;
    }
    chunks.push(`${marker}${text}`);
    used += marker.length + text.length + 2;
  }

  return { text: chunks.join("\n\n").slice(0, limit).trim(), truncated };
}

export function readablePageText(text: string) {
  return text
    .replace(PAGE_MARKER, (_, page: string) => `\n\nPage ${page}\n\n`)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
