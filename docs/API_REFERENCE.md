# API reference

All workspace endpoints require an authenticated Supabase session cookie. They
return JSON and are implemented as Next.js route handlers under `src/app/api`.

Common responses:

| Status | Meaning |
| --- | --- |
| `401` | No valid session; the client redirects to `/login?reason=session-expired` |
| `503` | Supabase environment variables are missing |
| `400` | Validation failure; body is `{ "error": "..." }` |
| `403` | Cross-origin mutation rejected |
| `404` | Record not found or not owned by the caller |
| `409` | Duplicate resource (project name or identical document fingerprint) |
| `429` | Rate limit exceeded (uploads or AI quota); see `Retry-After` where sent |
| `500` | Unexpected server error; details are logged server-side only |

Mutating endpoints (`POST`, `PATCH`, `DELETE`) require a same-origin
`Origin`/`Referer`.

## `GET /api/workspace`

Returns the authenticated user's full workspace. It does not create sample
content: a new account returns empty arrays for every collection.

```json
{
  "profile": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "Alex Rivera",
    "role": "Member",
    "emailVerified": true,
    "notificationPreferences": {
      "meetingReminders": true,
      "approvalRequests": true,
      "weeklySummary": false
    }
  },
  "projects": [],
  "documents": [],
  "meetings": [],
  "actions": [],
  "knowledge": [],
  "writingPreferences": { "tone": "...", "structure": "...", "greeting": "...", "signOff": "...", "preserve": "...", "useExamples": true },
  "writingExamples": [],
  "user": { "id": "uuid", "email": "user@example.com" }
}
```

Responses use `Cache-Control: no-store`.

## `PATCH /api/profile`

```json
{
  "fullName": "Alex Rivera",
  "role": "Programme lead",
  "notificationPreferences": {
    "meetingReminders": true,
    "approvalRequests": false,
    "weeklySummary": true
  }
}
```

`fullName` is required (1–120 characters). `role` is optional (max 80).
Returns `{ "ok": true }`.

## `POST /api/projects`

```json
{
  "name": "Customer research",
  "description": "Optional description",
  "objective": "Agree the phase-two plan",
  "status": "Active"
}
```

`status` must be `Active`, `In review`, or `Paused`. Duplicate names for the same
user return `409`. Returns `201 { "id": "uuid" }`.

## `PATCH /api/projects/[id]`

Accepts any subset of `name`, `description`, `objective`, `status`, and
`archived` (boolean). `name` and `objective` must remain non-empty. `archived:
true` sets `archived_at`; `false` clears it. Duplicate names return `409`. A
project owned by another user returns `404`. Returns `{ "ok": true, "id":
"uuid" }`.

## `DELETE /api/projects/[id]`

Deletes the project record. Documents, meetings, preparations, meeting records,
knowledge entries, and AI runs keep their data with `project_id` set to null.
Decisions and action items filed under the project are deleted by cascade. A
project owned by another user returns `404`. Returns `{ "ok": true, "id":
"uuid" }`.

## `POST /api/documents`

`multipart/form-data` fields:

| Field | Required | Notes |
| --- | --- | --- |
| `file` | yes | PDF, DOCX, PNG, JPEG, or WebP, max 20 MB; file signature must match the extension |
| `name` | yes | Display name, max 240 characters; the correct extension is appended when missing |
| `projectId` | no | Must belong to the caller |
| `extractedText` | yes | Produced by the browser extractor, capped at 50,000 characters |
| `pageCount` | no | Integer or empty string |
| `extractionMethod` | no | `pdf-text`, `ocr`, `mixed`, `docx`, `image`, or `manual` |
| `sourceKind` | no | `Document` (default), `Agenda`, `Previous notes`, `Transcript`, or `Note` |
| `extractionConfidence` | no | 0–1 OCR confidence |
| `pages` | no | JSON array of `{ pageNumber, text, extractionMethod, confidence, uncertain, uncertainLines, rotationApplied, duplicateOf }`; max 1,000 pages, 30,000 characters each |
| `extractionQuality` | no | JSON object with processing counts and warnings |
| `contentHash` | no | SHA-256 hex of the original file, used for duplicate detection |
| `processingError` | no | Safe failure reason, max 500 characters |

The server re-checks the extension, MIME type, 20 MB size limit, and the file's
magic signature (PDF, ZIP-based DOCX, PNG, JPEG, WebP) before storage is used.
Each user is limited to 40 uploads per rolling hour; excess requests return
`429` with `Retry-After: 3600`.

