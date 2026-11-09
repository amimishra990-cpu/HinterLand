-- Hinterland initial schema.
-- All user-owned rows carry user_id and are protected by row level security.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 120),
  role text not null default 'Member' check (char_length(role) <= 80),
  notification_preferences jsonb not null default
    '{"meetingReminders":true,"approvalRequests":true,"weeklySummary":false}'::jsonb,
  workspace_seeded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 5000),
  objective text not null default '' check (char_length(objective) <= 5000),
  status text not null default 'Active' check (status in ('Active', 'In review', 'Paused')),
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index projects_user_name_unique
  on public.projects (user_id, lower(btrim(name)));
create index projects_user_updated_idx on public.projects (user_id, updated_at desc);

-- ---------------------------------------------------------------------------
-- Documents (metadata for private storage objects)
-- ---------------------------------------------------------------------------
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  name text not null check (char_length(btrim(name)) between 1 and 255),
  file_type text not null check (file_type in ('PDF', 'DOCX', 'Notes')),
  status text not null default 'Ready' check (status in ('Ready', 'Processing', 'Needs review')),
  storage_path text unique,
  size_bytes bigint not null default 0 check (size_bytes >= 0 and size_bytes <= 20971520),
  page_count integer check (page_count is null or page_count >= 0),
  excerpt text not null default '' check (char_length(excerpt) <= 5000),
  extracted_text text check (extracted_text is null or char_length(extracted_text) <= 100000),
  analysis jsonb not null default '{"summary":"","findings":[],"gaps":[]}'::jsonb,
  is_sample boolean not null default false,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index documents_user_uploaded_idx on public.documents (user_id, uploaded_at desc);
create index documents_project_idx on public.documents (project_id);

-- ---------------------------------------------------------------------------
-- Meetings
-- ---------------------------------------------------------------------------
create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  objective text not null default '' check (char_length(objective) <= 5000),
  attendees text[] not null default '{}',
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meetings_time_order check (
    scheduled_start is null or scheduled_end is null or scheduled_end >= scheduled_start
  )
);

create index meetings_user_start_idx on public.meetings (user_id, scheduled_start);
create index meetings_project_idx on public.meetings (project_id);

-- ---------------------------------------------------------------------------
-- Meeting preparations
-- ---------------------------------------------------------------------------
create table public.meeting_preparations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  meeting_id uuid references public.meetings (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  objective text not null default '' check (char_length(objective) <= 5000),
  brief jsonb not null default '{}'::jsonb,
  content text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'approved')),
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index meeting_preparations_user_idx on public.meeting_preparations (user_id, created_at desc);
create index meeting_preparations_meeting_idx on public.meeting_preparations (meeting_id);

-- ---------------------------------------------------------------------------
-- Meeting records and summaries
-- ---------------------------------------------------------------------------
create table public.meeting_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  meeting_id uuid references public.meetings (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  title text not null check (char_length(btrim(title)) between 1 and 300),
  summary text not null default '' check (char_length(summary) <= 10000),
  content text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'approved')),
  approved_at timestamptz,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index meeting_records_user_idx on public.meeting_records (user_id, created_at desc);
create index meeting_records_meeting_idx on public.meeting_records (meeting_id);

-- ---------------------------------------------------------------------------
-- Decisions
-- ---------------------------------------------------------------------------
create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  meeting_id uuid references public.meetings (id) on delete set null,
  summary text not null check (char_length(btrim(summary)) between 1 and 2000),
  rationale text not null default '' check (char_length(rationale) <= 5000),
  decided_at date not null default current_date,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index decisions_user_idx on public.decisions (user_id, decided_at desc);
create index decisions_project_idx on public.decisions (project_id);

-- ---------------------------------------------------------------------------
-- Action items
-- ---------------------------------------------------------------------------
create table public.action_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  meeting_id uuid references public.meetings (id) on delete set null,
  label text not null check (char_length(btrim(label)) between 1 and 1000),
  owner text check (owner is null or char_length(owner) <= 200),
  due_date date,
  done boolean not null default false,
  completed_at timestamptz,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index action_items_user_idx on public.action_items (user_id, created_at);
create index action_items_project_idx on public.action_items (project_id);

-- ---------------------------------------------------------------------------
-- Knowledge entries
-- ---------------------------------------------------------------------------
create table public.knowledge_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  meeting_id uuid references public.meetings (id) on delete set null,
  title text not null check (char_length(btrim(title)) between 1 and 300),
  kind text not null check (kind in ('Meeting record', 'Decision log', 'Preparation brief', 'Refinement')),
  topic text not null default '' check (char_length(topic) <= 160),
  description text not null default '' check (char_length(description) <= 5000),
  content text[] not null default '{}',
  related text[] not null default '{}',
  approved boolean not null default false,
  approved_at timestamptz,
  entry_date date not null default current_date,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index knowledge_entries_user_date_idx on public.knowledge_entries (user_id, entry_date desc);
