-- Phase 7: organizations, cohorts, partner analytics

create type public.org_member_role as enum ('admin', 'coach', 'member');
create type public.cohort_member_status as enum ('pending', 'active');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  brand_name text,
  llm_daily_cap int not null default 500,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.org_member_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create index org_members_user_id_idx on public.org_members (user_id);

create table public.cohorts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  description text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cohorts_org_id_idx on public.cohorts (org_id);

create table public.cohort_members (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts (id) on delete cascade,
  email text not null,
  user_id uuid references auth.users (id) on delete cascade,
  status public.cohort_member_status not null default 'pending',
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  unique (cohort_id, email)
);

create index cohort_members_user_id_idx on public.cohort_members (user_id);
create index cohort_members_cohort_status_idx on public.cohort_members (cohort_id, status);

create table public.org_analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  cohort_id uuid references public.cohorts (id) on delete cascade,
  snapshot_date date not null default current_date,
  metrics jsonb not null,
  created_at timestamptz not null default now(),
  unique (org_id, cohort_id, snapshot_date)
);

create table public.org_llm_usage (
  org_id uuid not null references public.organizations (id) on delete cascade,
  usage_date date not null default current_date,
  call_count int not null default 0,
  primary key (org_id, usage_date)
);

create trigger organizations_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

create trigger cohorts_updated_at
  before update on public.cohorts
  for each row execute function public.set_updated_at();

-- Link pending invites when auth user email matches
create or replace function public.link_pending_cohort_members(p_user_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_count int;
begin
  select email into v_email from auth.users where id = p_user_id;
  if v_email is null then
    return 0;
  end if;

  update public.cohort_members
  set
    user_id = p_user_id,
    status = 'active',
    joined_at = coalesce(joined_at, now())
  where
    status = 'pending'
    and lower(email) = lower(v_email);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

alter table public.organizations enable row level security;
alter table public.org_members enable row level security;
alter table public.cohorts enable row level security;
alter table public.cohort_members enable row level security;
alter table public.org_analytics_snapshots enable row level security;
alter table public.org_llm_usage enable row level security;

-- Organizations: members can read their org
create policy "Org members can view organization"
  on public.organizations for select
  using (
    exists (
      select 1 from public.org_members m
      where m.org_id = organizations.id and m.user_id = auth.uid()
    )
  );

create policy "Authenticated users can create organizations"
  on public.organizations for insert
  to authenticated
  with check (true);

create policy "Org admins can update organization"
  on public.organizations for update
  using (
    exists (
      select 1 from public.org_members m
      where m.org_id = organizations.id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  );

-- Org members
create policy "Users can view org members in their orgs"
  on public.org_members for select
  using (
    org_id in (
      select om.org_id from public.org_members om where om.user_id = auth.uid()
    )
  );

create policy "Users can insert self as org creator"
  on public.org_members for insert
  with check (user_id = auth.uid());

create policy "Org admins can manage members"
  on public.org_members for update
  using (
    exists (
      select 1 from public.org_members m
      where m.org_id = org_members.org_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  );

create policy "Org admins can delete members"
  on public.org_members for delete
  using (
    exists (
      select 1 from public.org_members m
      where m.org_id = org_members.org_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  );

-- Cohorts
create policy "Org members can view cohorts"
  on public.cohorts for select
  using (
    exists (
      select 1 from public.org_members m
      where m.org_id = cohorts.org_id and m.user_id = auth.uid()
    )
  );

create policy "Org admins and coaches can create cohorts"
  on public.cohorts for insert
  with check (
    exists (
      select 1 from public.org_members m
      where m.org_id = cohorts.org_id
        and m.user_id = auth.uid()
        and m.role in ('admin', 'coach')
    )
  );

create policy "Org admins can update cohorts"
  on public.cohorts for update
  using (
    exists (
      select 1 from public.org_members m
      where m.org_id = cohorts.org_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  );

-- Cohort members: admins/coaches see all; members see own row
create policy "Staff can view cohort members"
  on public.cohort_members for select
  using (
    exists (
      select 1 from public.cohorts c
      join public.org_members m on m.org_id = c.org_id
      where c.id = cohort_members.cohort_id
        and m.user_id = auth.uid()
        and m.role in ('admin', 'coach')
    )
    or user_id = auth.uid()
  );

create policy "Staff can invite cohort members"
  on public.cohort_members for insert
  with check (
    exists (
      select 1 from public.cohorts c
      join public.org_members m on m.org_id = c.org_id
      where c.id = cohort_members.cohort_id
        and m.user_id = auth.uid()
        and m.role in ('admin', 'coach')
    )
  );

create policy "Staff can update cohort members"
  on public.cohort_members for update
  using (
    exists (
      select 1 from public.cohorts c
      join public.org_members m on m.org_id = c.org_id
      where c.id = cohort_members.cohort_id
        and m.user_id = auth.uid()
        and m.role in ('admin', 'coach')
    )
  );

-- Analytics snapshots: staff read only
create policy "Staff can view org analytics snapshots"
  on public.org_analytics_snapshots for select
  using (
    exists (
      select 1 from public.org_members m
      where m.org_id = org_analytics_snapshots.org_id
        and m.user_id = auth.uid()
        and m.role in ('admin', 'coach')
    )
  );

create policy "Staff can insert org analytics snapshots"
  on public.org_analytics_snapshots for insert
  with check (
    exists (
      select 1 from public.org_members m
      where m.org_id = org_analytics_snapshots.org_id
        and m.user_id = auth.uid()
        and m.role in ('admin', 'coach')
    )
  );

-- LLM usage: readable by org admins (server increments via RPC or service)
create policy "Org admins can view llm usage"
  on public.org_llm_usage for select
  using (
    exists (
      select 1 from public.org_members m
      where m.org_id = org_llm_usage.org_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
    )
  );

-- Increment LLM usage (server-side via security definer)
create or replace function public.increment_org_llm_usage(p_org_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cap int;
  v_count int;
  v_date date := current_date;
begin
  select llm_daily_cap into v_cap from organizations where id = p_org_id;
  if v_cap is null then
    return jsonb_build_object('allowed', true, 'call_count', 0, 'daily_cap', null);
  end if;

  insert into org_llm_usage (org_id, usage_date, call_count)
  values (p_org_id, v_date, 1)
  on conflict (org_id, usage_date)
  do update set call_count = org_llm_usage.call_count + 1
  returning call_count into v_count;

  return jsonb_build_object(
    'allowed', v_count <= v_cap,
    'call_count', v_count,
    'daily_cap', v_cap
  );
end;
$$;