The original file is uploaded to private storage at
`<user-id>/<document-id>/<safe-name>`. Documents with low-confidence OCR pages
are saved with status `Needs review`. On insert failure the uploaded object is
removed; on page-index failure the document row and object are removed too.

Returns `201 { "id": "uuid", "status": "Ready" | "Needs review", "duplicate": false }`.

If the same user already uploaded an identical file, the request is rejected
before upload with `409 { "error": "...", "existingDocumentId": "uuid" }`.

## `GET /api/documents/search`

`?q=<text>&projectId=<uuid>` — full-text search over the caller's page index
(`document_pages.search`) and non-paged document text (`documents.search`), at
least two characters, max 20 results. Returns snippets, page numbers, OCR
confidence, the uncertain flag, and the extraction method. Results never cross
user or project boundaries.

```json
{
  "query": "vendor readiness",
  "results": [
    {
      "documentId": "uuid",
      "documentName": "Programme Review Pack.pdf",
      "projectId": "uuid",
      "fileType": "PDF",
      "status": "Ready",
      "pageNumber": 3,
      "snippet": "Vendor readiness review The vendor confirmed…",
      "confidence": null,
      "uncertain": false,
      "extractionMethod": "pdf-text"
    }
  ],
  "truncated": false
}
```

## `GET /api/documents/lookup`

`?hash=<sha256-hex>` — returns the caller's matching document metadata or
`{ "document": null }`. Used to avoid reprocessing an unchanged file.

## `GET /api/documents/[id]/pages`

`?page=<n>` (1-based, default 1) — returns document processing metadata and the
stored page text with `extractionMethod`, `confidence`, `uncertain`,
`uncertainLines`, `rotationApplied`, and `duplicateOf`. `page` is `null` when the
document has no page index (for example DOCX). Requires ownership; unknown or
unowned IDs return `404`.

## `POST /api/documents/text`

Saves pasted context as a source in the caller's library.

```json
{
  "name": "Pilot kickoff agenda",
  "text": "9:00 Welcome…",
  "projectId": "uuid or null",
  "sourceKind": "Agenda"
}
```

`name` is 1–240 characters and `text` is 1–50,000 characters. `projectId` must
belong to the caller. `sourceKind` defaults to `Note`. The row is inserted with
`file_type = 'Notes'`, `extraction_method = 'manual'`, a derived excerpt, and no
storage object. Limited to 40 pasted sources per rolling hour. Returns
`201 { "id": "uuid" }`.

## `PATCH /api/documents/[id]`

Edits a source owned by the caller.

```json
{ "name": "New name", "sourceKind": "Transcript", "projectId": "uuid or null", "text": "..." }
```

All fields are optional; at least one is required. `text` is accepted only for
pasted sources (no `storage_path`), and updating it also refreshes the excerpt,
size, and stored analysis summary. Returns `{ "ok": true }`; unowned IDs return
`404`.

## `DELETE /api/documents/[id]`

Verifies ownership, removes the storage object (if present), then deletes the
document row. Pasted sources have no storage object. Returns `{ "ok": true }`.

## `GET /api/documents/[id]/download`

Verifies ownership and returns a 60-second signed URL:

```json
{ "url": "https://.../storage/v1/object/sign/documents/...", "expiresIn": 60 }
```

The browser opens this URL; the bucket itself is private.

## `POST /api/knowledge`

```json
{
  "title": "Pilot review — meeting record",
  "type": "Meeting record",
  "projectId": "uuid or null",
  "meetingId": "uuid or null",
  "meetingTitle": "Pilot review",
  "meetingDate": "2026-11-12",
  "topic": "Meeting record",
  "description": "Executive summary",
  "content": ["Discussion: ...", "Decision: ..."],
  "related": [],
  "approved": true,
  "preparation": { "objective": "...", "brief": {} },
  "meetingRecord": { "summary": "..." }
}
```

`type` must be `Meeting record`, `Decision log`, `Preparation brief`, or
`Refinement`. If `meetingId` is absent and `meetingTitle` is supplied, an
existing meeting with that title is reused or a new one is created. A
`Preparation brief` also writes `meeting_preparations`; a `Meeting record` also
writes `meeting_records`. Returns `201 { "id": "uuid" }`.

## `PATCH /api/knowledge/[id]`

```json
{ "approved": true }
```

Sets approval and `approved_at`. Returns `{ "ok": true }`; `404` when the record
is not owned by the caller.

## `PATCH /api/actions/[id]`

```json
{ "done": true }
```

Sets `done` and `completed_at`. Returns `{ "ok": true }`.

## `PATCH /api/writing/preferences`

