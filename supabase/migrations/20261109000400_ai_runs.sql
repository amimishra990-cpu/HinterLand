-- AI run metadata.
-- Stores operational metadata only: feature, provider, model, status, token
-- counts, latency, and the ids of the sources that were included. It must
-- never contain prompts, document text, transcripts, or generated content.

create table public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  feature text not null check (
    feature in ('communication', 'preparation', 'intelligence', 'document', 'development', 'knowledge')
  ),
  task text not null check (char_length(task) between 1 and 80),
  provider text not null check (char_length(provider) between 1 and 40),
  model text not null check (char_length(model) between 1 and 120),
  prompt_version text not null check (char_length(prompt_version) between 1 and 40),
  input_refs jsonb not null default '{}'::jsonb,
  request_hash text check (request_hash is null or char_length(request_hash) <= 64),
  status text not null check (status in ('succeeded', 'failed', 'refused', 'invalid_output')),
  error_code text check (error_code is null or char_length(error_code) <= 80),
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  created_at timestamptz not null default now()
);

create index ai_runs_user_created_idx on public.ai_runs (user_id, created_at desc);
create index ai_runs_user_feature_idx on public.ai_runs (user_id, feature, created_at desc);
create index ai_runs_project_idx on public.ai_runs (project_id);

alter table public.ai_runs enable row level security;

create policy "ai_runs_select_own" on public.ai_runs
  for select to authenticated using (user_id = auth.uid());
create policy "ai_runs_insert_own" on public.ai_runs
  for insert to authenticated with check (user_id = auth.uid());

revoke all on public.ai_runs from anon;
grant select, insert on public.ai_runs to authenticated;
