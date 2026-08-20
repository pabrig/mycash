# Checklist RLS — aislamiento de datos (2 usuarios)

Objetivo: verificar que **A no ve lo personal de B**, y que **solo lo shared del mismo hogar** es visible entre ambos.

Hacé esto **después** de aplicar migraciones `001`→`007`.

## Preparación

1. Dos browsers (o 1 normal + 1 ventana privada).
2. Dos emails: `userA@…` y `userB@…`.
3. Login magic link en cada uno.
4. En Cuenta de **ambos**: activar **Gastos compartidos**.
5. A genera código → B se une (o al revés).

Opcional: corré primero el script estructural [`rls-audit.sql`](./rls-audit.sql) en SQL Editor (RLS on, policies, grants).

---

## Escenarios mínimos (UI — 2 browsers)

### 1. Personal aislado

| Paso | Esperado |
|------|----------|
| A carga un **ingreso** personal | Solo A lo ve en Inicio |
| A carga un **gasto personal** | Solo A lo ve |
| B abre Inicio | **No** aparecen esos movimientos de A |

### 2. Shared visible en el hogar

| Paso | Esperado |
|------|----------|
| A carga gasto **compartido** | A y B lo ven en Compartido |
| El monto resta del disponible de **A**; B lo ve y su fondo no cambia | Compartido = visualización, el saldo es individual |
| Autor = nombre de A | Visible en la fila |

### 3. Ingresos del partner ocultos

| Paso | Esperado |
|------|----------|
| B carga sueldo (ingreso) | Solo B lo ve |
| A no ve ese ingreso en ningún listado | OK |

### 4. No insertar shared ajeno

| Paso | Esperado |
|------|----------|
| Con las tools de browser, no se puede “inventar” un `household_id` de otro grupo | Insert falla por RLS |

(Si solo usás la UI, el form ya manda tu household; el fallo real se valida en SQL Editor.)

### 5. Update / delete

| Paso | Esperado |
|------|----------|
| A edita/borra **su** shared | OK |
| B abre detalle del shared de A | **Sin** botones Editar/Eliminar |
| B no puede borrar el personal de A | OK |
| Rates / settings de A | Solo A los cambia |

### 6. Rates y settings

| Paso | Esperado |
|------|----------|
| A usa display USD / bolsillos | No cambia la UI de B |
| Cotización de A | Independiente de B |

### 7. Invites (post-007)

| Paso | Esperado |
|------|----------|
| A genera código (12 chars) | Aparece en pendientes |
| A revoca el código | B no puede unirse con ese código |
| Tras B unirse | Otros invites abiertos del hogar desaparecen |

### 8. Salir del hogar

| Paso | Esperado |
|------|----------|
| B sale del grupo | B deja de ver shared del hogar de A |
| A sigue viendo los shared del hogar | OK |
| B tiene hogar solo de nuevo | Puede invitar a otra persona |

---

## Verificación estructural (SQL)

Ejecutá [`rls-audit.sql`](./rls-audit.sql) y confirmá:

1. `rls_enabled = true` en las 7 tablas.
2. Policies de `movements` incluyen SELECT / INSERT / UPDATE / DELETE.
3. `household_invites` tiene policy de DELETE (revocar).
4. RPCs `accept_household_invite`, `leave_household`, `delete_own_account`, `my_household_id`: **sin** EXECUTE para `anon` / `PUBLIC`.
5. FKs de `movements.user_id` / `created_by` → `profiles` con `ON DELETE CASCADE`.

Chequeo rápido RLS:

```sql
select relname, relrowsecurity
from pg_class
where relname in (
  'profiles', 'households', 'household_members', 'household_invites',
  'movements', 'monthly_rates', 'user_settings'
)
order by relname;
```

---

## Si algo falla

1. No “arregles” ocultando en la UI: arreglá la **policy** o el **RPC**.
2. Nueva migración `008_….sql` — no edites a ciegas `001` en un proyecto ya aplicado.
3. Anotá el escenario que falló y el mensaje de error de Supabase.

---

## Resultado

Cuando todos los escenarios pasan:

- [ ] Personal aislado  
- [ ] Shared cruzado solo en el hogar  
- [ ] Ingresos ajenos ocultos  
- [ ] Delete/update respetan autor  
- [ ] Settings/rates propios  
- [ ] Invites: revocar + invalidar extras  
- [ ] Salir del hogar  
- [ ] RLS enabled + grants RPC OK (`rls-audit.sql`)  

→ fase nube endurecida lista a nivel seguridad de datos.
