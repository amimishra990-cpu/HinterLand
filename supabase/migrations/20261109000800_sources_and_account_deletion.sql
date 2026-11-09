-- Context source classification and self-service account deletion.
-- Additive: existing documents default to the "Document" label.

alter table public.documents
  add column if not exists source_kind text not null default 'Document';

alter table public.documents
  drop constraint if exists documents_source_kind_check;

alter table public.documents
  add constraint documents_source_kind_check
    check (source_kind in ('Document', 'Agenda', 'Previous notes', 'Transcript', 'Note'));

comment on column public.documents.source_kind is
  'Where the context came from: uploaded document, agenda, previous notes, transcript, or a note.';

create index if not exists documents_user_source_kind_idx
  on public.documents (user_id, source_kind);

-- Deletes the calling user's auth account. Every workspace table references
-- auth.users with on delete cascade, so owned rows are removed in the same
-- transaction. Storage objects are removed by the API before this runs.
create or replace function public.delete_current_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  delete from auth.users where id = caller;
end;
$$;

revoke all on function public.delete_current_account() from public;
revoke all on function public.delete_current_account() from anon;
grant execute on function public.delete_current_account() to authenticated;

comment on function public.delete_current_account() is
  'Deletes the authenticated user and all cascaded workspace data. Invoked only by the account deletion route.';
