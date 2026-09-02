-- Arrastre anual opcional en la vista mes (default off = solo el mes actual)

alter table public.user_settings
  add column if not exists carryover_enabled boolean not null default false;
