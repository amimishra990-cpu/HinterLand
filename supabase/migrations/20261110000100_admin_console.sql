-- Admin console: privileged roles, telemetry, issue monitoring and audit.
-- All privileged reads/writes go through security-definer RPCs that verify
-- public.profiles.is_admin. Telemetry tables are not exposed to API roles.

-- ---------------------------------------------------------------------------
-- Profile administration fields
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists username text,
  add column if not exists is_admin boolean not null default false,
  add column if not exists must_change_password boolean not null default false,
  add column if not exists last_seen_at timestamptz,
  add column if not exists bio text check (bio is null or char_length(bio) <= 500);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_username_format'
  ) then
    alter table public.profiles
      add constraint profiles_username_format
      check (username is null or username ~ '^[a-z0-9][a-z0-9._-]{2,31}$');
  end if;
end;
$$;

create unique index if not exists profiles_username_unique
  on public.profiles (lower(username))
  where username is not null;

-- Users may edit only presentation fields. Privileged columns are writable
-- exclusively by security-definer functions and the service role.
revoke insert, update on public.profiles from authenticated;
grant insert (id, full_name, role, notification_preferences)
  on public.profiles to authenticated;
grant update (full_name, role, notification_preferences)
  on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Authentication activity
-- ---------------------------------------------------------------------------
create table if not exists public.auth_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  email text not null default '' check (char_length(email) <= 254),
  event_type text not null check (
    event_type in (
      'signup', 'login', 'login_failed', 'logout',
      'password_recovery_requested', 'password_updated',
      'email_verified', 'session_expired'
    )
  ),
  success boolean not null default true,
  reason text check (reason is null or char_length(reason) <= 200),
  correlation_id uuid not null default gen_random_uuid(),
  user_agent text not null default '' check (char_length(user_agent) <= 300),
  created_at timestamptz not null default now()
);

create index if not exists auth_events_created_idx
  on public.auth_events (created_at desc);
create index if not exists auth_events_user_idx
  on public.auth_events (user_id, created_at desc);
create index if not exists auth_events_type_idx
  on public.auth_events (event_type, created_at desc);
create index if not exists auth_events_email_idx
  on public.auth_events (lower(email));

