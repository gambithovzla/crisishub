# CrisisHub — Roadmap por fases

> Plataforma web de respuesta rápida para desastres naturales.
> Primer caso de uso: Terremoto Venezuela 2026. Arquitectura genérica y reutilizable.
> **Objetivo central:** reducir el tiempo que tarda una familia en encontrar información sobre un ser querido.

---

## 0. Decisión de infraestructura (leer primero)

Tú tienes una cuenta de **Railway** y no conoces Supabase. Aquí está la realidad sin tecnicismos:

La app necesita **5 cosas** del backend:
1. **Base de datos** (guardar personas, reportes, ayuda…).
2. **Login / usuarios** (administradores, moderadores).
3. **Almacenamiento de fotos** (fotos de desaparecidos, del mapa…).
4. **Tiempo real** (que el listado se actualice solo cuando alguien reporta).
5. **Reglas de seguridad** sobre quién puede leer/escribir cada cosa.

| Opción | Qué implica | Esfuerzo | Costo inicial |
|---|---|---|---|
| **Supabase Cloud + Vercel** ✅ recomendado | Te da las 5 cosas listas. Solo creas una cuenta y copias 2 claves. | Bajo | **$0** (planes gratuitos) |
| Solo Railway | Railway te da la base de datos, pero login, fotos y tiempo real los tendrías que construir a mano. | Alto | Railway cobra tras ~$5 de crédito |

**Recomendación:** Supabase (gratis) para el backend + Vercel (gratis) para publicar la web.
Railway queda reservado para la Fase de escalabilidad (procesos en segundo plano, envío de SMS/WhatsApp, IA), donde sí es ideal.

> Decisión confirmada del equipo: **idioma español (Venezuela) con estructura i18n preparada** para sumar otros países de Latinoamérica después.

---

## Principios que guían TODO el proyecto

- **Mobile-first real:** 95% entra desde celular, muchos antiguos y con 2G. Cada decisión se mide en "¿carga rápido en un teléfono malo con mala señal?".
- **Es una herramienta de emergencia,** no una red social ni un portal de noticias. Cero distracciones. La acción principal de cada pantalla debe ser obvia y enorme.
- **Genérico desde el día 1:** todo cuelga de un **Evento**. Nada se "hardcodea" a Venezuela.
- **Accesible:** alto contraste, fuente grande, lectores de pantalla, modo oscuro.
- **Moderable:** todo contenido creado por ciudadanos puede ser editado/ocultado por un admin.

---

## Modelo de datos (boceto inicial)

Todo gira alrededor de `events`. Las tablas hijas siempre llevan `event_id`.

```
events
  id, slug (ej. "terremoto-venezuela-2026"), nombre, tipo (terremoto|inundacion|...),
  descripcion, pais, estado (activo|cerrado), centro_mapa (lat,lng,zoom),
  created_at

missing_persons                      -- Módulo 1
  id, event_id, nombre, apellido, edad_aprox, foto_url,
  ultima_ubicacion (lat,lng + texto), ultimo_contacto_at,
  ultimo_contacto_medio (llamada|whatsapp|presencial|otro),   -- "Último contacto"
  ultimo_contacto_actividad (texto),                          -- qué estaba haciendo
  descripcion, familiar_nombre, familiar_telefono,
  estado (desaparecido|encontrado_vivo|fallecido),
  status_moderacion (visible|oculto|falso|fusionado),
  merged_into_id (para duplicados), created_at, search_vector (full-text)

tips                                  -- Módulo 2 "Tengo información"
  id, missing_person_id, nombre, telefono, informacion,
  ubicacion (lat,lng + texto), foto_url, status_moderacion, created_at

map_markers                           -- Módulo 4
  id, event_id, tipo (hospital|refugio|acopio|agua|calle_bloqueada|edificio_colapsado),
  descripcion, foto_url, lat, lng, usuario (texto libre),
  status_moderacion, created_at

help_requests                         -- Módulo 5
  id, event_id, modo (necesito|ofrezco),
  categoria (agua|comida|medicinas|hospedaje|transporte|electricidad|internet|ropa|otros),
  descripcion, ubicacion (lat,lng + texto), contacto,
  estado (pendiente|en_proceso|resuelta),
  status_moderacion, created_at

profiles                              -- usuarios admin/moderador (ligado a Supabase Auth)
  id, rol (admin|moderador), nombre, created_at

audit_log                             -- moderación: quién hizo qué
  id, actor_id, accion, tabla, registro_id, detalle, created_at
```

