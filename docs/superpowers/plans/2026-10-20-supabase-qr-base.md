# Plan 1 — Supabase y QR permanentes: implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** que la app lea los terrarios de Supabase y que cada terrario tenga un QR definitivo `https://app.filotaxia.com/t/<código>`, publicado en GitHub Pages e imprimible. El panel de carga es el Plan 2.

**Architecture:** una tabla `terrarios` en Supabase con un `qr_code` que genera la base y que nadie puede cambiar. La app pública lee la tabla con un `fetch` a la API REST de Supabase (sin librería), guarda una copia en el teléfono y, si nunca la bajó, usa `catalogo.json`, una copia que deja en el repo una tarea programada de GitHub Actions (que además mantiene despierto el proyecto gratis). El link `/t/<código>` lo resuelve `404.html` → `#/t/<código>` → la app busca el terrario y abre su ficha como escaneo.

**Tech Stack:** HTML/CSS/JS vanilla con ES modules (sin build), Supabase (Postgres + API REST, plan gratis), GitHub Pages, GitHub Actions, DNS en Hostinger, `node --test`.

**Spec:** `docs/superpowers/specs/2026-10-20-supabase-qr-panel-design.md`

## Global Constraints

- Sin build, sin `package.json`, sin npm. Este plan no agrega librerías: Supabase se lee con `fetch`.
- Cada archivo CSS/JS nuevo empieza con la cabecera de 3 líneas de CLAUDE.md (grupo — nombre). Comentarios en español, textos de la app en español (es-AR, voseo).
- Ninguna vista ni componente toca Supabase ni `localStorage`: solo `src/store/`.
- Todo valor que viene de la base y se pinta pasa por `escapeHTML()`.
- CSS solo con alias semánticos, mobile first, sin colores de acento (DESIGN.md).
- En el repo (público) solo va la clave pública `anon` de Supabase. La clave `service_role` nunca entra al repo.
- El link impreso es exactamente `https://app.filotaxia.com/t/<qr_code>`; `qr_code` = 6 caracteres de `abcdefghjkmnpqrstuvwxyz23456789` (sin `0 o 1 l i`).
- Un terrario se conecta únicamente por `/t/<código>` o con el escáner. Escribir `#/terrario/NN` no conecta.
- Ningún QR definitivo se imprime antes de que la Task 7 esté publicada y verificada con el dominio real.
- Tests: `node --test 'tests/**/*.test.js'` (siempre con el glob).

## Review Focus

- **Un QR de un terrario recién publicado en un teléfono con catálogo viejo**: tiene que abrir igual (si el código no está en la copia local, se vuelve a pedir a Supabase antes de decir "no encontrado"). → test en Task 3.
- **Supabase dormido o sin red, en un teléfono que nunca abrió la app**: el QR abre la ficha usando `catalogo.json`. → test en Task 3.
- **Un código con mayúsculas o con basura alrededor** (`/t/K7F2Q9`, `/t/k7f2q9?x=1`, `/t/k7f2q9/`): se normaliza y se encuentra. → test en Task 2.
- **Abrir la ficha de un terrario no conectado escribiendo `#/terrario/03`**: no lo conecta; muestra "Sin conectar" con el botón para escanear. → verificación en Task 4.
- **Cualquier otra dirección inexistente en el dominio** (`app.filotaxia.com/hola`): termina en la app (inicio), nunca en la página de error de GitHub. → verificación en Task 7.

---

## Mapa de archivos

