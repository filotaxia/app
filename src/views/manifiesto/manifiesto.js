/* ============================================
   Views — Manifiesto
   ============================================ */

// Introducción a la biosonificación en siete pantallas, para que la pieza
// se escuche como lo que es (y no como ruido al azar):
//
//   1. Gancho      una cita de filotaxia.com, distinta cada vez que se abre
//                  (content/citas.js; la última mostrada queda en el store)
//   2. Por dentro  la foto del TR01 con puntos sobre sus capas y sus
//                  plantas: tocar uno lo explica
//   3. Capas       el terrario por dentro: cuatro franjas horizontales, una por
//                  capa (con su imagen en movimiento), y debajo "/Capa01" y
//                  el texto de la capa encendida; pasan solas
//   4. Idioma      cada forma de hoja → su onda (components/leaf-waves)
//   5. Mecanismo   01 / 02 / 03, de la planta a la nota, con un gráfico por paso
//                  que entra uno después del otro (señal → Biodata → notas)
//   6. Producción  los dos Biodata del terrario, en un dibujo que se mueve
//                  (components/production-loop): el de las plantas va al
//                  Microfreak (ahí le damos una voz a cada planta) y el del
//                  sustrato, a la compu (Ableton); tocar una parte la explica
//   7. Prueba      la huella de TU pieza: sus notas reales (audio/score.js)
//                  en un piano roll que un cabezal recorre, con nombre y fecha;
//                  abajo, "Escuchar la pieza" lleva a su reproductor (#/escuchar).
//                  (Antes había una pantalla más con el reproductor adentro: en el
//                  celular hacía lento al Manifiesto, así que se sacó.)
//
// Con id (#/manifiesto/04) era la introducción del primer escaneo; hoy el
// QR lleva directo a la pieza y nada manda acá con id, pero la ruta sigue
// andando por si se vuelve a usar. "Saltar" guarda
// `manifiesto_seen` y sigue al reproductor de ese terrario; llegar a la 7
// también lo guarda (ya lo vio todo).
// También es una sección de la barra, sin id (#/manifiesto): ahí "Saltar"
// es "Cerrar" (vuelve a Mi terrario). En la 7 siempre dice "Cerrar".
// El terrario de la pantalla 7 lo elige pickTerrario.
//
// La pantalla 1 apoya la cita abajo a la izquierda (como las cards de citas
// de filotaxia.com); la 2, la 3 y la 4 llenan el alto (título arriba,
// terrario o tarjetas abajo / gráfico arriba, texto abajo); las demás van centradas.
//
// Pasa sola, como las historias de Instagram: cada pantalla dura lo que
// tarda su animación de adentro en terminar, más 6 s (AFTER_MS) para mirarla
// quieta, y su línea de arriba se llena en ese tiempo; al llenarse, sigue la
// próxima (en la última se queda). Ver slideDuration(). Mantener apretado la pausa; tocar algo de
// adentro de una pantalla (un punto, una capa, las hojas) frena el autoplay
// del todo, porque la persona está explorando. Con "reducir movimiento" en el
// teléfono no pasa sola.
// A mano: con los botones redondos ‹ › de abajo, tocando una de las líneas de
// arriba (va directo a esa pantalla) o con las flechas del teclado. Tocar la
// pantalla en sí no la pasa. Deslizar o hacer scroll tampoco (overflow hidden
// en el CSS; el JS la corre con scrollTo).

import { get, set } from "../../store/store.js";
import { linkedIds } from "../../store/collection.js";
import { myTerrarioId } from "../../store/my-terrario.js";
import { TERRARIOS, getTerrario, codeOf } from "../../content/terrarios.js";
import { QUOTES, nextQuoteIndex } from "../../content/citas.js";
import { LAYERS, INSIDE_TERRARIUM } from "../../content/ayuda.js";
import { getPlanta, WAVE_NAMES } from "../../content/plantas.js";
import { buildScore, seedFrom } from "../../audio/score.js";
import { leafWaves, bindLeafWaves } from "../../components/leaf-waves/leaf-waves.js";
import { productionLoop, bindProductionLoop } from "../../components/production-loop/production-loop.js";
import { formatDate } from "../../utils/format.js";
import { escapeHTML } from "../../utils/html.js";
import { icon } from "../../utils/icons.js";

export const title = "Manifiesto";

