export type ExtractedDocument = {
  text: string;
  pageCount: number | null;
  truncated: boolean;
};

const MAX_EXTRACTED_CHARACTERS = 50_000;

function limitText(text: string) {
  return text.replace(/\u0000/g, "").trim().slice(0, MAX_EXTRACTED_CHARACTERS);
}

export async function extractDocumentText(file: File): Promise<ExtractedDocument> {
  const buffer = await file.arrayBuffer();
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    const text = limitText(result.value);
    if (!text) {
      throw new Error("No usable text was found in this DOCX file.");
    }
    return {
      text,
      pageCount: null,
      truncated: result.value.trim().length > MAX_EXTRACTED_CHARACTERS,
    };
  }

  if (extension === "pdf") {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    const document = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
    const pages: string[] = [];
    let characterCount = 0;
    let truncated = false;

    try {
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        const page = await document.getPage(pageNumber);
        const content = await page.getTextContent();
        const pageText = content.items
          .filter(
            (item): item is typeof item & { str: string } =>
              "str" in item && typeof item.str === "string"
          )
          .map((item) => item.str)
          .join(" ");
        const remaining = MAX_EXTRACTED_CHARACTERS - characterCount;
        const marker = `[[page ${pageNumber}]] `;
        if (pageText.length + marker.length > remaining) {
          pages.push(`${marker}${pageText.slice(0, Math.max(remaining - marker.length, 0))}`);
          truncated = true;
          break;
        }
        pages.push(`${marker}${pageText}`);
        characterCount += pageText.length + marker.length + 2;
        if (characterCount >= MAX_EXTRACTED_CHARACTERS) {
          truncated = pageNumber < document.numPages;
          break;
        }
      }

      const text = limitText(pages.join("\n\n"));
      if (!text) {
        throw new Error(
          "No selectable text was found in this PDF. Image-only PDFs need OCR, which is not enabled."
        );
      }
      return { text, pageCount: document.numPages, truncated };
    } finally {
      await document.destroy();
    }
  }

  throw new Error("Only PDF and DOCX documents can be extracted.");
}
