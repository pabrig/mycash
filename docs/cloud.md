# Myca$h — Nube (Supabase)

Guía operativa para configurar, entender y endurecer el modo nube.  
Pensada para **uso íntimo** (vos + pareja): priorizamos aislamiento de datos y consentimiento, no escala SaaS.

## Mapa mental (1 minuto)

El browser **no es de confianza**. La UI puede ocultar cosas, pero la puerta real es **Postgres + RLS**:

```text
Next.js (anon key + JWT del usuario)
        ↓
   Supabase Auth (magic link)
        ↓
   Postgres con Row Level Security
        ├── personal → solo tu user_id
        └── shared  → solo tu household
```

**Regla de oro:** nunca pongas la `service_role` en el frontend ni en variables `NEXT_PUBLIC_*`.  
En la app solo van **URL** + **anon key** (ver [`.env.example`](../.env.example)).

---

## Glosario corto

| Término | Qué es | Por qué importa |
|--------|--------|-----------------|
| **anon key** | Clave pública del cliente | Segura de exponer *si* RLS está bien. Sin RLS, cualquiera lee todo. |
| **service_role** | Clave de admin (bypass RLS) | Solo servidor/Dashboard. **Nunca** en el browser. |
| **JWT** | Token de sesión tras el magic link | Viaja en cada request; Postgres sabe quién sos (`auth.uid()`). |
| **RLS** | Políticas por fila en cada tabla | Define qué filas podés SELECT/INSERT/UPDATE/DELETE. |
| **household** | “Hogar” / grupo compartido | Un usuario ∈ un solo hogar. |
| **scope personal** | Movimiento solo tuyo | El partner **no** lo ve. |
| **scope shared** | Gasto del hogar | Ambos lo ven (monto + descripción + quién lo cargó). |
| **RPC security definer** | Función SQL con privilegios elevados | Usada p.ej. para aceptar invitaciones; hay que restringir `GRANT EXECUTE`. |

---

## Qué ve tu pareja (contrato de privacidad)

Si activaste **Gastos compartidos** y estánieron cuentas:

**Sí ve**
- Gastos marcados como **compartidos** (descripción, monto, moneda, categoría, autor).
- Nombre de display de los miembros del hogar.

**No ve**
- Tus **ingresos** (sueldo, pasivos, etc.).
- Tus gastos **personales**.
- Tu **tipo de cambio** mensual ni settings (ARS/USD display, bolsillos, flags).
- Tu bolsillo Ahorro / Cotidiano como “cuenta bancaria” privada.

**Importante:** el gasto compartido **resta solo del disponible de quien lo cargó**. Tu pareja lo ve, pero no le descuenta de su fondo (no hay “quién debe a quién”).

---

## Setup paso a paso

### 1. Proyecto Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. Settings → API: copiá **Project URL** y **anon public** key (JWT `eyJ…`, no `sb_publishable`).

### 2. Migraciones (orden fijo)

En **SQL Editor**, ejecutá en orden:

1. `supabase/migrations/001_initial.sql` — tablas, trigger usuario nuevo, RLS, RPC invite  
2. `supabase/migrations/002_wallets.sql` — bolsillos  
3. `supabase/migrations/003_movements_update.sql` — update de movimientos  
4. `supabase/migrations/004_shared_enabled.sql` — flag compartido  
5. `supabase/migrations/005_usd_enabled.sql` — flag USD  
6. `supabase/migrations/006_cloud_hardening.sql` — grants RPC + hardening  
7. `supabase/migrations/007_lifecycle_invites.sql` — revocar invites, salir del hogar, borrar cuenta  

Si el proyecto ya tenía `001`–`006`, solo corré `007`.

### 3. Variables de entorno

```bash
cp .env.example .env.local
```

Completá:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

En producción, `NEXT_PUBLIC_SITE_URL` = tu dominio (`https://tudominio.com`).

### 4. Auth URLs (Dashboard)

**Authentication → URL Configuration**

- Site URL: `http://localhost:3000` (dev) o tu dominio (prod)
- Redirect URLs (allowlist), mínimo:
  - `http://localhost:3000/auth/callback`
  - `https://TU_DOMINIO/auth/callback`

Sin esto el magic link falla o puede redirigir mal.

### 5. Email (opcional pero recomendado)

Authentication → Email templates: revisá el link del magic link.  
En Free tier los mails salen desde Supabase; en prod conviene SMTP propio más adelante.

### 6. Arrancar

```bash
npm run dev:fresh
```

Abrí `/cuenta` → Entrar → magic link → sync activo.

Sin `.env.local` la app sigue en **modo local** (localStorage).

---

## Checklist de producción (Fase 1)

Marcá antes de cargar datos reales:

- [ ] Solo `anon` key en `.env` / hosting; **no** existe `SERVICE_ROLE` en el repo ni en Vercel/env públicas
- [ ] Redirect URLs allowlist solo localhost + dominio propio
- [ ] Migraciones `001`→`007` aplicadas
- [ ] RLS enabled en: `profiles`, `households`, `household_members`, `household_invites`, `movements`, `monthly_rates`, `user_settings`
- [ ] RPCs `accept_household_invite`, `leave_household`, `delete_own_account` solo para `authenticated`
- [ ] Probaste login magic link en el dominio real
- [ ] Probaste aislamiento con 2 usuarios (ver [rls-checklist.md](./rls-checklist.md))

---

## Sync local ↔ nube (regla simple)

1. Sin sesión → datos en `localStorage`.
2. Primer login → se **migran una vez** solo los movimientos **personales** locales (nunca se inventan shared sin household).
3. Si ya hay personales en la nube → **no se re-migra**; la nube manda.
4. Con sesión → la UI lee/escribe remoto; si falla la red, se muestra aviso y se cae a local temporalmente.
5. Cerrar sesión → podés seguir en local; no borramos cloud automáticamente.
6. **Salir del grupo** → perdés acceso a shared del hogar anterior; se crea un hogar solo nuevo.
7. **Borrar cuenta** → elimina el usuario Auth (cascade a profile/movimientos propios).

---

## Ciclo de vida (invites y cuenta)

| Acción | Dónde | Notas |
|--------|--------|------|
| Código invite | 12 chars, 7 días, máx. 5 pendientes | Owner puede **Revocar** |
| Aceptar invite | Unir o `/join/CODE` | Invalida otros códigos abiertos del hogar |
| Salir del grupo | Cuenta (si hay 2+ miembros) | RPC `leave_household` |
| Exportar | Cuenta → JSON | Backup personal |
| Borrar cuenta | Cuenta (doble confirm) | RPC `delete_own_account` |

---

## Archivos clave en el código

| Pieza | Path |
|-------|------|
| Env / “¿hay nube?” | `src/lib/supabase/env.ts` |
| Cliente browser | `src/lib/supabase/client.ts` |
| Queries + invites | `src/lib/supabase/data.ts` |
| Auth UI | `src/context/AuthContext.tsx` |
| Sync finanzas | `src/context/FinanceContext.tsx` |
| Callback magic link | `src/app/auth/callback/route.ts` |
| SQL | `supabase/migrations/` |
| Despliegue público | [deploy.md](./deploy.md) |

---

## Estado del plan

1. ~~Docs + glosario~~  
2. ~~Hardening grants (`006`) + checklist~~  
3. ~~Auditoría RLS~~ ([rls-checklist.md](./rls-checklist.md) + [rls-audit.sql](./rls-audit.sql))  
4. ~~UX consentimiento + migrate personal-only~~  
5. ~~Invites fuertes / salir / borrar / export~~  
6. ~~Errores sync visibles + regla cloud gana + tests scope~~  