// Autoplay: cada pantalla se queda esto después de que termina su animación
const AFTER_MS = 6000;
// Pantalla 3: cada cuánto se abre la capa siguiente, y lo que tarda en abrirse
// (manifiesto.css: flex-grow 0.6s)
const LAYER_MS = 5000;
const LAYER_OPEN_MS = 600;
// Pantalla 4: a los cuánto giran las hojas a sus ondas, y lo que tarda el giro
// de las cuatro tarjetas (leaf-waves.css: 0.8s + 0.1s por tarjeta)
const FLIP_AT_MS = 3000;
const FLIP_MS = 1100;
// Pantalla 6: una vuelta entera del dibujo de la Producción (la perilla
// pasa por sus tres ondas; connect-loop.css: --loop 12s)
const PRODUCTION_LOOP_MS = 12000;
// Sin barra en el primer escaneo (con id: es parte del onboarding);
// abierto desde la barra (sin id), la barra sigue ahí
export const nav = ({ params }) => !params.id;

const SLIDES = [
  // 1. Gancho: una cita del Manifiesto de filotaxia.com (libro + autor abajo)
  ({ quote }) => `
    <figure class="manifiesto__quote">
      <blockquote class="manifiesto__big">“${quote.text}”</blockquote>
      <figcaption class="manifiesto__byline">
        <cite class="manifiesto__cite">/${quote.book}</cite>
        <span>${quote.author}</span>
      </figcaption>
    </figure>
  `,
  // 2. Por dentro: la foto del terrario con sus puntos
  //    (ver anatomy() más abajo)
  `
    <p class="manifiesto__title">Ecosistemas<br />que hablan.</p>
    ${anatomy()}
  `,
  // 3. Capas: el terrario por dentro (ver layers() más abajo)
  `
    <p class="manifiesto__title">Un terrario.<br />Cuatro capas.</p>
    ${layers()}
  `,
  // 4. Idioma: título arriba a la izquierda y las cuatro tarjetas grandes abajo,
  //    en igualdad (todavía no es tu terrario): primero las hojas y, a los 3 s,
  //    giran a sus ondas; los dos puntos de arriba a la derecha cambian la vista
  `
    <p class="manifiesto__title">Cada planta.<br />Su propia onda.</p>
    ${leafWaves({ flip: true })}
  `,
  // 5. Mecanismo: paso a paso, cada uno con su gráfico (ver mechanism() más abajo)
  `
    <p class="manifiesto__title">Biosonificación.</p>
    ${mechanism()}
  `,
  // 6. Producción: título arriba y, abajo, el dibujo de los dos Biodata
  //    (plantas → Microfreak, sustrato → compu); tocar una parte la explica
  //    (components/production-loop)
  `
    <p class="manifiesto__title">Producción.<br />Una voz por planta.</p>
    ${productionLoop()}
  `,
  // 7. Prueba: depende del terrario, por eso es una función (ver render).
  //    Abajo, el botón negro que lleva a escuchar su pieza
  ({ terrario }) => `
    ${pieceGraphic(terrario)}
    <div class="manifiesto__quote">
      <p class="manifiesto__big">Esta pieza nació de esta planta, en este momento exacto.</p>
      <p class="manifiesto__byline">
        <span class="manifiesto__cite">/${escapeHTML(codeOf(terrario))}</span>
        <span>Grabada el ${formatDate(terrario.recorded)}</span>
      </p>
    </div>
    <a class="btn btn--primary manifiesto__listen" href="#/escuchar/${terrario.id}" data-listen data-done>
      ${icon("play")} Escuchar la pieza
    </a>
  `,
];

// Ubicación del contenido: centrado salvo estas
const SLIDE_LAYOUT = {
  0: "manifiesto__slide--bottom",   // la cita, abajo a la izquierda
  1: "manifiesto__slide--anatomy",  // título arriba, terrario y su explicación abajo
  2: "manifiesto__slide--layers",   // barras arriba, número y texto abajo
  3: "manifiesto__slide--split",    // título arriba, tarjetas abajo
  5: "manifiesto__slide--production", // título arriba, la animación abajo
  6: "manifiesto__slide--piece",    // la huella y el texto al centro, el botón abajo
};

