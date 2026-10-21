# Supabase, QR permanentes y panel de carga — diseño

Fecha: 2026-10-20 · Estado: para aprobar

## Para qué

Hoy los terrarios viven en el código (`src/content/terrarios.js`): para sumar uno hay que editar un archivo y publicar la app. Nicolás va a ir creando terrarios nuevos (TR07, TR08…) y necesita:

1. **Un panel privado** donde cargar cada terrario nuevo cuando lo termina, sin tocar código.
2. **Un QR por terrario, generado desde ese panel**, listo para imprimir y pegar en la base.
3. **Que la app lea los terrarios de una base de datos** (Supabase), así lo que se carga en el panel aparece en la app al instante.

El que escanea el QR abre la pieza de ese terrario y la escucha. Puede ser una persona que se lo llevó a su casa, o mucha gente en una instalación con varios terrarios: el QR se escanea las veces que haga falta, por quien sea.

## Regla número uno: un QR impreso no muere nunca

Una vez pegado, el QR no se cambia. Todo el diseño se apoya en esto:

- **Apunta a un dominio propio**: `https://app.filotaxia.com/t/<código>`. Nunca a la dirección del hosting ni a la de Supabase. Si cambia el hosting, la base o la app, se mueve el subdominio y los QR siguen andando.
- **Subdominio, no carpeta de la web**: así un rediseño de filotaxia.com no puede romper los QR.
- **El código de cada terrario es fijo**: se genera una vez, no se puede editar ni reutilizar (lo impide la base, no solo el panel). Un terrario no se borra: se **retira**, y su QR sigue abriendo algo digno.
- **Un código que no existe nunca muestra un error técnico**: muestra una pantalla de la app ("No encontramos este terrario") con salida a Conectar.
- **El QR físico aguanta**: corrección de errores alta (nivel H, ~30% de daño) y link corto para que el QR sea simple.
- **Condición externa**: `filotaxia.com` con renovación automática. Si vence el dominio, mueren todos los QR.

## Decidido por Nicolás

- Un QR lleva siempre a un único terrario; se escanea muchas veces y por mucha gente.
- Los QR nunca mueren (la regla de arriba).
- Dominio de la marca: `app.filotaxia.com/t/<código>` (propuesta aceptada).
- Supabase como backend (plan gratis), con un panel para cargar y editar los terrarios a medida que se crean.
- **No hay ningún QR impreso ni nadie usando la app todavía**: se arranca limpio. Todos los terrarios reciben su QR definitivo `/t/<código>`.
- **TR01 a TR05 conservan su nombre**; todo lo demás (foto, texto, plantas, cuidados, MIDI…) no es definitivo y se va a editar desde el panel.
- El DNS de `filotaxia.com` y el sitio web están en **Hostinger**; la app está en **GitHub** (`filotaxia/app`) y ahí se queda.

## Decisiones mías (revisables)

