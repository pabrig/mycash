-- Fase nube: hardening grants + confirmación RLS
-- Ejecutar después de 001–005 (proyectos nuevos: correr todo en orden).

-- RPC de invite: solo usuarios autenticados (no anon / no public)
revoke all on function public.accept_household_invite(text) from public;
revoke all on function public.accept_household_invite(text) from anon;
grant execute on function public.accept_household_invite(text) to authenticated;

-- Helper usado en policies: lectura vía security definer; sin execute público innecesario
revoke all on function public.my_household_id() from public;
revoke all on function public.my_household_id() from anon;
grant execute on function public.my_household_id() to authenticated;

-- Asegurar RLS en tablas de producto (idempotente)
alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invites enable row level security;
alter table public.movements enable row level security;
alter table public.monthly_rates enable row level security;
alter table public.user_settings enable row level security;
