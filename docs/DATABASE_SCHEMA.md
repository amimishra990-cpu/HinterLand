# Database schema

Hinterland stores account data in Supabase Postgres. Schema changes live in
`supabase/migrations/` and are intended to be applied with the Supabase CLI or
pasted into the SQL editor in order.

| Migration | Purpose |
| --- | --- |
| `20261109000100_initial_schema.sql` | Tables, constraints, indexes, triggers, RLS |
| `20261109000200_private_document_storage.sql` | Private `documents` bucket and storage policies |
| `20261109000300_harden_functions.sql` | Pins `search_path` on security-definer functions |
| `20261109000400_ai_runs.sql` | Metadata-only AI run log with per-user RLS |
| `20261109000500_document_processing.sql` | Processing metadata columns, `document_pages` page index, widened file/status constraints |
| `20261109000600_document_search.sql` | Generated `documents.search` tsvector and GIN index |
| `20261109000700_document_image_storage.sql` | Allows PNG, JPEG, and WebP in the private bucket for OCR uploads |
| `20261109000800_sources_and_account_deletion.sql` | Adds `documents.source_kind` with a check constraint and index, and the `delete_current_account()` function |
| `20261109000900_project_archive.sql` | Adds nullable `projects.archived_at` and a partial index for active projects |

All document migrations are additive: existing rows keep their values, and every
new column is nullable or has a safe default.

## Tables

Every user-owned table carries `user_id uuid not null references auth.users (id)
on delete cascade`. User-owned rows default `user_id` to `auth.uid()` so a
server-side insert cannot silently write another user's data.

### `profiles`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | PK, references `auth.users` |
| `full_name` | text | max 120 |
| `role` | text | max 80, default `Member` |
| `notification_preferences` | jsonb | `meetingReminders`, `approvalRequests`, `weeklySummary` |
| `workspace_seeded_at` | timestamptz | legacy column; the app no longer seeds sample content and never writes it |
| `created_at`, `updated_at` | timestamptz | |

A `security definer` trigger on `auth.users` (`handle_new_user`) creates the
profile and `writing_preferences` row after sign-up.

### `projects`

One row per project. `status` is constrained to `Active`, `In review`, or
`Paused`. A unique index on `(user_id, lower(btrim(name)))` prevents duplicate
project names per user. `archived_at` is null for active projects; when set, the
project stays readable and restorable but is listed separately from active
context. The `is_sample` column is a legacy flag retained for schema
compatibility; the application no longer seeds content or sets it, and no
workspace query reads it.

### `documents`

Metadata for a private storage object plus the processing record.

| Column | Notes |
| --- | --- |
| `project_id` | FK to `projects`, `on delete set null` |
| `name` | 1–255 characters |
| `file_type` | `PDF`, `DOCX`, `Image`, or `Notes` |
| `source_kind` | `Document`, `Agenda`, `Previous notes`, `Transcript`, or `Note`; defaults to `Document` |
| `status` | `Ready`, `Processing`, `Needs review`, or `Failed` |
| `storage_path` | unique path `<user-id>/<document-id>/<file-name>` |
| `size_bytes` | 0–20 MB |
| `page_count` | nullable |
| `excerpt` | max 5,000 characters |
| `extracted_text` | capped at 50,000 extracted characters by the API |
| `analysis` | jsonb `{ summary, findings[], gaps[] }` |
| `uploaded_at` | ordering timestamp |
| `extraction_method` | `pdf-text`, `ocr`, `mixed`, `docx`, `image`, `manual`, or null |
| `extraction_confidence` | 0–1 weighted OCR confidence, or null for pure text extraction |
| `extraction_quality` | jsonb counts: pages, scanned/OCR/low-confidence/uncertain/duplicate/empty pages, `repeatedLinesRemoved`, `truncated`, `warnings[]` |
| `content_hash` | SHA-256 hex of the original file; unique per user when present |
| `mime_type` | detected content type, max 120 characters |
| `processed_at` | when extraction finished |
| `processing_error` | max 500 characters; safe, user-facing failure reason |
| `document_version` | integer, default `1` |
| `search` | generated `tsvector` over name, excerpt, and extracted text |

