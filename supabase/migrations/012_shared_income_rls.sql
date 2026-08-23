-- Alinea RLS con 010: un shared puede ser gasto O ingreso.
-- Antes: el CHECK lo permitía, pero insert/update exigían type = 'expense'.
-- Correr después de 008 + 010 (011 no es requisito).

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
        and type in ('expense', 'income')
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
        and type in ('expense', 'income')
        and public.is_household_member(household_id)
      )
    )
  );
