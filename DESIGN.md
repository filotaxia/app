# Filotaxia — Design System

> Blanco, negro y grises neutros, como filotaxia.com. Mucho aire, títulos en regular, eyebrows chicos en mayúsculas. Una ficha de museo que suena.

Fuente: los wireframes "Filotaxia App" (01 Splash · 02 Escaneo QR · 03 Ficha · 06 Reproductor · 07 Mi Colección · 08 Perfil → Ajustes). Registro y Login se sacaron: escanear alcanza. La estructura de navegación es la de Pulso.

## Principios

1. **Blanco y negro, nada más.** La paleta es la de filotaxia.com: blanco de fondo, negro para texto y acciones, y su escala de grises neutros (`#fafafa` → `#0a0a0a`) para todo lo demás. **Sin color de acento**, ni verde ni ningún otro: lo único con color son las fotos (terrarios, plantas, hojas). En oscuro se invierte: fondo `#0a0a0a`, texto `#fafafa`.
2. **Una acción por pantalla.** Botón negro **rectangular, sin redondear** (como en filotaxia.com), a todo el ancho, al pie de la pantalla; debajo, un link de texto como alternativa, con el estilo del botón terciario de filotaxia.com: texto regular de 15px, flecha separada a la derecha y una línea fina debajo de todo el ancho (`.text-link`). Las flechas son siempre el carácter "→" / "←" de la tipografía (`arrow()` en `utils/icons.js`), nunca un ícono: **la web manda**.
3. **Títulos en regular, apoyo chico.** Título de 28px en peso 400; bajada de 13px gris; eyebrows de 10px en mayúsculas con tracking amplio (TERRARIO Nº 04).
4. **Líneas finas, sin cajas.** Los campos son un label en mayúsculas sobre una línea; las listas se separan con líneas de 1px. Sin sombras.
5. **La planta como imagen.** Cada terrario se representa con un cuadro gris claro (luz arriba a la izquierda) y un brote dibujado al centro. Mientras suena, el brote se balancea y la luz respira.

## Tema

Claro y oscuro con `light-dark()`: cada alias se declara una vez con sus dos valores. Ajustes → **Apariencia** (Auto · Claro · Oscuro) se guarda en `prefs.theme`; **Claro es el default** (y `index.html` arranca en claro, sin destello oscuro); `utils/theme.js` pone `data-theme` en `<html>` (o lo saca en Auto, que sigue al teléfono) y actualiza el color de la barra del navegador. Vistas y componentes usan solo alias, nunca tokens crudos.

## Colores (alias)

| Alias | Claro | Oscuro | Uso |
|---|---|---|---|
| `--color-bg` | `#ffffff` | `#0a0a0a` | Fondo |
| `--color-block-bg` | `#f5f5f5` | `#171717` | Bloques, cuadro del QR |
| `--color-text` | `#0a0a0a` | `#fafafa` | Texto, íconos, botón principal |
| `--color-text-muted` | `#737373` | `#a3a3a3` | Bajadas, subtítulos, eyebrows |
| `--color-text-faint` | `#a3a3a3` | `#404040` | Placeholders |
| `--color-line` | `#e5e5e5` | `#262626` | Entre filas, bordes suaves |
| `--color-track` | `#d4d4d4` | `#404040` | Barra de progreso vacía, switch apagado |
| `--color-art-*` | `#fafafa` → `#e5e5e5`, planta `#a3a3a3` | `#262626` → `#171717`, planta `#404040` | Ilustración del terrario |
| `--color-inverse-bg` / `-text` | negro / blanco | blanco / negro | Botón principal, play, toast, opción elegida, acciones de los bloques |
| `--color-meter-soft` | `#e5e5e5` | `#262626` | Relleno del medidor de Ventilación |
| `--color-badge-bg` | blanco | fondo | Etiquetas chicas sobre un bloque |

## Marca

