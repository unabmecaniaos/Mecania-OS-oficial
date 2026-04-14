# Modulo Self Inspection

## Diseno funcional final

El modulo `self-inspection` agrega una recepcion digital previa al taller con dos entradas:

- `enlace seguro`: crea un borrador accesible por token hash y expiracion.
- `superficie interna`: staff del taller puede listar, revisar, calificar riesgo y dejar sugerencias operativas.

El flujo de cliente es wizard multipaso:

1. Inicio y disclaimer.
2. Identificacion del vehiculo.
3. Motivo de inspeccion.
4. Estado general por bloques tecnicos.
5. Danos y siniestros.
6. Historial y mantenciones previas.
7. Evidencia fotografica.
8. Observaciones libres.
9. Resumen final y declaracion.
10. Confirmacion de envio.

## Arquitectura tecnica

### Backend

- `prisma/schema.prisma`
  - agregado `SelfInspection` y tablas satelite.
- `src/modules/self-inspections/`
  - `self-inspection.constants.ts`
  - `self-inspection.schemas.ts`
  - `self-inspection.repository.ts`
  - `self-inspection.service.ts`
  - `self-inspection.storage.ts`
- `src/app/api/self-inspections/`
  - endpoints internos protegidos.
- `src/app/api/self-inspections/public/[token]/`
  - endpoints publicos por token para wizard y fotos.

### Frontend

- `src/components/self-inspections/`
  - badges de estado y riesgo.
  - barra de progreso.
  - wrapper de preguntas.
  - selectores Si/No y opciones.
  - slot de foto con preview y reemplazo.
- `src/app/self-inspections/start/[token]/`
  - pagina publica del wizard.
- `src/app/(protected)/self-inspections/`
  - listado interno.
  - detalle interno.
  - acciones de enlace, estado y revision.

## Modelo de datos

### Entidades principales

- `SelfInspection`
  - raiz del agregado.
  - guarda estado, riesgo global, motivo, resumen, token seguro y trazabilidad temporal.
- `SelfInspectionVehicleSnapshot`
  - foto fija del vehiculo al momento de responder.
- `SelfInspectionAnswer`
  - respuestas estructuradas por `questionKey`.
- `SelfInspectionPhoto`
  - evidencia fotografica con `photoType`, `storageKey`, `isRequired` y orden.
- `SelfInspectionNote`
  - observaciones de cliente y notas internas.
- `SelfInspectionReview`
  - revision del staff con resumen interno, riesgo final y siguiente paso sugerido.
- `SelfInspectionStatusLog`
  - historial de cambios de estado.

### Estados

- `DRAFT`
- `IN_PROGRESS`
- `SUBMITTED`
- `UNDER_REVIEW`
- `REVIEWED`
- `CONVERTED_TO_WORK_ORDER`
- `CANCELLED`

### Riesgo

- `LOW`
- `MEDIUM`
- `HIGH`
- `CRITICAL`

## Reglas de negocio implementadas

- permite crear inspeccion sin orden de trabajo.
- reutiliza vehiculo existente si pertenece al cliente.
- si el cliente modifica datos, se guarda snapshot independiente.
- no permite cambios publicos despues de `submitted`.
- valida envio final con respuestas obligatorias y fotos obligatorias.
- marca respuestas de alto riesgo por severidad.
- genera resumen automatico y nivel de riesgo preliminar.
- registra log de cambios de estado.

## Endpoints

### Staff

- `GET /api/self-inspections`
- `POST /api/self-inspections`
- `GET /api/self-inspections/[id]`
- `PATCH /api/self-inspections/[id]/status`
- `POST /api/self-inspections/[id]/review`

### Publicos

- `GET /api/self-inspections/public/[token]`
- `PUT /api/self-inspections/public/[token]/vehicle`
- `PUT /api/self-inspections/public/[token]/reason`
- `PUT /api/self-inspections/public/[token]/general`
- `PUT /api/self-inspections/public/[token]/damage`
- `PUT /api/self-inspections/public/[token]/history`
- `PUT /api/self-inspections/public/[token]/notes`
- `POST /api/self-inspections/public/[token]/photos`
- `DELETE /api/self-inspections/public/[token]/photos/[photoId]`
- `POST /api/self-inspections/public/[token]/submit`

## Validaciones

- patente normalizada y validada.
- ano razonable.
- kilometraje no negativo.
- combustible y transmision obligatorios.
- fotos limitadas a JPG, PNG, WEBP, HEIC y 8 MB.
- condiciona campos detalle cuando hay testigos, fugas o diagnostico previo.
- bloqueo de envio si faltan respuestas obligatorias.

## Seeds

El seed agrega:

- una autoinspeccion `in_progress` con enlace seguro activo.
- una autoinspeccion `reviewed` con fotos, revision interna y alertas criticas.

## Integraciones futuras previstas

- asociacion opcional con `WorkOrder`.
- sugerencia de cotizacion y derivacion por area.
- storage encapsulado para migrar a `evidence` o S3.
- `sourceChannel` preparado para `customer portal`, `secure link` y `staff assisted`.
