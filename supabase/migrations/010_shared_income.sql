-- Ingresos compartidos del grupo + cómo impactan en el mes de cada uno.

alter table public.movements
  drop constraint if exists movements_shared_rules;

alter table public.movements
  add constraint movements_shared_rules check (
    (scope = 'personal')
    or (scope = 'shared' and household_id is not null)
  );

alter table public.user_settings
  add column if not exists shared_funding text not null default 'payer';

alter table public.user_settings
  drop constraint if exists user_settings_shared_funding_check;

alter table public.user_settings
  add constraint user_settings_shared_funding_check
  check (shared_funding in ('payer', 'pool'));
