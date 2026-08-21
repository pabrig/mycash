# Checklist RLS — aislamiento de datos (multi-household)

Objetivo: **A no ve lo personal de B**. Shared solo es visible entre miembros del **mismo** grupo. Un segundo grupo (Proyecto) no se filtra a quien no es miembro.

Hacé esto **después** de aplicar migraciones `001`→`008`.

## Preparación

1. Tres browsers (o ventanas privadas).
2. Emails: `userA@…`, `userB@…`, `userC@…`.
3. Login magic link en cada uno.
4. En Cuenta de **los tres**: activar **Gastos con otros**.
5. A crea grupo **Casa** e invita a B.
6. A crea grupo **Proyecto** e invita a C (A sigue en Casa).

Opcional: corré primero el script estructural [`rls-audit.sql`](./rls-audit.sql) en SQL Editor.

---

## Escenarios mínimos (UI)

### 1. Personal aislado

| Paso | Esperado |
|------|----------|
| A carga un **ingreso** personal | Solo A lo ve en Inicio |
| A carga un **gasto personal** | Solo A lo ve |
| B y C abren Inicio | **No** aparecen esos movimientos de A |

### 2. Shared visible solo en el grupo

| Paso | Esperado |
|------|----------|
| A carga gasto shared en **Casa** | A y B lo ven. **C no** |
| A carga gasto shared en **Proyecto** | A y C lo ven. **B no** |
| El monto resta del disponible de **quien lo cargó** | El resto lo ve; su fondo no cambia |

### 3. Membresía no se filtra entre grupos

| Paso | Esperado |
|------|----------|
| B lista miembros de Casa | Ve a A y B. No ve a C |
| B no ve el grupo Proyecto en Cuenta | OK |
| Inventar el `household_id` de Proyecto desde B | Insert shared **falla** por RLS |

### 4. Ingresos ajenos ocultos

| Paso | Esperado |
|------|----------|
| B carga sueldo (ingreso) | Solo B lo ve |
| A no ve ese ingreso en ningún listado | OK |

### 5. Update / delete

| Paso | Esperado |
|------|----------|
| A edita/borra **su** shared | OK |
| B abre detalle del shared de A en Casa | **Sin** botones Editar/Eliminar |
| B no puede borrar el personal de A | OK |
| A sale de Casa: ya no puede borrar shared de Casa | RLS delete exige ser miembro |

### 6. Rates y settings

| Paso | Esperado |
|------|----------|
| A usa display USD / bolsillos | No cambia la UI de B ni C |
| Cotización de A | Independiente |

### 7. Invites (post-008)

| Paso | Esperado |
|------|----------|
| A genera 2 códigos en Casa | Ambos quedan pendientes |
| B se une con uno | El **otro código sigue válido** (para un tercero) |
| A revoca un código | Ese ya no sirve |
| Aceptar no saca a A de Proyecto | A sigue en los dos grupos |

### 8. Salir de un grupo

| Paso | Esperado |
|------|----------|
| C sale de Proyecto | C deja de ver esos shared. A los sigue viendo |
| C no tenía otro grupo | Puede crear uno o unirse a otro |
| A sigue en Casa | Los shared de Casa no se tocan |

---

## Verificación estructural (SQL)

Ejecutá [`rls-audit.sql`](./rls-audit.sql) y confirmá:

1. `rls_enabled = true` en las 7 tablas.
2. Policies de `movements` incluyen SELECT / INSERT / UPDATE / DELETE.
3. `household_invites` tiene policy de DELETE (revocar).
4. RPCs `accept_household_invite`, `leave_household`, `create_household`, `delete_own_account`, `is_household_member`, `my_household_ids`: **sin** EXECUTE para `anon` / `PUBLIC`.
5. Unicidad: `household_members` unique `(household_id, user_id)` — **no** unique `(user_id)`.
6. FKs de `movements.user_id` / `created_by` → `profiles` con `ON DELETE CASCADE`.

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
2. Nueva migración `010_….sql` — no edites a ciegas `001`/`009` en un proyecto ya aplicado.
3. Anotá el escenario que falló y el mensaje de error de Supabase.

---

## Resultado

Cuando todos los escenarios pasan:

- [ ] Personal aislado  
- [ ] Shared cruzado solo en el mismo grupo  
- [ ] Segundo grupo invisible para no-miembros  
- [ ] Ingresos ajenos ocultos  
- [ ] Delete/update respetan autor + membresía  
- [ ] Settings/rates propios  
- [ ] Invites: un código = un uso; no borra hermanas  
- [ ] Salir de un grupo no te saca de los otros  
- [ ] RLS enabled + grants RPC OK (`rls-audit.sql`)  

→ multi-household listo para F&F.
