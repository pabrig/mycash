# Myca$h — Despliegue público (PWA)

Guía para publicar la app en una **URL HTTPS** usable desde el celular (vos + pareja primero; camino a escalar después).

**Stack elegido:** Vercel (Next.js) + Supabase (Auth + Postgres/RLS).  
**Fase 1:** `https://TU-PROYECTO.vercel.app` · **Fase 2:** dominio propio.

```text
Celular (PWA)
    ↓ HTTPS
Vercel (Next.js 16)
    ↓ anon key + JWT
Supabase (Auth magic link + RLS)
```

---

## Por qué Vercel (y no otras)

| Opción | Cuándo tiene sentido | Para Myca$h ahora |
|--------|----------------------|-------------------|
| **Vercel** | Next App Router, HTTPS, preview PRs, free tier | **Sí — default** |
| Cloudflare Pages | Coste edge a escala | Más fricción con Next 16 |
| Railway / Render / Fly | Querés contenedor `next start` | Más ops de lo necesario |
| VPS | Control total | No para F&F |
| Solo static en Supabase | SPA sin server | No: necesitás `/auth/callback` |

Supabase Free alcanza para 2–decenas de usuarios; el cuello al crecer suele ser email Auth / DB, no el front.

---

## Pre-flight

1. Código estable en `develop` / `main` (migraciones `001`→`007`).
2. En Supabase: migraciones aplicadas ([cloud.md](./cloud.md)).
3. Ninguna `service_role` en el repo ni en vars `NEXT_PUBLIC_*`.
4. Local OK: magic link + compartido + install PWA.

---

## Fase 1 — URL pública (`*.vercel.app`)

### A. Proyecto Vercel

1. [vercel.com](https://vercel.com) → **Add New Project** → importá `pabrig/mycash`.
2. Framework: **Next.js**.
3. Root: repo root. Build: `npm run build` (default).
4. **Node.js Version:** `22.x` (Settings → General, o `engines` en `package.json`).
5. Production Branch: empezá con **`develop`** (iteración F&F) o **`main`** si ya promocionás releases ahí.
6. Deploy.

Anotá la URL: `https://mycash-xxxx.vercel.app` (o el nombre que elijas).

### B. Variables de entorno (Vercel → Settings → Environment Variables)

Para **Production** (y **Preview** si querés magic link en PRs):

| Name | Valor |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ahhpikxugqpxuokohcbk.supabase.co` (tu project) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Legacy **anon** JWT (`eyJ…`) — no `sb_publishable`, no service_role |
| `NEXT_PUBLIC_SITE_URL` | `https://TU-PROYECTO.vercel.app` (sin slash final) |

Tras cambiar env: **Redeploy** (las `NEXT_PUBLIC_*` se bakean en el build).

### C. Supabase Auth (bloqueante)

**Authentication → URL Configuration**

- **Site URL:** `https://TU-PROYECTO.vercel.app`
- **Redirect URLs** (allowlist), una por línea:
  - `https://TU-PROYECTO.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`

Sin el allowlist el magic link falla o redirige mal.

Opcional: revisar plantilla de email (Authentication → Email Templates) para que el CTA diga “Entrar a Myca$h”.

### D. Smoke F&F (celular)

- [ ] Abre la URL en Chrome/Safari  
- [ ] Magic link llega y deja sesión  
- [ ] Sync / gastos compartidos entre 2 cuentas  
- [ ] **Agregar a inicio** (PWA)  
- [ ] Tras un deploy nuevo, si ves UI vieja: unregister SW (ver README)  

### E. Acceso “cerrado” sin SaaS

La URL es pública: cualquiera puede pedir un magic link a *su* mail y crear cuenta vacía (RLS evita que vea tus datos). Para F&F: **no compartas el link** fuera del dúo. Allowlist de emails / invites-only → más adelante.

---

## Fase 2 — Dominio propio

1. Comprá dominio (`.app` / `.com` / `.com.ar`).
2. Vercel → Project → **Domains** → Add → seguí DNS (CNAME/A).
3. Actualizá:
   - `NEXT_PUBLIC_SITE_URL=https://tudominio.com`
   - Supabase Site URL + Redirect: `https://tudominio.com/auth/callback`
4. Redeploy.
5. Dejá `*.vercel.app` como alias o redirect.

---

## PWA en producción

Ya incluido:

- [`public/manifest.json`](../public/manifest.json)
- [`public/sw.js`](../public/sw.js) (network-first en navegación; cache mínimo de estáticos)
- Registro en cliente ([`ServiceWorkerRegister`](../src/components/ServiceWorkerRegister.tsx))

Requisitos: **HTTPS** (Vercel) + icono. iOS: a veces el magic link abre Safari fuera de la PWA; abrir el mail en el mismo browser o copiar el link.

Mejora futura (no bloquea F&F): PNG 180/192/512 además del SVG.

---

## Preview deploys

Cada PR puede tener `*.vercel.app` de preview. Si Preview tiene las mismas env que Production, el login funciona contra el **mismo** proyecto Supabase (cuidado: datos reales). Alternativa: proyecto Supabase `mycash-staging` + env Preview distintas.

---

## Escalado corto plazo (sin cambiar de host)

| Señal | Acción |
|-------|--------|
| Magic link en spam | SMTP propio (Resend/Postmark) en Supabase |
| “No veo el cambio” tras deploy | Documentar unregister SW; bump cache name en `sw.js` |
| Más de F&F | Correr [rls-checklist.md](./rls-checklist.md) + [rls-audit.sql](./rls-audit.sql) |
| Datos críticos | Export JSON (Cuenta) + contemplar Supabase Pro / backups |
| Cuentas basura en Auth | Limpiar Users en Dashboard; luego allowlist |

---

## Checklist rápido (copiá y marcá)

```text
[ ] Vercel proyecto + Node 22 + branch correcta
[ ] Env: URL + anon + SITE_URL = dominio vercel
[ ] Redeploy tras env
[ ] Supabase Site URL + Redirect /auth/callback
[ ] Migraciones 001–007
[ ] Login magic link en 2 celulares
[ ] Shared OK
[ ] PWA instalada
[ ] (Luego) dominio propio + actualizar SITE_URL + Auth
```

Más detalle de nube/RLS: [cloud.md](./cloud.md).
