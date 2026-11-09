import { describe, expect, it } from "vitest";

import {
  aggregateConfidence,
  assembleDocumentText,
  collapseDuplicateLines,
  detectRepeatedLines,
  findDuplicatePage,
  hasMeaningfulText,
  markUncertainLines,
  meaningfulCharacterCount,
  normalizePageText,
  orderTextItems,
  readablePageText,
  stripRepeatedLines,
  truncatePageText,
} from "../text";

describe("meaningful text detection", () => {
  it("counts letters and digits but ignores punctuation and whitespace", () => {
    expect(meaningfulCharacterCount("abc 123!?,.")).toBe(6);
    expect(meaningfulCharacterCount("   \n\t")).toBe(0);
  });

  it("treats a page just below the threshold as empty", () => {
    expect(hasMeaningfulText("x".repeat(23))).toBe(false);
    expect(hasMeaningfulText("x".repeat(24))).toBe(true);
    expect(hasMeaningfulText("x".repeat(10), 10)).toBe(true);
  });
});

describe("normalizePageText", () => {
  it("normalizes newlines and collapses repeated whitespace", () => {
    expect(normalizePageText("Hello\r\nWorld   again")).toBe("Hello\nWorld again");
    expect(normalizePageText("a\n\n\n\nb")).toBe("a\n\nb");
  });

  it("removes null bytes and trims the result", () => {
    expect(normalizePageText("  a\u0000b  ")).toBe("ab");
  });
});

describe("orderTextItems", () => {
  it("reads top to bottom, then left to right within a line", () => {
    const text = orderTextItems([
      { text: "World", x: 60, y: 100, height: 10 },
      { text: "Second line", x: 10, y: 80, height: 10 },
      { text: "Hello", x: 10, y: 101, height: 10 },
    ]);
    expect(text).toBe("Hello World\nSecond line");
  });

  it("ignores blank items and returns an empty string when nothing remains", () => {
    expect(orderTextItems([{ text: "   ", x: 0, y: 0 }])).toBe("");
    expect(orderTextItems([])).toBe("");
  });
});

describe("collapseDuplicateLines", () => {
  it("removes only consecutive duplicate lines, ignoring case", () => {
    expect(collapseDuplicateLines("Alpha\nAlpha\nBeta\nalpha\nBeta")).toEqual({
      text: "Alpha\nBeta\nalpha\nBeta",
      removed: 1,
    });
  });

  it("keeps intentional blank lines", () => {
    expect(collapseDuplicateLines("Alpha\n\n\nBeta")).toEqual({
      text: "Alpha\n\n\nBeta",
      removed: 0,
    });
  });
});

describe("repeated header and footer detection", () => {
  const page = (index: number) =>
    [
      "Acme Confidential",
      `Body ${index} alpha`,
      "More body",
      `Interior ${index}`,
      "Shared interior",
      "Detail",
      "Closing note",
      "Acme page footer",
    ].join("\n");

  it("detects edge lines that repeat on most pages", () => {
    const repeated = detectRepeatedLines([page(1), page(2), page(3), page(4)]);
    expect(repeated.has("acme confidential")).toBe(true);
    expect(repeated.has("acme page footer")).toBe(true);
    expect(repeated.has("more body")).toBe(true);
    expect(repeated.has("shared interior")).toBe(false);
  });

  it("does not flag a line that appears on fewer than the required pages", () => {
    const pages = [
      page(1).replace("Acme Confidential", "One-off A"),
      page(2).replace("Acme Confidential", "One-off B"),
      page(3),
      page(4),
    ];
    const repeated = detectRepeatedLines(pages);
    expect(repeated.has("one-off a")).toBe(false);
    expect(repeated.has("acme confidential")).toBe(false);
    expect(repeated.has("acme page footer")).toBe(true);
  });

  it("needs at least three pages", () => {
    expect(detectRepeatedLines([page(1), page(2)])).toEqual(new Set());
  });

  it("ignores repeated body paragraphs away from the page edges", () => {
    const body = Array.from({ length: 12 }, (_, index) => `Line ${index}`);
    body[6] = "Shared paragraph";
    const repeated = detectRepeatedLines([body.join("\n"), body.join("\n"), body.join("\n")]);
    expect(repeated.has("shared paragraph")).toBe(false);
  });
});

describe("stripRepeatedLines", () => {
  it("strips repeated lines only near the page edges", () => {
    const lines = Array.from({ length: 12 }, (_, index) => `Body ${index}`);
    const text = ["Acme Confidential", ...lines, "Acme page footer"].join("\n");
    const repeated = new Set(["acme confidential", "acme page footer"]);
    const result = stripRepeatedLines(text, repeated);
    expect(result.removed).toBe(2);
    expect(result.text.startsWith("Body 0")).toBe(true);
    expect(result.text.endsWith("Body 11")).toBe(true);
  });

  it("returns the text unchanged when nothing is repeated", () => {
    expect(stripRepeatedLines("a\nb\nc", new Set())).toEqual({ text: "a\nb\nc", removed: 0 });
  });
});

