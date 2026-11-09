-- Project archiving keeps a project and its linked context in the account while
-- removing it from active work. Additive: existing projects stay unarchived.

alter table public.projects
  add column if not exists archived_at timestamptz;

comment on column public.projects.archived_at is
  'When set, the project is archived: still readable and restorable, hidden from active context.';

create index if not exists projects_user_active_idx
  on public.projects (user_id, updated_at desc)
  where archived_at is null;