-- ---------------------------------------------------------------------------
-- Application issues
-- ---------------------------------------------------------------------------
create table if not exists public.app_issues (
  id uuid primary key default gen_random_uuid(),
  fingerprint text not null unique check (char_length(fingerprint) between 8 and 64),
  severity text not null check (severity in ('critical', 'error', 'warning', 'info')),
  category text not null check (char_length(category) <= 80),
  message text not null check (char_length(message) <= 2000),
  route text check (route is null or char_length(route) <= 300),
  environment text not null default 'production' check (char_length(environment) <= 40),
  app_version text check (app_version is null or char_length(app_version) <= 80),
  correlation_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (
    status in ('open', 'investigating', 'resolved', 'ignored')
  ),
  occurrence_count integer not null default 1 check (occurrence_count >= 1),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_issues_status_idx
  on public.app_issues (status, last_seen_at desc);
create index if not exists app_issues_severity_idx
  on public.app_issues (severity, last_seen_at desc);
create index if not exists app_issues_last_seen_idx
  on public.app_issues (last_seen_at desc);

-- ---------------------------------------------------------------------------
-- Administrative audit log
-- ---------------------------------------------------------------------------
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  actor_email text not null default '' check (char_length(actor_email) <= 254),
  action text not null check (char_length(action) between 1 and 80),
  target_type text check (target_type is null or char_length(target_type) <= 80),
  target_id text check (target_id is null or char_length(target_id) <= 200),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_created_idx
  on public.admin_audit_log (created_at desc);
create index if not exists admin_audit_actor_idx
  on public.admin_audit_log (actor_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Admin settings
-- ---------------------------------------------------------------------------
create table if not exists public.admin_settings (
  key text primary key check (char_length(key) <= 80),
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

insert into public.admin_settings (key, value) values
  ('monitoring_retention_days', '90'::jsonb),
  ('issue_retention_days', '180'::jsonb),
  ('failed_login_alert_threshold', '10'::jsonb)
on conflict (key) do nothing;

drop trigger if exists set_app_issues_updated_at on public.app_issues;
create trigger set_app_issues_updated_at
  before update on public.app_issues
  for each row execute function public.set_updated_at();

drop trigger if exists set_admin_settings_updated_at on public.admin_settings;
create trigger set_admin_settings_updated_at
  before update on public.admin_settings
  for each row execute function public.set_updated_at();

alter table public.auth_events enable row level security;
alter table public.app_issues enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.admin_settings enable row level security;

revoke all on public.auth_events from anon, authenticated;
revoke all on public.app_issues from anon, authenticated;
revoke all on public.admin_audit_log from anon, authenticated;
revoke all on public.admin_settings from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Authorization helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and is_admin
  );
$$;

create or replace function public.assert_admin()
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_admin
      and not must_change_password
  ) then
    raise exception 'Administrator access required.' using errcode = '42501';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Registration event
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

  insert into public.auth_events (user_id, email, event_type, success, reason)
  values (new.id, coalesce(new.email, ''), 'signup', true, 'registration');

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Telemetry writers
-- ---------------------------------------------------------------------------
create or replace function public.record_public_auth_event(
  p_event_type text,
  p_email text,
  p_success boolean,
  p_reason text default null,
  p_correlation_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_agent text;
begin
  if p_event_type not in ('login_failed', 'password_recovery_requested') then
    raise exception 'Unsupported auth event.' using errcode = '22023';
  end if;

  if (
    select count(*)
    from public.auth_events
    where created_at > now() - interval '1 minute'
      and event_type = p_event_type
  ) >= 120 then
    return;
  end if;

  select u.id into v_user_id
  from auth.users u
  where lower(u.email) = lower(btrim(coalesce(p_email, '')))
  limit 1;

  v_agent := left(
    coalesce(
      (coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb)
        ->> 'user-agent',
      ''
    ),
    300
  );

  insert into public.auth_events (
    user_id, email, event_type, success, reason, correlation_id, user_agent
  )
  values (
    v_user_id,
    left(lower(btrim(coalesce(p_email, ''))), 254),
    p_event_type,
    coalesce(p_success, false),
    left(nullif(btrim(coalesce(p_reason, '')), ''), 200),
    coalesce(p_correlation_id, gen_random_uuid()),
    v_agent
  );
end;
$$;

create or replace function public.record_own_auth_event(p_event_type text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_agent text;
begin
  if v_uid is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if p_event_type not in (
    'login', 'logout', 'password_updated', 'email_verified', 'session_expired'
  ) then
    raise exception 'Unsupported auth event.' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.auth_events
    where user_id = v_uid
      and event_type = p_event_type
      and created_at > now() - interval '3 seconds'
  ) then
    return;
  end if;

  select email into v_email from auth.users where id = v_uid;

  v_agent := left(
    coalesce(
      (coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb)
        ->> 'user-agent',
      ''
    ),
    300
  );

  insert into public.auth_events (
    user_id, email, event_type, success, reason, correlation_id, user_agent
  )
  values (v_uid, coalesce(v_email, ''), p_event_type, true, null, gen_random_uuid(), v_agent);

  update public.profiles set last_seen_at = now() where id = v_uid;
end;
$$;

create or replace function public.resolve_login_email(p_identifier text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.email
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.username is not null
    and lower(p.username) = lower(btrim(p_identifier))
  limit 1;
$$;

create or replace function public.record_admin_login()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
begin
  if v_uid is null or not exists (
    select 1 from public.profiles where id = v_uid and is_admin
  ) then
    return;
  end if;

  select email into v_email from auth.users where id = v_uid;

  update public.profiles set last_seen_at = now() where id = v_uid;

  insert into public.admin_audit_log (
    actor_id, actor_email, action, target_type, target_id, metadata
  )
  values (
    v_uid, coalesce(v_email, ''), 'admin.login', 'session', null,
    jsonb_build_object('route', '/login')
  );
end;
$$;

create or replace function public.complete_admin_password_change()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
begin
  if v_uid is null or not exists (
    select 1 from public.profiles where id = v_uid and is_admin
  ) then
    raise exception 'Administrator access required.' using errcode = '42501';
  end if;

  select email into v_email from auth.users where id = v_uid;

  update public.profiles
  set must_change_password = false, last_seen_at = now()
  where id = v_uid;

  insert into public.admin_audit_log (
    actor_id, actor_email, action, target_type, target_id, metadata
  )
  values (
    v_uid, coalesce(v_email, ''), 'admin.password_changed', 'account', v_uid::text,
    '{}'::jsonb
  );
end;
$$;

create or replace function public.record_app_issue(
  p_fingerprint text,
  p_severity text,
  p_category text,
  p_message text,
  p_route text default null,
  p_environment text default null,
  p_app_version text default null,
  p_correlation_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_severity not in ('critical', 'error', 'warning', 'info') then
    raise exception 'Unsupported severity.' using errcode = '22023';
  end if;

  if p_fingerprint is null or char_length(p_fingerprint) < 8 then
    raise exception 'A fingerprint is required.' using errcode = '22023';
  end if;

  if (
    select count(*) from public.app_issues
    where last_seen_at > now() - interval '1 minute'
  ) >= 500 then
    return;
  end if;

  insert into public.app_issues (
    fingerprint, severity, category, message, route, environment,
    app_version, correlation_id, metadata
  )
  values (
    left(p_fingerprint, 64),
    p_severity,
    left(coalesce(p_category, 'unknown'), 80),
    left(coalesce(p_message, 'Unknown error'), 2000),
    left(nullif(btrim(coalesce(p_route, '')), ''), 300),
    left(coalesce(nullif(btrim(p_environment), ''), 'production'), 40),
    left(nullif(btrim(coalesce(p_app_version, '')), ''), 80),
    p_correlation_id,
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (fingerprint) do update set
    occurrence_count = public.app_issues.occurrence_count + 1,
    last_seen_at = now(),
    severity = excluded.severity,
    message = excluded.message,
    route = excluded.route,
    environment = excluded.environment,
    app_version = excluded.app_version,
    correlation_id = excluded.correlation_id,
    metadata = excluded.metadata,
    status = case
      when public.app_issues.status = 'resolved' then 'open'
      else public.app_issues.status
    end,
    resolved_at = case
      when public.app_issues.status = 'resolved' then null
      else public.app_issues.resolved_at
    end,
    resolved_by = case
      when public.app_issues.status = 'resolved' then null
      else public.app_issues.resolved_by
    end,
    updated_at = now();
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin read APIs
-- ---------------------------------------------------------------------------
create or replace function public.admin_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  perform public.assert_admin();

  select jsonb_build_object(
    'generatedAt', now(),
    'totalUsers', (select count(*)::int from auth.users),
    'confirmedUsers', (
      select count(*)::int from auth.users where email_confirmed_at is not null
    ),
    'newToday', (
      select count(*)::int from auth.users
      where created_at >= date_trunc('day', now())
    ),
    'newWeek', (
      select count(*)::int from auth.users
      where created_at >= date_trunc('week', now())
    ),
    'newMonth', (
      select count(*)::int from auth.users
      where created_at >= date_trunc('month', now())
    ),
    'activeUsers30d', (
      select count(*)::int from auth.users
      where last_sign_in_at >= now() - interval '30 days'
    ),
    'loginsToday', (
      select count(*)::int from auth_events
      where event_type = 'login' and success
        and created_at >= date_trunc('day', now())
    ),
    'logins7d', (
      select count(*)::int from auth_events
      where event_type = 'login' and success
        and created_at >= now() - interval '7 days'
    ),
    'failedToday', (
      select count(*)::int from auth_events
      where event_type = 'login_failed'
        and created_at >= date_trunc('day', now())
    ),
    'failed7d', (
      select count(*)::int from auth_events
      where event_type = 'login_failed'
        and created_at >= now() - interval '7 days'
    ),
    'failedLastHour', (
      select count(*)::int from auth_events
      where event_type = 'login_failed'
        and created_at >= now() - interval '1 hour'
    ),
    'openIssues', (
      select count(*)::int from app_issues
      where status in ('open', 'investigating')
    ),
    'criticalOpenIssues', (
      select count(*)::int from app_issues
      where severity = 'critical' and status in ('open', 'investigating')
    ),
    'warningOpenIssues', (
      select count(*)::int from app_issues
      where severity = 'warning' and status in ('open', 'investigating')
    ),
    'resolved7d', (
      select count(*)::int from app_issues
      where status = 'resolved' and resolved_at >= now() - interval '7 days'
    ),
    'totalIssues', (select count(*)::int from app_issues),
    'signupSeries', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object('day', to_char(s.day, 'YYYY-MM-DD'), 'count', s.count)
          order by s.day
        ),
        '[]'::jsonb
      )
      from (
        select gs::date as day,
          (
            select count(*)::int from auth.users u
            where u.created_at >= gs and u.created_at < gs + interval '1 day'
          ) as count
        from generate_series(
          date_trunc('day', now()) - interval '29 days',
          date_trunc('day', now()),
          interval '1 day'
        ) as gs
      ) s
    ),
    'loginSeries', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object('day', to_char(s.day, 'YYYY-MM-DD'), 'count', s.count)
          order by s.day
        ),
        '[]'::jsonb
      )
      from (
        select gs::date as day,
          (
            select count(*)::int from auth_events e
            where e.event_type = 'login' and e.success
              and e.created_at >= gs and e.created_at < gs + interval '1 day'
          ) as count
        from generate_series(
          date_trunc('day', now()) - interval '13 days',
          date_trunc('day', now()),
          interval '1 day'
        ) as gs
      ) s
    ),
    'failedSeries', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object('day', to_char(s.day, 'YYYY-MM-DD'), 'count', s.count)
          order by s.day
        ),
        '[]'::jsonb
      )
      from (
        select gs::date as day,
          (
            select count(*)::int from auth_events e
            where e.event_type = 'login_failed'
              and e.created_at >= gs and e.created_at < gs + interval '1 day'
          ) as count
        from generate_series(
          date_trunc('day', now()) - interval '13 days',
          date_trunc('day', now()),
          interval '1 day'
        ) as gs
      ) s
    ),
    'issueSeries', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object('day', to_char(s.day, 'YYYY-MM-DD'), 'count', s.count)
          order by s.day
        ),
        '[]'::jsonb
      )
      from (
        select gs::date as day,
          (
            select count(*)::int from app_issues i
            where i.first_seen_at >= gs and i.first_seen_at < gs + interval '1 day'
          ) as count
        from generate_series(
          date_trunc('day', now()) - interval '13 days',
          date_trunc('day', now()),
          interval '1 day'
        ) as gs
      ) s
    ),
    'database', jsonb_build_object(
      'sizeBytes', pg_database_size(current_database()),
      'connections', (
        select count(*)::int from pg_stat_activity
        where datname = current_database()
      )
    ),
    'aiLastRun', (
      select to_jsonb(x)
      from (
        select status, model, created_at
        from ai_runs
        order by created_at desc
        limit 1
      ) x
    ),
    'recentUsers', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', x.id,
            'email', x.email,
            'fullName', x.full_name,
            'createdAt', x.created_at,
            'confirmed', x.confirmed
          )
          order by x.created_at desc
        ),
        '[]'::jsonb
      )
      from (
        select u.id, u.email, p.full_name,
          u.created_at, u.email_confirmed_at is not null as confirmed
        from auth.users u
        left join public.profiles p on p.id = u.id
        order by u.created_at desc
        limit 5
      ) x
    ),
    'recentEvents', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', x.id,
            'eventType', x.event_type,
            'success', x.success,
            'email', x.email,
            'createdAt', x.created_at
          )
          order by x.created_at desc
        ),
        '[]'::jsonb
      )
      from (
        select id, event_type, success, email, created_at
        from auth_events
        order by created_at desc
        limit 8
      ) x
    ),
    'recentIssues', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', x.id,
            'severity', x.severity,
            'category', x.category,
            'message', x.message,
            'status', x.status,
            'occurrenceCount', x.occurrence_count,
            'lastSeenAt', x.last_seen_at,
            'route', x.route
          )
          order by x.last_seen_at desc
        ),
        '[]'::jsonb
      )
      from (
        select * from app_issues order by last_seen_at desc limit 5
      ) x
    )
  ) into v_result;

  return v_result;