export async function render(root, { params }) {
  const terrario = await pickTerrario(params.id);

  // Una cita distinta cada vez: la que sigue a la última que se mostró
  const quoteIndex = nextQuoteIndex(await get("manifiesto_quote"));
  await set("manifiesto_quote", quoteIndex);
  const quote = QUOTES[quoteIndex];

  // "Saltar" / "Cerrar". Con id: viene del primer escaneo → sigue al reproductor
  // de ese terrario. Sin id: se abrió desde la barra → vuelve a Mi terrario.
  const exit = params.id ? `#/escuchar/${params.id}` : "#/mi-terrario";
  const last = SLIDES.length - 1;

  root.innerHTML = `
    <section class="screen manifiesto">
      <h1 class="visually-hidden" tabindex="-1">Manifiesto</h1>

      <div class="manifiesto__top">
        <ol class="manifiesto__progress" aria-label="Pantallas">
          ${SLIDES.map((_, i) => `
            <li>
              <button class="manifiesto__bar" type="button" data-go="${i}" aria-label="Ir a la pantalla ${i + 1}">
                <span class="manifiesto__line"><span class="manifiesto__fill" data-fill></span></span>
              </button>
            </li>`).join("")}
        </ol>
        <div class="manifiesto__meta">
          <span class="eyebrow" data-count aria-hidden="true">01 / 0${SLIDES.length}</span>
          <a class="text-link manifiesto__skip" href="${exit}" data-done data-skip-link>${params.id ? "Saltar" : "Cerrar"}</a>
        </div>
      </div>

      <div class="manifiesto__track" data-track aria-roledescription="carrusel" aria-label="Manifiesto">
        ${SLIDES.map((slide, i) => `
          <section class="manifiesto__slide ${SLIDE_LAYOUT[i] ?? ""}" data-slide="${i}" aria-roledescription="pantalla"
            aria-label="${i + 1} de ${SLIDES.length}" ${i ? 'aria-hidden="true"' : ""}>
            ${typeof slide === "function" ? slide({ terrario, quote }) : slide}
          </section>`).join("")}
      </div>

      <div class="manifiesto__nav">
        <button class="manifiesto__arrow" type="button" data-prev aria-label="Pantalla anterior" disabled>${icon("chevron-left")}</button>
        <button class="manifiesto__arrow" type="button" data-next aria-label="Pantalla siguiente">${icon("chevron-right")}</button>
      </div>
    </section>
  `;

  const track = root.querySelector("[data-track]");
  const slides = [...root.querySelectorAll("[data-slide]")];
  const screen = root.querySelector(".manifiesto");
  const bars = [...root.querySelectorAll(".manifiesto__bar")];
  const fills = [...root.querySelectorAll("[data-fill]")];
  const count = root.querySelector("[data-count]");
  const prev = root.querySelector("[data-prev]");
  const next = root.querySelector("[data-next]");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let current = 0;   // la pantalla a la que vamos (solo la cambia goTo)
  let shown = 0;     // la que se ve (la cambia show)
  let autoplay = !reduceMotion;
  const waves = bindLeafWaves(root);   // los dos puntos de la pantalla 4
  const layerCycle = bindLayers(root);  // las barras de la pantalla 3
  bindAnatomy(root);                    // los puntos de la pantalla 2
  bindProductionLoop(root);             // las partes de la pantalla 6
  const skip = root.querySelector("[data-skip-link]");

  // Última pantalla: llegar hasta acá cuenta como haberlo visto todo; arriba,
  // "Cerrar" vuelve a Mi terrario (también en el primer escaneo: "Saltar" ya
  // no tiene sentido, para escuchar está el botón de abajo)
  async function finish() {
    skip.textContent = "Cerrar";
    skip.setAttribute("href", "#/mi-terrario");
    await set("manifiesto_seen", true);
  }

  function goTo(index) {
    const target = Math.max(0, Math.min(last, index));
    current = target;   // ya, sin esperar al deslizado: así dos toques rápidos pasan dos pantallas
    track.scrollTo({ left: target * track.clientWidth, behavior: reduceMotion ? "auto" : "smooth" });
  }

  // Las líneas de arriba: las anteriores llenas, las siguientes vacías y la
  // actual llenándose (con autoplay) o llena (sin autoplay, o en la última)
  function paintBars(index) {
    const playing = autoplay && index < last;
    fills.forEach((fill, i) => {
      fill.classList.remove("is-playing");
      fill.classList.toggle("is-full", i < index || (i === index && !playing));
      bars[i].toggleAttribute("aria-current", i === index);
    });
    if (playing) {
      fills[index].style.setProperty("--duration", `${slideDuration(slides[index])}ms`);
      void fills[index].offsetWidth;   // así la animación arranca de cero
      fills[index].classList.add("is-playing");
    }
  }

  function stopAutoplay() {
    if (!autoplay) return;
    autoplay = false;
    paintBars(shown);
  }

  // Pinta la pantalla actual: líneas de progreso, contador y flechas
  // (no toca `current`: mientras desliza de la 1 a la 3 pasa por la 2, y eso
  // no tiene que cambiar a dónde vamos)
  function show(index) {
    shown = index;
    slides[index].dataset.seen = "";   // arranca su animación de entrada (una vez)
    paintBars(index);
    slides.forEach((slide, i) => slide.toggleAttribute("aria-hidden", i !== index));
    count.textContent = `${String(index + 1).padStart(2, "0")} / ${String(SLIDES.length).padStart(2, "0")}`;
    prev.disabled = index === 0;
    next.disabled = index === last;
    // Pantalla 4: a los 3 s de verla, las hojas giran a sus ondas
    if (slides[index].querySelector("[data-leaf-waves]")) waves.play(FLIP_AT_MS);
    // Pantalla 3: las capas pasan solas solo mientras se ve
    if (slides[index].querySelector("[data-layers]")) layerCycle.play();
    else layerCycle.stop();
    if (index === last) finish();
  }

  // La pantalla que más se ve es la actual (sirve igual para tap, click o teclado)
  const observer = new IntersectionObserver(
    (entries) => entries.forEach((entry) => entry.isIntersecting && show(Number(entry.target.dataset.slide))),
    { root: track, threshold: 0.6 },
  );
  slides.forEach((slide) => observer.observe(slide));

  // Autoplay: cuando la línea de la pantalla actual se llena, sigue la próxima
  fills.forEach((fill, i) => {
    fill.addEventListener("animationend", () => {
      if (autoplay && i === shown) goTo(i + 1);
    });
  });

  // Mantener apretado pausa (la línea se frena); al soltar, sigue
  track.addEventListener("pointerdown", () => screen.classList.add("is-paused"));
  ["pointerup", "pointercancel", "pointerleave"].forEach((type) =>
    track.addEventListener(type, () => screen.classList.remove("is-paused")));

  // Con la app en segundo plano tampoco avanza
  function onVisibility() {
    screen.classList.toggle("is-away", document.hidden);
  }
  document.addEventListener("visibilitychange", onVisibility);

  // Tocar algo de adentro de una pantalla (un punto, una capa, las hojas,
  // una parte de la Producción):
  // está explorando, el autoplay se frena del todo. Va en la fase de captura
  // porque los puntos de las hojas (leaf-waves) frenan su click.
  track.addEventListener("click", (event) => {
    if (event.target.closest("button, a, [role='button']")) stopAutoplay();
  }, true);

  prev.addEventListener("click", () => goTo(current - 1));
  next.addEventListener("click", () => goTo(current + 1));
  // Las líneas de arriba llevan directo a su pantalla
  bars.forEach((bar) => bar.addEventListener("click", () => goTo(Number(bar.dataset.go))));

  // Saltar / Cerrar / Escuchar la pieza: ya lo vio
  root.querySelectorAll("[data-done]").forEach((link) => {
    link.addEventListener("click", async (event) => {
      event.preventDefault();
      await set("manifiesto_seen", true);
      // replace: "atrás" desde el reproductor no vuelve al manifiesto
      location.replace(link.getAttribute("href"));
    });
  });

  function onKey(event) {
    if (event.key === "ArrowRight") goTo(current + 1);
    if (event.key === "ArrowLeft") goTo(current - 1);
  }
  document.addEventListener("keydown", onKey);

  return () => {
    observer.disconnect();
    waves.stop();
    layerCycle.stop();
    document.removeEventListener("keydown", onKey);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}

// Cuánto se queda una pantalla con autoplay: hasta que termina su animación
// de adentro, más AFTER_MS. Las animaciones CSS (la entrada de cada cosa, los
// gráficos de la 5) se miden en el momento con getAnimations(), salvo las que
// no terminan nunca (los puntos que respiran); las que mueve el JS se suman
// aparte: la 3 recorre sus cuatro capas, la 4 gira las hojas a sus ondas.
// La 6 se repite sin fin, así que se cuenta una vuelta entera.
function slideDuration(slide) {
  const css = slide.getAnimations({ subtree: true }).map((animation) => {
    const { endTime } = animation.effect.getComputedTiming();
    return Number.isFinite(endTime) ? endTime - (animation.currentTime ?? 0) : 0;
  });
  let js = 0;
  if (slide.querySelector("[data-layers]")) js = LAYER_MS * (LAYERS.length - 1) + LAYER_OPEN_MS;
  if (slide.querySelector("[data-leaf-waves]")) js = FLIP_AT_MS + FLIP_MS;
  if (slide.querySelector("[data-production]")) js = PRODUCTION_LOOP_MS;
  return Math.round(Math.max(0, js, ...css) + AFTER_MS);
}

/* ---------------------------------------- */
/* Pantalla 2: el terrario por dentro */

// La foto del TR01 y, encima, un punto de vidrio por capa y uno por planta,
// en el lugar que dice INSIDE_TERRARIUM (content/ayuda.js). Debajo, qué es el
// punto elegido: su nombre ("Sustrato", "Haworthia Attenuata") y su texto.
function anatomy() {
  const { image, alt, spots } = INSIDE_TERRARIUM;
  return `
    <div class="anatomy" data-anatomy>
      <div class="anatomy__stage">
        <div class="anatomy__figure">
          <img class="anatomy__image" src="${image}" alt="${alt}" decoding="async" />
          ${spots.map((spot, i) => `
            <button class="anatomy__dot" type="button" data-spot="${i}"
              style="--x: ${spot.x}; --y: ${spot.y}" aria-pressed="${i === 0}" aria-label="${spotName(spot)}"></button>`).join("")}
        </div>
      </div>
      <div class="anatomy__info" data-spot-info aria-live="polite">${spotInfo(spots[0])}</div>
    </div>
  `;
}

// "Capa 02: Sustrato" / "Planta: Haworthia Attenuata" (para el lector de pantalla)
function spotName(spot) {
  return spot.kind === "capa" ? `Capa ${pad(spot.layer + 1)}: ${LAYERS[spot.layer][0]}` : `Planta: ${spot.name}`;
}

function spotInfo(spot) {
  if (spot.kind === "capa") {
    const [name, , text] = LAYERS[spot.layer];
    return `
      <p class="anatomy__name">/${name}</p>
      <p class="anatomy__text">${text}</p>
    `;
  }
  const planta = getPlanta(spot.name);
  return `
    <p class="anatomy__name">/${escapeHTML(planta.name)}</p>
    <p class="anatomy__text">${planta.wave
      ? `Hoja ${planta.leafLabel.toLowerCase()}: suena con una onda ${WAVE_NAMES[planta.wave].toLowerCase()}.`
      : "Una de las plantas del terrario."}</p>
  `;
}

// Tocar un punto lo elige y cuenta qué es.
function bindAnatomy(root) {
  const box = root.querySelector("[data-anatomy]");
  if (!box) return;
  const dots = [...box.querySelectorAll("[data-spot]")];
  const info = box.querySelector("[data-spot-info]");

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      dots.forEach((d) => d.setAttribute("aria-pressed", String(d === dot)));
      info.innerHTML = spotInfo(INSIDE_TERRARIUM.spots[Number(dot.dataset.spot)]);
    });
  });
}