The unique partial index `documents_user_content_hash_idx` on
`(user_id, content_hash)` makes re-uploading an identical file return `409`
instead of processing it again.

Pasted context is stored in the same table: `file_type = 'Notes'`,
`storage_path` and `content_hash` are null, `extraction_method = 'manual'`, and
the pasted body lives in `extracted_text` with a derived `excerpt`. Because
`source_kind` is a normal column, pasted sources carry the same labels and
filters as uploaded files.

`documents_user_source_kind_idx` supports per-user label filtering.

### `document_pages`

One row per extracted page, written in the same upload request.

| Column | Notes |
| --- | --- |
| `user_id` | defaults to `auth.uid()`; RLS column |
| `document_id` | FK to `documents`, `on delete cascade` |
| `page_number` | 1-based; unique per document |
| `text` | max 30,000 characters |
| `extraction_method` | `pdf-text`, `ocr`, `mixed`, `docx`, or `image` |
| `confidence` | 0–1 OCR confidence, or null |
| `uncertain` | true when any line or the page average fell below the review threshold |
| `uncertain_lines` | `text[]` of low-confidence line excerpts (max 25 × 200 chars) |
| `rotation_applied` | 0/90/180/270 for rotated OCR retries, or null |
| `duplicate_of` | 1-based page number this page duplicates, or null |
| `search` | generated `tsvector` over the page text |
| `created_at` | |

Pages are inserted in batches of 200; a page-insert failure deletes the document
row and its storage object so no partial document exists.

### `meetings`

| Column | Notes |
| --- | --- |
| `project_id` | FK to `projects`, `on delete set null` |
| `title` | 1–200 characters |
| `objective` | max 5,000 characters |
| `attendees` | `text[]` |
| `scheduled_start`, `scheduled_end` | timestamptz; check enforces end >= start |

### `meeting_preparations`

Stores the generated preparation brief: `objective`, `brief` jsonb, `content`
text array, `status` (`draft` / `approved`), and optional `meeting_id`.

### `meeting_records`

Stores the approved meeting record: `title`, `summary`, `content`, `status`,
`approved_at`, and optional `meeting_id`.

### `decisions`

`summary` (1–2,000 chars), `rationale`, `decided_at` date, optional
`project_id` and `meeting_id`.

### `action_items`

`label`, optional `owner`, optional `due_date`, `done`, `completed_at`, and
optional project/meeting links.

### `knowledge_entries`

The repository index shown in the workspace: `title`, `kind` (`Meeting record`,
`Decision log`, `Preparation brief`, `Refinement`), `topic`, `description`,
`content` text array, `related` text array, `approved`, `approved_at`, and
`entry_date`.

### `writing_preferences`

One row per user. `tone`, `structure`, `greeting`, `sign_off`, `preserve`, and
`use_examples`.

### `approved_writing_examples`

`title`, `context`, `excerpt`, `approved_at`. Used as writing guidance when
`use_examples` is true.

## Relationships

```
auth.users
  ├── profiles (1:1)
  ├── writing_preferences (1:1)
  ├── projects
  │     ├── documents
  │     │     └── document_pages
  │     ├── meetings
  │     ├── decisions
  │     └── action_items
  ├── meetings
  │     ├── meeting_preparations
  │     └── meeting_records
  ├── knowledge_entries
  ├── approved_writing_examples
  └── ai_runs
```

Project and meeting foreign keys use `on delete set null` where the child record
should outlive the parent, and `on delete cascade` where the child has no meaning
without it (`decisions` and `action_items` under a project).

## Indexes

