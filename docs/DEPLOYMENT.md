# Deployment

Hinterland deploys as a standard Next.js application with an existing Supabase
project for auth, Postgres, and private storage. This document describes the
configuration the application expects; it does not deploy anything by itself.

## Current deployment

| Item | Value |
| --- | --- |
| Production URL | `https://hinter-land.vercel.app` |
| Host | Vercel, project `hinter-land`, connected to `amimishra990-cpu/HinterLand` `main` |
| Admin console | `https://hinterland-admin.vercel.app`, separate Vercel project `hinterland-admin` rooted at `admin-console/` |
| Database and auth | Supabase project `qewxigzaymgwqlvkswcz` |
| AI provider | Gemini `gemini-flash-lite-latest` through the OpenAI-compatible endpoint |
| Site URL and redirects | Supabase Site URL is the production origin; the allowlist holds `https://hinter-land.vercel.app/**` and `http://localhost:3000/**` |
| Email | Custom SMTP (Gmail App Password), thirty messages per hour |

Every push to `main` creates a production deployment. Preview deployments reuse
the same environment variables, so their auth links point at the production
origin. Never commit `.env.local` or paste credentials into chat, issues, or
build logs.

---

## 1. Prerequisites

| Requirement | Notes |
| --- | --- |
| Node.js | 22+ for deployment (`@supabase/supabase-js` declares `>=22`); verified locally on 24.22.1 |
| npm | 10+ |
| Supabase project | The existing project; do not create a replacement or reset it |
| Hosting | Vercel is the reference target; any Node host that supports Next.js 16 works |
| AI provider | Optional. Without it the workspace runs, but AI routes report `ai_not_configured` |

The build command is `npm run build`. The production server is `npm run start`.
The application does not use a service-role key.

---

## 2. Environment variables

Set these per environment (Development, Preview, Production on Vercel).

| Variable | Scope | Required | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public | Yes | Publishable (or anon) key |
| `NEXT_PUBLIC_SITE_URL` | Public | Recommended | Canonical origin used for email redirect links |
| `AI_PROVIDER` | Server | For AI | `openai`, `openai-compatible`, or `anthropic` |
| `AI_MODEL` | Server | For AI | Model name accepted by the provider |
| `AI_API_KEY` | Server | For AI | Provider key; falls back to `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` |
| `AI_BASE_URL` | Server | For compatible APIs | HTTPS gateway base URL |
| `AI_TIMEOUT_MS` | Server | No | Default `60000` |
| `AI_MAX_RETRIES` | Server | No | Default `2` |
| `AI_MAX_OUTPUT_TOKENS` | Server | No | Default `3000` |
| `AI_TEMPERATURE` | Server | No | Default `0.2` |
| `AI_REQUESTS_PER_HOUR` | Server | No | Default `40` per user |
| `AI_JSON_MODE` | Server | No | Default `true` |
| `AI_CONTEXT_CHARS` | Server | No | Default `24000` |
| `AI_CACHE_TTL_MS` | Server | No | Default `300000` |

Rules:

- Only `NEXT_PUBLIC_*` values reach the browser. Never prefix a provider key
  with `NEXT_PUBLIC_`.
- `SUPABASE_SERVICE_ROLE_KEY` is not read anywhere in this repository. Leave it
  out of the application environment.
- `.env.example` lists the names with placeholder values and is safe to commit.

Local setup:

```bash
cp .env.example .env.local
# fill in the public Supabase values and, optionally, the AI values
npm run dev
```

---

## 3. Supabase configuration

Project: the existing HINTERLAND project. Do not replace it, and do not run
`supabase db reset` against it.

### 3.1 Database migrations

Apply every file in `supabase/migrations/` in filename order:

```text
20261109000100_initial_schema.sql
20261109000200_private_document_storage.sql
20261109000300_harden_functions.sql
20261109000400_ai_runs.sql
20261109000500_document_processing.sql
20261109000600_document_search.sql
20261109000700_document_image_storage.sql
```

With the Supabase CLI:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Or paste each file into the SQL editor in order. The migrations are additive.
`00500` widens `documents` and creates `document_pages`; `00600` adds generated
search vectors; `00700` extends the existing bucket's MIME allowlist. None of
them delete user rows.

Record which migration versions are already applied before pushing, and review
the SQL diff the CLI prints. If a migration has already been applied through the
dashboard, `db push` may need the matching version recorded rather than rerun.

### 3.2 Authentication