- **Código del QR difícil de adivinar**: 6 caracteres en minúscula, sin los que se confunden (`0 o 1 l i`), por ejemplo `k7f2q9`. Es una **disuasión liviana, no un secreto**: el código se puede leer desde la base (la app lo necesita) y eso está bien. Lo que importa es que escribir un número en la barra no conecte terrarios: como no hay nada impreso, los formatos viejos por número (`#/terrario/NN`, `filotaxia:NN`, el número solo) dejan de conectar; un terrario se conecta únicamente por `/t/<código>` o con el escáner (que lee el mismo link). "Simular conexión" queda como herramienta de desarrollo. El código que ve la gente (`TR07`) es otra cosa y sí es correlativo.
- **TR06 no pasa a la base**: entendí que los que quedan son TR01–TR05. Si TR06 sigue, se carga desde el panel como cualquier otro.
- **Hosting de la app: GitHub Pages** (elegido por Nicolás: gratis con el repo público, sin build, se publica desde `main`, todo en GitHub). El DNS sigue en Hostinger: se agrega un registro `CNAME` `app` → `filotaxia.github.io`, y un archivo `CNAME` en el repo. El sitio filotaxia.com sigue en Hostinger sin cambios. La dirección `*.github.io` nunca va en un QR. `npx serve` sigue sirviendo para trabajar en local.
- **Supabase gratis, despierto y con respaldo**: el plan gratis pausa el proyecto tras una semana sin uso. Una tarea programada de GitHub Actions (gratis) corre cada 2 días y hace dos cosas: consulta Supabase (eso lo mantiene despierto) y guarda una copia del catálogo publicado en el repo (`catalogo.json`), que se publica con la app. Así, si Supabase falla, la app igual sabe a qué terrario lleva cada QR y muestra su ficha (las fotos y los MIDI viven en Supabase Storage y podrían no cargar en ese caso). Si un día hay presupuesto, el plan Pro (≈US$25/mes) elimina las pausas.
- **El panel es una página interna de la misma app**: `app.filotaxia.com/admin/`, sin enlace desde la app, como hoy `imprimir-qr.html`. Mismo diseño (DESIGN.md), mismos componentes.
- **Login solo para el panel**: Supabase Auth con email y contraseña, registros nuevos desactivados, y solo los emails de una tabla `admins` pueden escribir. La app pública sigue sin cuentas.
- **La app no espera a la red para todo**: el catálogo se guarda en el teléfono (vía `src/store/`) cada vez que se baja. Sin conexión, o si Supabase no responde, se usa la última copia; si nunca se bajó, se usa `catalogo.json` (la copia que deja la tarea programada).
- **El catálogo de plantas (`content/plantas.js`) y los textos (`content/ayuda.js`) se quedan en el código** por ahora: el panel elige plantas de esa lista.
- **TR01–TR05 se pasan a la base** con lo que tienen hoy (datos, fotos, MIDI del 01), como punto de partida para editarlos desde el panel.
- **Retirado ≠ borrado**: un terrario retirado sigue abriendo su ficha y su pieza desde el QR; solo deja de aparecer en Colección para quien no lo tenga conectado.

## Cómo funciona

### Datos (Supabase)

Tabla `terrarios`, una fila por terrario. Los campos son los de hoy en `terrarios.js`:

| Campo | Qué es |
|---|---|
| `id` | el número de siempre: "01", "07"… (lo usan las rutas, la colección guardada en cada teléfono y la bitácora) |
| `qr_code` | el código del QR, `k7f2q9`. Único, se genera solo, **no se puede modificar** |
| `model` | el código visible, "TR07" |
| `status` | `borrador` (solo se ve en el panel) · `publicado` · `retirado` |
| `recorded`, `duration`, `story` | día en que empezó a sonar, largo de la pieza, texto |
| `specs`, `plants`, `waves`, `care` | igual que hoy |
| `photo`, `video`, `midi_plantas`, `midi_sustrato` | archivos en Storage |

- **Storage**: un bucket público `terrarios/` con una carpeta por terrario (foto, video, los dos `.mid`).
- **Permisos (RLS)**: cualquiera puede leer los terrarios publicados y retirados; solo un admin puede crear y editar. Nadie puede borrar. Un trigger en la base impide cambiar `qr_code` una vez creado.
- **Cambios de estructura** con migraciones SQL guardadas en el repo (`supabase/migrations/`), para que la base se pueda rehacer desde cero.

### App pública

- `src/content/terrarios.js` deja de tener la lista escrita y pasa a cargarla: al arrancar, la app trae el catálogo (Supabase → copia del teléfono → `catalogo.json`). `getTerrario(id)` y `codeOf()` siguen existiendo con la misma forma, así las vistas cambian lo mínimo.
- Supabase se usa desde el navegador con `supabase-js` cargado de jsDelivr con versión fija, como hoy jsQR. Sin npm, sin build.
- Solo `src/content/terrarios.js` (o un adaptador en `src/store/`) habla con Supabase, igual que la regla de datos actual.

### El link del QR

