# Direccion UI MecaniaOS

## Objetivo

MecaniaOS adoptara una direccion visual inspirada en Taller Alpha: una interfaz operativa, oscura, modular y densa en informacion. La meta no es clonar pantallas ni branding, sino trasladar el lenguaje visual que mejor funciona para software de taller:

- superficies oscuras con capas bien separadas
- foco fuerte en flujo operativo y lectura rapida
- acentos azules para navegacion y estados activos
- verde para acciones positivas, cierres y totales
- tarjetas compactas, paneles y sidebars de uso intensivo

## Diferencia con el estado actual

Hoy el sistema usa una base clara estilo SaaS generalista:

- fondo claro
- cards blancas
- contraste suave
- poca densidad operativa

La referencia deseada exige lo contrario:

- fondo principal oscuro
- superficies azul marino/gris
- jerarquia construida por capas y bordes suaves
- componentes compactos y mas informativos

## Principios visuales

1. Operativo antes que decorativo
La interfaz debe parecer una consola de trabajo diario, no una landing corporativa.

2. Densidad legible
Debe entrar mas informacion por pantalla, pero sin colapsar la jerarquia visual.

3. Acciones claras
Las acciones principales deben ser obvias: buscar, crear, avanzar, aprobar, facturar, guardar.

4. Estados visibles
Cada estado del negocio tiene que sentirse distinto por color, badge, columna o bloque.

5. Consistencia sistemica
No se aceptan pantallas aisladas con estilos distintos. Todo nuevo debe salir del mismo set de tokens y patrones.

## Paleta propuesta

Estos colores no son una copia exacta. Son una aproximacion funcional para MecaniaOS.

```css
:root {
  --bg-app: #0b1420;
  --bg-shell: #111c2d;
  --bg-sidebar: #0d1726;
  --surface-1: #162235;
  --surface-2: #1b2a3f;
  --surface-3: #22324a;
  --surface-elevated: #273954;
  --border-soft: rgba(151, 180, 214, 0.14);
  --border-strong: rgba(151, 180, 214, 0.24);
  --text-primary: #edf4ff;
  --text-secondary: #b3c3da;
  --text-muted: #7f93b0;
  --accent-primary: #37a8ff;
  --accent-primary-strong: #238dff;
  --accent-secondary: #4b63ff;
  --success: #23c16b;
  --warning: #d2a72c;
  --danger: #ef4444;
  --info: #4cc3ff;
}
```

## Semantica de color

- `accent-primary`: navegacion activa, CTA principal, filtros activos, foco
- `accent-secondary`: tabs o modulos tecnicos secundarios
- `success`: guardar, confirmar, total monetario, estados completados
- `warning`: trabajos en proceso, alertas blandas
- `danger`: bloqueos, errores, rechazo, estados urgentes
- `info`: indicadores tecnicos y datos auxiliares

## Tipografia

La UI actual usa `Manrope`, que es valida para mantener velocidad. Si no se cambia de inmediato, se puede conservar en la primera fase.

Reglas:

- headings compactos y pesados
- labels y captions en mayusculas ligeras con tracking moderado
- cuerpos cortos, nunca parrafos largos dentro del shell operativo
- prioridad a lectura en tablas, formularios y tableros

## Layout base

### Shell

- fondo principal oscuro
- sidebar izquierda fija y mas compacta
- header superior integrado con breadcrumb, contexto y acciones
- contenido organizado en paneles o grids, no en paginas vacias

### Sidebar

- base oscura casi negra
- iconos o grupos con estados activos en azul
- separacion clara entre navegacion principal y acciones de sesion

### Header

- menos hero y mas contexto
- titulo, subtitulo corto, accion principal, herramientas secundarias
- breadcrumbs discretos arriba o al costado

## Tokens de composicion

- radio base: `14px`
- radio panel: `18px`
- radio chip: `999px`
- alto de input y boton principal: `44px` a `48px`
- sombra principal: suave, profunda, azulada
- blur: sutil; no usar glassmorphism fuerte
- espaciado vertical base: `16px`, `20px`, `24px`

## Patrones de componentes

### Card operativa

- fondo `surface-1` o `surface-2`
- borde suave visible
- sombra baja
- titulo corto
- metadata secundaria en texto tenue

### Boton principal

- azul brillante
- texto claro
- hover mas saturado
- usarlo una sola vez por bloque para mantener jerarquia

### Boton secundario

- fondo oscuro elevado
- borde visible
- hover con ligera subida de brillo

### Inputs y selects

- fondos oscuros elevados
- borde suave permanente
- foco azul
- placeholders visibles, no lavados

### Tabs

- apariencia de segmento o pildora compacta
- activo con azul o secundario intenso
- inactivo integrado al panel

### Badges

- compactos
- una sola semantica por color
- no mezclar colores arbitrariamente

### Tablas y listas

- filas con separacion por bordes o contraste de superficie
- cabeceras discretas
- acciones por fila solo cuando agregan valor

## Patrones de pagina

### Dashboard

- metricas en tarjetas compactas
- panel principal de actividad
- bloque lateral de alertas o foco del dia
- evitar grandes vacios blancos

### Listados

- header con titulo, contador y CTA
- barra de filtros persistente
- tarjetas o tabla segun densidad del modulo

### Formularios complejos

- dividir en pasos o paneles
- siempre mostrar progreso, resumen o contexto del vehiculo/cliente
- acciones finales pegadas al borde inferior o al bloque lateral

### Flujos tipo taller

- idealmente usar patron de sidebar de pasos + area central + panel derecho resumen/servicios cuando aplique

## Anti patrones a evitar

- fondos blancos o gris claro dentro del shell principal
- cards demasiado blandas estilo dashboard financiero generico
- un solo azul para todo sin semantica
- sombras grandes estilo marketing
- formularios sueltos sin contexto del vehiculo o cliente
- botones primarios repetidos en la misma linea
- interfaces con demasiado aire para tareas operativas

## Orden de implementacion recomendado

1. Rehacer tokens globales y `globals.css`
2. Rehacer shell (`app-shell`, sidebar, header)
3. Rehacer primitives UI (`button`, `card`, `input`, `select`, `textarea`, badges)
4. Migrar dashboard
5. Migrar listados: clientes, vehiculos, ordenes
6. Migrar formularios y wizards
7. Afinar estados vacios, loading, error y mobile

## Checklist de aceptacion visual

- La pantalla se siente parte de una misma familia visual
- Hay una accion principal claramente dominante
- El contraste es suficiente en textos, bordes y foco
- Los estados del negocio son distinguibles
- La densidad mejora la operacion en lugar de empeorarla
- No hay componentes claros heredados rompiendo el shell oscuro
- Mobile y desktop mantienen la misma direccion visual

## Regla de referencia

Se puede usar Taller Alpha como referencia de:

- estructura
- jerarquia
- paleta
- densidad
- tipo de paneles

No se debe copiar:

- logotipos
- marca
- textos
- assets
- iconografia propietaria
- layouts 1:1 cuando no correspondan al flujo real de MecaniaOS
