-- Lugar de la meta (opción B): disponible | diario | ahorro

alter table public.savings_goals
  add column if not exists place text not null default 'disponible';

alter table public.savings_goals
  drop constraint if exists savings_goals_place_check;

alter table public.savings_goals
  add constraint savings_goals_place_check
  check (place in ('disponible', 'diario', 'ahorro'));

-- Metas de ahorro no reservan el libre del mes
update public.savings_goals
set deduct_from_disponible = false
where place = 'ahorro' and deduct_from_disponible = true;
