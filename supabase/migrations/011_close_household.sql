-- Cerrar un grupo (dueño) y avisar a los demás con un aviso en la app.

create table if not exists public.user_notices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('household_closed')),
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists user_notices_user_unread_idx
  on public.user_notices (user_id, created_at desc)
  where read_at is null;

alter table public.user_notices enable row level security;

drop policy if exists "notices_select_own" on public.user_notices;
create policy "notices_select_own"
  on public.user_notices for select
  using (user_id = auth.uid());

drop policy if exists "notices_update_own" on public.user_notices;
create policy "notices_update_own"
  on public.user_notices for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.close_household(target_household_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  n text;
  who text;
  next_hid uuid;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_household_owner(target_household_id) then
    raise exception 'No se puede cerrar: solo quien creó el grupo';
  end if;

  select trim(coalesce(name, '')) into n
  from public.households
  where id = target_household_id;

  if n is null then
    raise exception 'Ese grupo ya no está';
  end if;
  if n = '' then
    n := 'un grupo';
  end if;

  select trim(coalesce(display_name, '')) into who
  from public.profiles
  where id = uid;
  if who is null or who = '' then
    who := 'Alguien';
  end if;

  insert into public.user_notices (user_id, kind, title, body)
  select
    hm.user_id,
    'household_closed',
    'Se cerró ' || n,
    who || ' cerró el grupo. Ya no está esa lista de gastos.'
  from public.household_members hm
  where hm.household_id = target_household_id
    and hm.user_id <> uid;

  delete from public.households
  where id = target_household_id;

  select household_id into next_hid
  from public.household_members
  where user_id = uid
  order by joined_at
  limit 1;

  update public.user_settings
  set active_household_id = next_hid
  where user_id = uid;
end;
$$;

revoke all on function public.close_household(uuid) from public;
revoke all on function public.close_household(uuid) from anon;
grant execute on function public.close_household(uuid) to authenticated;