| Archivo | Qué hace |
|---|---|
| `supabase/migrations/20261020120000_terrarios.sql` | tabla, generador de `qr_code`, candado del código, permisos |
| `supabase/migrations/20261020120100_seed_tr01_tr05.sql` | TR01–TR05 con su contenido actual |
| `src/store/supabase-config.js` | URL del proyecto y clave `anon` |
| `src/store/catalog.js` | **el único que habla con Supabase**: baja el catálogo, lo guarda en el teléfono, cae a `catalogo.json` |
| `src/utils/catalog.js` | puro: fila de la base → terrario de la app |
| `src/utils/qr.js` | puro: lee un link `/t/<código>` (reemplaza `parseTerrarioCode`) |
| `src/utils/scan-intent.js` | recuerda, en memoria, que el próximo terrario abierto llega de un escaneo |
| `src/content/terrarios.js` | deja de tener la lista; guarda el catálogo cargado (`TERRARIOS`, `getTerrario`, `codeOf`, `setCatalog`, `getTerrarioByQr`) |
| `src/views/qr/qr.js` + `qr.css` | ruta `#/t/:code`: resuelve el código y abre la ficha, o "No encontramos este terrario" |
| `404.html` | `/t/k7f2q9` → `/#/t/k7f2q9` |
| `CNAME` | `app.filotaxia.com` para GitHub Pages |
| `catalogo.json` | copia del catálogo publicado (la escribe la tarea programada) |
| `.github/workflows/catalogo.yml` | cada 2 días: despierta Supabase y actualiza `catalogo.json` |
| `imprimir-qr.html` | hoja de QR con los links definitivos |

---

### Task 1: Proyecto Supabase, tabla y TR01–TR05

**Files:**
- Create: `supabase/migrations/20261020120000_terrarios.sql`
- Create: `supabase/migrations/20261020120100_seed_tr01_tr05.sql`
- Create: `src/store/supabase-config.js`

**Interfaces:**
- Produces: tabla `public.terrarios` legible por `anon` en `GET {SUPABASE_URL}/rest/v1/terrarios`; `export const SUPABASE_URL: string`, `export const SUPABASE_ANON_KEY: string`.

- [ ] **Step 1: Crear el proyecto (Nicolás, en supabase.com)**: nombre `filotaxia`, región `South America (São Paulo)`, plan Free. Copiar de *Project Settings → API* la URL y la clave `anon` (`public`). Antes, autorizar el conector de Supabase de Claude (`/mcp` en una terminal de `claude`) para aplicar las migraciones desde acá; si no, se pegan en el *SQL Editor*.

- [ ] **Step 2: Escribir la migración de la tabla** con:
  - función `public.gen_qr_code() returns text`: 6 caracteres al azar de `abcdefghjkmnpqrstuvwxyz23456789` (usar `gen_random_bytes` de `pgcrypto`, no `random()`).
  - tabla `terrarios`: `id text primary key check (id ~ '^\d{2,3}$')`, `qr_code text not null unique default public.gen_qr_code() check (qr_code ~ '^[a-hjkmnp-z2-9]{6}$')`, `model text not null`, `status text not null default 'borrador' check (status in ('borrador','publicado','retirado'))`, `recorded date`, `duration integer`, `story text`, `photo text`, `video text`, `midi_plantas text`, `midi_sustrato text`, `specs jsonb`, `plants text[]`, `waves text[]`, `care jsonb not null`, `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()`.
  - trigger `before update`: si `new.qr_code is distinct from old.qr_code` → `raise exception 'qr_code no se puede cambiar'`; además pone `updated_at = now()`.
  - un choque de `unique` en `qr_code` al insertar es tan improbable (31⁶ ≈ 887 millones) que se acepta el error; el panel (Plan 2) reintenta.
  - `alter table terrarios enable row level security`; política `select` para `anon, authenticated` con `using (status in ('publicado','retirado'))`. Sin políticas de insert/update/delete (Plan 2 agrega las del admin). `revoke delete on terrarios from anon, authenticated`.

- [ ] **Step 3: Escribir la migración de TR01–TR05**: un `insert` por terrario con `status 'publicado'` y los campos tal cual están hoy en `src/content/terrarios.js` (ids `01`–`05`; `photo` queda como ruta local `src/assets/images/terrarios/tr0N.jpg`; `specs`/`care` como `jsonb`; `plants`/`waves` como `text[]`). Sin `qr_code`: lo pone la base. TR06 no se carga.

