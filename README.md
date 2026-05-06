# MecaniaOS

Plataforma de gestion operativa para talleres mecanicos.

## Stack

- Next.js 16
- TypeScript
- Prisma 6.18
- PostgreSQL
- Tailwind CSS 4
- Zod
- Autenticacion por sesion con cookie `httpOnly`

## Arquitectura

Se usa un monolito modular: la UI y la API viven en el mismo proyecto, pero la logica de negocio queda separada por dominios dentro de `src/modules`.

Documentacion base:

- `docs/architecture.md`
- `docs/implementation-plan.md`

## Estructura

```text
.
|-- docs/
|-- prisma/
|-- src/
|   |-- app/
|   |   |-- api/
|   |   |-- login/
|   |   `-- (protected)/
|   |-- components/
|   |-- lib/
|   `-- modules/
|-- .env.example
`-- README.md
```

## Módulos implementados en Sprint 1

- Autenticación
- Clientes
- Vehículos
- Órdenes de trabajo
- Estados de reparación
- Historial técnico
- Inspección Autónoma (Self-Inspection)

## Objetivos del Sprint 2 (En Desarrollo)

**Módulo de Inventario:**
- Control stock de repuestos (MOS-6)
- Consulta de stock y alertas de mínimo (MOS-86)
- Registro de ingreso por reposición (MOS-84)
- Ajuste manual de inventario (MOS-87)
- Descuento automático por OTs (MOS-85)

**Módulo de Presupuestos:**
- Generar presupuesto desglosado (MOS-7)
- Enviar presupuesto a cliente/aseguradora (MOS-61)
- Aprobar presupuesto (MOS-11)
- Rechazar presupuesto (MOS-62)
- Convertir en Orden de Trabajo (MOS-63)

## Variables de entorno

Hay dos juegos de variables separados:

- Desarrollo local fuera de Docker: usa [`.env.local.example`](/C:/Users/nacho/OneDrive/Escritorio/MecaniaOS/MecaniaOS/.env.local.example)
- Deploy / Dockploy: usa [`.env.example`](/C:/Users/nacho/OneDrive/Escritorio/MecaniaOS/MecaniaOS/.env.example)

Notas:

- `DATABASE_URL` y `DIRECT_URL` de deploy usan el `pooler` de Supabase para evitar problemas de conectividad IPv6 en servidores.
- Los buckets `self-inspections` y `work-orders` deben existir en Supabase Storage.
- Si defines `BOOTSTRAP_ADMIN_*`, el contenedor crea o reactiva un administrador al arrancar.

## Levantado local

### Modo recomendado: Docker con hot reload

Este es el flujo recomendado para desarrollar en local:

```bash
corepack pnpm docker:dev:up
```

Luego abre:

```text
http://localhost:3000/login
```

Si la base local esta vacia, este modo carga automaticamente los datos demo una sola vez al arrancar.

Este modo queda aislado del deploy:

- `app-dev` siempre usa PostgreSQL local en `db:5432`
- no reutiliza `DATABASE_URL`, `DIRECT_URL` ni `SUPABASE_*` del `.env` de Dockploy
- al recrear el contenedor se regenera `.next`, evitando que queden assets viejos pegados
- los cambios en `src/` se reflejan por hot reload
- si la base esta vacia, crea los usuarios y registros demo del seed local sin tocar entornos remotos
- si no hay un Supabase real configurado para desarrollo, las fotos se guardan localmente en `public/uploads/` sin afectar Dockploy

Comandos utiles:

- `corepack pnpm docker:dev:up`
- `corepack pnpm docker:dev:down`
- `corepack pnpm docker:dev:logs`
- `corepack pnpm docker:dev:db:push`
- `corepack pnpm docker:dev:seed`
- `corepack pnpm docker:dev:reset`

Si cambias a una rama que modifica Prisma o datos base, corre despues:

```bash
corepack pnpm docker:dev:db:push
corepack pnpm docker:dev:seed
```

Si algo queda raro con caches o dependencias, usa:

```bash
corepack pnpm docker:dev:reset
corepack pnpm docker:dev:up
```

### Modo local fuera de Docker

Si quieres correr Next directamente en tu maquina:

1. Copia [`.env.local.example`](/C:/Users/nacho/OneDrive/Escritorio/MecaniaOS/MecaniaOS/.env.local.example) a `.env.local`
2. Levanta la base local:

```bash
corepack pnpm docker:db:up
```

3. Instala dependencias y sincroniza Prisma:

```bash
corepack pnpm install
corepack pnpm db:generate
corepack pnpm db:push
corepack pnpm db:seed
```

4. Inicia la app:

```bash
corepack pnpm dev
```

### Imagen de produccion local

Para validar una build cerrada parecida al deploy, pero usando recursos locales seguros:

```bash
corepack pnpm docker:app:up
```

Para apagarla:

```bash
corepack pnpm docker:app:down
```

### Solo base de datos local

- `corepack pnpm docker:db:up`
- `corepack pnpm docker:db:down`
- `corepack pnpm docker:db:logs`

## Supabase

La fuente de verdad de base de datos para deploy es Supabase.

Migraciones versionadas:

- [supabase/migrations/20260428180241_remote_schema.sql](/C:/Users/nacho/OneDrive/Escritorio/MecaniaOS/MecaniaOS/supabase/migrations/20260428180241_remote_schema.sql)
- [supabase/migrations/20260428194000_budget_inventory_alignment.sql](/C:/Users/nacho/OneDrive/Escritorio/MecaniaOS/MecaniaOS/supabase/migrations/20260428194000_budget_inventory_alignment.sql)

Para aplicar cambios del repo al proyecto enlazado:

```bash
npx supabase db push --linked
```

## Dockploy

Deje listo [docker-compose.dockploy.yml](/C:/Users/nacho/OneDrive/Escritorio/MecaniaOS/MecaniaOS/docker-compose.dockploy.yml) para desplegar en Dockploy sin mezclar configuracion de desarrollo local.

Flujo recomendado:

1. En Dockploy crear el servicio usando `docker-compose.dockploy.yml`.
2. Cargar las variables de [`.env.example`](/C:/Users/nacho/OneDrive/Escritorio/MecaniaOS/MecaniaOS/.env.example).
3. Confirmar que `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y los buckets esten configurados.
4. Si es el primer deploy, dejar `BOOTSTRAP_ADMIN_*` cargado para crear el acceso inicial.
5. Desplegar.

