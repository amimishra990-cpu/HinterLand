# Security implementation

## Credentials

Only two public values are used by the browser:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

They live in `.env.local` (ignored by Git). `.env.example` documents the names
without values. The application never reads, requires, or exposes a Supabase
service-role key. If a service-role key is present in the environment, it is not
referenced by this codebase.

No secret key should be committed, pasted into chat, or added to a
`NEXT_PUBLIC_*` variable.

## Authentication

- Supabase Auth email/password is the only sign-in method.
- Registration collects a full name, email, and password. Passwords require at
  least 8 characters with a letter and a number.
- Verification and recovery emails redirect through:
  - `/auth/callback` — exchanges a PKCE `code` for a session.
  - `/auth/confirm` — verifies an OTP `token_hash` for email confirmation and
    recovery links.
- Sessions are stored in HTTP cookies by `@supabase/ssr`; the browser cannot
  read the tokens as JavaScript values. The server client refreshes them on each
  request through `src/proxy.ts`.
- Unauthenticated requests to `/app` are redirected to
  `/login?next=<path>&reason=session-expired`. Authenticated requests to the
  auth pages are redirected to `/app`.
- `signOutAction` clears the local session and returns to `/login`.
- Expired sessions surface as 401 responses from the API. The client provider
  redirects to `/login?reason=session-expired`.
- Sign-in errors are mapped to safe user-facing messages; Supabase internals are
  not returned.

## Route protection and authorization

Every workspace API route calls `getApiContext()`:

1. Reads the session with `supabase.auth.getUser()` (server-verified, not a
   client-asserted cookie).
2. Returns `503` if Supabase is not configured.
3. Returns `401` for a missing/expired session.
4. Returns the authenticated user and a request-scoped Supabase client.

Mutating routes also call `sameOrigin(request)` and reject cross-origin
requests. Inputs are validated and length-limited before use. Ownership is
checked explicitly for referenced projects, meetings, and documents, in addition
to RLS.

Client-side auth checks are only used for navigation and empty/loading states;
they are never the security boundary.

## Row-level security

RLS is enabled on every table in `supabase/migrations/20261109000100_initial_schema.sql`.
Policies restrict all four operations to the `authenticated` role and require
ownership through `auth.uid()`:

- `profiles`: `id = auth.uid()`
- all other tables: `user_id = auth.uid()`

This prevents reading, updating, or deleting another account's rows even if a
client crafts requests directly against Supabase.

## Document storage

- The `documents` bucket is private (`public = false`).
- Allowed MIME types: PDF, DOCX, PNG, JPEG, and WebP. Images are accepted for
  OCR of scans and document photos.
- Bucket file size limit: 20 MB.
- Upload route re-validates extension, MIME, size, file signature, and project
  ownership.
- Object path is `<user-id>/<document-id>/<sanitised-file-name>`; the first path
  segment must equal `auth.uid()`.
- Storage policies require the same folder ownership for select, insert, update,
  and delete.
- Download route looks up the document by id and owner, then creates a signed
  URL valid for 60 seconds with a download filename. The bucket is never exposed
  publicly.
- Delete route verifies ownership, removes the storage object, then deletes the
  database row. If the object is already missing, the row is still removed.
- Pasted context (`POST /api/documents/text`) creates no storage object and
  accepts only text, so it cannot be used to upload arbitrary binaries.

## Account deletion

- `DELETE /api/account` requires a same-origin request, a valid session, the
  current password, and the exact confirmation string `DELETE`.
- The password is checked with a separate Supabase client configured with
  `persistSession: false`, so reauthentication never replaces or extends the
  browser session. A wrong password returns `403` and changes nothing.
- Stored objects under the caller's `<user-id>/` prefix are removed before any
  row is deleted. If listing or removal fails, the route returns `500` and the
  account and database rows remain intact.
- The `auth.users` row is deleted through `public.delete_current_account()`, a
  `security definer` function with an empty `search_path`, executable only by
  `authenticated`. Ownership comes from `auth.uid()`, never from a request body.
- All workspace tables cascade from `auth.users`, so the profile, preferences,
  projects, sources, pages, meetings, records, decisions, actions, knowledge
  entries, writing examples, and AI metadata are deleted in the same statement.
- The route signs the session out and returns `{ ok: true }`. The client then
  redirects to the public site; the deleted session cannot be reused.
- Workspace reset is a different operation. It clears workspace content and
  storage and keeps the account; it is never presented as account deletion.
- Another account's rows and files are untouched: deletion targets only
  `auth.uid()` and the caller's storage prefix, and RLS blocks cross-account
  reads in the same request.

## Uploaded file handling

