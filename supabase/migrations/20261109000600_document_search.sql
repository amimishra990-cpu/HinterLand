-- Full-text search for document text that is not stored page by page (DOCX and
-- documents uploaded before the page index existed). Additive: one generated
-- column and one GIN index. Existing rows are indexed from their stored text;
-- no values are modified.

alter table public.documents
  add column if not exists search tsvector
    generated always as (
      to_tsvector(
        'english',
        coalesce(name, '') || ' ' || coalesce(excerpt, '') || ' ' || coalesce(extracted_text, '')
      )
    ) stored;

create index if not exists documents_search_idx
  on public.documents using gin (search);