create index knowledge_entries_project_idx on public.knowledge_entries (project_id);
create index knowledge_entries_meeting_idx on public.knowledge_entries (meeting_id);

-- ---------------------------------------------------------------------------
-- Writing preferences and approved examples
-- ---------------------------------------------------------------------------
create table public.writing_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  tone text not null default 'Professional' check (char_length(tone) <= 80),
  structure text not null default 'Short, direct sentences' check (char_length(structure) <= 160),
  greeting text not null default 'Warm and brief' check (char_length(greeting) <= 160),
  sign_off text not null default 'Best,' check (char_length(sign_off) <= 160),
  preserve text not null default '' check (char_length(preserve) <= 5000),
  use_examples boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.approved_writing_examples (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  context text not null default '' check (char_length(context) <= 300),
  excerpt text not null check (char_length(btrim(excerpt)) between 1 and 10000),
  approved_at timestamptz not null default now(),
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index approved_writing_examples_user_idx
  on public.approved_writing_examples (user_id, approved_at desc);

-- ---------------------------------------------------------------------------
-- Updated-at triggers
-- ---------------------------------------------------------------------------
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'projects', 'documents', 'meetings', 'meeting_preparations',
    'meeting_records', 'decisions', 'action_items', 'knowledge_entries',
    'writing_preferences', 'approved_writing_examples'
  ]
  loop
    execute format(
      'drop trigger if exists set_%1$s_updated_at on public.%1$I',
      table_name
    );
    execute format(
      'create trigger set_%1$s_updated_at before update on public.%1$I
       for each row execute function public.set_updated_at()',
      table_name
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- New-user bootstrap
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      split_part(coalesce(new.email, 'Member'), '@', 1)
    )
  )
  on conflict (id) do nothing;

  insert into public.writing_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.documents enable row level security;
alter table public.meetings enable row level security;
alter table public.meeting_preparations enable row level security;
alter table public.meeting_records enable row level security;
alter table public.decisions enable row level security;
alter table public.action_items enable row level security;
alter table public.knowledge_entries enable row level security;
alter table public.writing_preferences enable row level security;
alter table public.approved_writing_examples enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "writing_preferences_select_own" on public.writing_preferences
  for select to authenticated using (user_id = auth.uid());
create policy "writing_preferences_insert_own" on public.writing_preferences
  for insert to authenticated with check (user_id = auth.uid());
create policy "writing_preferences_update_own" on public.writing_preferences
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "writing_preferences_delete_own" on public.writing_preferences
  for delete to authenticated using (user_id = auth.uid());

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'projects', 'documents', 'meetings', 'meeting_preparations',
    'meeting_records', 'decisions', 'action_items', 'knowledge_entries',
    'approved_writing_examples'
  ]
  loop
    execute format(
      'create policy "%1$s_select_own" on public.%1$I
         for select to authenticated using (user_id = auth.uid())',
      table_name
    );
    execute format(
      'create policy "%1$s_insert_own" on public.%1$I
         for insert to authenticated with check (user_id = auth.uid())',
      table_name
    );
    execute format(
      'create policy "%1$s_update_own" on public.%1$I
         for update to authenticated using (user_id = auth.uid())
         with check (user_id = auth.uid())',
      table_name
    );
    execute format(
      'create policy "%1$s_delete_own" on public.%1$I
         for delete to authenticated using (user_id = auth.uid())',
      table_name
    );
  end loop;
end;
$$;

revoke all on public.profiles from anon;
revoke all on public.projects from anon;
revoke all on public.documents from anon;
revoke all on public.meetings from anon;
revoke all on public.meeting_preparations from anon;
revoke all on public.meeting_records from anon;
revoke all on public.decisions from anon;
revoke all on public.action_items from anon;
revoke all on public.knowledge_entries from anon;
revoke all on public.writing_preferences from anon;
revoke all on public.approved_writing_examples from anon;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.documents to authenticated;
grant select, insert, update, delete on public.meetings to authenticated;
grant select, insert, update, delete on public.meeting_preparations to authenticated;
grant select, insert, update, delete on public.meeting_records to authenticated;
grant select, insert, update, delete on public.decisions to authenticated;
grant select, insert, update, delete on public.action_items to authenticated;
grant select, insert, update, delete on public.knowledge_entries to authenticated;
grant select, insert, update, delete on public.writing_preferences to authenticated;
grant select, insert, update, delete on public.approved_writing_examples to authenticated;
