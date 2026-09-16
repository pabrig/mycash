-- Desglose opcional del Ahorro USD por lugares (composición informativa)

alter table public.user_settings
  add column if not exists savings_locations_enabled boolean not null default false;

create table if not exists public.savings_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null default 'Lugar',
  amount numeric(18, 2) not null default 0 check (amount >= 0),
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists savings_locations_user_id_idx
  on public.savings_locations (user_id, sort_order);

alter table public.savings_locations enable row level security;

drop policy if exists "savings_locations_own" on public.savings_locations;
create policy "savings_locations_own"
  on public.savings_locations for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