Notas:

- `docker-compose.dockploy.yml` sigue leyendo `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_*` y `APP_URL` reales del entorno de Dockploy.
- En Dockploy el contenedor sincroniza Prisma con `pnpm db:push` antes de iniciar la app, para que los cambios de schema del branch queden aplicados al desplegar.
- El deploy no ejecuta `db:seed`, por lo que los datos demo locales nunca se mezclan con produccion. Solo se puede crear o reactivar el admin inicial mediante `BOOTSTRAP_ADMIN_*`.
- Los cambios hechos para `docker compose --profile dev` no alteran ese flujo.

Comandos utiles para simular el deploy en local:

```bash
corepack pnpm docker:prod:up
corepack pnpm docker:prod:down
```

## Datos iniciales

`pnpm db:seed` carga catalogos y registros base para desarrollo local.
`pnpm db:seed:if-empty` hace lo mismo solo cuando la base aun no tiene usuarios.

## Scripts

- `pnpm dev`
- `pnpm build`
- `pnpm start`
- `pnpm start:prod`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm db:generate`
- `pnpm db:push`
- `pnpm db:migrate`
- `pnpm db:seed`
- `pnpm db:seed:if-empty`
- `pnpm db:bootstrap`
- `pnpm studio`
- `pnpm docker:db:up`
- `pnpm docker:db:down`
- `pnpm docker:db:logs`
- `pnpm docker:dev:up`
- `pnpm docker:dev:down`
- `pnpm docker:dev:logs`
- `pnpm docker:dev:db:push`
- `pnpm docker:dev:seed`
- `pnpm docker:dev:reset`
- `pnpm docker:app:up`
- `pnpm docker:app:down`
- `pnpm docker:prod:up`
- `pnpm docker:prod:down`

## Endpoints base

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/clients`
- `POST /api/clients`
- `GET /api/clients/:id`
- `PATCH /api/clients/:id`
- `GET /api/vehicles`
- `POST /api/vehicles`
- `GET /api/vehicles/:id`
- `PATCH /api/vehicles/:id`
- `GET /api/vehicles/search?vin=...&plate=...`
- `GET /api/vehicles/:id/history`
- `GET /api/vehicles/history/search?vin=...`
- `GET /api/work-orders`
- `POST /api/work-orders`
- `GET /api/work-orders/:id`
- `PATCH /api/work-orders/:id`
- `PATCH /api/work-orders/:id/status`

## Siguiente fase sugerida

- Inventario basico
- Cotizaciones
- Evidencias fotograficas
- Portal cliente
