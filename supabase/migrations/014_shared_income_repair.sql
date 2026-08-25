-- Repara ingresos del grupo: el CHECK y el RLS viejos exigían type = 'expense'.
-- 010 relajó el CHECK; 012 el RLS. Si alguna no se corrió, el gasto anda y el ingreso no.
-- Idempotente: se puede correr aunque 010 y 012 ya estén.

alter table public.movements
  drop constraint if exists movements_shared_rules;

alter table public.movements
  add constraint movements_shared_rules check (
    (scope = 'personal')
    or (scope = 'shared' and household_id is not null)
  );

drop policy if exists "movements_insert" on public.movements;
drop policy if exists "movements_update" on public.movements;

create policy "movements_insert"
  on public.movements for insert
  with check (
    created_by = auth.uid()
    and (
      (scope = 'personal' and user_id = auth.uid() and household_id is null)
      or (
        scope = 'shared'
        and user_id = auth.uid()
        and public.is_household_member(household_id)
      )
    )
  );

create policy "movements_update"
  on public.movements for update
  using (
    created_by = auth.uid()
    and (
      scope = 'personal'
      or public.is_household_member(household_id)
    )
  )
  with check (
    created_by = auth.uid()
    and (
      (scope = 'personal' and user_id = auth.uid() and household_id is null)
      or (
        scope = 'shared'
        and public.is_household_member(household_id)
      )
    )
  );