end;
$$;

create or replace function public.admin_list_users(
  p_search text default null,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_status text default null,
  p_sort text default 'created_at',
  p_desc boolean default true,
  p_limit integer default 25,
  p_offset integer default 0
)
returns table (
  user_id uuid,
  email text,
  full_name text,
  username text,
  created_at timestamptz,
  email_confirmed boolean,
  status text,
  last_sign_in_at timestamptz,
  last_seen_at timestamptz,
  login_count integer,
  project_count integer,
  document_count integer,
  meeting_count integer,
  total_count integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_search text := nullif(btrim(p_search), '');
begin
  perform public.assert_admin();

  return query
  select
    u.id,
    u.email::text,
    coalesce(p.full_name, ''),
    p.username,
    u.created_at,
    u.email_confirmed_at is not null,
    case
      when u.banned_until is not null and u.banned_until > now() then 'Suspended'
      when u.email_confirmed_at is null then 'Pending verification'
      else 'Active'
    end,
    u.last_sign_in_at,
    p.last_seen_at,
    (
      select count(*)::int from auth_events e
      where e.user_id = u.id and e.event_type = 'login' and e.success
    ),
    (select count(*)::int from projects pr where pr.user_id = u.id),
    (select count(*)::int from documents d where d.user_id = u.id),
    (select count(*)::int from meetings m where m.user_id = u.id),
    count(*) over ()::int
  from auth.users u
  left join public.profiles p on p.id = u.id
  where (
      v_search is null
      or u.email ilike '%' || v_search || '%'
      or coalesce(p.full_name, '') ilike '%' || v_search || '%'
      or coalesce(p.username, '') ilike '%' || v_search || '%'
      or u.id::text = v_search
    )
    and (p_from is null or u.created_at >= p_from)
    and (p_to is null or u.created_at <= p_to)
    and (
      p_status is null
      or p_status = ''
      or lower(p_status) = case
        when u.banned_until is not null and u.banned_until > now() then 'suspended'
        when u.email_confirmed_at is null then 'pending'
        else 'active'
      end
    )
  order by
    case when p_sort = 'email' and p_desc then u.email end desc,
    case when p_sort = 'email' and not p_desc then u.email end asc,
    case when p_sort = 'last_sign_in_at' and p_desc then u.last_sign_in_at end desc nulls last,
    case when p_sort = 'last_sign_in_at' and not p_desc then u.last_sign_in_at end asc nulls last,
    case when p_sort = 'full_name' and p_desc then p.full_name end desc,
    case when p_sort = 'full_name' and not p_desc then p.full_name end asc,
    case when p_sort = 'created_at' and p_desc then u.created_at end desc,
    case when p_sort = 'created_at' and not p_desc then u.created_at end asc,
    u.created_at desc
  limit least(greatest(coalesce(p_limit, 25), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

create or replace function public.admin_user_detail(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_actor_email text;
  v_result jsonb;
begin
  perform public.assert_admin();

  select jsonb_build_object(
    'user', jsonb_build_object(
      'id', u.id,
      'email', u.email,
      'fullName', coalesce(p.full_name, ''),
      'username', p.username,
      'role', coalesce(p.role, 'Member'),
      'createdAt', u.created_at,
      'emailConfirmedAt', u.email_confirmed_at,
      'lastSignInAt', u.last_sign_in_at,
      'lastSeenAt', p.last_seen_at,
      'bannedUntil', u.banned_until,
      'providers', (
        select coalesce(jsonb_agg(i.provider), '[]'::jsonb)
        from auth.identities i where i.user_id = u.id
      )
    ),
    'counts', jsonb_build_object(
      'projects', (select count(*)::int from projects pr where pr.user_id = u.id),
      'documents', (select count(*)::int from documents d where d.user_id = u.id),
      'meetings', (select count(*)::int from meetings m where m.user_id = u.id),
      'decisions', (select count(*)::int from decisions d where d.user_id = u.id),
      'actionItems', (select count(*)::int from action_items a where a.user_id = u.id),
      'knowledgeEntries', (
        select count(*)::int from knowledge_entries k where k.user_id = u.id
      ),
      'logins', (
        select count(*)::int from auth_events e
        where e.user_id = u.id and e.event_type = 'login' and e.success
      ),
      'failedLogins', (
        select count(*)::int from auth_events e
        where e.user_id = u.id and e.event_type = 'login_failed'
      )
    ),
    'recentEvents', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', x.id,
            'eventType', x.event_type,
            'success', x.success,
            'reason', x.reason,
            'correlationId', x.correlation_id,
            'userAgent', x.user_agent,
            'createdAt', x.created_at
          )
          order by x.created_at desc
        ),
        '[]'::jsonb
      )
      from (
        select id, event_type, success, reason, correlation_id, user_agent, created_at
        from auth_events
        where user_id = p_user_id
        order by created_at desc
        limit 25
      ) x
    )
  ) into v_result
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = p_user_id;

  if v_result is null then
    raise exception 'User not found.' using errcode = 'P0002';
  end if;

  select email into v_actor_email from auth.users where id = v_uid;

  insert into public.admin_audit_log (
    actor_id, actor_email, action, target_type, target_id, metadata
  )
  values (
    v_uid, coalesce(v_actor_email, ''), 'admin.view_user', 'user', p_user_id::text,
    '{}'::jsonb
  );

  return v_result;
