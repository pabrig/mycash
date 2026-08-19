# Myca$h

PWA de **finanzas personales** para controlar ingresos, gastos y disponible mensual. Reemplaza planillas de Excel con carga rápida desde el celular.

## Modelo

- **Modo local** — sin login, datos en el teléfono (localStorage)
- **Modo nube** (opcional) — Supabase: magic link, sync personal y gastos compartidos en pareja
- **Gastos compartidos**: solo egresos; el monto completo resta del disponible de cada miembro (sin reparto)
- **Un hogar por usuario** — vinculación por código de invitación
- **Disponible** = ingresos − gastos personales − gastos compartidos
- **Modo bolsillos** (opcional, requiere USD): **Todo junto** o **Dos bolsillos** (Cotidiano ARS + Ahorro USD)
- **USD** (opcional): activable en Cuenta — cotización, cargar en dólares y bolsillos
- **Dólar oficial**: automático vía [DolarApi](https://dolarapi.com); tipo de cambio **por usuario**

## Funcionalidades

- **Nuevo movimiento**: ingreso o gasto con monto en ARS o USD
- **Resumen mes/año**: toggle con acumulados y promedios mensuales
- **Visualización ARS/USD** con dólar oficial del mes
- **Lista del mes** con filtros (ingresos, personal, compartido)
- **Pestaña Compartido** — gastos del hogar con autor (nube)
- **Cuenta** — USD on/off, bolsillos, compartido, invitar / unirse, cerrar sesión
- **Offline**: datos en localStorage + service worker básico

## Desarrollo

Requisito: **Node arm64** (Apple Silicon nativo). Verificá con `node -p process.arch` → debe decir `arm64`.

```bash
nvm use          # usa .nvmrc → v22.23.1 arm64
npm install
npm run dev:fresh   # recomendado: limpia servidor duplicado y cache
# o
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

### Si `pnpm dev` falla con "Another next dev server is already running"

```bash
npm run dev:fresh
```

### Si la pantalla queda en "Cargando…" sin avanzar

Un service worker viejo puede estar sirviendo JS desactualizado. En DevTools → Application → Service Workers → Unregister, o en consola:

```javascript
navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
caches.keys().then((ks) => ks.forEach((k) => caches.delete(k)));
location.reload();
```

En desarrollo el SW no se registra; en producción solo cachea manifest e íconos.

### Error `lightningcss.darwin-x64.node` / `next/font`

Node está en **x64 (Rosetta)** o `node_modules` se instaló con otra arquitectura.

```bash
node -p process.arch   # debe decir arm64 en Apple Silicon
nvm use
rm -rf node_modules .next
npm install            # usar npm, no pnpm
npm run dev:fresh
```

Si `process.arch` dice `x64`, instalá Node arm64 con `nvm install 22.23.1` y repetí los pasos.

### Supabase (sync y compartido, opcional)

Guía completa (glosario, qué ve tu pareja, checklist prod, RLS): **[docs/cloud.md](docs/cloud.md)**.

Resumen rápido:

1. Creá un proyecto en [Supabase](https://supabase.com)
2. En SQL Editor, ejecutá en orden `supabase/migrations/001_initial.sql` … `007_lifecycle_invites.sql`
3. Copiá `.env.example` → `.env.local` (solo URL + **anon** key — nunca `service_role`)
4. Authentication → URL Configuration: `http://localhost:3000/auth/callback` (+ dominio prod)
5. Reiniciá `npm run dev`

Sin `.env.local` la app funciona igual en modo local.

Auditoría de aislamiento con 2 usuarios: **[docs/rls-checklist.md](docs/rls-checklist.md)** · script SQL: **[docs/rls-audit.sql](docs/rls-audit.sql)**.

Despliegue público (Vercel + Auth + PWA): **[docs/deploy.md](docs/deploy.md)** — guía paso a paso.

## Tests

```bash
npm test
npm run build
```

## Instalar en el celular

1. Abrí la app en Chrome/Safari
2. **Agregar a pantalla de inicio** / **Install app**
3. Listo — funciona como app nativa

## Roadmap

- **Fase 3**: sync offline robusto
- **Fase 4**: import CSV desde Excel
