-- Fase 4–5: invites más fuertes, revocar, invalidar extras, salir del hogar, borrar cuenta

-- Revocar invitaciones pendientes (owner del hogar)
create policy "invites_delete_owner"
  on public.household_invites for delete
  using (
    household_id = public.my_household_id()
    and used_by is null
    and exists (
      select 1 from public.household_members
      where household_id = household_invites.household_id
        and user_id = auth.uid()
        and role = 'owner'
    )
  );

-- Aceptar invite: invalidar otros códigos abiertos del mismo hogar
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
    update public.household_invites
    set used_by = uid, used_at = now()
    where id = inv.id;

    delete from public.household_invites
    where household_id = inv.household_id
      and used_by is null
      and id <> inv.id;

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

  -- Invalidar otros invites abiertos del hogar (código filtrado en chat, etc.)
  delete from public.household_invites
  where household_id = inv.household_id
    and used_by is null
    and id <> inv.id;

  return inv.household_id;
end;
$$;

-- Salir del hogar: si hay más de un miembro, crear hogar solo nuevo
create or replace function public.leave_household()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  old_hid uuid;
  old_members int;
  new_hid uuid;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select household_id into old_hid
  from public.household_members
  where user_id = uid;

  if old_hid is null then
    raise exception 'Not in a household';
  end if;

  select count(*) into old_members
  from public.household_members
  where household_id = old_hid;

  if old_members <= 1 then
    return old_hid;
  end if;

  delete from public.household_members where user_id = uid;

  insert into public.households (name, created_by)
  values ('Compartido', uid)
  returning id into new_hid;

  insert into public.household_members (household_id, user_id, role)
  values (new_hid, uid, 'owner');

  return new_hid;
end;
$$;

-- Borrar cuenta propia (cascade vía profiles → movements, membership, etc.)
create or replace function public.delete_own_account()
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

  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.accept_household_invite(text) from public;
revoke all on function public.accept_household_invite(text) from anon;
grant execute on function public.accept_household_invite(text) to authenticated;

revoke all on function public.leave_household() from public;
revoke all on function public.leave_household() from anon;
grant execute on function public.leave_household() to authenticated;

revoke all on function public.delete_own_account() from public;
revoke all on function public.delete_own_account() from anon;
grant execute on function public.delete_own_account() to authenticated;