De filotaxia.com (`src/assets/images/marca/`): el **isotipo** (dos hojas) y el **logotipo** (FILOTAXIA con la A sin travesaño). Son PNG negros con transparencia que se usan como `mask-image` con fondo `--color-text`, así siguen al tema. Están en el splash; el isotipo también es el ícono de la app (negro sobre `#f5f5f5`).

Las **ondas** (`icon("wave-sine")`, `wave-triangle`, `wave-square`, `wave-sawtooth`) redibujan los íconos de osciladores del sitio en SVG de línea, como los de Lucide. Cada forma de hoja suena con una onda (ver `content/plantas.js`).

## Tipografía

**PP Neue Montreal**, la misma de filotaxia.com, en archivos locales (`src/assets/fonts/`, `styles/base/fonts.css`). Como en la web, todo usa el corte **Medium** (400 y 500 apuntan al mismo archivo): la jerarquía la dan el tamaño, el gris y las mayúsculas, no el peso. Es de uso personal libre: para publicar la app hace falta la licencia de app/web de Pangram Pangram.

| Token | Tamaño | Uso |
|---|---|---|
| `--font-2xs-*` | 10/12, tracking 1.2px, mayúsculas | Eyebrows, labels de campos |
| `--font-xs-*` | 11/14, tracking 0 | Nav, tiempos del reproductor |
| `--font-sm-*` | 13/18 | Bajadas, botones, links |
| `--font-base-*` | 15/22 | Filas de Ajustes, texto corrido |
| `--font-lg-*` | 17/22 | Título del escaneo |
| `--font-xl-*` | 28/32 (32 desde 768) | Títulos de pantalla |
| `--font-2xl-*` | 32/36 (40 desde 768) | Nombre en el reproductor |
| `--font-brand-*` | 32/36, tracking 5px, mayúsculas | FILOTAXIA en el splash |
| `--num-md-*` | 40/44, tracking -1.6 (las cifras -6) | Valor de un bloque ("22°.", "3 días.") |
| `--num-lg-*` | 72/72, tracking -3 | Porcentaje del recorrido (Filotaxia): "60%" |
| `--num-xl-*` | 96/88, tracking -5 | Número protagonista de Mi terrario ("TR01") |

## Espacio y forma

- **Spacing** (base 8): `2xs` 2 · `xs` 4 · `sm` 8 · `md` 12 · `lg` 16 · `xl` 24 · `2xl` 32 · `3xl` 40 · `4xl` 56 · `5xl` 80.
- **Radius:** **ninguno.** Todo es cuadrado, como en filotaxia.com: botones, bloques, hojas modales, chips, barra de navegación, interruptor y fotos. Los tokens `--radius-*` existen pero valen 0 (`tokens-radius.css`). Excepciones: son círculos el punto de Ajustes (`components/settings-link`), los dos puntos de vista del Manifiesto, los puntos y el círculo "Ver" de Filotaxia, el play y el punto de la barra de progreso del reproductor, y la barra de navegación tiene un redondeo suave (16px la barra, 12px el fondo de la sección activa).
- **Layout:** columna de 720px · gutter 16 → 24 (≥768) · botón principal 52 de alto · play 64 · área tocable mínima 44.

## Navegación (de Pulso)

Barra **flotante de vidrio**: 64px de alto con redondeo suave (16px), centrada (máx. 360px), separada de los bordes, con desenfoque. **Inicio · Terrarios · Manifiesto · Filotaxia** (estructura de Pulso; Inicio es la pantalla del terrario propio, `#/mi-terrario`). Las cuatro iguales (ícono de línea + label; Inicio lleva un terrario dibujado con el mismo trazo —la pecera redonda con sustrato y un brote— y Filotaxia el isotipo de la marca); ninguna lleva fondo negro. La sección activa lleva un fondo (8% del texto). En desktop (≥1024) la barra pasa a un riel vertical a la izquierda.