In **Authentication → Providers**, enable Email. Decide whether email
confirmation is required; the registration flow supports both.

In **Authentication → URL Configuration**:

- Site URL: the production origin, for example `https://hinterland.example`.
- Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/auth/confirm`
  - `http://localhost:3000/reset-password`
  - `https://<production-host>/auth/callback`
  - `https://<production-host>/auth/confirm`
  - `https://<production-host>/reset-password`
  - `https://hinterland-admin.vercel.app/auth/callback`
  - `https://hinterland-admin.vercel.app/reset-password`
  - Preview deployments, if used, need their own exact URLs or a narrowly
    scoped wildcard. Do not allow arbitrary origins.

Set a minimum password length of 8 in the auth settings to match the client
validation, and review the built-in auth rate limits before launch.

**Email delivery (custom SMTP).** The built-in sender is capped at two
messages per hour per project, which blocks real signup and recovery. Enabling
custom SMTP in **Authentication → Emails → SMTP Settings** raises the default
cap to thirty messages per hour; the cap is separately tunable under
**Authentication → Rate Limits**.

Two upstreams work:

- Resend (`smtp.resend.com`, port `465` or `587`, username `resend`,
  password: a Resend API key). The sender must use a domain verified in
  Resend with its DNS records; `onboarding@resend.dev` only delivers to the
  Resend account owner.
- Gmail (`smtp.gmail.com`, port `465` or `587`, username: the full address,
  password: a 16-character Google App Password, sender: the same address).
  This needs 2-Step Verification on the Google account, delivers to any
  recipient, and is suitable for small deployments; Supabase warns that
  personal mail providers may affect deliverability.

After saving, send a test confirmation and a password reset from the app.

### 3.3 Storage

The `documents` bucket must exist and be **private**:

| Setting | Value |
| --- | --- |
| Public | No |
| File size limit | 20 MB |
| MIME types | `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `image/png`, `image/jpeg`, `image/webp` |

Migration `00200` creates the bucket and owner-scoped policies; `00700` adds the
image types. Object paths are `<user-id>/<document-id>/<file-name>`, and every
storage policy checks that the first path segment equals `auth.uid()`.

### 3.4 Row-level security

RLS is enabled on every application table and scoped to `auth.uid()`. After
migrations, confirm:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

Every application table should report `rowsecurity = true`. Also confirm the
policies exist for `documents`, `document_pages`, and `ai_runs`, and that `anon`
has no table grants.

---

## 4. AI provider

The six AI features (communication, preparation, intelligence, document
analysis, knowledge answers, development) stay disabled until all three of
`AI_PROVIDER`, `AI_MODEL`, and a server-side key are set.

1. Create a provider key outside this repository.
2. Add the three values to the hosting environment (and `.env.local` locally).
3. Redeploy or restart so the server reads them.
4. Check `GET /api/ai/status` while signed in. It reports the provider, model,
   and any missing setting, without echoing the key.
5. Run one request per feature and confirm usage appears in `ai_runs`.

For an OpenAI-compatible gateway, also set `AI_BASE_URL` to an HTTPS endpoint.
The per-user hourly quota is enforced from `ai_runs`; adjust
`AI_REQUESTS_PER_HOUR` deliberately.

Google AI Studio (Gemini) works through the same compatible protocol and has a
free tier with no billing account:

```
AI_PROVIDER=openai-compatible
AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
AI_MODEL=gemini-flash-lite-latest
AI_JSON_MODE=true
AI_API_KEY=<key from https://aistudio.google.com/apikey>
```

Keys created in the Google Cloud console now require a service account binding
and a Gemini API restriction; AI Studio keys work unchanged. Use a `-latest`
alias: retired model IDs answer with 404, and busy models answer with 503.

If the configured model rejects `response_format`, the provider retries once
without JSON mode, so a different Gemini model can be dropped in through
`AI_MODEL` alone.

The application never returns provider error bodies to the browser and never
persists prompt text, document text, or model output in `ai_runs`.

---

## 5. OCR

OCR uses Tesseract.js in the browser. There is no OCR server, API key, or
container to provision. The worker and language data are loaded by the client
from the installed package and its normal asset URLs.

Operational consequences:

- Extraction and OCR run on the user's device before upload; the server only
  receives the resulting text and page metadata.
- Very large scans are bounded by the 20 MB upload limit, 1,000-page index, and
  50,000-character extraction cap.
- OCR pages carry a confidence value. Pages below the threshold are saved as
  `Needs review` and are never presented as verified.
- If a future server-side OCR provider is added, keep its key server-only and
  document the new environment variable here first.

---

## 6. Hosting on Vercel

1. Import the repository. Framework preset: **Next.js**. Root directory: the
   repository root.
2. Build command `npm run build`; install command `npm install`.
3. Select Node.js 24.x (or 22.x). `@supabase/supabase-js` requires Node 22 or
   newer; the local verification suite also passed on Node 20.18.0.
4. Add the environment variables from section 2 to Production, Preview, and
   Development as appropriate. Mark AI keys as sensitive.
5. Choose a region close to the Supabase project to reduce database latency.
6. Deploy, then add the production domain and update the Supabase Site URL and
   redirect allowlist.
7. Do not enable a public deployment until the owner authorizes it.

### 6.1 Admin console as a separate project

The admin console is a standalone Next.js app in `admin-console/` and must not
be served by the public application. On Vercel:

1. Import the same repository again as a new project named `hinterland-admin`.
2. Set **Root Directory** to `admin-console` and keep the **Next.js** preset.
   Import it as a standalone project, not as a multi-service project.
3. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
   `NEXT_PUBLIC_SITE_URL=https://hinterland-admin.vercel.app`,
   `NEXT_PUBLIC_MAIN_SITE_URL=https://hinter-land.vercel.app`, and
   `MAIN_SITE_URL=https://hinter-land.vercel.app`. No AI key is required; when
   it is absent the console reports the AI provider as not configured.