- [ ] **Step 4: Aplicar las dos migraciones** (MCP `apply_migration` o SQL Editor).

- [ ] **Step 5: Verificar permisos y candado**

Run: `curl -s "$SUPABASE_URL/rest/v1/terrarios?select=id,model,qr_code,status&order=id" -H "apikey: $SUPABASE_ANON_KEY"`
Expected: 5 filas `01`–`05`, cada una con un `qr_code` de 6 caracteres distinto.

Run (SQL Editor): `update terrarios set qr_code = 'aaaaaa' where id = '01';`
Expected: `ERROR: qr_code no se puede cambiar`.

Run: `curl -s -X DELETE "$SUPABASE_URL/rest/v1/terrarios?id=eq.01" -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $SUPABASE_ANON_KEY"`
Expected: error de permiso; la fila `01` sigue estando.

- [ ] **Step 6: `src/store/supabase-config.js`** exporta `SUPABASE_URL` y `SUPABASE_ANON_KEY` con un comentario: la clave `anon` es pública a propósito; la de servicio nunca va acá.

- [ ] **Step 7: Commit**

```bash
git add supabase/ src/store/supabase-config.js
git commit -m "Supabase: tabla terrarios con qr_code fijo y TR01–TR05"
```

---

### Task 2: Funciones puras — fila → terrario, y leer el link del QR

**Files:**
- Create: `src/utils/catalog.js`, `tests/catalog.test.js`
- Modify: `src/utils/qr.js` (se reemplaza entero), `tests/qr.test.js` (se reemplaza entero)

**Interfaces:**
- Produces:
  - `rowToTerrario(row: object, storageBase: string) → terrario`: misma forma que hoy usan las vistas (`id, model, qr_code, status, recorded, duration, story, photo, video, specs, plants, waves, care`, y `midi: { plantas, sustrato }` solo si hay alguno). Los `null` de la base pasan a `undefined` (las vistas usan `??` y `?.`). Una ruta de archivo que empieza con `src/` o `http` queda igual; cualquier otra se prefija con `storageBase` (Storage, Plan 2).
  - `parseQrLink(raw: string) → string | null`: el `qr_code` en minúscula, o `null`.

- [ ] **Step 1: Tests que fallan**

```js
// tests/catalog.test.js
test("rowToTerrario arma midi y saca los null", () => {
  const t = rowToTerrario({ id: "07", model: "TR07", qr_code: "k7f2q9", status: "publicado",
    story: null, photo: "07/foto.jpg", midi_plantas: "07/p.mid", midi_sustrato: null, care: { riego_days: 30 } },
    "https://x.supabase.co/storage/v1/object/public/terrarios/");
  assert.equal(t.story, undefined);
  assert.equal(t.photo, "https://x.supabase.co/storage/v1/object/public/terrarios/07/foto.jpg");
  assert.deepEqual(t.midi, { plantas: "https://x.supabase.co/storage/v1/object/public/terrarios/07/p.mid", sustrato: undefined });
});
test("rowToTerrario deja igual las rutas locales y los links", () => {
  assert.equal(rowToTerrario({ id: "01", model: "TR01", photo: "src/assets/images/terrarios/tr01.jpg", care: {} }, "B/").photo,
    "src/assets/images/terrarios/tr01.jpg");
  assert.equal(rowToTerrario({ id: "01", model: "TR01", photo: "https://a.b/c.jpg", care: {} }, "B/").photo, "https://a.b/c.jpg");
});
test("rowToTerrario sin MIDI no tiene midi", () => {
  assert.equal(rowToTerrario({ id: "01", model: "TR01", care: {} }, "B/").midi, undefined);
});

// tests/qr.test.js
test("lee el link impreso y el de la app", () => {
  assert.equal(parseQrLink("https://app.filotaxia.com/t/k7f2q9"), "k7f2q9");
  assert.equal(parseQrLink("http://localhost:4180/#/t/k7f2q9"), "k7f2q9");
  assert.equal(parseQrLink("  https://app.filotaxia.com/t/K7F2Q9/  "), "k7f2q9");
  assert.equal(parseQrLink("https://app.filotaxia.com/t/k7f2q9?ref=qr"), "k7f2q9");
});
test("no acepta los formatos viejos ni códigos mal formados", () => {
  for (const raw of ["04", "filotaxia:04", "https://app.filotaxia.com/#/terrario/04",
    "https://app.filotaxia.com/t/04", "https://app.filotaxia.com/t/k7f2q", "https://app.filotaxia.com/t/k0f2q9",
    "https://google.com", "", null]) assert.equal(parseQrLink(raw), null, String(raw));
});
```