/* ---------------------------------------- */
/* Pantalla 3: las cuatro capas */

// Arriba, una franja horizontal por capa, apiladas como en el terrario
// (plantas arriba, piedras abajo), con su imagen en movimiento: la capa
// encendida se abre (más alta y a color) y muestra su nombre centrado.
// Debajo de las franjas, su número ("/Capa01") y el texto que la
// explica. Tocar una franja la abre.
//
// Cada franja es una caja con un botón que la cubre entera (para tocarla)
// y, encima, el nombre.

function layers() {
  const [, , text] = LAYERS[0];
  return `
    <div class="layers" data-layers>
      <div class="layers__bars" role="group" aria-label="Las cuatro capas">
        ${LAYERS.map(([layerName, , , media], i) => `
          <div class="layers__bar${i === 0 ? " is-open" : ""}" data-layer-bar>
            <video class="layers__media" src="${media}" muted loop playsinline autoplay aria-hidden="true"></video>
            <button class="layers__hit" type="button" data-layer="${i}" aria-pressed="${i === 0}"
              aria-label="Capa ${pad(i + 1)}: ${layerName}"></button>
            <div class="layers__details" aria-hidden="true">
              <span class="layers__title">${layerName}</span>
            </div>
          </div>`).join("")}
      </div>
      <div class="layers__info">
        <p class="layers__number" data-layer-number aria-hidden="true">/Capa01</p>
        <p class="layers__text" data-layer-text>${text}</p>
      </div>
    </div>
  `;
}

