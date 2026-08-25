-- Auditoría estructural RLS / grants — Myca$h
-- Correr en SQL Editor (rol postgres / service). NO simula auth.uid();
-- el aislamiento real se valida con 3 users en la app (docs/rls-checklist.md).
-- Requiere migraciones 001 → 008 aplicadas.

-- 1) RLS enabled en todas las tablas de producto
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in (
    'profiles',
    'households',
    'household_members',
    'household_invites',
    'movements',
    'monthly_rates',
    'user_settings',
    'user_notices'
  )
order by relname;
-- Esperado: rls_enabled = true en todas

-- 2) Policies presentes (nombres clave)
select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'profiles',
    'households',
    'household_members',
    'household_invites',
    'movements',
    'monthly_rates',
    'user_settings',
    'user_notices'
  )
order by tablename, policyname;
-- Esperado mínimo en movements: select, insert, update, delete
-- Esperado en household_invites: select, insert, delete (owner revoke)

-- 3) Grants EXECUTE en RPCs sensibles — anon/PUBLIC no deben aparecer
select routine_name, grantee, privilege_type
from information_schema.routine_privileges
where specific_schema = 'public'
  and routine_name in (
    'accept_household_invite',
    'leave_household',
    'close_household',
    'create_household',
    'delete_own_account',
    'my_household_id',
    'my_household_ids',
    'is_household_member',
    'is_household_owner',
    'ensure_own_account',
    'set_membership_shared_funding'
  )
order by routine_name, grantee;
-- Esperado: authenticated (y roles internos). NO anon / PUBLIC con EXECUTE.

-- 4) Funciones security definer con search_path fijo
select p.proname as function_name,
       p.prosecdef as security_definer,
       pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'accept_household_invite',
    'leave_household',
    'close_household',
    'create_household',
    'delete_own_account',
    'my_household_id',
    'my_household_ids',
    'is_household_member',
    'is_household_owner',
    'handle_new_user',
    'ensure_own_account',
    'set_membership_shared_funding'
  )
order by p.proname;
-- Esperado: security_definer = true en RPCs de invite/leave/create/delete/helpers

-- 5) Unicidad: un user puede estar en N hogares (unique household+user)
select conname, contype, pg_get_constraintdef(oid) as def
from pg_constraint
where conrelid = 'public.household_members'::regclass
  and contype in ('u', 'p');
select indexname, indexdef
from pg_indexes
where tablename = 'household_members';
-- Esperado: unique (household_id, user_id). NO unique (user_id) solo.

-- 6) Cascade de borrado de cuenta (profile → movements)
select
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name as foreign_table,
  rc.delete_rule
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
join information_schema.referential_constraints rc
  on rc.constraint_name = tc.constraint_name
where tc.table_schema = 'public'
  and tc.table_name = 'movements'
  and tc.constraint_type = 'FOREIGN KEY'
  and kcu.column_name in ('user_id', 'created_by');
-- Esperado: delete_rule = CASCADE hacia profiles