- [ ] **Step 2: Correr y ver que fallan**

Run: `node --test 'tests/**/*.test.js'`
Expected: FAIL en `catalog.test.js` y `qr.test.js` (funciones que no existen).

- [ ] **Step 3: Implementar** `rowToTerrario` en `src/utils/catalog.js` y `parseQrLink` en `src/utils/qr.js` (borrar `parseTerrarioCode`). El código se valida con `/^[a-hjkmnp-z2-9]{6}$/` después de pasarlo a minúscula; se busca con `/\/t\/([a-z0-9]+)/i` en el texto.

- [ ] **Step 4: Correr y ver que pasan**

Run: `node --test 'tests/**/*.test.js'`
Expected: `catalog.test.js` y `qr.test.js` PASS. (`content.test.js` puede fallar hasta la Task 3; `escanear.js` todavía importa `parseTerrarioCode`, se arregla en la Task 4.)

- [ ] **Step 5: Commit**

```bash
git add src/utils/catalog.js src/utils/qr.js tests/catalog.test.js tests/qr.test.js
git commit -m "Utils: fila de Supabase → terrario, y lectura del link /t/<código>"
```

---

### Task 3: El catálogo se carga de Supabase, con copia en el teléfono y `catalogo.json`

**Files:**
- Create: `src/store/catalog.js`, `catalogo.json`, `tests/catalog-store.test.js`
- Modify: `src/content/terrarios.js`, `src/store/defaults.js`, `src/main.js`, `tests/content.test.js`

**Interfaces:**
- Consumes: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (Task 1); `rowToTerrario` (Task 2).
- Produces:
  - `src/content/terrarios.js`: `TERRARIOS` (el mismo array exportado de siempre, ahora se llena con `setCatalog`), `setCatalog(terrarios: object[]) → void` (reemplaza el contenido de `TERRARIOS` en el mismo array, ordenado por `id`), `getTerrario(id) → terrario | null`, `getTerrarioByQr(code) → terrario | null`, `codeOf(terrario) → string`, `terrarioIds() → string[]` (reemplaza la constante `TERRARIO_IDS`).
  - `src/store/catalog.js`: `loadCatalog({ fetchImpl = fetch } = {}) → Promise<void>`, `findByQr(code: string, { fetchImpl = fetch } = {}) → Promise<terrario | null>`.
  - clave nueva del store `catalog` (default `null`): `{ rows: object[], fetched_at: string }`.

Comportamiento de `loadCatalog`:
1. Si hay copia en el store → `setCatalog` con ella **ya**, y pide Supabase en segundo plano (si responde, guarda y vuelve a `setCatalog`, y avisa con `window.dispatchEvent(new Event("filotaxia:refresh"))` solo si cambió algo).
2. Si no hay copia → espera a Supabase con un tope de 4 s; si falla o tarda, usa `fetch("./catalogo.json")`; si eso también falla, deja el catálogo vacío (las vistas ya muestran "no encontrado").

`findByQr(code)`: busca en `TERRARIOS`; si no está, pide Supabase de nuevo (`?qr_code=eq.<code>`… o el catálogo entero) y vuelve a buscar; si Supabase falla, busca en `catalogo.json`. Recién ahí devuelve `null`.