// Abre una capa por vez. Devuelve:
//   play()  empieza a pasar solas (cada LAYER_MS, 5 s), si la persona no tocó una franja
//   stop()  las frena (al salir de la pantalla)
function bindLayers(root) {
  const box = root.querySelector("[data-layers]");
  if (!box) return { play() {}, stop() {} };
  const bars = [...box.querySelectorAll("[data-layer-bar]")];
  const hits = [...box.querySelectorAll("[data-layer]")];
  const number = box.querySelector("[data-layer-number]");
  const copy = box.querySelector("[data-layer-text]");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let current = 0;
  let touched = false;
  let timer = 0;

  function open(index) {
    current = index;
    const [, , text] = LAYERS[index];
    bars.forEach((bar, i) => bar.classList.toggle("is-open", i === index));
    hits.forEach((hit, i) => hit.setAttribute("aria-pressed", String(i === index)));
    number.textContent = `/Capa${pad(index + 1)}`;
    copy.textContent = text;
    if (!reduceMotion) {
      [number, copy].forEach((el) => el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: "ease-out" }));
    }
  }

  hits.forEach((hit) => {
    hit.addEventListener("click", () => {
      touched = true;
      clearInterval(timer);
      timer = 0;
      open(Number(hit.dataset.layer));
    });
  });

  return {
    play() {
      if (touched || timer || reduceMotion) return;
      timer = setInterval(() => open((current + 1) % LAYERS.length), LAYER_MS);
    },
    stop() {
      clearInterval(timer);
      timer = 0;
    },
  };
}