Lo que ya no está en la barra:
- **Escanear:** el QR chico arriba a la derecha del bloque Pieza de Mi terrario (y "Escanear QR" cuando todavía no hay terrario).
- **Escuchar:** el reproductor se abre tocando el bloque Pieza, "Escuchar" o un terrario de Terrarios.
- **Ajustes:** el punto de arriba a la derecha (`components/settings-link`, el círculo de 15px del nav de filotaxia.com), como el avatar de Perfil en Pulso: en el header y en las pantallas con encabezado propio (Mi terrario, ficha, reproductor, Escanear).

La barra está en todas las pantallas menos el splash y el Manifiesto del primer escaneo (onboarding, pantalla completa). Abierto desde la barra, el Manifiesto la mantiene.

El header grande (título + subtítulo + el punto de Ajustes) está en Terrarios, Filotaxia, Cuidados, Bitácora y Ajustes (este con flecha de volver a la pantalla de la que se vino). Inicio tiene su propio encabezado de dos líneas. Las demás pantallas tienen su propio título y, si hace falta, un link chico de volver ("← Inicio").

## Componentes

| Componente | Archivos | Notas |
|---|---|---|
| Button | `components/button/` | `--primary` (negro, rectangular, 52 de alto), `--ghost` (borde fino), `--icon` (área de 44 sin fondo ni borde), `--block`. |
| Field | `components/field/` | Solo CSS (lo usa `imprimir-qr.html`): label en mayúsculas + input sin caja sobre una línea. |
| Terrarium art | `components/terrarium-art/` | Cuadro con degradé radial y el brote. `size: "sm"` para la grilla, `live` mientras suena. |
| List row | `components/list-row/` | Filas de 56 separadas por líneas, flecha a la derecha que se corre al hover. `--muted` para una acción secundaria. |
| Segmented | `components/segmented/` | Rectángulo con borde fino y radios nativos; la opción elegida, inversa. Apariencia en Ajustes. |
| Block | `components/block/` | El bloque de dato de la referencia "Status.": fondo gris, título con punto, etiqueta blanca, ícono y valor grande (`--num-md`). Media columna o `full`; con medidor, acción o link. Mi terrario y Cuidados. |
| Plants block | `components/plants-block/` | Bloque "Plantas." con el botón negro "Ondas" que cambia hojas por ondas. |
| Settings link | `components/settings-link/` | El punto de arriba a la derecha (círculo de 15px del color del texto, 44px tocables): abre Ajustes. |
| Switch | `components/switch/` | Checkbox nativo con `role="switch"`; negro prendido. |
| Sheet | `components/sheet/` | Hoja modal sobre `<dialog>` que sube desde abajo; centrada en desktop. |
| Toast | `components/toast/` | Rectángulo negro con `aria-live`. |
| Leaf waves | `components/leaf-waves/` | Grilla 2×2 hoja → onda con los íconos de osciladores de filotaxia.com (PNG como máscara, `src/assets/images/ondas/`). Nombre arriba a la izquierda, dibujo centrado. Sin parámetros, las cuatro iguales; `flip: true` arma tarjetas de dos caras (Manifiesto): al frente la onda en negro (color inverso), al dorso la tarjeta clara con la foto de la hoja (`src/assets/images/hojas/`, las de filotaxia.com/musica); giran escalonadas cuando cambia la vista, y arriba a la derecha de la grilla hay dos puntos de 8px (ondas · hojas) para elegirla (`bindLeafWaves`); con `active: ["puntiaguda"]`, esa en negro sólido y el resto al 40% (para la ficha). |
| Chip | `components/chip/` | Etiqueta chica de contexto con fondo de bloque ("Ideal 70–90%"). |
| Header | `layout/header/` | Título 28 + subtítulo gris. |
| Bottom nav | `layout/bottom-nav/` | Ver "Navegación". |

## Pantallas

