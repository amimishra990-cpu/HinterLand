import "server-only";

export function parseJsonObject(text: string): unknown {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\s*/, "").replace(/```\s*$/, "").trim();
  }
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new SyntaxError("No JSON object found in the model output.");
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}
