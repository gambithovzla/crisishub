<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# CrisisHub — Guía del proyecto (para Claude Code, Cursor y otros asistentes)

> Plataforma web de respuesta rápida ante desastres naturales. Primer caso de
> uso: **Terremoto Venezuela 2026**. La arquitectura es **genérica y multi-evento**.
> Objetivo central: **reducir el tiempo que tarda una familia en encontrar a un ser querido.**
> NO es una red social ni un portal de noticias: es una herramienta de emergencia.

El plan completo por fases está en [`ROADMAP.md`](ROADMAP.md).

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **TailwindCSS v4** + **shadcn/ui estilo `base-nova`** (basado en **Base UI**, no Radix)
- **next-intl** (i18n, español por defecto, sin routing de locale)
- **next-themes** (modo claro/oscuro/sistema)
- **Supabase** (Postgres + Auth + Storage + Realtime)
- Mapas (pendiente, Fase 6): **Leaflet + OpenStreetMap**
- Hosting: **Vercel** (repo `github.com/gambithovzla/crisishub`, auto-deploy desde `main`)

## ⚠️ Gotchas importantes (leer antes de tocar UI)

1. **Base UI, no Radix.** Los componentes de `src/components/ui/*` usan la prop
   **`render`**, NO `asChild`. Ejemplos:
   ```tsx
   <Button render={<Link href="/x" />}>Texto</Button>
   <SheetTrigger render={<Button variant="ghost" />}>...</SheetTrigger>
   <DropdownMenuTrigger render={<Button size="icon" />}>...</DropdownMenuTrigger>
   ```
2. **Next.js 16**: `cookies()`, `headers()` y `params` son **async** (usar `await`).
3. **i18n**: todo texto visible va en `messages/es.json` y se lee con
   `useTranslations()` (cliente) o `getTranslations()` (servidor). No hardcodear cadenas.
4. **Idioma del código/UI**: español (Venezuela). Comentarios y copy en español.

## Comandos

```bash
npm run dev     # desarrollo (http://localhost:3000)
npm run build   # build de producción (verificar SIEMPRE antes de dar por hecho algo)
npm run lint    # ESLint
npm start       # servir el build de producción
```

## Estructura

```
src/
  app/                 # rutas (App Router). Páginas de los módulos: desaparecidos,
                       #   buscar, mapa, ayuda (hoy placeholders salvo lo construido)
  components/
    ui/                # shadcn (Base UI) — usar prop `render`, no `asChild`
    site-header.tsx, site-footer.tsx, theme-*.tsx, page-placeholder.tsx
  config/nav.ts        # navegación principal (los 5 módulos) + reportHref
  i18n/request.ts      # config next-intl (locale fijo 'es')
  lib/supabase/        # client.ts (navegador) · server.ts · admin.ts (service_role) · types.ts
messages/es.json       # todos los textos de la UI
supabase/
  migrations/0001_init.sql   # esquema: events + 5 módulos + profiles + audit_log
  migrations/0002_rls.sql    # seguridad por fila (RLS)
  migrations/0003_storage.sql# bucket de fotos
  seed.sql                   # evento "Terremoto Venezuela 2026"
  INSTALAR-TODO.sql          # los 4 anteriores juntos (pegar 1 vez en SQL Editor)
  README.md                  # pasos de configuración
```

## Modelo de datos (resumen)

Todo cuelga de `events` (PK `bigint` para URLs cortas tipo `/desaparecidos/12345`).
Tablas: `events`, `missing_persons` (incluye bloque **"Último contacto"**: lat/lng,
hora, medio, actividad; y `search_vector` full-text en español), `tips`
("Tengo información"), `map_markers`, `help_requests`, `profiles` (staff ligado a
`auth.users`), `audit_log`. Estados moderables vía columna `moderation`.

**RLS**: el público LEE lo `visible` y CREA registros; solo staff (admin/moderador,
vía función `is_staff()`) edita/oculta/borra. El anti-spam real (rate limit, captcha,
validación de imágenes) vive en la capa de aplicación (Fase 9).

## Variables de entorno

En `.env.local` (ya configurado, git lo ignora):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
En producción hay que añadir las mismas en Vercel → Settings → Environment Variables.

## Convenciones

- **Mobile-first** real (95% del tráfico es móvil, muchos con 2G y teléfonos antiguos):
  botones grandes, alto contraste, SSR, lazy loading, imágenes comprimidas.
- **Accesibilidad**: foco visible (amarillo Gov.uk), lectores de pantalla, fuente grande.
- Diseño inspirado en **Gov.uk / Google Crisis Response**: mucho espacio blanco, claro.
- Tokens de color y semánticos (`--status-missing/found/deceased`, `--emergency`,
  `--success`, `--warning`) definidos en `src/app/globals.css`.
- Verificar con `npm run build` antes de afirmar que algo funciona.

## Estado de fases

- ✅ **Fase 1** — Scaffold + sistema de diseño + layout + i18n + PWA shell.
- ✅ **Fase 2** — Esquema de BD, RLS, Storage, clientes Supabase y tipos.
- ✅ **Fase 3** — Módulo "Personas desaparecidas": formulario con "Último contacto",
  subida de foto, listado, ficha con URL única + Open Graph, botón "Tengo información".
  Rutas en `src/app/desaparecidos/*`; lógica en `src/lib` y `src/components/missing`.
- ✅ **Fase 4** — "Tengo información": formulario de pistas (`tip-form.tsx`) en
  `desaparecidos/[id]/tengo-informacion`, action `createTip`, y `TipsList` en la
  ficha (muestra info/ubicación/foto/fecha; oculta nombre/teléfono del informante).
- ✅ **Fase 5** — Buscar: `/buscar` con formulario nativo GET (sin JS, 2G-friendly),
  full-text en español **sin acentos** (f_unaccent + `stripAccents` en el query) y
  filtros por estado/situación/edad. Requiere correr `0004_search_unaccent.sql`.
- ✅ **Fase 6** — Mapa colaborativo: `/mapa` con Leaflet + OSM cargado vía
  `next/dynamic` (ssr:false) en `map-view.tsx`; `crisis-map.tsx` con pines por tipo,
  popups, filtros y alta (tocar mapa o GPS + foto). Action `createMarker`.
- ✅ **Fase 7** — Ayuda: `/ayuda` con pestañas necesito/ofrezco (`help_*`), y
  **Centros de acopio internacionales** `/ayuda/acopio` (tabla `collection_points`,
  migración `0005`, directorio por país + alta). Completa el MVP de 5 módulos.
- ⏭️ **Fase 8** — Moderación y panel admin (Auth + roles; `is_staff`, `audit_log` listos).
- Resto: ver `ROADMAP.md` (Seguridad, Rendimiento/PWA, Lanzamiento).
