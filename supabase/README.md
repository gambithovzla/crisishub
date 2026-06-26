# Configuración de Supabase — CrisisHub

Sigue estos pasos **una sola vez** para dejar la base de datos lista.

## 1. Copiar las claves a `.env.local`

En Supabase: **Project Settings → API**. Copia tres valores:

1. Crea el archivo `.env.local` en la raíz del proyecto (copia de `.env.example`).
2. Pega:

```
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (anon public)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (service_role — secreta)
```

> `.env.local` está ignorado por git: las claves nunca se suben.

## 2. Crear las tablas y la seguridad

En Supabase: **SQL Editor → New query**. Pega y ejecuta **en este orden**
(cada archivo es re-ejecutable, no pasa nada si lo corres dos veces):

1. `supabase/migrations/0001_init.sql`  → tipos, tablas, índices, búsqueda
2. `supabase/migrations/0002_rls.sql`   → seguridad por fila (RLS)
3. `supabase/migrations/0003_storage.sql` → bucket de fotos
4. `supabase/seed.sql`                   → evento "Terremoto Venezuela 2026"

Comprueba en **Table Editor** que aparecen las tablas (`events`,
`missing_persons`, `tips`, `map_markers`, `help_requests`, `profiles`,
`audit_log`) y que `events` tiene una fila.

## 3. (Más adelante) Crear un usuario de staff

Cuando lleguemos a la moderación (Fase 8):

1. **Authentication → Users → Add user** (crea tu correo + contraseña).
2. Copia su `id` (UUID) y ejecuta en el SQL Editor:

```sql
insert into public.profiles (id, rol, nombre)
values ('PEGA-EL-UUID-AQUI', 'admin', 'Tu nombre');
```

### Solicitudes de moderadores (con tu aprobación)

Ejecuta también `supabase/migrations/0006_staff_applications.sql`.

En `.env.local` y en Vercel añade una clave secreta de invitación:

```
STAFF_INVITE_SECRET=una-clave-larga-y-aleatoria
```

Comparte **solo por canal privado** este enlace (no está en el menú del sitio):

```
https://www.vzla.lat/entrar/solicitud?invite=TU_CLAVE_SECRETA
```

La persona se registra ahí; tú apruebas o rechazas en **Panel → Solicitudes**
(solo visible si tu perfil tiene rol `admin`).

## 4. Para producción (Vercel)

Añade las **mismas variables** en Vercel:
**Project → Settings → Environment Variables** (las tres, entorno *Production*).
Luego redepliega.

---

### Clientes disponibles en el código

- `src/lib/supabase/client.ts` → navegador (componentes `"use client"`).
- `src/lib/supabase/server.ts` → servidor (Server Components / Actions).
- `src/lib/supabase/admin.ts`  → service_role, **solo servidor** (salta RLS).
