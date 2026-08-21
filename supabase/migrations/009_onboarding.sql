-- Primer login: wizard de cuenta. Quienes ya tenían settings no lo vuelven a ver.

alter table public.user_settings
  add column if not exists onboarding_completed boolean not null default true;

alter table public.user_settings
  alter column onboarding_completed set default false;