- **Inicio:** isotipo + logotipo + "Armonía en Plantas" al centro; sigue sola.
- **Inicio** (`#/mi-terrario`, antes "Mi terrario"; referencia "Status." de una app de energía): "Filotaxia." en negro y "Armonía en plantas." en gris debajo, arriba a la derecha el punto que abre Ajustes; aire; **el nombre del terrario** de protagonista, en gigante (`--num-xl`, "TR01"), debajo un chip (Grabado …) y "▶ Escuchar" a la derecha (lleva al reproductor); grilla de bloques de 2 columnas con 8px de aire: **la foto del terrario** a todo el ancho (4:3, lleva a la ficha) · **Bitácora.** ("3 notas", etiqueta "Última: hoy"; lleva a la Bitácora) | **Pieza.** (la duración de la pieza, "4:11"; todo el bloque lleva al reproductor y, arriba a la derecha, el QR chico abre Escanear) · **Ventilación.** a todo el ancho con medidor suave y "Ventilé hoy" · (**Plantas.**) · **Cuidados.** a todo el ancho ("N preguntas", "Cómo cuidarlo." y →; lleva a la subpágina Cuidados). Títulos de bloque con punto; etiqueta blanca arriba a la derecha (debajo del título en los de media columna); valor grande abajo (los números sin punto final: "27 días", "4:11"). En ecosistemas abiertos no hay Ventilación; si el terrario tiene plantas cargadas aparece **Plantas.** (lista numerada 01/ 02/ 03/ con foto de cada planta vista de arriba y, debajo del nombre, la forma de su hoja; arriba a la derecha el botón negro "Ondas" (sin ícono, del tamaño de "Escuchar"), que cambia el título a "Ondas.", pasa a decir "Plantas" para volver y muestra en cada fila el dibujo de su onda en lugar de la foto, y su onda en lugar de la hoja).
- **Cuidados** (`#/mi-terrario/cuidados`, subpágina de Mi terrario): header grande "Cuidados" con el nombre del terrario de subtítulo y flecha que vuelve a Mi terrario; el bloque **Riego.** a todo el ancho (cuándo toca); **Guía** (eyebrow + Riego · Luz · Sustrato en filas 01/ 02/ 03/ con línea fina, la misma para todos los terrarios) y **Preguntas frecuentes** que se abren (un + que gira a ×). La barra sigue marcando Mi terrario.
- **Escanear:** el punto de Ajustes arriba a la derecha, título centrado, visor de 200px con esquinas negras y una línea que barre, ayuda debajo, "Simular escaneo →" al pie.
- **Terrario:** el punto de Ajustes arriba a la derecha, foto (o ilustración) a todo el ancho, eyebrow, nombre, historia; si tiene ficha técnica, **Especificaciones** (eyebrow + filas con línea fina: etiqueta gris a la izquierda, dato a la derecha: Modelo, Ecosistema, Recipiente, Medidas, Planta 01…); abrirla suma el terrario a la colección (aviso la primera vez). Botón "Escuchar" + links "Ver sus cuidados" / "Ir a mis terrarios" y "Ver su bitácora".
- **Escuchar:** "← Inicio" (o "← Terrarios", según de dónde se venga) y el punto de Ajustes arriba, ilustración (76% del ancho), eyebrow, nombre grande, "Grabado el … · 3:42", chips con las ondas de la pieza (ícono + nombre), barra fina con tiempos, −15 · play · +15.
- **Bitácora** (`#/bitacora/04`, una por terrario): header grande "Bitácora" con "TR01 · Sustrato Base" de subtítulo y flecha de volver; botón negro "+ Nueva entrada" y las entradas, la más nueva arriba: fecha (eyebrow) y "Borrar" chico, la nota y la foto (4:3), separadas por líneas finas. "Nueva entrada" abre una hoja: la fecha de hoy, la nota (campo de línea, varias líneas; obligatoria, el error se dice con palabras), "Sumar una foto" (botón con borde; muestra la foto y "Quitar la foto") y "Guardar".
- **Terrarios** (`#/coleccion`; antes "Mi Colección"): todos los terrarios de Filotaxia (TR01 a TR06, como la página Terrarios de filotaxia.com), en grilla de 2 columnas (3 desde 640): foto, "TR04" (· Tuyo en el propio, · Escaneado en los ya escaneados) y nombre; de subtítulo, cuántos se escanearon. Cada uno abre su reproductor, aunque no se haya escaneado.
- **Manifiesto** (solo, una vez, tras el primer escaneo, sin barra; y desde la barra, con la barra abajo): arriba cinco líneas finas de progreso, "01 / 05" y "Saltar" ("Cerrar" desde la barra); en el medio una pantalla por vez, con el contenido **centrado**, salvo la 1, que apoya la cita **abajo a la izquierda** como las cards de citas de filotaxia.com (una cita del Manifiesto de filotaxia.com, distinta cada vez que se abre, en 32/36 con libro y autor debajo · el mecanismo paso a paso · "Cada planta. Su propia onda." (en dos líneas) arriba a la izquierda y las cuatro tarjetas abajo (cuadradas, sin esquinas redondeadas): primero las ondas en negro ("onda / Triangular") y, a los 3 s, giran a sus hojas ("hoja / Puntiaguda"), con la etiqueta chica en minúscula como en filotaxia.com/musica; arriba a la derecha de la grilla, dos puntos (ondas · hojas) para cambiar la vista a mano (al tocarlos deja de girar sola) · la huella de tu pieza (sus notas reales en un piano roll que un cabezal recorre, "Esta pieza nació de esta planta, en este momento exacto." y NOMBRE · fecha de grabación) · "Esto es lo que estás por escuchar."); abajo a la izquierda, en las cinco, "Siguiente →" o, en la última, el botón negro "Escuchar mi terrario" (lleva al reproductor del terrario recién escaneado) o, desde la barra, "Volver al inicio". El contenido de cada pantalla entra con fade la primera vez que se ve.
  - **Mecanismo:** línea de tiempo 01 / 02 / 03 (número + línea fina que crece hasta el paso siguiente) y un gráfico de línea por paso, que entran despacio, uno cada 1,5 s (`--beat` en `manifiesto.css`): el brote y su señal que se dibuja · el sensor que late y las lecturas que suben una a una · las mismas lecturas como notas de un piano roll, con un cabezal que pasa. SVG en `currentColor`, solo CSS; con "menos movimiento" aparece todo de una.
