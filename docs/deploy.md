# Myca$h — Guía paso a paso: desplegar en Vercel

Publicá la PWA en una URL HTTPS (`*.vercel.app`) para usarla vos y tu pareja desde el celular.  
Stack: **Vercel** (Next.js) + **Supabase** (Auth + datos).

Tiempo estimado: **15–25 minutos** la primera vez.

---

## Antes de empezar (checklist)

Tené a mano:

1. Cuenta en [GitHub](https://github.com) con acceso al repo `pabrig/mycash`.
2. Cuenta en [Vercel](https://vercel.com) (podés entrar con GitHub).
3. Proyecto Supabase **mycash** ya creado, con migraciones `001`→`007` aplicadas ([cloud.md](./cloud.md)).
4. De Supabase → **Project Settings → API**:
   - **Project URL** (`https://….supabase.co`)
   - **anon public** key (JWT que empieza con `eyJ…` — **no** uses `service_role` ni `sb_publishable` si ves ambas).

En la compu, el repo local puede estar en `develop` (recomendado para F&F).

---

## Paso 1 — Entrar a Vercel e importar el repo

1. Abrí [https://vercel.com/login](https://vercel.com/login).
2. Elegí **Continue with GitHub** y autorizá si te lo pide.
3. En el dashboard: **Add New…** → **Project**.
4. En **Import Git Repository**, buscá **`mycash`** (owner `pabrig`).
   - Si no aparece: **Adjust GitHub App Permissions** / conectá la org o el repo en Vercel → Settings → Git.
5. Clic en **Import** junto a `mycash`.

---

## Paso 2 — Configurar el proyecto (antes del primer deploy)

En la pantalla **Configure Project**:

| Campo | Valor recomendado |
|--------|-------------------|
| **Project Name** | `mycash` (o el que quieras; define la URL `mycash.vercel.app` si está libre) |
| **Framework Preset** | **Next.js** (autodetectado) |
| **Root Directory** | `.` (dejar vacío / root) |
| **Build Command** | `npm run build` (default) |
| **Output Directory** | dejar default de Next |
| **Install Command** | `npm install` (default) |

### Node 22

Myca$h pide Node ≥ 22 (`package.json` → `engines`).

1. En la misma pantalla, abrí **Environment Variables** más abajo **o** después: **Settings → General → Node.js Version** → **22.x**.
2. Si no está la opción aún, después del primer deploy: Project → **Settings** → **General** → **Node.js Version** → `22.x` → Save → Redeploy.

### Branch de producción

- Para iterar F&F: **Production Branch = `develop`**.
- Para releases “estables”: `main` (cuando merges ahí).

En **Settings → Git → Production Branch** podés cambiarlo después.

**Todavía no hagas Deploy** si podés cargar env primero (Paso 3). Si Vercel ya desplegó sin env, no pasa nada: corregís env y redesplegás.

---

## Paso 3 — Variables de entorno

1. Project → **Settings** → **Environment Variables**.
2. Agregá **tres** variables. Marcá **Production** (y también **Preview** si querés que los PRs puedan loguear).

| Name | Value | Notas |
|------|--------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://TU_PROJECT_ID.supabase.co` | Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi…` | Settings → API → `anon` `public` |
| `NEXT_PUBLIC_SITE_URL` | `https://TU-PROYECTO.vercel.app` | Sin `/` al final. Si aún no sabés el dominio exacto, poné un placeholder, deployá, copiá la URL real y **actualizá** esta var. |

3. **Save** cada una.
4. Importante: las `NEXT_PUBLIC_*` se **hornean en el build**. Después de crearlas o cambiarlas → **Redeploy** (Paso 5).

### Qué NO poner

- `SERVICE_ROLE` / `service_role` — **nunca** en Vercel ni en el frontend.
- Keys `sb_publishable_…` si tu cliente espera el JWT `eyJ…` legacy anon.

---

## Paso 4 — Primer deploy

1. **Deployments** → **…** del último attempt → **Redeploy**,  
   **o** en el setup inicial: botón **Deploy**.
2. Esperá el build (2–4 min). Estado **Ready** = OK.
3. Clic en **Visit** / abrí la URL: `https://TU-PROYECTO.vercel.app`.
4. Deberías ver Myca$h. Si falta env, la app puede ir en modo local (sin sync); corregí Paso 3 y redesplegá.

Anotá la URL exacta; la usás en Supabase (Paso 6).

---

## Paso 5 — Alinear `NEXT_PUBLIC_SITE_URL` con la URL real

1. Copiá la URL de producción (sin path): `https://mycash-xxx.vercel.app`.
2. **Settings → Environment Variables** → editá `NEXT_PUBLIC_SITE_URL` → ese valor.
3. **Deployments** → menú del deployment actual → **Redeploy** → confirmá (usar el mismo commit está bien).

Sin esto, el magic link puede apuntar a `localhost` o a un dominio viejo.

---

## Paso 6 — Configurar Supabase Auth (obligatorio)

Sin esto el login por email **no funciona** en prod.

1. [Supabase Dashboard](https://supabase.com/dashboard) → proyecto **mycash**.
2. **Authentication** → **URL Configuration**.
3. **Site URL:**  
   `https://TU-PROYECTO.vercel.app`
4. **Redirect URLs** → Add (una por línea o una por fila):

```text
https://TU-PROYECTO.vercel.app/auth/callback
http://localhost:3000/auth/callback
```

5. **Save**.

Opcional: **Authentication → Email Templates → Magic Link** — revisá que el link use el redirect de Supabase (no hardcodees otro dominio).

---

## Paso 7 — Probar en el celular (smoke)

En el teléfono (misma red / datos):

1. Abrí `https://TU-PROYECTO.vercel.app`.
2. **Cuenta** → **Entrar** → tu email → abrí el magic link del mail.
3. Deberías volver a la app **logueado** (“Sync en la nube activo”).
4. Activá **Gastos compartidos**, generá código; en el otro celular / usuario, unirse.
5. **Agregar a pantalla de inicio** / Install app (PWA).

### Si el magic link falla

- Redirect URL mal tipeada (falta `/auth/callback`).
- `NEXT_PUBLIC_SITE_URL` distinto del dominio que abriste → corregí + Redeploy.
- Email en spam / delay de Supabase Free.
- En iOS: a veces abre Safari fuera de la PWA; abrí el link en el mismo browser o copiá la URL.

### Si ves UI vieja tras un deploy nuevo

En el browser:

```javascript
navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
caches.keys().then((ks) => ks.forEach((k) => caches.delete(k)));
location.reload();
```

---

## Paso 8 — Deploys automáticos (día a día)

Con el repo conectado:

- Push a la **Production Branch** (`develop` o `main`) → deploy a producción.
- Cada **Pull Request** → URL de **Preview** (`*.vercel.app` distinta).

Para Preview con login: mismas tres env en entorno **Preview** (mismo Supabase = datos reales; o creá un proyecto staging después).

---

## (Opcional) Dominio propio — después

1. Comprá dominio (`.app` / `.com` / `.com.ar`).
2. Vercel → Project → **Settings** → **Domains** → Add → seguí las instrucciones DNS.
3. Cuando el dominio esté **Valid**:
   - `NEXT_PUBLIC_SITE_URL=https://tudominio.com`
   - Supabase Site URL + Redirect: `https://tudominio.com/auth/callback`
4. Redeploy en Vercel.

---

## Resumen visual

```text
1. Vercel ← import GitHub mycash
2. Node 22 + branch develop/main
3. Env: SUPABASE_URL + ANON + SITE_URL
4. Deploy → anotar URL
5. SITE_URL = URL real + Redeploy
6. Supabase Auth: Site URL + /auth/callback
7. Probar magic link en 2 celulares + PWA
```

---

## Checklist final

```text
[ ] Repo importado en Vercel
[ ] Node.js 22.x
[ ] Production branch elegida (develop o main)
[ ] NEXT_PUBLIC_SUPABASE_URL
[ ] NEXT_PUBLIC_SUPABASE_ANON_KEY (eyJ…)
[ ] NEXT_PUBLIC_SITE_URL = URL de producción
[ ] Redeploy después de las env
[ ] Supabase Site URL = misma URL
[ ] Redirect: https://…/auth/callback (+ localhost)
[ ] Migraciones 001–007 aplicadas
[ ] Login + sync OK en celular
[ ] Pareja puede unirse / ver shared
[ ] App en pantalla de inicio
```

Más contexto de nube y privacidad: [cloud.md](./cloud.md).  
Auditoría RLS: [rls-checklist.md](./rls-checklist.md).
