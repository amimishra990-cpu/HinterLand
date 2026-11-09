import { describe, expect, it } from "vitest";

import {
  ACCEPTED_FILE_EXTENSIONS,
  MAX_UPLOAD_BYTES,
  documentKind,
  extensionForKind,
  isSupportedDocument,
  matchesSignature,
} from "../file-kind";

describe("documentKind", () => {
  it("detects a PDF by extension and matching MIME type", () => {
    expect(documentKind({ name: "Report.PDF", type: "application/pdf" })?.fileType).toBe(
      "PDF"
    );
  });

  it("accepts a PDF when the browser reports a generic MIME type", () => {
    expect(
      documentKind({ name: "report.pdf", type: "application/octet-stream" })?.fileType
    ).toBe("PDF");
  });

  it("rejects an extension whose MIME type contradicts it", () => {
    expect(documentKind({ name: "report.pdf", type: "image/png" })).toBeNull();
  });

  it("falls back to the MIME type when there is no extension", () => {
    expect(documentKind({ name: "scan", type: "image/png" })?.fileType).toBe("Image");
  });

  it("treats jpg and jpeg as the same kind", () => {
    expect(documentKind({ name: "photo.jpg", type: "image/jpeg" })?.mimeType).toBe(
      "image/jpeg"
    );
    expect(documentKind({ name: "photo.JPEG", type: "image/jpg" })?.extension).toBe("jpg");
  });

  it("detects DOCX saved with a generic zip MIME type", () => {
    expect(documentKind({ name: "brief.docx", type: "application/zip" })?.fileType).toBe(
      "DOCX"
    );
  });

  it("rejects unsupported files", () => {
    expect(documentKind({ name: "notes.txt", type: "text/plain" })).toBeNull();
    expect(documentKind({ name: "no-extension", type: "" })).toBeNull();
    expect(isSupportedDocument({ name: "notes.txt" })).toBe(false);
    expect(isSupportedDocument({ name: "scan.webp", type: "image/webp" })).toBe(true);
  });
});

describe("accepted extensions", () => {
  it("lists every supported extension once", () => {
    expect([...ACCEPTED_FILE_EXTENSIONS].sort()).toEqual([
      "docx",
      "jpeg",
      "jpg",
      "pdf",
      "png",
      "webp",
    ]);
  });
});

describe("extensionForKind", () => {
  it("preserves the original extension when it matches the kind", () => {
    expect(extensionForKind("Image", "photo.jpeg")).toBe("jpeg");
    expect(extensionForKind("PDF", "report.pdf")).toBe("pdf");
  });

  it("falls back to the canonical extension", () => {
    expect(extensionForKind("Image", "picture")).toBe("png");
    expect(extensionForKind("DOCX", "brief")).toBe("docx");
  });
});

describe("upload limits", () => {
  it("caps uploads at 20 MB", () => {
    expect(MAX_UPLOAD_BYTES).toBe(20 * 1024 * 1024);
  });
});

describe("matchesSignature", () => {
  const kindOf = (name: string, type: string) => {
    const kind = documentKind({ name, type });
    if (!kind) throw new Error(`expected a supported kind for ${name}`);
    return kind;
  };
  const bytes = (...values: number[]) => new Uint8Array(values);

  it("accepts a real PDF header and rejects a text file renamed to .pdf", () => {
    const pdf = kindOf("report.pdf", "application/pdf");
    expect(matchesSignature(bytes(0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e), pdf)).toBe(true);
    expect(matchesSignature(new TextEncoder().encode("<html>"), pdf)).toBe(false);
  });

  it("accepts a DOCX zip header", () => {
    const docx = kindOf("brief.docx", "application/zip");
    expect(matchesSignature(bytes(0x50, 0x4b, 0x03, 0x04, 0x14, 0x00), docx)).toBe(true);
    expect(matchesSignature(bytes(0x25, 0x50, 0x44, 0x46, 0x2d), docx)).toBe(false);
  });

  it("checks PNG, JPEG, and WebP signatures", () => {
    const png = kindOf("scan.png", "image/png");
    const jpeg = kindOf("photo.jpg", "image/jpeg");
    const webp = kindOf("shot.webp", "image/webp");
    expect(matchesSignature(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a), png)).toBe(
      true
    );
    expect(matchesSignature(bytes(0xff, 0xd8, 0xff, 0xe0), jpeg)).toBe(true);
    expect(
      matchesSignature(
        new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]),
        webp
      )
    ).toBe(true);
    expect(
      matchesSignature(
        new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x41, 0x56, 0x49, 0x20]),
        webp
      )
    ).toBe(false);
    expect(matchesSignature(bytes(0xff, 0xd8), jpeg)).toBe(false);
  });
});
