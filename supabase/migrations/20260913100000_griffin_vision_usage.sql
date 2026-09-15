-- GriffinEye photo-extraction usage caps by subscription tier.

alter table public.organizations
add column if not exists subscription_tier text not null default 'free'
  check (subscription_tier in ('free', 'growth', 'scale', 'enterprise'));

create table if not exists public.ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  usage_type text not null check (usage_type = 'griffin_vision_photo'),
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_log_org_type_created_idx
  on public.ai_usage_log (organization_id, usage_type, created_at desc);

alter table public.ai_usage_log enable row level security;

drop policy if exists "ai_usage_log_select_org" on public.ai_usage_log;
create policy "ai_usage_log_select_org"
on public.ai_usage_log
for select
to authenticated
using (organization_id = public.current_user_organization_id());

drop policy if exists "ai_usage_log_insert_org" on public.ai_usage_log;
create policy "ai_usage_log_insert_org"
on public.ai_usage_log
for insert
to authenticated
with check (
  organization_id = public.current_user_organization_id()
  and usage_type = 'griffin_vision_photo'
);

grant select, insert on public.ai_usage_log to authenticated;