- PDF/DOCX text extraction still runs in the browser with the existing
  `pdfjs-dist` and `mammoth` code, before any upload.
- Extraction is capped at 50,000 characters; the server also enforces a
  100,000-character database limit.
- The upload route reads the first bytes of the file and checks the magic
  signature for PDF (`%PDF-`), DOCX (ZIP), PNG, JPEG, and WebP. A text or HTML
  file renamed to `.pdf` is rejected with `400` before storage is touched.
- Each user is limited to 40 uploads per rolling hour. The count is derived from
  `documents.uploaded_at`, so it holds across server instances; excess requests
  receive `429` with `Retry-After`.
- The original binary is uploaded only after validation; extracted text and
  analysis are stored in the row, not injected into HTML. There is no
  `dangerouslySetInnerHTML` in the application.
- Only the authenticated owner can retrieve the signed URL. Signed URLs expire
  after 60 seconds and are never cached (`Cache-Control: no-store`).

## Input validation

`src/lib/validation.ts` provides:

- email normalisation and a format check,
- password policy,
- safe relative redirect paths (prevents open redirects),
- trimmed required/optional text with length limits.

API routes validate every accepted field, cap array lengths and string sizes,
and reject unknown knowledge kinds or statuses.

## Cross-site request protection

All state-changing API handlers require a same-origin `Origin` header (requests
without an `Origin`, such as same-origin navigations, are allowed). Session
cookies are `HttpOnly`-managed by the Supabase SSR client; the client never
stores session tokens in `localStorage`.

## Security headers

`next.config.ts` applies these to every route:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` disabling camera, microphone, geolocation, payment, and USB
- `Content-Security-Policy: base-uri 'self'; object-src 'none'; frame-ancestors 'none'`
- `X-Powered-By` is disabled

The CSP deliberately does not restrict scripts because the Next.js runtime,
Tesseract workers, and the Three.js scene all rely on generated inline and blob
scripts. A nonce-based script policy is a follow-up, not a launch blocker.

## Document processing and OCR

- PDF text extraction, DOCX extraction, and OCR run in the browser before
  upload. The server never fetches or parses the original file.
- Extracted text is treated as untrusted data. It is stored as text, rendered as
  text, and is never interpolated into HTML or SQL.
- OCR pages keep their confidence value and uncertain lines. Pages below the
  confidence threshold set the document to `Needs review`; low-confidence text
  is never presented as verified.
- The page index enforces one row per document page (unique constraint) and
  parent ownership through RLS. Page inserts roll back the document row and the
  stored object if any batch fails.
- Files with an identical SHA-256 fingerprint are not processed again; the
  existing document is returned instead.

## Rate limits and quotas

- AI routes: per-user hourly quota enforced from `ai_runs`.
- Document uploads: 40 per rolling hour, derived from `documents`.
- Auth: Supabase's built-in auth rate limits apply; review them in the dashboard
  before launch.

## AI provider security

- Provider credentials (`AI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) are
  read only by server modules (`src/lib/ai/`), which import `server-only`.
  They are never echoed, logged, or returned to the browser. `GET /api/ai/status`
  reports only the provider, model, and configuration issues.
- Every AI route authenticates the caller first, then loads projects and
  documents with the user's session. Database RLS remains the final boundary;
  the route never uses a service-role client. A project or document id owned by
  another user is treated as not found.
- Meeting preparation, meeting intelligence, and knowledge answers read only
  material the caller already owns. Knowledge retrieval is restricted to
  `approved = true` records.
- Uploaded content is treated as untrusted data in prompts. System prompts
  forbid tool use and instruct the model to ignore instructions found inside
  documents.
- The server, not the model, verifies quotes and enumerations: decision and
  action evidence must appear verbatim in the source; owners and deadlines are
  removed unless the verified quote contains them; document citations are
  dropped when they cannot be found in the source text.
- `ai_runs` stores metadata only (feature, task, provider, model, status, token
  counts, latency, request hash, source ids). No prompt text, document text, or
  model output is persisted there.
- Per-user hourly quota is enforced from `ai_runs`; responses never include
  provider error bodies.

## What the user must configure in Supabase

1. Enable the Email provider (Authentication → Providers).
2. Enable "Confirm email" if verification is required.
3. Set Site URL to the deployed origin (e.g. `https://your-domain`).
4. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/auth/confirm`
   - `http://localhost:3000/reset-password`
   - the equivalent production URLs
5. Apply all migrations in `supabase/migrations/`.
6. Confirm the `documents` bucket exists and is private.
7. Set `AI_PROVIDER`, `AI_MODEL`, and a server-only API key in the hosting
   environment. Without them the AI routes return `503 ai_not_configured` with
   the exact missing settings.

No service-role key is needed for any of the above.
