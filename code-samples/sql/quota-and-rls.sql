-- Per-account usage quota + data isolation (PostgreSQL / Supabase)
--
-- Requirements solved by this schema:
--   1) each user can only READ their own data (Row Level Security);
--   2) the limit of N plans per account cannot be bypassed—neither by concurrent requests
--      nor by the user calling the database API directly.
--
-- Decisions:
--   * All WRITES go through the server using the service role key (`service_role`); users only get SELECT.
--   * Slot reservation is a conditional UPDATE inside a function: PostgreSQL guarantees atomicity,
--     so two simultaneous requests can never exceed the cap.
--   * Quota functions are NOT executable by authenticated users: if they could call
--     `refund_plan_slot`, they could refund slots for themselves.

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  plans_used  int  not null default 0 check (plans_used >= 0),
  created_at  timestamptz not null default now()
);

create table public.plans (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  goal        text not null,
  plan        jsonb not null,            -- generated plan (no GPS coordinates)
  created_at  timestamptz not null default now()
);
create index plans_user_created_idx on public.plans (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.plans    enable row level security;

-- `(select auth.uid())` in a subquery: Postgres evaluates it once per query instead of per row (faster).
create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "plans: read own" on public.plans
  for select to authenticated using (user_id = (select auth.uid()));

-- Automatically create a profile on signup (email or Google).
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Atomic slot reservation: true = reserved, false = quota reached.
create function public.claim_plan_slot(p_user uuid, p_max int) returns boolean
language plpgsql security definer set search_path = '' as $$
declare used int;
begin
  insert into public.profiles (id) values (p_user) on conflict do nothing;  -- users created before the trigger
  update public.profiles
     set plans_used = plans_used + 1
   where id = p_user and plans_used < p_max
  returning plans_used into used;
  return used is not null;
end;
$$;

-- Refund a slot when generation fails. Counter never goes negative.
create function public.refund_plan_slot(p_user uuid) returns void
language sql security definer set search_path = '' as $$
  update public.profiles set plans_used = greatest(plans_used - 1, 0) where id = p_user;
$$;

revoke all on function public.claim_plan_slot(uuid, int) from public, anon, authenticated;
revoke all on function public.refund_plan_slot(uuid)     from public, anon, authenticated;
grant execute on function public.claim_plan_slot(uuid, int) to service_role;
grant execute on function public.refund_plan_slot(uuid)     to service_role;