function pad(n) {
  return String(n).padStart(2, "0");
}

/* ---------------------------------------- */
/* Pantalla 5: el mecanismo, paso a paso */
/* ---------------------------------------- */

// Los tres gráficos cuentan la misma señal, cada vez más "música":
//   01  la señal eléctrica de la planta, nerviosa y continua (se dibuja sola)
//   02  Biodata la lee: muestras puntuales, una tras otra
//   03  cada muestra pasa a ser una nota (como un piano roll)
// Todos miden 320 × 64 y usan currentColor, así siguen al tema.
// Son funciones (no constantes) para poder usarlas arriba, en SLIDES.

function mechanism() {
  const steps = [
    ["Cada planta genera microfluctuaciones eléctricas constantes", signalGraphic()],
    ["Biodata las capta en tiempo real", sensorGraphic()],
    ["Se traducen a notas — eso es biosonificación", notesGraphic()],
  ];

  return `
    <ol class="flow">
      ${steps
        .map(([text, graphic], i) => `
        <li class="flow__step" style="--step: ${i}">
          <span class="flow__index">${String(i + 1).padStart(2, "0")}</span>
          <div class="flow__body">
            ${graphic}
            <p class="flow__text">${text}</p>
          </div>
        </li>`)
        .join("")}
    </ol>
  `;
}

// La "actividad" de la planta en el instante i: tres senos mezclados
// (siempre da lo mismo, así el dibujo no cambia). Va de −16 a 16.
function activity(i) {
  return Math.sin(i * 1.3) * 7 + Math.sin(i * 0.47) * 6 + Math.sin(i * 3.1) * 3;
}

// Un decimal alcanza para el SVG
function round(n) {
  return Math.round(n * 10) / 10;
}

// 01: un brote a la izquierda y su señal hacia la derecha
function signalGraphic() {
  // La señal nace a la altura de las hojas del brote (x 52) y llega al borde
  const points = Array.from({ length: 34 }, (_, i) => `${52 + i * 8},${round(34 + activity(i))}`);
  return `
    <svg class="flow__graphic" viewBox="0 0 320 64" aria-hidden="true">
      <g transform="translate(-8 2) scale(0.95)">
        <g class="flow__sprout">
          <path d="M32 58V14" /><path d="M32 40c-10 1-18-4-21-12 9-2 18 1 21 12Z" /><path d="M32 40c10 1 18-4 21-12-9-2-18 1-21 12Z" />
        </g>
      </g>
      <polyline class="flow__signal" pathLength="1" points="${points.join(" ")}" />
    </svg>
  `;
}

