-- Usuarios Auth sin fila en profiles/user_settings (el trigger no corrió).
-- Sin perfil no se puede unir a un grupo: household_members.user_id → profiles.

insert into public.profiles (id, display_name)
select
  u.id,
  coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'display_name'), ''),
    split_part(coalesce(u.email, 'usuario'), '@', 1)
  )
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

insert into public.user_settings (user_id)
select u.id
from auth.users u
left join public.user_settings s on s.user_id = u.id
where s.user_id is null;

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = auth.uid());

create or replace function public.ensure_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  dname text;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  dname := coalesce(
    nullif(trim(auth.jwt() -> 'user_metadata' ->> 'display_name'), ''),
    split_part(coalesce(auth.jwt() ->> 'email', 'usuario'), '@', 1)
  );

  insert into public.profiles (id, display_name)
  values (uid, coalesce(nullif(dname, ''), 'usuario'))
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (uid)
  on conflict (user_id) do nothing;
end;
$$;

revoke all on function public.ensure_own_account() from public;
revoke all on function public.ensure_own_account() from anon;
grant execute on function public.ensure_own_account() to authenticated;

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
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    split_part(coalesce(new.email, 'usuario'), '@', 1)
  );

  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(dname, ''), 'usuario'))
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
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

revoke all on function public.accept_household_invite(text) from public;
revoke all on function public.accept_household_invite(text) from anon;
grant execute on function public.accept_household_invite(text) to authenticated;
