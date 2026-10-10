# Filotaxia — Design System

> Blanco, negro y grises piedra. Mucho aire, títulos en regular, eyebrows chicos en mayúsculas. Una ficha de museo que suena.

Fuente: los wireframes "Filotaxia App" (01 Splash · 02 Escaneo QR · 03 Ficha · 06 Reproductor · 07 Mi Colección · 08 Perfil → Ajustes). Registro y Login se sacaron: escanear alcanza. La estructura de navegación es la de Pulso.

## Principios

1. **Monocromo + un acento.** Blanco de fondo, negro para texto y acciones, grises piedra (con un toque cálido) para todo lo demás. En oscuro se invierte: fondo casi negro, texto blanco cálido. Un solo acento, **verde lima musgo** (`--color-accent-fill`, `#dbe56f`), en un único bloque por pantalla: el cuidado que viene en Mi terrario (como el amarillo de la referencia de energía). Siempre con texto negro; el bloque de acento queda claro también en el tema oscuro.
2. **Una acción por pantalla.** Botón negro en pill, a todo el ancho, al pie de la pantalla; debajo, un link chico subrayado como alternativa.
3. **Títulos en regular, apoyo chico.** Título de 28px en peso 400; bajada de 13px gris; eyebrows de 10px en mayúsculas con tracking amplio (TERRARIO Nº 04).
4. **Líneas finas, sin cajas.** Los campos son un label en mayúsculas sobre una línea; las listas se separan con líneas de 1px. Sin sombras.
5. **La planta como imagen.** Cada terrario se representa con un cuadro gris claro (luz arriba a la izquierda) y un brote dibujado al centro. Mientras suena, el brote se balancea y la luz respira.

## Tema

Claro y oscuro con `light-dark()`: cada alias se declara una vez con sus dos valores. Ajustes → **Apariencia** (Auto · Claro · Oscuro) se guarda en `prefs.theme`; `utils/theme.js` pone `data-theme` en `<html>` (o lo saca en Auto, que sigue al teléfono) y actualiza el color de la barra del navegador. Vistas y componentes usan solo alias, nunca tokens crudos.

## Colores (alias)

| Alias | Claro | Oscuro | Uso |
|---|---|---|---|
| `--color-bg` | `#ffffff` | `#0e0e0d` | Fondo |
| `--color-block-bg` | `#f0f0ec` | `#1a1a18` | Cuadro del QR |
| `--color-text` | `#0a0a0a` | `#f2f2ee` | Texto, íconos, botón principal |
| `--color-text-muted` | `#6b6b66` | `#8f8f88` | Bajadas, subtítulos, eyebrows |
| `--color-text-faint` | `#b4b4ad` | `#4a4a46` | Placeholders |
| `--color-line` | `#e6e6e1` | `#242422` | Entre filas, bordes suaves |
| `--color-track` | `#d9d9d3` | `#2b2b29` | Barra de progreso vacía, switch apagado |
| `--color-art-*` | `#f7f7f4` → `#e4e4df`, planta `#b4b4ad` | `#242422` → `#141413`, planta `#4a4a46` | Ilustración del terrario |
| `--color-inverse-bg` / `-text` | negro / blanco | blanco / negro | Botón principal, play, toast, opción elegida, acciones de los bloques |
| `--color-accent-fill` | `#dbe56f` | `#dbe56f` | Relleno del bloque de acento (Riego) |
| `--color-meter-soft` | `#e6e6e1` | `#242422` | Relleno de un medidor que no es el acento (Ventilación) |
| `--color-badge-bg` | blanco | fondo | Etiquetas chicas sobre un bloque |

## Tipografía

**Inter**, pesos 400 y 500.

| Token | Tamaño | Uso |
|---|---|---|
| `--font-2xs-*` | 10/12, tracking 1.2px, mayúsculas | Eyebrows, labels de campos |
| `--font-xs-*` | 11/14 | Nav, tiempos del reproductor |
| `--font-sm-*` | 13/18 | Bajadas, botones, links |
| `--font-base-*` | 15/22 | Filas de Ajustes, texto corrido |
| `--font-lg-*` | 17/22 | Título del escaneo |
| `--font-xl-*` | 28/32 (32 desde 768) | Títulos de pantalla |
| `--font-2xl-*` | 32/36 (40 desde 768) | Nombre en el reproductor |
| `--font-brand-*` | 32/36, tracking 5px, mayúsculas | FILOTAXIA en el splash |
| `--num-md-*` | 40/44, tracking -1.6 | Valor de un bloque ("22°.", "En 3 días.") |
| `--num-xl-*` | 136/124, tracking -8 | Número protagonista de Mi terrario ("84%") |

## Espacio y forma

