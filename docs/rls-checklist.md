# Checklist RLS — aislamiento de datos (2 usuarios)

Objetivo: verificar que **A no ve lo personal de B**, y que **solo lo shared del mismo hogar** es visible entre ambos.

Hacé esto **después** de aplicar migraciones `001`→`006`.

## Preparación

1. Dos browsers (o 1 normal + 1 ventana privada).
2. Dos emails: `userA@…` y `userB@…`.
3. Login magic link en cada uno.
4. En Cuenta de **ambos**: activar **Gastos compartidos**.
5. A genera código → B se une (o al revés).

Opcional: SQL Editor con dos JWTs es más avanzado; con la UI alcanza para esta fase íntima.

---

## Escenarios mínimos

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
| El monto resta del disponible de **ambos** | Coherente con el modelo (sin split) |
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
| B intenta editar el shared de A (si la UI lo permite) | Debe fallar o no mostrar acciones |
| Rates / settings de A | Solo A los cambia |

### 6. Rates y settings

| Paso | Esperado |
|------|----------|
| A usa display USD / bolsillos | No cambia la UI de B |
| Cotización de A | Independiente de B |

---

## Verificación rápida en SQL (opcional)

En SQL Editor (como `postgres` / service role) **no** simula al usuario.  
Para probar como usuario necesitás el JWT o usar la app.

Chequeo de que RLS está prendido:

```sql
select relname, relrowsecurity
from pg_class
where relname in (
  'profiles', 'households', 'household_members', 'household_invites',
  'movements', 'monthly_rates', 'user_settings'
)
order by relname;
```

Todas las filas deben tener `relrowsecurity = true`.

Grants del RPC de invite:

```sql
select grantee, privilege_type
from information_schema.routine_privileges
where routine_name = 'accept_household_invite';
```

`anon` / `PUBLIC` **no** deberían tener EXECUTE; sí `authenticated` (y roles internos de Postgres).

---

## Si algo falla

1. No “arregles” ocultando en la UI: arreglá la **policy** o el **RPC**.
2. Nueva migración `007_….sql` — no edites a ciegas `001` en un proyecto ya aplicado.
3. Anotá el escenario que falló y el mensaje de error de Supabase.

---

## Resultado

Cuando todos los escenarios pasan:

- [ ] Personal aislado  
- [ ] Shared cruzado solo en el hogar  
- [ ] Ingresos ajenos ocultos  
- [ ] Delete/update respetan autor  
- [ ] Settings/rates propios  
- [ ] RLS enabled + grants RPC OK  

→ podés pasar a Fase 3 (UX consentimiento) del plan nube.
