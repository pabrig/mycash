-- Cómo cuenta cada grupo en tu mes: payer/pool por membresía, no por cuenta.
-- user_settings.shared_funding sigue siendo el default al crear o unirse.

alter table public.household_members
  add column if not exists shared_funding text not null default 'payer';

alter table public.household_members
  drop constraint if exists household_members_shared_funding_check;

alter table public.household_members
  add constraint household_members_shared_funding_check
  check (shared_funding in ('payer', 'pool'));

update public.household_members hm
set shared_funding = us.shared_funding
from public.user_settings us
where us.user_id = hm.user_id
  and us.shared_funding in ('payer', 'pool');

create or replace function public.membership_funding_default(uid uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select us.shared_funding
      from public.user_settings us
      where us.user_id = uid
        and us.shared_funding in ('payer', 'pool')
    ),
    'payer'
  );
$$;

create or replace function public.set_membership_shared_funding(
  target_household_id uuid,
  funding text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if funding is null or funding not in ('payer', 'pool') then
    raise exception 'Opción inválida';
  end if;

  update public.household_members
  set shared_funding = funding
  where household_id = target_household_id
    and user_id = uid;

  if not found then
    raise exception 'No estás en ese grupo';
  end if;
end;
$$;

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

  insert into public.household_members (household_id, user_id, role, shared_funding)
  values (hid, uid, 'owner', public.membership_funding_default(uid));

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

  if not exists (select 1 from public.profiles where id = uid) then
    perform public.ensure_own_account();
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

  insert into public.household_members (household_id, user_id, role, shared_funding)
  values (inv.household_id, uid, 'member', public.membership_funding_default(uid));

  update public.household_invites
  set used_by = uid, used_at = now()
  where id = inv.id;

  update public.user_settings
  set active_household_id = inv.household_id
  where user_id = uid;

  return inv.household_id;
end;
$$;

-- Solo la usan create/accept (security definer). No es API de cliente.
revoke all on function public.membership_funding_default(uuid) from public;
revoke all on function public.membership_funding_default(uuid) from anon;

revoke all on function public.set_membership_shared_funding(uuid, text) from public;
revoke all on function public.set_membership_shared_funding(uuid, text) from anon;
grant execute on function public.set_membership_shared_funding(uuid, text) to authenticated;

revoke all on function public.create_household(text) from public;
revoke all on function public.create_household(text) from anon;
grant execute on function public.create_household(text) to authenticated;

revoke all on function public.accept_household_invite(text) from public;
revoke all on function public.accept_household_invite(text) from anon;
grant execute on function public.accept_household_invite(text) to authenticated;
