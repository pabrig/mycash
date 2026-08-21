-- Multi-household: un usuario ∈ N grupos. Aislamiento por household_id + RLS.
-- Caps F&F: 8 hogares por user, 8 miembros por hogar.
-- Ejecutar después de 001–007.

-- ---------------------------------------------------------------------------
-- 1) Cardinalidad: dejar de forzar un hogar por usuario
-- ---------------------------------------------------------------------------
alter table public.household_members
  drop constraint if exists household_members_user_id_key;

-- Por si el unique(user_id) se nombró distinto al default de Postgres
do $$
declare
  r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.household_members'::regclass
      and c.contype = 'u'
      and pg_get_constraintdef(c.oid) ilike '%(user_id)%'
      and pg_get_constraintdef(c.oid) not ilike '%household_id%'
  loop
    execute format(
      'alter table public.household_members drop constraint if exists %I',
      r.conname
    );
  end loop;
end $$;

create unique index if not exists household_members_household_user_key
  on public.household_members (household_id, user_id);

create index if not exists household_members_user_household_idx
  on public.household_members (user_id, household_id);

-- Grupo activo en la UI (nullable; ON DELETE SET NULL si el grupo desaparece)
alter table public.user_settings
  add column if not exists active_household_id uuid
    references public.households (id) on delete set null;

-- ---------------------------------------------------------------------------
-- 2) Helpers security definer (evitan recursión de policies)
-- ---------------------------------------------------------------------------
create or replace function public.is_household_member(hid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members
    where household_id = hid
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_household_owner(hid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members
    where household_id = hid
      and user_id = auth.uid()
      and role = 'owner'
  );
$$;

create or replace function public.my_household_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select household_id
  from public.household_members
  where user_id = auth.uid();
$$;

-- Compat: ya no se usa en policies. Queda por si algún cliente viejo la llama.
create or replace function public.my_household_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select household_id
  from public.household_members
  where user_id = auth.uid()
  order by joined_at
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- 3) RLS: de un uuid a pertenencia al set
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_select_members" on public.profiles;
drop policy if exists "households_select_member" on public.households;
drop policy if exists "households_update_owner" on public.households;
drop policy if exists "members_select_same_household" on public.household_members;
drop policy if exists "invites_select_own_household" on public.household_invites;
drop policy if exists "invites_insert_owner" on public.household_invites;
drop policy if exists "invites_delete_owner" on public.household_invites;
drop policy if exists "movements_select" on public.movements;
drop policy if exists "movements_insert" on public.movements;
drop policy if exists "movements_update" on public.movements;
drop policy if exists "movements_delete" on public.movements;

create policy "profiles_select_members"
  on public.profiles for select
  using (
    id = auth.uid()
    or id in (
      select them.user_id
      from public.household_members them
      where public.is_household_member(them.household_id)
    )
  );

create policy "households_select_member"
  on public.households for select
  using (public.is_household_member(id));

create policy "households_update_owner"
  on public.households for update
  using (public.is_household_owner(id));

create policy "members_select_same_household"
  on public.household_members for select
  using (public.is_household_member(household_id));

create policy "invites_select_own_household"
  on public.household_invites for select
  using (public.is_household_member(household_id));

create policy "invites_insert_owner"
  on public.household_invites for insert
  with check (
    created_by = auth.uid()
    and public.is_household_owner(household_id)
  );

create policy "invites_delete_owner"
  on public.household_invites for delete
  using (
    used_by is null
    and public.is_household_owner(household_id)
  );

create policy "movements_select"
  on public.movements for select
  using (
    (scope = 'personal' and user_id = auth.uid())
    or (scope = 'shared' and public.is_household_member(household_id))
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
        and user_id = auth.uid()
        and public.is_household_member(household_id)
      )
    )
  );

create policy "movements_update"
  on public.movements for update
  using (
    created_by = auth.uid()
    and (
      scope = 'personal'
      or public.is_household_member(household_id)
    )
  )
  with check (
    created_by = auth.uid()
    and (
      (scope = 'personal' and user_id = auth.uid() and household_id is null)
      or (
        scope = 'shared'
        and type = 'expense'
        and public.is_household_member(household_id)
      )
    )
  );

create policy "movements_delete"
  on public.movements for delete
  using (
    (scope = 'personal' and user_id = auth.uid())
    or (
      scope = 'shared'
      and created_by = auth.uid()
      and public.is_household_member(household_id)
    )
  );

