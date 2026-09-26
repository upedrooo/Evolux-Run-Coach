-- Limite de uso por conta + isolamento de dados (PostgreSQL / Supabase)
--
-- Requisitos que este esquema resolve:
--   1) cada usuário só pode LER os próprios dados (Row Level Security);
--   2) o limite de N fichas por conta não pode ser burlado, nem por requisições simultâneas,
--      nem pelo próprio usuário chamando a API do banco diretamente.
--
-- Decisões:
--   * Toda ESCRITA passa pelo servidor com a chave de serviço (service_role); usuários só têm SELECT.
--   * A reserva de vaga é um UPDATE condicional dentro de uma função: o banco garante a atomicidade,
--     então duas requisições ao mesmo tempo nunca ultrapassam o limite.
--   * As funções de cota NÃO são executáveis por usuários logados: se pudessem chamar
--     `refund_plan_slot`, poderiam devolver vagas para si mesmos.

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  plans_used  int  not null default 0 check (plans_used >= 0),
  created_at  timestamptz not null default now()
);

create table public.plans (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  goal        text not null,
  plan        jsonb not null,            -- ficha gerada (sem coordenadas GPS)
  created_at  timestamptz not null default now()
);
create index plans_user_created_idx on public.plans (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.plans    enable row level security;

-- (select auth.uid()) em subconsulta: o Postgres avalia uma vez por consulta, não por linha (mais rápido).
create policy "profiles: ler o próprio" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "plans: ler as próprias" on public.plans
  for select to authenticated using (user_id = (select auth.uid()));

-- Cria o perfil automaticamente no cadastro (e-mail ou Google).
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Reserva atômica de uma vaga: true = reservou, false = limite atingido.
create function public.claim_plan_slot(p_user uuid, p_max int) returns boolean
language plpgsql security definer set search_path = '' as $$
declare used int;
begin
  insert into public.profiles (id) values (p_user) on conflict do nothing;  -- usuários anteriores ao trigger
  update public.profiles
     set plans_used = plans_used + 1
   where id = p_user and plans_used < p_max
  returning plans_used into used;
  return used is not null;
end;
$$;

-- Devolve a vaga quando a geração falha. O contador nunca fica negativo.
create function public.refund_plan_slot(p_user uuid) returns void
language sql security definer set search_path = '' as $$
  update public.profiles set plans_used = greatest(plans_used - 1, 0) where id = p_user;
$$;

revoke all on function public.claim_plan_slot(uuid, int) from public, anon, authenticated;
revoke all on function public.refund_plan_slot(uuid)     from public, anon, authenticated;
grant execute on function public.claim_plan_slot(uuid, int) to service_role;
grant execute on function public.refund_plan_slot(uuid)     to service_role;