- **Ajustes** (desde el punto de arriba a la derecha; flecha de volver): lista Apariencia (segmentado Auto / Claro / Oscuro) · Notificaciones · Contacto (hoja: mail e Instagram).
- **Filotaxia** (`#/filotaxia`, sección de la barra; referencia: una lista de tareas del día): header "Filotaxia" con "La experiencia, paso a paso"; card gris **Tu recorrido** ("Tu recorrido en Filotaxia" chico y gris, "3/5 completados" a la derecha, el porcentaje en `--num-lg` y cinco puntos de 18px que se llenan de izquierda a derecha); debajo, una fila gris por paso, separadas por 2px: chips blancos chicos ("✓ Hecho" en inverso, "Paso 01"), título de 28px, una línea gris y a la derecha el círculo negro **"Ver"** (64px; claro con ✓ si el paso está hecho, y el título atenuado). "Ver" abre una hoja con el video tutorial del paso (16:9; sin video, un recuadro "Video en preparación"), el texto completo y el botón negro para hacerlo ("Escanear el QR", "Escuchar mi terrario", "Ver sus cuidados", "Abrir la bitácora"; en el paso 01, "Ya lo ubiqué", que lo marca hecho). Debajo, "Para saber más": De la planta a la música (tres etapas), Las cuatro capas, Preguntas frecuentes y "Ver el Manifiesto →".