-- ---------------------------------------------------------------------------
-- 4) Signup: ya no se fabrica un hogar vacío (los existentes se conservan)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  dname text;
begin
  dname := coalesce(
    new.raw_user_meta_data ->> 'display_name',
    split_part(coalesce(new.email, 'usuario'), '@', 1)
  );

  insert into public.profiles (id, display_name)
  values (new.id, dname);

  insert into public.user_settings (user_id)
  values (new.id);

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5) Active household: tiene que ser un grupo del usuario
-- ---------------------------------------------------------------------------
create or replace function public.enforce_active_household()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.active_household_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.household_members
    where household_id = new.active_household_id
      and user_id = new.user_id
  ) then
    raise exception 'No estás en ese grupo';
  end if;

  return new;
end;
$$;

drop trigger if exists user_settings_active_household on public.user_settings;
create trigger user_settings_active_household
  before insert or update of active_household_id on public.user_settings
  for each row execute function public.enforce_active_household();

-- ---------------------------------------------------------------------------
-- 6) RPCs de ciclo de vida
-- ---------------------------------------------------------------------------
create or replace function public.create_household(household_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  hid uuid;
  n text;
  cnt int;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  n := trim(coalesce(household_name, ''));
  if n = '' then
    n := 'Compartido';
  end if;
  if char_length(n) > 40 then
    raise exception 'El nombre es muy largo';
  end if;

  select count(*) into cnt
  from public.household_members
  where user_id = uid;

  if cnt >= 8 then
    raise exception 'Ya hay 8 grupos. Salí de uno para crear otro.';
  end if;

  insert into public.households (name, created_by)
  values (n, uid)
  returning id into hid;

  insert into public.household_members (household_id, user_id, role)
  values (hid, uid, 'owner');

  update public.user_settings
  set active_household_id = hid
  where user_id = uid;

  return hid;
end;
$$;

create or replace function public.accept_household_invite(invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  inv public.household_invites%rowtype;
  already boolean;
  user_groups int;
  group_members int;
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

  select exists (
    select 1
    from public.household_members
    where household_id = inv.household_id
      and user_id = uid
  ) into already;

  if already then
    update public.household_invites
    set used_by = uid, used_at = now()
    where id = inv.id;

    update public.user_settings
    set active_household_id = inv.household_id
    where user_id = uid;

    return inv.household_id;
  end if;

  select count(*) into user_groups
  from public.household_members
  where user_id = uid;

  if user_groups >= 8 then
    raise exception 'Ya hay 8 grupos. Salí de uno para entrar a otro.';
  end if;

  select count(*) into group_members
  from public.household_members
  where household_id = inv.household_id;

  if group_members >= 8 then
    raise exception 'Ya hay 8 personas en este grupo.';
  end if;

  insert into public.household_members (household_id, user_id, role)
  values (inv.household_id, uid, 'member');

  update public.household_invites
  set used_by = uid, used_at = now()
  where id = inv.id;

  update public.user_settings
  set active_household_id = inv.household_id
  where user_id = uid;

  return inv.household_id;
end;
$$;

drop function if exists public.leave_household();

create or replace function public.leave_household(target_household_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  old_role text;
  remaining int;
  next_hid uuid;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select role into old_role
  from public.household_members
  where household_id = target_household_id
    and user_id = uid;

  if old_role is null then
    raise exception 'No estás en ese grupo';
  end if;

  select count(*) into remaining
  from public.household_members
  where household_id = target_household_id;

  delete from public.household_members
  where household_id = target_household_id
    and user_id = uid;

  if remaining <= 1 then
    delete from public.households where id = target_household_id;
  elsif old_role = 'owner' then
    update public.household_members
    set role = 'owner'
    where id = (
      select id
      from public.household_members
      where household_id = target_household_id
      order by joined_at asc
      limit 1
    );
  end if;

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

-- ---------------------------------------------------------------------------
-- 7) Grants: solo authenticated
-- ---------------------------------------------------------------------------
revoke all on function public.is_household_member(uuid) from public;
revoke all on function public.is_household_member(uuid) from anon;
grant execute on function public.is_household_member(uuid) to authenticated;

revoke all on function public.is_household_owner(uuid) from public;
revoke all on function public.is_household_owner(uuid) from anon;
grant execute on function public.is_household_owner(uuid) to authenticated;

revoke all on function public.my_household_ids() from public;
revoke all on function public.my_household_ids() from anon;
grant execute on function public.my_household_ids() to authenticated;

revoke all on function public.my_household_id() from public;
revoke all on function public.my_household_id() from anon;
grant execute on function public.my_household_id() to authenticated;

revoke all on function public.create_household(text) from public;
revoke all on function public.create_household(text) from anon;
grant execute on function public.create_household(text) to authenticated;

revoke all on function public.accept_household_invite(text) from public;
revoke all on function public.accept_household_invite(text) from anon;
grant execute on function public.accept_household_invite(text) to authenticated;

revoke all on function public.leave_household(uuid) from public;
revoke all on function public.leave_household(uuid) from anon;
grant execute on function public.leave_household(uuid) to authenticated;