end;
$$;

create or replace function public.admin_list_auth_events(
  p_search text default null,
  p_event_type text default null,
  p_success boolean default null,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_user_id uuid default null,
  p_limit integer default 25,
  p_offset integer default 0
)
returns table (
  id uuid,
  user_id uuid,
  email text,
  event_type text,
  success boolean,
  reason text,
  correlation_id uuid,
  user_agent text,
  created_at timestamptz,
  total_count integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_search text := nullif(btrim(p_search), '');
begin
  perform public.assert_admin();

  return query
  select
    e.id, e.user_id, e.email, e.event_type, e.success, e.reason,
    e.correlation_id, e.user_agent, e.created_at,
    count(*) over ()::int
  from auth_events e
  where (
      v_search is null
      or e.email ilike '%' || v_search || '%'
      or e.event_type ilike '%' || v_search || '%'
      or coalesce(e.reason, '') ilike '%' || v_search || '%'
      or e.user_id::text = v_search
    )
    and (p_event_type is null or p_event_type = '' or e.event_type = p_event_type)
    and (p_success is null or e.success = p_success)
    and (p_from is null or e.created_at >= p_from)
    and (p_to is null or e.created_at <= p_to)
    and (p_user_id is null or e.user_id = p_user_id)
  order by e.created_at desc
  limit least(greatest(coalesce(p_limit, 25), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

create or replace function public.admin_list_issues(
  p_search text default null,
  p_severity text default null,
  p_status text default null,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_limit integer default 25,
  p_offset integer default 0
)
returns table (
  id uuid,
  fingerprint text,
  severity text,
  category text,
  message text,
  route text,
  environment text,
  app_version text,
  status text,
  occurrence_count integer,
  first_seen_at timestamptz,
  last_seen_at timestamptz,
  correlation_id uuid,
  total_count integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_search text := nullif(btrim(p_search), '');
begin
  perform public.assert_admin();

  return query
  select
    i.id, i.fingerprint, i.severity, i.category, i.message, i.route,
    i.environment, i.app_version, i.status, i.occurrence_count,
    i.first_seen_at, i.last_seen_at, i.correlation_id,
    count(*) over ()::int
  from app_issues i
  where (
      v_search is null
      or i.message ilike '%' || v_search || '%'
      or coalesce(i.route, '') ilike '%' || v_search || '%'
      or i.category ilike '%' || v_search || '%'
      or i.fingerprint ilike '%' || v_search || '%'
    )
    and (p_severity is null or p_severity = '' or i.severity = p_severity)
    and (p_status is null or p_status = '' or i.status = p_status)
    and (p_from is null or i.last_seen_at >= p_from)
    and (p_to is null or i.last_seen_at <= p_to)
  order by i.last_seen_at desc
  limit least(greatest(coalesce(p_limit, 25), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

create or replace function public.admin_get_issue(p_issue_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_actor_email text;
  v_result jsonb;
begin
  perform public.assert_admin();

  select to_jsonb(i) into v_result
  from app_issues i
  where i.id = p_issue_id;

  if v_result is null then
    raise exception 'Issue not found.' using errcode = 'P0002';
  end if;

  select email into v_actor_email from auth.users where id = v_uid;

  insert into public.admin_audit_log (
    actor_id, actor_email, action, target_type, target_id, metadata
  )
  values (
    v_uid, coalesce(v_actor_email, ''), 'admin.view_issue', 'issue',
    p_issue_id::text, '{}'::jsonb
  );

  return v_result;
end;
$$;

create or replace function public.admin_update_issue_status(
  p_issue_id uuid,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_actor_email text;
  v_old_status text;
  v_result jsonb;
begin
  perform public.assert_admin();

  if p_status not in ('open', 'investigating', 'resolved', 'ignored') then
    raise exception 'Unsupported issue status.' using errcode = '22023';
  end if;

  select status into v_old_status from app_issues where id = p_issue_id for update;

  if not found then
    raise exception 'Issue not found.' using errcode = 'P0002';
  end if;

  update app_issues
  set status = p_status,
      resolved_at = case when p_status = 'resolved' then now() else null end,
      resolved_by = case when p_status = 'resolved' then v_uid else null end,
      updated_at = now()
  where id = p_issue_id
  returning to_jsonb(app_issues.*) into v_result;

  select email into v_actor_email from auth.users where id = v_uid;

  insert into public.admin_audit_log (
    actor_id, actor_email, action, target_type, target_id, metadata
  )
  values (
    v_uid, coalesce(v_actor_email, ''), 'admin.issue_status', 'issue',
    p_issue_id::text,
    jsonb_build_object('from', v_old_status, 'to', p_status)
  );

  return v_result;
end;
$$;

create or replace function public.admin_list_audit(
  p_search text default null,
  p_action text default null,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_limit integer default 25,
  p_offset integer default 0
)
returns table (
  id uuid,
  actor_id uuid,
  actor_email text,
  action text,
  target_type text,
  target_id text,
  metadata jsonb,
  created_at timestamptz,
  total_count integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_search text := nullif(btrim(p_search), '');
begin
  perform public.assert_admin();

  return query
  select
    a.id, a.actor_id, a.actor_email, a.action, a.target_type, a.target_id,
    a.metadata, a.created_at, count(*) over ()::int
  from admin_audit_log a
  where (
      v_search is null
      or a.actor_email ilike '%' || v_search || '%'
      or a.action ilike '%' || v_search || '%'
      or coalesce(a.target_id, '') ilike '%' || v_search || '%'
    )
    and (p_action is null or p_action = '' or a.action = p_action)
    and (p_from is null or a.created_at >= p_from)
    and (p_to is null or a.created_at <= p_to)
  order by a.created_at desc
  limit least(greatest(coalesce(p_limit, 25), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

create or replace function public.admin_get_settings()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  perform public.assert_admin();

  select coalesce(jsonb_object_agg(key, value), '{}'::jsonb)
  into v_result
  from admin_settings;

  return v_result;
end;
$$;

create or replace function public.admin_update_setting(p_key text, p_value jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_actor_email text;
  v_int integer;
  v_value jsonb;
begin
  perform public.assert_admin();

  if p_key not in (
    'monitoring_retention_days',
    'issue_retention_days',
    'failed_login_alert_threshold'
  ) then
    raise exception 'Unknown setting.' using errcode = '22023';
  end if;

  begin
    v_int := (p_value #>> '{}')::int;
  exception when others then
    raise exception 'Setting value must be an integer.' using errcode = '22023';
  end;

  v_int := case
    when p_key = 'monitoring_retention_days' then least(greatest(v_int, 7), 365)
    when p_key = 'issue_retention_days' then least(greatest(v_int, 7), 730)
    else least(greatest(v_int, 1), 1000)
  end;

  v_value := to_jsonb(v_int);

  update admin_settings
  set value = v_value, updated_at = now(), updated_by = v_uid
  where key = p_key;

  select email into v_actor_email from auth.users where id = v_uid;

  insert into public.admin_audit_log (
    actor_id, actor_email, action, target_type, target_id, metadata
  )
  values (
    v_uid, coalesce(v_actor_email, ''), 'admin.setting_changed', 'setting', p_key,
    jsonb_build_object('value', v_value)
  );

  return v_value;
end;
$$;

create or replace function public.admin_database_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  perform public.assert_admin();

  select jsonb_build_object(
    'generatedAt', now(),
    'databaseName', current_database(),
    'sizeBytes', pg_database_size(current_database()),
    'connections', (
      select count(*)::int from pg_stat_activity
      where datname = current_database()
    ),
    'maxConnections', (
      select setting::int from pg_settings where name = 'max_connections'
    ),
    'cacheHitRatio', (
      select case
        when coalesce(sum(blks_hit), 0) + coalesce(sum(blks_read), 0) = 0 then null
        else round(
          sum(blks_hit)::numeric * 100
            / (sum(blks_hit) + sum(blks_read)),
          2
        )
      end
      from pg_stat_database
      where datname = current_database()
    ),
    'tables', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'name', t.relname,
            'rows', t.n_live_tup,
            'sizeBytes', pg_total_relation_size(t.relid)
          )
          order by pg_total_relation_size(t.relid) desc
        ),
        '[]'::jsonb
      )
      from pg_stat_user_tables t
      where t.schemaname = 'public'
    ),
    'storage', jsonb_build_object(
      'objects', (
        select count(*)::int from storage.objects where bucket_id = 'documents'
      ),
      'bytes', (
        select coalesce(
          sum(nullif(o.metadata ->> 'size', '')::bigint), 0
        )::bigint
        from storage.objects o
        where o.bucket_id = 'documents'
      )
    ),
    'documents', jsonb_build_object(
      'total', (select count(*)::int from documents),
      'processing', (
        select count(*)::int from documents where status = 'Processing'
      ),
      'needsReview', (
        select count(*)::int from documents where status = 'Needs review'
      ),
      'failed', (
        select count(*)::int from documents where processing_error is not null
      )
    ),
    'telemetry', jsonb_build_object(
      'authEvents', (select count(*)::int from auth_events),
      'issues', (select count(*)::int from app_issues),
      'auditEntries', (select count(*)::int from admin_audit_log)
    ),
    'recentDatabaseIssues', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', x.id,
            'message', x.message,
            'severity', x.severity,
            'status', x.status,
            'lastSeenAt', x.last_seen_at
          )
          order by x.last_seen_at desc
        ),
        '[]'::jsonb
      )
      from (
        select id, message, severity, status, last_seen_at
        from app_issues
        where category = 'database'
        order by last_seen_at desc
        limit 5
      ) x
    )
  ) into v_result;

  return v_result;
end;
$$;

create or replace function public.admin_document_pipeline()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  perform public.assert_admin();

  select jsonb_build_object(
    'total', count(*)::int,
    'processing', count(*) filter (where status = 'Processing')::int,
    'needsReview', count(*) filter (where status = 'Needs review')::int,
    'failed', count(*) filter (where processing_error is not null)::int,
    'ocrDocuments', count(*) filter (
      where extraction_method in ('ocr', 'mixed')
    )::int,
    'averageConfidence', round(avg(extraction_confidence)::numeric, 2),
    'latestProcessedAt', max(processed_at)
  ) into v_result
  from documents;

  return v_result;
end;
$$;

create or replace function public.admin_purge_telemetry()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_actor_email text;
  v_monitoring_days integer := 90;
  v_issue_days integer := 180;
  v_events integer := 0;
  v_issues integer := 0;
  v_audit integer := 0;
begin
  perform public.assert_admin();

  select coalesce((value #>> '{}')::int, 90) into v_monitoring_days
  from admin_settings where key = 'monitoring_retention_days';

  select coalesce((value #>> '{}')::int, 180) into v_issue_days
  from admin_settings where key = 'issue_retention_days';

  delete from auth_events
  where created_at < now() - make_interval(days => v_monitoring_days);
  get diagnostics v_events = row_count;

  delete from app_issues
  where status in ('resolved', 'ignored')
    and last_seen_at < now() - make_interval(days => v_issue_days);
  get diagnostics v_issues = row_count;

  delete from admin_audit_log
  where created_at < now() - interval '365 days';
  get diagnostics v_audit = row_count;

  select email into v_actor_email from auth.users where id = v_uid;

  insert into public.admin_audit_log (
    actor_id, actor_email, action, target_type, target_id, metadata
  )
  values (
    v_uid, coalesce(v_actor_email, ''), 'admin.retention_run', 'telemetry', null,
    jsonb_build_object(
      'authEventsDeleted', v_events,
      'issuesDeleted', v_issues,
      'auditDeleted', v_audit
    )
  );

  return jsonb_build_object(
    'authEventsDeleted', v_events,
    'issuesDeleted', v_issues,
    'auditDeleted', v_audit
  );
end;
$$;

create or replace function public.admin_ping()
returns timestamptz
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.assert_admin();
  return now();
end;
$$;

-- ---------------------------------------------------------------------------
-- Function privileges: deny by default, allow only intended callers.
-- ---------------------------------------------------------------------------
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.is_admin()',
    'public.assert_admin()',
    'public.record_public_auth_event(text, text, boolean, text, uuid)',
    'public.record_own_auth_event(text)',
    'public.resolve_login_email(text)',
    'public.record_admin_login()',
    'public.complete_admin_password_change()',
    'public.record_app_issue(text, text, text, text, text, text, text, uuid, jsonb)',
    'public.admin_overview()',
    'public.admin_list_users(text, timestamptz, timestamptz, text, text, boolean, integer, integer)',
    'public.admin_user_detail(uuid)',
    'public.admin_list_auth_events(text, text, boolean, timestamptz, timestamptz, uuid, integer, integer)',
    'public.admin_list_issues(text, text, text, timestamptz, timestamptz, integer, integer)',
    'public.admin_get_issue(uuid)',
    'public.admin_update_issue_status(uuid, text)',
    'public.admin_list_audit(text, text, timestamptz, timestamptz, integer, integer)',
    'public.admin_get_settings()',
    'public.admin_update_setting(text, jsonb)',
    'public.admin_database_overview()',
    'public.admin_document_pipeline()',
    'public.admin_purge_telemetry()',
    'public.admin_ping()'
  ]
  loop
    execute format('revoke all on function %s from public', fn);
    execute format('revoke all on function %s from anon', fn);
    execute format('revoke all on function %s from authenticated', fn);
  end loop;
end;
$$;

grant execute on function public.record_public_auth_event(text, text, boolean, text, uuid)
  to anon, authenticated;
grant execute on function public.resolve_login_email(text) to anon, authenticated;
grant execute on function public.record_app_issue(text, text, text, text, text, text, text, uuid, jsonb)
  to anon, authenticated;

grant execute on function public.record_own_auth_event(text) to authenticated;
grant execute on function public.record_admin_login() to authenticated;
grant execute on function public.complete_admin_password_change() to authenticated;
grant execute on function public.admin_overview() to authenticated;
grant execute on function public.admin_list_users(text, timestamptz, timestamptz, text, text, boolean, integer, integer) to authenticated;
grant execute on function public.admin_user_detail(uuid) to authenticated;
grant execute on function public.admin_list_auth_events(text, text, boolean, timestamptz, timestamptz, uuid, integer, integer) to authenticated;
grant execute on function public.admin_list_issues(text, text, text, timestamptz, timestamptz, integer, integer) to authenticated;
grant execute on function public.admin_get_issue(uuid) to authenticated;
grant execute on function public.admin_update_issue_status(uuid, text) to authenticated;
grant execute on function public.admin_list_audit(text, text, timestamptz, timestamptz, integer, integer) to authenticated;
grant execute on function public.admin_get_settings() to authenticated;
grant execute on function public.admin_update_setting(text, jsonb) to authenticated;
grant execute on function public.admin_database_overview() to authenticated;
grant execute on function public.admin_document_pipeline() to authenticated;
grant execute on function public.admin_purge_telemetry() to authenticated;
grant execute on function public.admin_ping() to authenticated;
