-- Feature USD opcional (default on = mantiene comportamiento actual)

alter table public.user_settings
  add column if not exists usd_enabled boolean not null default true;