// 02: el electrodo (con un pulso) y las lecturas: un palito con punto por muestra
function sensorGraphic() {
  const samples = Array.from({ length: 13 }, (_, k) => {
    const x = 52 + k * 21;
    const top = round(30 + activity(k * 3));
    return `
      <g class="flow__sample" style="--i: ${k}">
        <line x1="${x}" y1="58" x2="${x}" y2="${top}" /><circle cx="${x}" cy="${top}" r="2.5" />
      </g>`;
  });
  return `
    <svg class="flow__graphic" viewBox="0 0 320 64" aria-hidden="true">
      <line class="flow__guide" x1="40" y1="58" x2="320" y2="58" />
      <circle class="flow__pulse" cx="18" cy="32" r="10" />
      <circle class="flow__sensor" cx="18" cy="32" r="10" />
      <circle class="flow__sensor-dot" cx="18" cy="32" r="3" />
      ${samples.join("")}
    </svg>
  `;
}

// 03: cada lectura, redondeada a una de 5 alturas, es una nota; una línea
// (el cabezal) pasa por encima como si las tocara
function notesGraphic() {
  const rows = [8, 19, 30, 41, 52];
  const widths = [12, 20, 16];
  const notes = Array.from({ length: 13 }, (_, k) => {
    const row = Math.round(((activity(k * 3) + 16) / 32) * 4);
    return `<rect class="flow__note" style="--i: ${k}" x="${8 + k * 24}" y="${rows[4 - row]}" width="${widths[k % 3]}" height="6" rx="3" />`;
  });
  return `
    <svg class="flow__graphic" viewBox="0 0 320 64" aria-hidden="true">
      ${rows.map((y) => `<line class="flow__guide" x1="0" y1="${y + 3}" x2="320" y2="${y + 3}" />`).join("")}
      ${notes.join("")}
      <line class="flow__playhead" x1="0" y1="2" x2="0" y2="62" />
    </svg>
  `;
}

/* ---------------------------------------- */
/* Pantalla 7: la huella de tu pieza */
/* ---------------------------------------- */

// El terrario de la pantalla 7 (su pieza y el botón para escucharla): el recién escaneado (id en la ruta); si se
// abrió desde la barra, el propio o el primero de la colección; si no hay
// ninguno, el primero del catálogo.
async function pickTerrario(id) {
  const candidates = [id, await myTerrarioId(), ...(await linkedIds())];
  return candidates.map((candidate) => candidate && getTerrario(candidate)).find(Boolean) ?? TERRARIOS[0];
}

// Las notas reales de la pieza (las mismas que toca el reproductor) como
// piano roll de 320 × 120: el tiempo va de izquierda a derecha y la altura,
// de grave (abajo) a agudo (arriba). Ningún otro terrario da este dibujo.
// --t es la posición de cada nota (0 a 1): la nota aparece cuando pasa el cabezal.
function pieceGraphic(terrario) {
  const { notes } = buildScore({ seed: seedFrom(terrario.id), duration: terrario.duration });
  const width = 320;
  const height = 120;
  const pitches = notes.map((note) => 12 * Math.log2(note.freq / 440) + 69);
  const low = Math.min(...pitches);
  const range = Math.max(...pitches) - low || 1;

  const rects = notes.map((note, i) => {
    const x = (note.time / terrario.duration) * width;
    // las últimas notas siguen sonando después del final: se cortan en el borde
    const w = Math.min(width - x, Math.max(2, (note.length / terrario.duration) * width));
    const y = (1 - (pitches[i] - low) / range) * (height - 4);
    return `<rect class="print__note" style="--t: ${round(x / width)}" x="${round(x)}" y="${round(y)}" width="${round(w)}" height="3" rx="1.5" />`;
  });

  return `
    <svg class="print" viewBox="0 0 ${width} ${height}" aria-hidden="true">
      ${[0.25, 0.5, 0.75].map((f) => `<line class="print__guide" x1="0" y1="${height * f}" x2="${width}" y2="${height * f}" />`).join("")}
      ${rects.join("")}
      <line class="print__playhead" x1="0" y1="0" x2="0" y2="${height}" />
    </svg>
  `;
}
