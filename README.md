# Myca$h

PWA de **finanzas personales** para controlar ingresos, gastos y disponible mensual. Reemplaza planillas de Excel con carga rápida desde el celular.

## Modelo

- **Un solo usuario** — todo en tu teléfono, sin login
- **Gastos**: personal o compartido (solo etiqueta, sin reparto)
- **Disponible** = ingresos − gastos personales − gastos compartidos
- **Dólar oficial**: automático vía [DolarApi](https://dolarapi.com) (sin pantalla de cotización)

## Funcionalidades

- **Nuevo movimiento**: ingreso o gasto con monto en ARS o USD
- **Resumen mes/año**: toggle con acumulados y promedios mensuales
- **Visualización ARS/USD** con dólar oficial del mes
- **Lista del mes** con filtros (ingresos, personal, compartido)
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

- **Fase 2**: Supabase — login y datos compartidos
- **Fase 3**: sync offline robusto
- **Fase 4**: import CSV desde Excel