Seguridad de datos: **RLS (Row Level Security)** activado en todas las tablas.
- Público: puede **leer** lo `visible` y **crear** registros (con rate-limit + captcha).
- Solo admin/moderador: puede editar, ocultar, marcar falso, fusionar.

---

## FASES

> **Estado al 2026-06-25:** ✅ Fases 0–7 completadas y **en producción**
> (https://crisishub-neon.vercel.app). Los **5 módulos del MVP** están vivos.
> Repo: github.com/gambithovzla/crisishub. Próximo: **Fase 8 (moderación)**.
>
> Desviaciones respecto al plan original (decisiones tomadas):
> - **Next.js 16** (no 15) + **Tailwind v4** + shadcn estilo **base-nova (Base UI)**.
> - Rutas top-level (`/desaparecidos`, `/buscar`, `/mapa`, `/ayuda`) en vez de
>   `/[evento]/...`: el MVP usa un único evento activo; el multi-evento se añadirá
>   con routing por slug cuando haga falta (la BD ya está lista con `event_id`).
> - **Añadido a Fase 7:** Centros de acopio internacionales (`/ayuda/acopio`).

### ✅ Fase 0 — Cuentas y cimientos (sin código)
- Crear cuenta en **GitHub** (repo del proyecto), **Supabase** (backend gratis), **Vercel** (publicar gratis).
- Crear el proyecto Supabase y copiar las 2 claves (`URL` y `anon key`) + la `service_role` (secreta).
- *Entregable:* las 3 cuentas listas y claves a mano.

### ✅ Fase 1 — Scaffold + Sistema de diseño
- Next.js 16 (App Router) + TypeScript + TailwindCSS v4 + shadcn/ui (Base UI).
- Estructura de carpetas multi-evento e i18n (`next-intl` o equivalente) con español por defecto.
- **Design system estilo Gov.uk / Google Crisis Response:** mucho espacio blanco, botones grandes, alto contraste, foco visible, tipografía grande legible.
- Modo oscuro + tokens de color accesibles (contraste AA/AAA).
- Shell PWA básico (manifest, instalable) y layout base responsive mobile-first.
- *Entregable:* la web arranca, se ve el layout, cambia de tema, sin módulos aún.

### ✅ Fase 2 — Modelo de datos y arquitectura "Evento"
- Migraciones SQL de todas las tablas + índices + `search_vector` para búsqueda.
- RLS y políticas de acceso.
- Buckets de Storage para fotos (con validación y límites).
- Cliente Supabase (servidor y navegador) + tipos TypeScript autogenerados.
- Seed de demo: el evento "Terremoto Venezuela 2026".
- *Entregable:* base de datos viva, segura y tipada, con un evento de prueba.

### ✅ Fase 3 — Módulo 1: Personas desaparecidas ⭐ (incluye "Último contacto")
- Formulario público de alta (nombre, apellido, edad aprox, foto, descripción, familiar+teléfono).
- **Bloque "Último contacto":** ubicación en mapa, hora, medio (llamada/WhatsApp/presencial/otro), qué estaba haciendo.
- Ficha individual con **URL única** (`/[evento]/desaparecidos/[id]`), optimizada para compartir (Open Graph: foto + nombre).
- Estados: Desaparecido / Encontrado con vida / Fallecido.
- *Entregable:* alta de un desaparecido de punta a punta + ficha compartible.

### ✅ Fase 4 — Módulo 2: "Tengo información"
- Botón gigante en cada ficha.
- Formulario de reporte (nombre, teléfono, información, ubicación, foto opcional).
- Reporte queda asociado a la persona y visible para admins/familiares según política.
- *Entregable:* cualquiera puede aportar pistas a una ficha.

### ✅ Fase 5 — Módulo 3: Buscar (rápido)
- Buscador por nombre, apellido, ciudad, estado, edad.
- Búsqueda full-text de Postgres con índices (`search_vector`) para que sea instantánea incluso con miles de registros.
- Resultados con foto, estado y enlace a ficha; paginación ligera.
- *Entregable:* encontrar a alguien en < 1 segundo.

### ✅ Fase 6 — Módulo 4: Mapa colaborativo
- Leaflet + OpenStreetMap (carga diferida para no penalizar el 2G).
- Marcadores: hospital, refugio, acopio, agua, calle bloqueada, edificio colapsado.
- Cada marcador: tipo, descripción, foto, fecha, usuario.
- Alta de marcador desde el mapa; clustering para muchos puntos.
- *Entregable:* mapa con capas filtrables y alta colaborativa.

### ✅ Fase 7 — Módulo 5: Ayuda
- Dos pestañas: **Necesito ayuda** / **Ofrezco ayuda**.
- Categorías: agua, comida, medicinas, hospedaje, transporte, electricidad, internet, ropa, otros.
- Estado por solicitud: pendiente / en proceso / resuelta.
- **Extra (idea del equipo): Centros de acopio internacionales** (`/ayuda/acopio`):
  directorio agrupado por país para que la diáspora sepa dónde y cómo donar
  (qué reciben, horario, dirección, contacto). Tabla `collection_points`.
- *Entregable:* tablero de oferta y demanda + directorio de acopio mundial.

### ⏭️ Fase 8 — Moderación y panel admin
- Login (Supabase Auth) con roles admin/moderador.
- Acciones: editar, eliminar/ocultar, marcar como información falsa, **fusionar duplicados**.
- `audit_log` de cada acción.
- *Entregable:* panel para controlar todo el contenido ciudadano.

### Fase 9 — Seguridad y anti-abuso
- **Rate limiting** en todos los formularios públicos.
- **Captcha** (hCaptcha/Turnstile) en altas.
- Validación + **compresión automática de imágenes** (límite de tamaño/tipo, recompresión).
- Defensa XSS (sanitización de todo texto libre) y SQLi (consultas parametrizadas; ya lo da Supabase).
- *Entregable:* la plataforma resiste spam y contenido malicioso.

### Fase 10 — Rendimiento, PWA y accesibilidad (endurecimiento)
- Optimizado para **2G**: SSR/ISR, lazy loading, imágenes comprimidas/`next/image`, JS mínimo.
- PWA completa: funciona con conexión intermitente, instalable, caché de assets.
- Auditoría de accesibilidad (lectores de pantalla, navegación por teclado, fuente grande).
- *Entregable:* Lighthouse alto en móvil lento; usable en teléfonos antiguos.

### Fase 11 — Lanzamiento
- Dominio, despliegue en Vercel, variables de entorno, backups de la base, monitoreo de errores.
- *Entregable:* CrisisHub en producción.

---

## Escalabilidad (post-MVP, arquitectura ya preparada)
Personas encontradas en hospitales · Donaciones · Voluntarios · IA para agrupar duplicados ·
IA para detectar noticias falsas · Chat entre familiares · Notificaciones · SMS · WhatsApp.
> Aquí entra **Railway** como host de procesos en segundo plano (colas, IA, envío de SMS/WhatsApp).

---

## Próximo paso sugerido
MVP (Fases 0–7) **completo y en producción**. Lo siguiente es la **Fase 8 —
Moderación y panel admin**: login con Supabase Auth (roles admin/moderador) para
editar, ocultar contenido falso y fusionar duplicados. La base ya está lista
(`profiles`, función `is_staff()`, tabla `audit_log`).
