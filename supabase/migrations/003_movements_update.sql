-- Allow updating own movements (edit)

create policy "movements_update"
  on public.movements for update
  using (
    created_by = auth.uid()
    or (scope = 'personal' and user_id = auth.uid())
  )
  with check (
    created_by = auth.uid()
    or (scope = 'personal' and user_id = auth.uid())
  );
