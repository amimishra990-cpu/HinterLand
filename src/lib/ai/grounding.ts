import "server-only";

export function normalizeForMatch(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function quoteIsSupported(quote: string | null | undefined, sources: string[]) {
  if (!quote) return false;
  const needle = normalizeForMatch(quote);
  if (needle.length < 8) return false;
  return sources.some((source) => normalizeForMatch(source).includes(needle));
}

export function valueAppearsInEvidence(value: string | null, evidence: string | null) {
  if (!value || !evidence) return false;
  const needle = normalizeForMatch(value);
  if (needle.length < 2) return false;
  return normalizeForMatch(evidence).includes(needle);
}

const PAGE_MARKER = /\[\[page\s+(\d+)\]\]/gi;

export function pageNumberForQuote(source: string, quote: string) {
  const index = source.toLowerCase().indexOf(quote.toLowerCase());
  if (index < 0) return null;
  let page: number | null = null;
  PAGE_MARKER.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = PAGE_MARKER.exec(source)) !== null) {
    if (match.index > index) break;
    page = Number.parseInt(match[1], 10);
  }
  return page && Number.isFinite(page) ? page : null;
}

export type OwnerDeadlineResult = {
  owner: string | null;
  due: string | null;
  ownerVerified: boolean;
  dueVerified: boolean;
};

// Owners and deadlines survive only when the verified evidence quote itself
// names them. Relative deadlines stay verbatim and are flagged for confirmation.
export function groundOwnerAndDeadline(
  owner: string | null,
  due: string | null,
  evidence: string | null,
  evidenceVerified: boolean
): OwnerDeadlineResult {
  const ownerVerified =
    Boolean(owner) && evidenceVerified && valueAppearsInEvidence(owner, evidence);
  const dueVerified = Boolean(due) && evidenceVerified && valueAppearsInEvidence(due, evidence);
  return {
    owner: ownerVerified ? owner : null,
    due: dueVerified ? due : null,
    ownerVerified,
    dueVerified,
  };
}
