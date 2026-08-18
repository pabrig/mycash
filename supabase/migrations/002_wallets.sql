-- Modo bolsillos (vida / ahorro) + override opcional en movimientos

alter table public.user_settings
  add column if not exists wallet_mode text not null default 'unified'
  check (wallet_mode in ('unified', 'split'));

alter table public.movements
  add column if not exists wallet text check (wallet in ('vida', 'ahorro'));