Pedido a Supabase: `GET {SUPABASE_URL}/rest/v1/terrarios?select=*&order=id` con headers `apikey` y `Authorization: Bearer <anon>`. `storageBase` = `{SUPABASE_URL}/storage/v1/object/public/terrarios/`.

`catalogo.json`: `{ "checked_on": "YYYY-MM", "rows": [ …filas crudas de la API… ] }`. La primera versión se genera a mano con el `curl` de la Task 1 (Step 5, con `select=*`).

- [ ] **Step 1: Tests que fallan** en `tests/catalog-store.test.js`, con un `fetchImpl` falso (y `globalThis.localStorage` ausente: el store cae a memoria):
  - `"sin copia y Supabase caído, usa catalogo.json"`: `fetchImpl` rechaza las URLs de Supabase y responde `catalogo.json` con una fila `01` → después de `loadCatalog`, `getTerrario("01").model === "TR01"`.
  - `"findByQr pide de nuevo si el código no está en la copia"`: catálogo cargado con `01`; `fetchImpl` de Supabase ahora devuelve `01` y `07` (qr `k7f2q9`) → `(await findByQr("k7f2q9")).id === "07"`.
  - `"findByQr devuelve null si nadie lo conoce"`: → `null`.

- [ ] **Step 2: Correr y ver que fallan**

Run: `node --test tests/catalog-store.test.js`
Expected: FAIL (módulo inexistente).

- [ ] **Step 3: Implementar** `src/store/catalog.js` y los cambios de `src/content/terrarios.js` (borrar la lista escrita; dejar el comentario de cabecera explicando de dónde viene ahora el catálogo y los campos). Agregar `catalog: null` a `DEFAULTS` con su línea en el comentario. En `src/main.js`, `await loadCatalog()` antes de `startRouter` (y anotarlo en la lista de pasos del comentario). Reemplazar los usos de `TERRARIO_IDS` por `terrarioIds()`.

- [ ] **Step 4: Adaptar `tests/content.test.js`**: antes de los tests, leer `catalogo.json` con `readFileSync` y `setCatalog(rows.map((row) => rowToTerrario(row, "")))`. Sumar un test: `"catalogo.json: qr_code con formato válido y sin repetir"`.

- [ ] **Step 5: Correr todo**

Run: `node --test 'tests/**/*.test.js'`
Expected: PASS todo.

- [ ] **Step 6: Verificar en el navegador** (`preview_start` `filotaxia`): con `localStorage` limpio, Colección muestra TR01–TR05 (no TR06); en la pestaña de red hay un pedido a `…supabase.co/rest/v1/terrarios`. Cortar la red (o poner una URL mala en la config) y recargar con `localStorage` limpio: Colección sigue mostrando TR01–TR05 (de `catalogo.json`).

- [ ] **Step 7: Commit**

```bash
git add src/store/catalog.js src/content/terrarios.js src/store/defaults.js src/main.js catalogo.json tests/
git commit -m "Catálogo: se carga de Supabase, con copia en el teléfono y catalogo.json"
```

---

### Task 4: `#/t/:code` conecta; la ficha ya no conecta sola

**Files:**
- Create: `src/utils/scan-intent.js`, `src/views/qr/qr.js`, `src/views/qr/qr.css`
- Modify: `src/router.js`, `src/views/terrario/terrario.js`, `src/views/escanear/escanear.js`, `src/styles.css`

**Interfaces:**
- Consumes: `findByQr` (Task 3), `parseQrLink` (Task 2), `getTerrario`, `terrarioIds` (Task 3), `isLinked` (`store/collection.js`).
- Produces: `markScanIntent(id: string) → void`, `takeScanIntent(id: string) → boolean` (devuelve `true` una sola vez por marca; vive en memoria, una recarga la borra). Ruta `t/:code`.

- [ ] **Step 1: `src/utils/scan-intent.js`** con las dos funciones (una variable del módulo con el id pendiente).