- **Spacing** (base 8): `2xs` 2 · `xs` 4 · `sm` 8 · `md` 12 · `lg` 16 · `xl` 24 · `2xl` 32 · `3xl` 40 · `4xl` 56 · `5xl` 80.
- **Radius:** `sm` 6 (ilustraciones, chips, etiquetas) · `block` 18 (bloques de Mi terrario) · `lg` 20 (hojas modales) · `full` (botones, play, barra).
- **Layout:** columna de 720px · gutter 24 → 32 (≥768) · botón principal 52 de alto · play 64 · área tocable mínima 44.

## Navegación (de Pulso)

Barra **flotante de vidrio**: cápsula redondeada de 64px, centrada (máx. 320px), separada de los bordes, con desenfoque. **Mi terrario · Colección · [Escanear] · Escuchar · Ajustes** (como Pulso: cinco secciones con la principal al centro). Escanear es un círculo negro de 28px al centro. La sección activa lleva una pill de fondo (8% del texto). En desktop (≥1024) la barra pasa a un riel vertical a la izquierda.

La barra está en todas las pantallas menos el splash.

El header grande (título + subtítulo) solo está en Colección y Ajustes. Mi terrario tiene su propio encabezado de dos líneas. Las demás pantallas tienen su propio título y, si hace falta, un link chico de volver ("← Colección").

## Componentes

| Componente | Archivos | Notas |
|---|---|---|
| Button | `components/button/` | `--primary` (negro, 52 de alto), `--ghost` (borde fino), `--icon` (círculo de 44 sin borde), `--block`. |
| Field | `components/field/` | Solo CSS (lo usa `imprimir-qr.html`): label en mayúsculas + input sin caja sobre una línea. |
| Terrarium art | `components/terrarium-art/` | Cuadro con degradé radial y el brote. `size: "sm"` para la grilla, `live` mientras suena. |
| List row | `components/list-row/` | Filas de 56 separadas por líneas, flecha a la derecha que se corre al hover. `--muted` para una acción secundaria. |
| Segmented | `components/segmented/` | Pill con borde fino y radios nativos; la opción elegida, inversa. Apariencia en Ajustes. |
| Switch | `components/switch/` | Checkbox nativo con `role="switch"`; negro prendido. |
| Sheet | `components/sheet/` | Hoja modal sobre `<dialog>` que sube desde abajo; centrada en desktop. |
| Toast | `components/toast/` | Pill negra con `aria-live`. |
| Chip | `components/chip/` | Pill chica de contexto con fondo de bloque ("Ideal 70–90%"). |
| Header | `layout/header/` | Título 28 + subtítulo gris. |
| Bottom nav | `layout/bottom-nav/` | Ver "Navegación". |

## Pantallas

- **Inicio:** FILOTAXIA + "Armonía en Plantas" al centro; sigue sola.
- **Mi terrario** (referencia "Status." de una app de energía): "Las Flechas." en negro y la frase de estado en gris debajo ("Todo en equilibrio."), miniatura del terrario arriba a la derecha (lleva a la ficha); aire; humedad del aire gigante (`--num-xl`) con triángulo de tendencia; chips (Humedad del aire · Ideal · Ayer); grilla de bloques de 2 columnas con 8px de aire: **Riego.** a todo el ancho con el relleno de acento (lo que queda del ciclo) y la pill "Regué hoy" · **Luz.** | **Temperatura.** · **Ventilación.** a todo el ancho con medidor suave y "Ventilé hoy" · **Sonido.** (link al reproductor) | **Con vos.** Títulos de bloque con punto; etiqueta blanca arriba a la derecha (debajo del título en los de media columna); valor grande abajo. En ecosistemas abiertos no hay Ventilación; si el terrario tiene plantas cargadas aparece **Plantas.** (lista numerada 01 / 02 / 03, etiqueta "Ecosistema abierto"). Después **Cuidados.**: preguntas frecuentes que se abren (filas con línea fina y un + que gira a ×). Al pie, "¿No es este? Cambiar terrario" (hoja para elegir).
- **Escanear:** título centrado arriba, visor de 200px con esquinas negras y una línea que barre, ayuda debajo, "Simular escaneo →" al pie.
- **Terrario:** foto (o ilustración) a todo el ancho, eyebrow, nombre, historia; si tiene ficha técnica, **Especificaciones** (eyebrow + filas con línea fina: etiqueta gris a la izquierda, dato a la derecha: Modelo, Ecosistema, Recipiente, Medidas, Planta 01…); abrirla suma el terrario a la colección (aviso la primera vez). Botón "Escuchar" + link "Ir a mi colección".
- **Escuchar:** "← Colección", ilustración (76% del ancho), eyebrow, nombre grande, "Grabado el … · 3:42", barra fina con tiempos, −15 · play · +15.
- **Colección:** todos los terrarios escaneados, en grilla de 2 columnas (3 desde 640): ilustración, "Nº 04" (· Tuyo en el propio) y nombre.
- **Ajustes:** lista Mis terrarios · Apariencia (segmentado Auto / Claro / Oscuro) · Notificaciones · Ayuda (hoja: "¿Cómo funciona?" en pasos 01/ 02/ 03/ + preguntas frecuentes).
