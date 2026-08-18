-- Feature compartido opcional (default off = solo finanzas personales)

alter table public.user_settings
  add column if not exists shared_enabled boolean not null default false;