- [ ] **Step 2: Vista `src/views/qr/qr.js`** (`nav: false`, `title: "Conectando"`): `const terrario = await findByQr(params.code.toLowerCase())`. Si existe → `markScanIntent(terrario.id)` y `location.replace(\`#/terrario/${terrario.id}\`)`. Si no → pantalla `.screen` con `h1` "No encontramos este terrario", un texto "Revisá que el QR sea el de la base de un terrario Filotaxia." y el botón primario "Conectar" → `#/escanear`. Registrar `["t/:code", qr]` en `ROUTES` y en el comentario de rutas de `router.js`; registrar `qr.css` en `src/styles.css`.

- [ ] **Step 3: Ficha (`terrario.js`)**: reemplazar `const isNew = await link(...)` y el `if (!from || from === "escanear")` por:
  - `const scanned = takeScanIntent(terrario.id)`.
  - Si `scanned` → `link`, `markScanned`, `claimIfFirst`, Manifiesto si es el primero (igual que hoy).
  - Si no `scanned` y `!(await isLinked(terrario.id))` → pantalla "Sin conectar": eyebrow "Terrario", `h1` con `codeOf`, texto "Escaneá el QR de su base para conectarlo y escuchar su pieza." y botón "Conectar" → `#/escanear`. No se conecta nada.
  - Si no `scanned` pero ya estaba conectado → la ficha de siempre, sin marcar "Última conexión".
  - Actualizar el comentario de cabecera del archivo.

- [ ] **Step 4: Escáner (`escanear.js`)**: `onCode` usa `parseQrLink(text)`; si da código → `location.hash = \`#/t/${code}\``. "Simular conexión" elige un terrario no conectado (con `terrarioIds()`) y va a `#/t/${getTerrario(id).qr_code}`. Actualizar los comentarios que mencionan `…/#/terrario/04`.

- [ ] **Step 5: Correr los tests**

Run: `node --test 'tests/**/*.test.js'`
Expected: PASS.

- [ ] **Step 6: Verificar en el navegador**, con `localStorage` limpio:
  - `#/t/<qr de TR01>` → Manifiesto (primer escaneo) → al saltarlo, el reproductor de TR01; Mi terrario = TR01.
  - `#/terrario/03` escrito a mano → "Sin conectar"; Colección sigue mostrando TR03 sin conectar.
  - `#/t/zzzzzz` → "No encontramos este terrario".
  - `#/t/<qr de TR03>` → TR03 se suma a la colección, con "Última conexión" de hoy.
  - "Simular conexión" en Conectar suma un terrario nuevo.
  - Sin errores en la consola.

- [ ] **Step 7: Commit**

```bash
git add src/utils/scan-intent.js src/views/qr/ src/router.js src/views/terrario/terrario.js src/views/escanear/escanear.js src/styles.css
git commit -m "QR: #/t/<código> conecta el terrario; la ficha ya no conecta sola"
```

---

### Task 5: `404.html` — el link impreso entra a la app

**Files:**
- Create: `404.html`

- [ ] **Step 1: Escribir `404.html`**: documento mínimo (cabecera de comentario en español, `<title>Filotaxia</title>`, fondo blanco) cuyo script hace `location.replace("/#" + location.pathname.replace(/\/+$/, ""))` — así `/t/k7f2q9` → `/#/t/k7f2q9` y cualquier otra ruta → `/#/loquesea` (el router la manda a inicio). Sin `?query`: el link impreso no lleva. `<noscript>` con un link a `/`.

- [ ] **Step 2: Verificar en local** (`npx serve` sirve `404.html` para lo que no existe): abrir `http://localhost:4180/t/<qr de TR02>` → termina en la ficha (o el Manifiesto) de TR02. Abrir `http://localhost:4180/hola` → inicio.

- [ ] **Step 3: Commit**

```bash
git add 404.html
git commit -m "404.html: /t/<código> abre la app en ese terrario"
```

---

### Task 6: Tarea programada — Supabase despierto y `catalogo.json` al día

**Files:**
- Create: `.github/workflows/catalogo.yml`