```json
{
  "tone": "Professional",
  "structure": "Short, direct sentences",
  "greeting": "Warm and brief",
  "signOff": "Best,",
  "preserve": "Keep the original reason.",
  "useExamples": true
}
```

Upserts the caller's row. Returns `{ "ok": true }`.

## `POST /api/writing/examples`

```json
{
  "title": "Client status update",
  "context": "Weekly update",
  "excerpt": "Short approved sample..."
}
```

`excerpt` is required (max 10,000 characters). Returns `201 { "id": "uuid" }`.

## `DELETE /api/writing/examples/[id]`

Deletes an example owned by the caller. Returns `{ "ok": true }`.

## `POST /api/workspace/reset`

Deletes the caller's documents (including storage objects), projects, meetings,
preparations, records, decisions, actions, knowledge entries, and writing
examples, then resets writing preferences to defaults. The account stays signed
in and the workspace is left empty; nothing is reseeded. Returns `{ "ok": true }`.

## `DELETE /api/account`

Permanently deletes the signed-in account.

```json
{ "password": "current password", "confirmation": "DELETE" }
```

The password is verified with a throwaway Supabase client that does not persist
a session; a wrong password returns `403`. `confirmation` must be exactly
`DELETE`. The route removes every object under the caller's `<user-id>/` storage
prefix first; if that fails it aborts before deleting any database row and
returns `500`. It then calls `delete_current_account()`, which deletes the
`auth.users` row and cascades every owned row, and signs the session out.
Returns `{ "ok": true }`. Requires a same-origin request.

## AI routes

All AI routes are server-only, require an authenticated session, reject
cross-origin POSTs, and return `{ error, code?, detail? }` on failure. They use
the configured provider from the server environment; no key ever reaches the
browser. Every structured response includes `meta` (`provider`, `model`,
`promptVersion`, `usage`, `latencyMs`, `runId`, `cached`) and, where relevant,
a `context` source manifest. Runs are recorded in `ai_runs` without prompt or
document text.

| Route | Purpose |
| --- | --- |
| `GET /api/ai/status` | Reports whether the provider is configured and the exact missing settings. |
| `POST /api/ai/communication` | Refines a message, returns alternatives, intention, improvements, ambiguity warnings, change explanations, and unsupported claims. |
| `POST /api/ai/preparation` | Builds a grounded meeting brief from title, objective, agenda, previous notes, and selected documents. |
| `POST /api/ai/intelligence` | Converts notes or a consented transcript into a record; every decision and action quote is verified server-side, and unverified owners or deadlines are removed. |
| `POST /api/ai/document` | Discriminated `action`: `summarize`, `analyze`, `compare` (2–8 documents), or `qa`. Citations are checked against the source; `analyze` can persist findings with `persist: true`. |
| `POST /api/ai/development` | Compares a draft with saved preferences and (optionally) approved examples; returns consistency findings, suggestions, and a proposed revision. |
| `POST /api/ai/knowledge` | Answers a question from the caller's approved knowledge records only, with verified citations and related records. |

Common request shapes:

```json
{ "draft": "...", "intention": "...", "tone": "Professional", "projectId": "uuid or null" }
{ "title": "Pilot review", "objective": "...", "agenda": ["..."], "previousNotes": "...", "documentIds": ["uuid"] }
{ "title": "Pilot review", "notes": "...", "sourceKind": "Notes", "consent": false, "projectId": "uuid or null" }
{ "action": "qa", "documentIds": ["uuid"], "question": "What deadline is stated?" }
{ "action": "compare", "documentIds": ["uuid", "uuid"] }
{ "question": "What did we decide about phase two?", "projectId": "uuid or null" }
```

`400` covers invalid input, missing transcript consent, and unauthorized
project/document selection. `401` means no session. `429` means the per-user
hourly limit (`AI_REQUESTS_PER_HOUR`) was reached. `502`/`504` cover provider
failures and timeouts; provider error text is not exposed to the client.

## Auth routes

| Route | Purpose |
| --- | --- |
| `/auth/callback?code=...&next=/app` | Exchanges a Supabase PKCE code for a cookie session. |
| `/auth/confirm?token_hash=...&type=email` | Verifies an email-confirmation token hash. |
| `/auth/confirm?token_hash=...&type=recovery` | Verifies a password-recovery link and redirects to `/reset-password`. |

Invalid or expired links redirect to `/login?error=link-invalid`.

## Server actions

`src/app/(auth)/actions.ts` exposes `signInAction`, `signUpAction`,
`requestPasswordResetAction`, `updatePasswordAction`, `resendVerificationAction`,
and `signOutAction`. They run only on the server, validate inputs, and redirect
after success.
