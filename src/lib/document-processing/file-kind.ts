import type { DocumentFileType } from "./types";

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export type FileKind = {
  fileType: DocumentFileType;
  mimeType: string;
  extension: string;
  extensions: string[];
  mimeTypes: string[];
};

const KINDS: FileKind[] = [
  {
    fileType: "PDF",
    mimeType: "application/pdf",
    extension: "pdf",
    extensions: ["pdf"],
    mimeTypes: ["application/pdf", "application/x-pdf", "application/octet-stream"],
  },
  {
    fileType: "DOCX",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extension: "docx",
    extensions: ["docx"],
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/octet-stream",
      "application/zip",
    ],
  },
  {
    fileType: "Image",
    mimeType: "image/png",
    extension: "png",
    extensions: ["png"],
    mimeTypes: ["image/png"],
  },
  {
    fileType: "Image",
    mimeType: "image/jpeg",
    extension: "jpg",
    extensions: ["jpg", "jpeg"],
    mimeTypes: ["image/jpeg", "image/jpg"],
  },
  {
    fileType: "Image",
    mimeType: "image/webp",
    extension: "webp",
    extensions: ["webp"],
    mimeTypes: ["image/webp"],
  },
];

export const ACCEPTED_FILE_EXTENSIONS = KINDS.flatMap((kind) => kind.extensions);

function extensionOf(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export function documentKind(file: { name: string; type?: string }): FileKind | null {
  const extension = extensionOf(file.name);
  const mime = (file.type ?? "").toLowerCase();
  const byExtension = KINDS.find((kind) => kind.extensions.includes(extension));
  if (byExtension) {
    if (!mime || byExtension.mimeTypes.includes(mime)) return byExtension;
    return null;
  }
  if (mime) return KINDS.find((kind) => kind.mimeTypes.includes(mime)) ?? null;
  return null;
}

export function isSupportedDocument(file: { name: string; type?: string }) {
  return documentKind(file) !== null;
}

function startsWith(bytes: Uint8Array, signature: number[], offset = 0) {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

export function matchesSignature(bytes: Uint8Array, kind: FileKind) {
  switch (kind.mimeType) {
    case "application/pdf":
      return startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]);
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]);
    case "image/png":
      return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/jpeg":
      return startsWith(bytes, [0xff, 0xd8, 0xff]);
    case "image/webp":
      return startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
        startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8);
    default:
      return false;
  }
}

export function extensionForKind(fileType: DocumentFileType, name: string) {
  const extension = extensionOf(name);
  const known = documentKind({ name, type: "" });
  if (
    known &&
    known.fileType === fileType &&
    known.extensions.includes(extension)
  ) {
    return extension;
  }
  return fileType === "PDF" ? "pdf" : fileType === "DOCX" ? "docx" : "png";
}
