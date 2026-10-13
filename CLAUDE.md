# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Filotaxia** is an installable web app (PWA, phone first — people scan the QR with their phone) for living terrariums that make sound: each terrarium has a QR in its base; scanning it opens the terrarium's page, which adds it to the collection on that phone, and the person can listen to its piece. The first one scanned becomes **Mi terrario** (their own), with its care status and reminders. **No accounts, no login**: the scan is enough.

- Visual system: **read `DESIGN.md` before building any UI.** Light and dark themes (Ajustes → Apariencia: Auto / Claro / Oscuro). White, black and the web's neutral greys only — **no accent colour** (no green or anything else); regular-weight titles, small uppercase eyebrows, black pill buttons, thin lines.
- Structure (router, store, header, floating bottom nav, sheets, toasts) comes from Pulso (`inspo/pulso`, the owner's own project). `inspo/` is reference material only — never import from it. `inspo/proyecto-filotaxia` is the filotaxia.com website (Vite + GSAP): assets are copied **optimized** into `src/assets/` (its originals weigh ~325 MB), never linked.
- The owner is a web designer who wants to understand all the code: keep it clear, comment in Spanish where it helps, no over-engineering. UI copy is Spanish (es-AR).

## Running the Project

No build, no package.json, no npm dependencies. Serve the root with any static server (ES modules don't work over `file://`):

```bash
npx serve . -l 4180
```

Logic tests (pure functions in `src/utils/` and `src/audio/score.js`) use Node's built-in runner. Always pass the glob — a bare `node --test` would also pick up the tests inside `inspo/`:

```bash
node --test 'tests/**/*.test.js'
```

## Architecture

Vanilla HTML, CSS and JS (ES modules). Font: PP Neue Montreal (same as filotaxia.com), local in `src/assets/fonts/` via `styles/base/fonts.css` — 400 and 500 both use the Medium cut, like the web (personal use only; publishing needs the app/web license). External: jsQR (scanner fallback) and qrcode-generator (`imprimir-qr.html`) loaded on demand from jsDelivr.

### Phone

- **QR:** each printed QR is a link to `https://<app>/#/terrario/<id>`, so any phone camera opens the ficha directly; the in-app scanner reads the same codes (`utils/qr.js` accepts the link, `filotaxia:04` or the bare number).
- **Camera needs HTTPS** (or localhost). Over the LAN (`http://192.168…`) the scanner shows the "insecure" hint; publish over https to test it on a phone.
- **iPhone audio:** `navigator.audioSession.type = "playback"` so Web Audio plays with the silent switch on; the player resumes the AudioContext when the app comes back to the foreground.
- **iOS caveat:** an installed PWA has its own storage, separate from Safari — terrariums scanned in Safari don't show up in the installed app (scanning again adds them).

```
index.html              app shell: header (hidden by default), <main id="view">, bottom nav (hidden by default)
manifest.webmanifest    PWA: name, icons, standalone
sw.js                   service worker, network-first (always fresh online, cached copy offline)
imprimir-qr.html        internal tool: one printable QR per terrarium (link to its ficha)
DESIGN.md               design system
src/
├── main.js             entry: header → router
├── router.js           hash router with params (#/terrario/:id, #/escuchar/:id?, #/bitacora/:id, #/manifiesto/:id?,
│                       #/mi-terrario/cuidados), ctx.from (previous route), guards and chrome
├── store/
│   ├── store.js        THE data API: get, set, subscribe, add, remove — all async
│   ├── local.js        localStorage adapter (the only file that touches localStorage)
│   ├── photos.js       IndexedDB adapter for Bitácora photos (the only file that touches IndexedDB)
│   ├── defaults.js     initial value per key (links, my_terrario, care_log, bitacora, prefs, manifiesto_seen)
│   ├── collection.js   every scanned terrarium: linkedIds, isLinked, link
│   ├── my-terrario.js  the own terrarium + care log: claimIfFirst, setMyTerrario, lastCare, logCare, linkedOn
│   ├── bitacora.js     per-terrarium notes (date, text, optional photo): entries, addEntry, removeEntry, photoURL
│   └── journey.js      the Filotaxia page's 5 steps: which are done (scanned / has notes come from other data;
│                       ubicado / escuchado / cuidado are marked in the `journey` key): journey, markStep
├── content/
│   ├── terrarios.js    catalog (id, name, recorded date, duration, story, care plan; optional model, photo, specs, plants, waves).
│   │                   Nº 01 is the complete example, with the real TR01 content from filotaxia.com
│   ├── plantas.js      plant catalog from filotaxia.com: leaf shape → wave (Puntiaguda→triangle, Redondeada→sine,
│   │                   Dentada→sawtooth, Recta→square) + top-view photo; getPlanta(name)
│   └── ayuda.js        filotaxia.com texts: "¿Cómo funciona?", care FAQ, process (3 stages), the 4 layers, sound FAQ, contact;
│                       STEPS (the user's 5 steps, views/filotaxia: key, title, short, text, video — videos go in
│                       src/assets/videos/, null = "Video en preparación") and CARE_GUIDE (riego · luz · sustrato):
│                       steps 04–05 and the guide are our own draft, to review before publishing
├── camera/qr-camera.js rear camera + QR reading: BarcodeDetector (Android) or jsQR from CDN (iPhone)
├── audio/
│   ├── score.js        pure + deterministic: seed → notes (tested)
│   └── player.js       Web Audio: drone + notes + echo, play/pause/seek/skip
├── views/<view>/       one folder per screen: <view>.js (+ .css)
├── components/<name>/  functions that return HTML strings (+ co-located CSS)
├── layout/             app-shell, header, bottom-nav
├── animation/          CSS-only reveals (.reveal, .reveal-stagger)
├── utils/              pure logic (format, qr, dates, care, random) + html escaping, icons, theme, image (shrink photos)
└── styles/             tokens → semantic → base
tests/                  node:test files (content.test.js checks the catalogs match and every photo exists)
```

### Flow

Splash (`#/inicio`, goes to Mi terrario if there is one, else Escanear) → Escanear (`#/escanear`, in-app camera or "Simular escaneo") or the phone's own camera opening the QR link → Ficha (`#/terrario/04`): opening it links the terrarium; the first one ever also becomes Mi terrario → "Escuchar" (`#/escuchar/04`, the player). Its **Bitácora** is a separate screen (`#/bitacora/04`), reached from Mi terrario's Bitácora block or the ficha's "Ver su bitácora".

**Manifiesto** (`#/manifiesto/04`): on the very first scan (a new link while `manifiesto_seen` is false) the ficha redirects to a 5-screen intro to biosonification (hook: one of the 6 quotes in `content/citas.js`, a different one each time it opens · 01/02/03 mechanism · wave → leaf grid (waves first, they flip to leaves after 3 s; two dots at its top right switch the view) · uniqueness · "Escuchar mi terrario"), then the player. Swipe (native scroll-snap), tap (left third = back), "Siguiente" or arrow keys; "Saltar" and the final button store `manifiesto_seen` and `location.replace` to the player. From the bottom nav it opens without id and keeps the bar (`nav` can be a function of ctx; only the first-scan onboarding hides it): "Cerrar" and the final "Volver al inicio" → `#/mi-terrario`.

Bottom nav (Pulso structure, 4 items): **Inicio · Terrarios · Manifiesto · Filotaxia** (Inicio = the own terrarium's page, route `#/mi-terrario`, formerly "Mi terrario") (Terrarios, route `#/coleccion`, lists the whole catalog TR01–TR06 like filotaxia.com, marking the own one and the scanned ones; any terrarium can be played from there without scanning. Scanning still is what links it and sets Mi terrario). Escanear is the small QR in the top-right corner of the Pieza block (and "Escanear QR" while there's no terrarium); Escuchar is opened from the Pieza block, "Escuchar" or a Terrarios tile; **Ajustes** is the dot at the top right (`components/settings-link`, the 15px circle from filotaxia.com's nav: in the header and in the screens with their own head), with a back arrow to the previous route. **Filotaxia** (`#/filotaxia`, nav section, styled like a daily task list) is the user's step-by-step: a "Tu recorrido" progress card (percent + one dot per step) and one row per step (01/ Ubicá · 02/ Escaneá · 03/ Escuchá · 04/ Cuidalo · 05/ Bitácora) with a round "Ver" button that opens a sheet with the step's video tutorial, its full text and the button to do it; done steps come from `store/journey.js` (the player marks "escuchado", Cuidados marks "cuidado", step 01 has "Ya lo ubiqué"). Below, "Para saber más" (process, layers, FAQ, Manifiesto).

**Bitácora**: per terrarium (never shared). Each entry: automatic date, required note, optional photo. Text lives in the store (`bitacora` key); photos are shrunk to 1200px JPEG (`utils/image.js`) and stored in IndexedDB (`store/photos.js`) because localStorage only holds ~5 MB of text. Views show them with object URLs and revoke them on leave.

### Mi terrario (`#/mi-terrario`)

Care page modeled on an energy app's "Status." screen: "Filotaxia." + "Armonía en plantas." in grey (the Ajustes dot at the right), the terrarium's code as the hero big number ("TR01", `codeOf()` in `content/terrarios.js`) with a chip with the piece's recorded date and "Escuchar" → the player, then blocks (`components/block`): the terrarium photo full width → its ficha, Bitácora (note count → `#/bitacora/:id`) | Pieza (the piece's duration; the whole block → the player, the QR in its corner → Escanear), Ventilación with a soft meter, Plantas (`components/plants-block`), and a full-width "Cuidados." card → `#/mi-terrario/cuidados`, a subpage with Riego, the general care guide (riego · luz · sustrato, same for every terrarium) and the care FAQ; its route starts with `mi-terrario` so the nav keeps that section active. Air humidity is no longer shown, and the status sentence (`careStatus` in `utils/care.js`) is not used on screen for now. Ventilación is logged by the person ("Ventilé hoy") in `care_log`; Riego has no button for now (it counts from the last logged watering, or from the scan day); humidity drops with the days since the last watering. **Readings are simulated** (seeded by terrarium + day, `utils/care.js`) until terrariums have sensors. Open ecosystems (`care.ventilacion_days: null`) hide Ventilación; terrariums with `plants` show a Plantas block (leaf shape per plant; its "Ondas" toggle swaps to each plant's wave). "Hecho hoy" only reflects a real log entry (`loggedToday`), never the scan-day fallback.

Photos: `terrario.photo` points to `src/assets/images/terrarios/` (the product shots from filotaxia.com's Terrarios page, TR01–06, cropped square at 800px). Plant photos live in `src/assets/images/plantas/` (360px webp) and show in the Plantas block with the plant's wave. The service worker caches them, so they also show offline. `terrariumArt()` draws the sprout underneath, so a missing photo falls back to the drawing.

### Views

Each view exports `title` (string or `(ctx) => string`), optionally `subtitle` (same), `header` (true → big header: title + subtitle + Ajustes dot), `nav` (false → no bar, the splash; or `(ctx) => boolean`: the Manifiesto hides it only in the first-scan onboarding), `back` (string or `(ctx) => string`), and `render(root, ctx)` with `ctx = { params, from }` (`from` = the previous route, e.g. `"coleccion"`). If `render` returns a function, the router calls it when leaving (stop the camera, destroy the audio player). Full-height screens use `.screen` (+ `.screen__actions` pinned to the bottom).

### Data rule

**No view, component or layout file touches `localStorage` or IndexedDB directly.** Everything goes through `src/store/` (`store.js`; Bitácora photos via `bitacora.js` → `photos.js`). To sync with a backend later, replace `collection.js` / `local.js` / `photos.js`; views don't change.

### Components

Plain functions that return HTML strings. **Every user-provided value goes through `escapeHTML()`** (`src/utils/html.js`). Event listeners are attached by the view after inserting the HTML.

### CSS

`src/styles.css` is the single CSS entry; register every new CSS file there under its group. Views and components use **semantic aliases only** (`--color-text`, `--color-line`…), never raw tokens or hex values — otherwise they ignore the theme.

Theme: every alias in `semantic-colors.css` is `light-dark(light, dark)`. **Light is the default** (`prefs.theme: "light"`; `index.html` starts with `data-theme="light"` so there's no dark flash). No `data-theme` = follow the phone ("Auto"); `data-theme="light|dark"` on `<html>` forces it (`utils/theme.js`, from `prefs.theme`, applied in `main.js` before the first render and on every `prefs` change).

Units: an existing token if one fits; otherwise plain `px`. Never `clamp()`, `vw`, `rem`/`em`. Exceptions: `vh`/`dvh` for heights, `%` for widths, `env(safe-area-inset-*)`.

Mobile first (375px is the source of truth). `min-width` media queries only, ascending, at the end of each CSS file after this banner:

```css
/* ============================================
RESPONSIVE
============================================ */
```

Breakpoints: 480 · 640 · 768 · 1024 (bottom nav becomes side rail) · 1280 · 1400.

### File Headers (CSS & JS)

Every CSS and JS file starts with this exact 3-line banner — group and name, separated by an em dash:

```css
/* ============================================
   Views — Escuchar
   ============================================ */
```

Groups: `Tokens`, `Semantic`, `Base`, `Layout`, `Animation`, `Components`, `Views`, `Store`, `Content`, `Audio`, `Utils`, `App`, `Tests`.

### Accessibility baseline

Tap targets ≥ 44px (`--size-tap`), visible focus (`:focus-visible`), icons next to text get `aria-hidden="true"`, the router moves focus to the screen title on navigation, errors are shown with words (not only a color).
