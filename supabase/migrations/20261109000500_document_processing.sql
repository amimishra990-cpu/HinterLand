-- Advanced document processing: extraction metadata, page-level index, OCR flags.
-- Additive only. Widens the accepted file types and statuses; existing rows keep
-- their values and every new column is nullable or has a safe default.

alter table public.documents
  drop constraint documents_file_type_check,
  drop constraint documents_status_check;

alter table public.documents
  add constraint documents_file_type_check
    check (file_type in ('PDF', 'DOCX', 'Notes', 'Image')),
  add constraint documents_status_check
    check (status in ('Ready', 'Processing', 'Needs review', 'Failed')),
  add column extraction_method text
    check (
      extraction_method is null
      or extraction_method in ('pdf-text', 'ocr', 'mixed', 'docx', 'image', 'manual')
    ),
  add column extraction_confidence numeric(4, 3)
    check (
      extraction_confidence is null
      or (extraction_confidence >= 0 and extraction_confidence <= 1)
    ),
  add column extraction_quality jsonb not null default '{}'::jsonb,
  add column content_hash text
    check (content_hash is null or content_hash ~ '^[0-9a-f]{64}$'),
  add column mime_type text
    check (mime_type is null or char_length(mime_type) <= 120),
  add column processed_at timestamptz,
  add column processing_error text
    check (processing_error is null or char_length(processing_error) <= 500),
  add column document_version integer not null default 1
    check (document_version >= 1);

comment on column public.documents.extraction_method is
  'How text was obtained: selectable PDF text, OCR, a mix, DOCX parsing, image OCR, or manual entry.';
comment on column public.documents.extraction_quality is
  'Processing counts such as scanned pages, OCR pages, low-confidence pages, duplicates removed.';
comment on column public.documents.content_hash is
  'SHA-256 of the original file, used to avoid reprocessing identical uploads.';

create unique index documents_user_content_hash_idx
  on public.documents (user_id, content_hash)
  where content_hash is not null;

create table public.document_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  page_number integer not null check (page_number >= 1),
  text text not null default '' check (char_length(text) <= 30000),
  extraction_method text not null
    check (extraction_method in ('pdf-text', 'ocr', 'mixed', 'docx', 'image')),
  confidence numeric(4, 3)
    check (confidence is null or (confidence >= 0 and confidence <= 1)),
  uncertain boolean not null default false,
  uncertain_lines text[] not null default '{}',
  rotation_applied integer
    check (rotation_applied is null or rotation_applied in (0, 90, 180, 270)),
  duplicate_of integer,
  search tsvector generated always as (to_tsvector('english', text)) stored,
  created_at timestamptz not null default now(),
  unique (document_id, page_number)
);

create index document_pages_user_document_idx
  on public.document_pages (user_id, document_id);
create index document_pages_search_idx
  on public.document_pages using gin (search);

alter table public.document_pages enable row level security;

create policy "document_pages_select_own" on public.document_pages
  for select to authenticated
  using (user_id = auth.uid());

create policy "document_pages_insert_own" on public.document_pages
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.documents d
      where d.id = document_id and d.user_id = auth.uid()
    )
  );

create policy "document_pages_update_own" on public.document_pages
  for update to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.documents d
      where d.id = document_id and d.user_id = auth.uid()
    )
  )
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.documents d
      where d.id = document_id and d.user_id = auth.uid()
    )
  );

create policy "document_pages_delete_own" on public.document_pages
  for delete to authenticated
  using (user_id = auth.uid());

revoke all on public.document_pages from anon;
grant select, insert, update, delete on public.document_pages to authenticated;
