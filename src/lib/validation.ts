const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: FormDataEntryValue | null) {
  return String(value ?? "").trim().toLowerCase();
}

export function isValidEmail(value: string) {
  return value.length <= 254 && EMAIL_PATTERN.test(value);
}

export function passwordProblem(value: string) {
  if (value.length < 8) return "Use at least 8 characters.";
  if (value.length > 128) return "Use no more than 128 characters.";
  if (!/[A-Za-z]/.test(value)) return "Include at least one letter.";
  if (!/[0-9]/.test(value)) return "Include at least one number.";
  return null;
}

export function safeRedirectPath(value: FormDataEntryValue | string | null | undefined) {
  const path = String(value ?? "").trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return "/app";
  }
  if (path.startsWith("/login") || path.startsWith("/register")) return "/app";
  return path;
}

export function requiredText(
  value: string,
  label: string,
  maxLength: number
): string | null {
  const trimmed = value.trim();
  if (!trimmed) return `${label} is required.`;
  if (trimmed.length > maxLength) {
    return `${label} must be ${maxLength} characters or fewer.`;
  }
  return null;
}

export function optionalText(value: string, label: string, maxLength: number) {
  if (value.length > maxLength) {
    return `${label} must be ${maxLength} characters or fewer.`;
  }
  return null;
}
