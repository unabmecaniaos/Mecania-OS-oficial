# Plan de implementacion

## Objetivo

Llevar MecaniaOS desde la base operativa actual hacia el producto definido en el PRD: una plataforma web responsive para la gestion de taller con trazabilidad operativa, portal cliente, soporte para aseguradoras y autoinspeccion remota.

## Estado base ya implementado

- autenticacion con sesiones seguras.
- usuarios internos `ADMIN` y `MECHANIC`.
- dashboard operativo basico.
- CRUD de clientes.
- CRUD de vehiculos.
- busqueda por VIN y patente.
- ordenes de trabajo con responsable actual.
- historial de cambios de estado en OT.
- evidencia fotografica en OT.
- historial tecnico por vehiculo y VIN.
- autoinspeccion remota por enlace seguro con revision interna.

## Brechas principales respecto al PRD

- falta el modulo de presupuestos.
- falta la aprobacion formal del presupuesto como hito de negocio.
- no existen tareas dentro de la OT ni progreso calculado automaticamente.
- no existe portal cliente autenticado.
- no existe portal aseguradora ni organizaciones externas.
- no existe sistema de notificaciones por correo.
- los roles actuales todavia no representan supervisor, pintura/desabolladura, cliente ni aseguradora.
- el dashboard aun no muestra los KPIs objetivo.

## Fases propuestas

### Fase 1. Cierre del nucleo operativo

- introducir `Quote` y `QuoteItem`.
- permitir crear presupuesto desde cliente + vehiculo o desde autoinspeccion.
- registrar estados `borrador`, `enviado`, `aprobado`, `rechazado`.
- permitir convertir un presupuesto aprobado en OT.
- restringir el acceso del cliente al portal solo despues de aprobacion.

### Fase 2. Ejecucion de trabajo y progreso

- modelar `WorkOrderTask`.
- calcular avance de forma automatica segun tareas completadas.
- exponer checklist operativo dentro de la OT.
- detectar atraso comparando fecha prometida vs estado de cierre.
- diferenciar evidencia interna y evidencia visible externamente.

### Fase 3. Roles y experiencia externa

- expandir roles a `SUPERVISOR`, `MECHANIC`, `BODY_PAINT`, `CUSTOMER`, `INSURANCE_ADJUSTER`.
- crear portal cliente autenticado.
- mostrar al cliente estado, progreso, evidencia visible e historial.
- modelar `InsuranceCompany` e `InsuranceAdjuster`.
- crear portal aseguradora para seguimiento de casos derivados.

### Fase 4. Comunicaciones y supervision

- enviar correos por cambios relevantes de estado.
- ampliar dashboard con KPIs del PRD.
- agregar filtros por estado, responsable y atraso.
- resaltar ordenes atrasadas y carga por tecnico.

### Fase 5. Cierre operativo y endurecimiento

- revisar consistencia de datos iniciales.
- preparar validacion end-to-end de los flujos criticos.
- asegurar despliegue limpio en `Vercel`.
- documentar configuracion, flujos y criterios operativos.

## Prioridad operativa

### Obligatorio

- presupuestos.
- aprobacion de presupuestos.
- OT derivada de presupuesto aprobado.
- tareas y progreso calculado.
- evidencia con visibilidad.
- portal cliente basico.
- dashboard alineado al flujo.

### Deseable si alcanza el tiempo

- portal aseguradora.
- correos automaticos.
- alertas visuales de atraso.

### Postergable

- reporterias complejas.
- analitica avanzada.
- integraciones externas.
- automatizaciones sofisticadas.

## Criterio de alineacion

La documentacion y el roadmap deben seguir esta regla:

- no presentar como implementado algo que todavia esta solo en el PRD.
- no seguir describiendo MecaniaOS como un sistema de mantenciones generico.
- priorizar el flujo completo del taller por sobre modulos accesorios.