1. El celular abre `https://app.filotaxia.com/t/k7f2q9`.
2. GitHub Pages no tiene reglas de redirección, así que `/t/k7f2q9` no existe como archivo y Pages sirve `404.html`. Ese `404.html` es una página mínima que reescribe la dirección a `/#/t/k7f2q9` y abre la app (el salto no se nota). Cualquier otra dirección que no exista también cae ahí y termina en la app, nunca en un error de GitHub.
3. La app busca qué terrario tiene ese `qr_code` y abre su ficha como un escaneo fresco: lo suma a la colección, marca "Última conexión" y sigue el flujo de siempre (Manifiesto la primera vez, después la pieza).
4. El escáner de la app (Conectar) acepta el mismo link.

### Panel (`/admin/`)

- **Entrar**: email y contraseña.
- **Lista**: todos los terrarios con su estado, su foto y su QR.
- **Nuevo / editar**: un formulario con todos los campos. Sugiere el próximo número (`07`, `TR07`). La foto se achica antes de subir (como `utils/image.js`). Se suben video y los dos MIDI.
- **Publicar / retirar**: cambia el estado. Nunca borra.
- **QR**: cada terrario muestra su QR con el link, y se puede descargar en SVG (para imprenta) y PNG, o imprimir una hoja con varios (reemplaza `imprimir-qr.html`). Debajo del QR, el código visible `TR07` para identificarlo a mano.

### Orden de trabajo

1. **Base**: proyecto Supabase, tabla, permisos, Storage, migraciones; pasar TR01–TR05; la app lee el catálogo desde Supabase con su respaldo; tarea programada (despertar + `catalogo.json`).
2. **Link permanente**: ruta `/t/<código>` con `404.html`, GitHub Pages con `app.filotaxia.com` (HTTPS activado), `CNAME` `app` en Hostinger, escáner que acepta el link nuevo.
3. **Panel**: login, alta y edición, subida de archivos, QR descargables e imprimibles.

Hasta que no esté el punto 2 publicado con el dominio real, **no se imprime ningún QR definitivo**.

## Objetivos

- Cargar un terrario nuevo y tener su QR listo para imprimir sin tocar código.
- Que un QR impreso hoy siga funcionando en años, pase lo que pase con el hosting o la app.
- Que la app siga andando sin conexión con lo último que bajó.

## No objetivos (por ahora)

- Cuentas para los usuarios de la app. Sigue sin login.
- Sincronizar la colección, la bitácora o los cuidados de cada teléfono con Supabase. Siguen en el teléfono.
- Estadísticas de escaneos.
- Resolver "Mi terrario" en instalaciones (hoy, el primer terrario escaneado pasa a ser el propio de cada visitante). Queda anotado para otra etapa.
- Pasar las plantas o los textos de ayuda a la base.

## Anti-objetivos (lo que lo haría un fracaso aunque funcione)

- Un QR impreso que deja de abrir su terrario, o que abre otro.
- Que la app pública pida registrarse o loguearse.
- Que alguien que no es Nicolás pueda cargar, editar o borrar terrarios.
- Que la app quede en blanco si Supabase no responde.
- Agregar un proceso de build o dependencias de npm a la app.

## Restricciones

- Sin build ni `package.json` (ver CLAUDE.md). Librerías externas, solo por CDN con versión fija.
- Todo el CSS y JS sigue las reglas de CLAUDE.md y DESIGN.md (cabeceras, alias semánticos, sin colores de acento, mobile first).
- Ninguna vista toca Supabase directamente.
- Las claves: en el navegador solo va la clave pública (`anon`); la clave de servicio nunca entra al repo (el repo es público), solo en los secretos de GitHub Actions si hiciera falta.

## Lo que queda para quien lo construya

- La forma interna del caché del catálogo y cuándo se refresca.
- El diseño de las pantallas del panel, dentro de DESIGN.md.
- Cómo se pasan TR01–TR05 (script o SQL).
- Los tests de las funciones puras nuevas (generar código, leer el link) con `node --test`.