- `projects_user_name_unique` — unique project name per user.
- `projects_user_active_idx` — partial index over unarchived projects ordered by
  `updated_at`; `projects_user_updated_idx`, `documents_user_uploaded_idx`,
  `knowledge_entries_user_date_idx`, `approved_writing_examples_user_idx`,
  `meetings_user_start_idx`, `decisions_user_idx`, `action_items_user_idx`,
  `meeting_preparations_user_idx`, `meeting_records_user_idx` — per-user list
  queries.
- `documents_project_idx`, `meetings_project_idx`, `decisions_project_idx`,
  `action_items_project_idx`, `knowledge_entries_project_idx`,
  `meeting_preparations_meeting_idx`, `meeting_records_meeting_idx`,
  `knowledge_entries_meeting_idx` — relationship lookups.
- `documents_user_content_hash_idx` — unique partial index that blocks duplicate
  uploads per user.
- `documents_search_idx`, `document_pages_search_idx` — GIN indexes on the
  generated `search` tsvectors for full-text search.
- `document_pages_user_document_idx` — page reads scoped by user and document;
  `document_pages_document_id_page_number_key` — unique page number per document.

## Timestamps

`set_updated_at()` is attached to every table with an `updated_at` column, so
updates always refresh it regardless of the client payload.

## Row-level security

RLS is enabled on all thirteen public tables. Each table has four policies
(`select`, `insert`, `update`, `delete`) restricted to the `authenticated` role
and requiring ownership:

```sql
using (user_id = auth.uid())
with check (user_id = auth.uid())
```

`profiles` uses `id = auth.uid()`; `writing_preferences` uses
`user_id = auth.uid()`. `ai_runs` is append-only for the browser: `select` and
`insert` only. `document_pages` additionally requires the parent document to
belong to the caller for insert and update. `anon` is revoked from every table,
and `authenticated` is granted only the privileges each table needs.

Server route handlers still add explicit `user_id` filters as defence in depth;
RLS is the final boundary.

`public.removed_content_backup_20261109` is an operational archive created while
clearing historical sample content. It has RLS enabled and no policies, so it is
unreachable through the API and holds only the removed demo rows. Drop it once
the owner confirms the archive is no longer needed.

## AI run metadata

`ai_runs` records one row per provider attempt group: `feature`, `task`,
`provider`, `model`, `prompt_version`, `status` (`succeeded`, `failed`,
`refused`, `invalid_output`), `error_code`, `input_tokens`, `output_tokens`,
`latency_ms`, `request_hash`, and `input_refs` (ids and character counts only).
It deliberately stores **no prompt text, document text, or model output**. Rows
are used for per-user hourly quota checks and failure auditing; users can read
their own rows and cannot update or delete them.

## Account deletion

`public.delete_current_account()` is a `security definer` function with an empty
`search_path`. It resolves the caller from `auth.uid()`, raises `42501` when
called without a session, and deletes the caller's `auth.users` row:

```sql
delete from auth.users where id = auth.uid();
```

Every workspace table cascades from `auth.users` (`on delete cascade`), so the
profile, preferences, projects, documents, pages, meetings, records, actions,
decisions, knowledge entries, writing examples, and AI run metadata are removed
in the same transaction. Execution is revoked from `public` and `anon` and
granted only to `authenticated`.

Storage objects are not owned by Postgres, so the API route removes every object
under the caller's `<user-id>/` prefix before invoking the function. If that
storage step fails, deletion aborts before any database row is removed.

## Private storage

`storage.buckets` contains a private `documents` bucket with a 20 MB limit and
PDF, DOCX, PNG, JPEG, and WebP MIME types. Object names must start with the
user's id:

```
<user-id>/<document-id>/<file-name>
```

Four policies on `storage.objects` require:

```sql
bucket_id = 'documents'
and (storage.foldername(name))[1] = auth.uid()::text
```

Downloads are generated server-side as 60-second signed URLs; there are no
public bucket URLs.
