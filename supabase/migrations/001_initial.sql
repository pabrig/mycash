-- Myca$h Phase 2: auth, personal sync, household shared expenses

create extension if not exists "pgcrypto";

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

-- Households (one per user via household_members.unique user_id)
create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Compartido',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  unique (user_id)
);

create table public.household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  code text not null unique,
  created_by uuid not null references public.profiles (id) on delete cascade,
  expires_at timestamptz not null,
  used_by uuid references public.profiles (id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index household_invites_code_idx on public.household_invites (code);

-- Movements: personal (user) + shared (household, expenses only)
create table public.movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  household_id uuid references public.households (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  scope text not null check (scope in ('personal', 'shared')),
  type text not null check (type in ('income', 'expense')),
  date date not null,
  amount numeric(18, 2) not null check (amount > 0),
  currency text not null check (currency in ('ARS', 'USD')),
  description text not null,
  kind text check (kind in ('fixed', 'variable')),
  category text,
  income_kind text check (income_kind in ('passive', 'active')),
  source text,
  created_at timestamptz not null default now(),
  constraint movements_shared_rules check (
    (scope = 'personal')
    or (scope = 'shared' and type = 'expense' and household_id is not null)
  )
);

create index movements_user_id_idx on public.movements (user_id);
create index movements_household_id_idx on public.movements (household_id);
create index movements_date_idx on public.movements (date desc);

create table public.monthly_rates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  year int not null check (year >= 2000),
  month int not null check (month between 1 and 12),
  usd_to_ars numeric(18, 2) not null,
  updated_at timestamptz,
  unique (user_id, year, month)
);

create table public.user_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  display_currency text not null default 'ARS' check (display_currency in ('ARS', 'USD'))
);

-- New user: profile + solo household
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  hid uuid;
  dname text;
begin
  dname := coalesce(
    new.raw_user_meta_data ->> 'display_name',
    split_part(coalesce(new.email, 'usuario'), '@', 1)
  );

  insert into public.profiles (id, display_name)
  values (new.id, dname);

  insert into public.households (name, created_by)
  values ('Compartido', new.id)
  returning id into hid;

  insert into public.household_members (household_id, user_id, role)
  values (hid, new.id, 'owner');

  insert into public.user_settings (user_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Join household via invite code (one household per user)
create or replace function public.accept_household_invite(invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  inv public.household_invites%rowtype;
  old_hid uuid;
  old_members int;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into inv
  from public.household_invites
  where upper(code) = upper(invite_code)
    and used_by is null
    and expires_at > now()
  limit 1;

  if inv.id is null then
    raise exception 'Invalid or expired invite';
  end if;

  select household_id into old_hid
  from public.household_members
  where user_id = uid;

  if old_hid = inv.household_id then
    return inv.household_id;
  end if;

  if old_hid is not null then
    select count(*) into old_members
    from public.household_members
    where household_id = old_hid;

    delete from public.household_members where user_id = uid;

    if old_members = 1 then
      delete from public.households where id = old_hid;
    end if;
  end if;

  insert into public.household_members (household_id, user_id, role)
  values (inv.household_id, uid, 'member');

  update public.household_invites
  set used_by = uid, used_at = now()
  where id = inv.id;

  return inv.household_id;
end;
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invites enable row level security;
alter table public.movements enable row level security;
alter table public.monthly_rates enable row level security;
alter table public.user_settings enable row level security;

create or replace function public.my_household_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select household_id from public.household_members where user_id = auth.uid() limit 1;
$$;

-- Profiles
create policy "profiles_select_members"
  on public.profiles for select
  using (
    id = auth.uid()
    or id in (
      select hm.user_id from public.household_members hm
      where hm.household_id = public.my_household_id()
    )
  );

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid());

-- Households
create policy "households_select_member"
  on public.households for select
  using (id = public.my_household_id());

create policy "households_update_owner"
  on public.households for update
  using (
    id = public.my_household_id()
    and exists (
      select 1 from public.household_members
      where household_id = id and user_id = auth.uid() and role = 'owner'
    )
  );

-- Members
create policy "members_select_same_household"
  on public.household_members for select
  using (household_id = public.my_household_id());

-- Invites
create policy "invites_select_own_household"
  on public.household_invites for select
  using (household_id = public.my_household_id());

create policy "invites_insert_owner"
  on public.household_invites for insert
  with check (
    household_id = public.my_household_id()
    and created_by = auth.uid()
    and exists (
      select 1 from public.household_members
      where household_id = household_invites.household_id
        and user_id = auth.uid()
        and role = 'owner'
    )
  );

-- Movements
create policy "movements_select"
  on public.movements for select
  using (
    (scope = 'personal' and user_id = auth.uid())
    or (scope = 'shared' and household_id = public.my_household_id())
  );

create policy "movements_insert"
  on public.movements for insert
  with check (
    created_by = auth.uid()
    and (
      (scope = 'personal' and user_id = auth.uid() and household_id is null)
      or (
        scope = 'shared'
        and type = 'expense'
        and household_id = public.my_household_id()
        and user_id = auth.uid()
      )
    )
  );

create policy "movements_delete"
  on public.movements for delete
  using (
    created_by = auth.uid()
    or (scope = 'personal' and user_id = auth.uid())
  );

-- Rates & settings
create policy "rates_own"
  on public.monthly_rates for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "settings_own"
  on public.user_settings for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