4. Deploy. Every push to `main` then rebuilds both projects, each from its own
   root directory.

The console has no `/admin` prefix on its own domain: `https://hinterland-admin.vercel.app/`
redirects to `/admin`, and unauthenticated visitors are sent to `/login`. The
public project no longer serves `/admin` or `/api/admin`.

Security headers are set in `next.config.ts` for every route:
`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
`Referrer-Policy: strict-origin-when-cross-origin`, a restrictive
`Permissions-Policy`, and a minimal CSP (`base-uri`, `object-src`,
`frame-ancestors`). `X-Powered-By` is disabled. Add HSTS at the host or CDN once
HTTPS is guaranteed for the domain.

---

## 7. Post-deployment checks

Run these against the deployed origin:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://<host>/app
# expect 307 to /login

curl -s -o /dev/null -w "%{http_code}\n" https://<host>/api/workspace
# expect 401

curl -sI https://<host>/ | grep -iE "x-frame-options|referrer-policy|x-content-type"
```

In a browser:

1. Register or sign in, then confirm the workspace opens completely empty with
   no sample projects, documents, meetings, records, or actions. Create the
   first project manually.
2. Upload a text PDF, a scanned image, and a DOCX. Confirm processing states,
   page counts, and `Needs review` where confidence is low.
3. Search extracted text from the knowledge page and open a page result.
4. Create a project, upload into it, paste text as a source, then confirm the
   source label filter and document text search find it.
5. Save an approved record, sign out, sign in, and confirm it persists.
6. Confirm AI features either work or report the exact missing configuration.
7. Confirm a second account cannot see the first account's rows or files.
8. With a disposable account, delete it from Settings using the current
   password and the typed confirmation. Confirm the auth account and all rows
   and storage objects are gone, and the first account is unaffected.

---

## 8. Operations and rollback

- Application rollback: promote the previous Vercel deployment. Database
  migrations are additive and do not need to be reversed for an app rollback.
- Database changes: take a backup or verify the project's point-in-time recovery
  before applying new migrations. Never run destructive SQL to fix a deployment.
- Secrets: rotate the AI key in the provider dashboard and update the hosting
  environment. Rotating the Supabase publishable key requires updating the
  public environment variable and redeploying.
- Logs: server errors log Supabase error messages and table names only. Do not
  add document text, prompts, tokens, or credentials to logs.

---

## 9. Deployment blockers

Current external requirements before a public launch:

- The repository owner's explicit authorization to deploy.
- A production domain and matching Supabase Site URL / redirect URLs.
- AI provider credentials if AI features must be live at launch.
- Email delivery configured and tested for confirmation and recovery. The
  built-in SMTP sender is rate-limited (two messages per hour per project),
  which blocks repeated signup and reset testing; configure a dedicated SMTP
  provider before launch.
- Email confirmation is enabled in the current project. New accounts cannot
  sign in until the address is confirmed.

Everything else in this document is configuration of the existing Supabase
project and the existing codebase.
