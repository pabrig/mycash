-- Metas de ahorro opcionales (default off)

alter table public.user_settings
  add column if not exists goals_enabled boolean not null default false;

create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null default 'Mi meta',
  target_amount numeric(18, 2) not null check (target_amount >= 0),
  currency text not null check (currency in ('ARS', 'USD')),
  saved_amount numeric(18, 2) not null default 0 check (saved_amount >= 0),
  monthly_plan numeric(18, 2) check (monthly_plan is null or monthly_plan >= 0),
  deduct_from_disponible boolean not null default true,
  target_date date,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Por si la tabla ya existía sin la columna (re-run seguro)
alter table public.savings_goals
  add column if not exists deduct_from_disponible boolean not null default true;

create index if not exists savings_goals_user_id_idx
  on public.savings_goals (user_id);

alter table public.savings_goals enable row level security;

drop policy if exists "goals_own" on public.savings_goals;
create policy "goals_own"
  on public.savings_goals for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