- [ ] **Step 1: Escribir el workflow**: `on: schedule: cron "17 9 */2 * *"` y `workflow_dispatch`; `permissions: contents: write`. Un job en `ubuntu-latest` que:
  1. hace el `curl` de la Task 1 con `select=*&status=in.(publicado,retirado)&order=id` (URL y clave `anon` en `env:`, copiadas de `src/store/supabase-config.js`; son públicas) y falla si la respuesta no es un array JSON (`jq -e 'type == "array"'`);
  2. arma `catalogo.json` = `{ checked_on: "<YYYY-MM de hoy>", rows: <respuesta> }` con `jq` (indentado, orden estable);
  3. si `git diff --quiet catalogo.json` no da diferencias, termina; si no, hace commit con el usuario `github-actions[bot]` y mensaje `Catálogo: copia de Supabase` y `git push`.
  - Comentario arriba del archivo explicando las dos razones: despertar Supabase (pausa a los 7 días) y que `checked_on` cambia cada mes, así el repo tiene un commit al menos mensual y GitHub no apaga la tarea (la apaga tras 60 días sin actividad).

- [ ] **Step 2: Correrlo a mano** una vez subido a GitHub: *Actions → Catálogo → Run workflow*.
Expected: termina en verde; si `catalogo.json` cambió, aparece un commit `Catálogo: copia de Supabase`.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/catalogo.yml
git commit -m "Tarea programada: Supabase despierto y catalogo.json al día"
```

---

### Task 7: Publicar en `app.filotaxia.com` y la hoja de QR

**Files:**
- Create: `CNAME`
- Modify: `imprimir-qr.html`, `CLAUDE.md`, `README.md`

- [ ] **Step 1: `imprimir-qr.html`**: antes de pintar, `await loadCatalog()`. El campo "base" arranca en `https://app.filotaxia.com/` (no en `location`). Cada tarjeta: `url = \`${base}t/${terrario.qr_code}\``, `qrcode(0, "H")` (comentario: tolera ~30% de daño), debajo el `codeOf` y el link. Cambiar el texto de la página para decir que estos son los links definitivos.

- [ ] **Step 2: `CNAME`** con una sola línea: `app.filotaxia.com`.

- [ ] **Step 3: Documentación**: en `CLAUDE.md`, actualizar lo que cambió (catálogo en Supabase vía `store/catalog.js`, `catalogo.json`, ruta `#/t/:code`, `404.html`, `qr.js` solo lee `/t/<código>`, la ficha ya no conecta sola, migraciones en `supabase/`, hosting GitHub Pages + `app.filotaxia.com`). En `README.md`, cómo se publica.

- [ ] **Step 4: Commit y abrir el PR** de la rama `supabase-qr` a `main`.

```bash
git add CNAME imprimir-qr.html CLAUDE.md README.md
git commit -m "Publicación en app.filotaxia.com y hoja de QR definitivos"
```

- [ ] **Step 5: Configurar el dominio (Nicolás)**, después de mergear a `main`:
  - GitHub → `filotaxia/app` → *Settings → Pages*: *Deploy from a branch*, `main`, `/ (root)`. *Custom domain*: `app.filotaxia.com`.
  - Hostinger → DNS de `filotaxia.com`: registro `CNAME`, nombre `app`, destino `filotaxia.github.io`.
  - Cuando GitHub verifique el dominio: tildar *Enforce HTTPS*.
  - Hostinger: confirmar que `filotaxia.com` tiene renovación automática.

- [ ] **Step 6: Verificar en producción**
  - `https://app.filotaxia.com/` abre la app con candado.
  - `https://app.filotaxia.com/t/<qr de TR01>` desde la cámara de un iPhone y de un Android abre TR01.
  - `https://app.filotaxia.com/hola` termina en inicio.
  - `https://app.filotaxia.com/imprimir-qr.html` muestra 5 QR con links `https://app.filotaxia.com/t/…`; escanear uno impreso en papel común abre su terrario.
  - Recién acá: los QR se pueden imprimir en el material final.