describe("duplicate page detection", () => {
  const base = Array.from({ length: 50 }, (_, index) => `term${index}`).join(" ");
  const words = Array.from({ length: 50 }, (_, index) => "word" + String.fromCharCode(97 + (index % 26)) + index).join(" ");

  it("ignores pages shorter than the minimum length", () => {
    expect(findDuplicatePage(["short page"], "short page")).toBeNull();
  });

  it("matches an exact page and returns its 1-based position", () => {
    expect(findDuplicatePage([base], base)).toBe(1);
    expect(findDuplicatePage(["different ".repeat(30), base], base)).toBe(2);
  });

  it("matches a near duplicate with a single changed word", () => {
    expect(findDuplicatePage([words], words.replace("worde4", "wordze4"))).toBe(1);
  });

  it("treats pages that differ only by page numbers as distinct", () => {
    const page = (number: number) =>
      `Programme review page ${number}. Workstream ${number} reported steady progress this cycle. Milestones remain green, risks are tracked weekly, and the vendor confirmed the integration sandbox is available for the pilot.`;
    expect(findDuplicatePage([page(1)], page(2))).toBeNull();
    expect(findDuplicatePage([page(1)], page(1))).toBe(1);
  });

  it("does not match unrelated text", () => {
    expect(findDuplicatePage(["alpha ".repeat(50)], "omega ".repeat(50))).toBeNull();
  });
});

describe("markUncertainLines", () => {
  it("flags lines below the confidence threshold", () => {
    const result = markUncertainLines([
      { text: "Confident line", confidence: 92 },
      { text: "Doubtful line", confidence: 69 },
      { text: "", confidence: 10 },
    ]);
    expect(result.uncertain).toBe(true);
    expect(result.uncertainLines).toEqual(["Doubtful line"]);
  });

  it("keeps a line exactly at the threshold as certain", () => {
    expect(markUncertainLines([{ text: "Borderline", confidence: 70 }]).uncertain).toBe(false);
  });

  it("caps stored lines and truncates long ones", () => {
    const lines = Array.from({ length: 30 }, (_, index) => ({
      text: `line ${index} ${"z".repeat(300)}`,
      confidence: 20,
    }));
    const result = markUncertainLines(lines);
    expect(result.uncertainLines).toHaveLength(25);
    expect(result.uncertainLines[0].length).toBe(200);
  });
});

describe("aggregateConfidence", () => {
  it("weights pages by the amount of meaningful text", () => {
    const confidence = aggregateConfidence([
      { text: "a".repeat(100), confidence: 0.9 },
      { text: "a".repeat(10), confidence: 0.5 },
    ]);
    expect(confidence).toBe(0.864);
  });

  it("ignores pages without confidence", () => {
    expect(
      aggregateConfidence([
        { text: "alpha", confidence: null },
        { text: "beta", confidence: 0.8 },
      ])
    ).toBe(0.8);
  });

  it("returns null when no page has confidence", () => {
    expect(aggregateConfidence([{ text: "alpha", confidence: null }])).toBeNull();
    expect(aggregateConfidence([])).toBeNull();
  });
});

describe("truncatePageText", () => {
  it("caps stored page text", () => {
    expect(truncatePageText("x".repeat(30_001))).toHaveLength(30_000);
    expect(truncatePageText("short")).toBe("short");
    expect(truncatePageText("abcdef", 3)).toBe("abc");
  });
});

describe("assembleDocumentText", () => {
  it("adds page markers and skips empty pages", () => {
    const result = assembleDocumentText([
      { pageNumber: 1, text: "Alpha" },
      { pageNumber: 2, text: "   " },
      { pageNumber: 3, text: "Beta" },
    ]);
    expect(result).toEqual({
      text: "[[page 1]] Alpha\n\n[[page 3]] Beta",
      truncated: false,
    });
  });

  it("stops at the limit and reports truncation", () => {
    const result = assembleDocumentText(
      [
        { pageNumber: 1, text: "Alpha" },
        { pageNumber: 2, text: "Beta" },
      ],
      20
    );
    expect(result.truncated).toBe(true);
    expect(result.text).toBe("[[page 1]] Alpha");
  });
});

describe("readablePageText", () => {
  it("replaces page markers with readable headings", () => {
    expect(readablePageText("[[page 2]]Foo\n[[page 10]]Bar")).toBe(
      "Page 2\n\nFoo\n\nPage 10\n\nBar"
    );
  });
});
