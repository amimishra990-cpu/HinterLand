import { describe, expect, it } from "vitest";

import { isSourceKind, SOURCE_KINDS } from "@/lib/workspace-types";

describe("source kinds", () => {
  it("exposes the five labels in display order", () => {
    expect(SOURCE_KINDS).toEqual([
      "Document",
      "Agenda",
      "Previous notes",
      "Transcript",
      "Note",
    ]);
  });

  it("accepts every supported label", () => {
    for (const kind of SOURCE_KINDS) {
      expect(isSourceKind(kind)).toBe(true);
    }
  });

  it("rejects unknown or malformed values", () => {
    expect(isSourceKind("document")).toBe(false);
    expect(isSourceKind("Minutes")).toBe(false);
    expect(isSourceKind("")).toBe(false);
    expect(isSourceKind(null)).toBe(false);
    expect(isSourceKind(42)).toBe(false);
  });
});
