/* ============================================
   Views — Manifiesto
   ============================================ */

// Introducción a la biosonificación en cinco pantallas, para que la pieza
// se escuche como lo que es (y no como ruido al azar):
//
//   1. Gancho      una cita de filotaxia.com, distinta cada vez que se abre
//                  (content/citas.js; la última mostrada queda en el store)
//   2. Mecanismo   01 / 02 / 03, de la planta a la nota, con un gráfico por paso
//                  que entra uno después del otro (señal → sensor → notas)
//   3. Idioma      cada forma de hoja → su onda (components/leaf-waves)
//   4. Prueba      la huella de TU pieza: sus notas reales (audio/score.js)
//                  en un piano roll que un cabezal recorre, con nombre y fecha
//   5. Cierre      "Escuchar mi terrario" → reproductor
//
// Se ve una sola vez: la ficha (views/terrario) manda acá en el primer escaneo,
// con el id del terrario (#/manifiesto/04). "Saltar" o el botón final guardan
// `manifiesto_seen` y siguen al reproductor de ese terrario.
// Desde Ajustes se vuelve a abrir sin id (#/manifiesto): ahí "Saltar" es "Cerrar".
//
// La pantalla 1 apoya la cita abajo a la izquierda (como las cards de citas
// de filotaxia.com); la 3 va con el título arriba y las tarjetas grandes
// abajo; las demás van centradas.
//
// Se pasa de pantalla deslizando (scroll-snap nativo), tocando (izquierda
// = atrás, resto = adelante), con "Siguiente" o con las flechas del teclado.

import { get, set } from "../../store/store.js";
import { linkedIds } from "../../store/collection.js";
import { myTerrarioId } from "../../store/my-terrario.js";
import { TERRARIOS, getTerrario } from "../../content/terrarios.js";
import { QUOTES, nextQuoteIndex } from "../../content/citas.js";
import { buildScore, seedFrom } from "../../audio/score.js";
import { leafWaves } from "../../components/leaf-waves/leaf-waves.js";
import { formatDate } from "../../utils/format.js";
import { escapeHTML } from "../../utils/html.js";
import { arrow } from "../../utils/icons.js";

export const title = "Manifiesto";
export const nav = false;

const SLIDES = [
  // 1. Gancho: una cita del Manifiesto de filotaxia.com (libro + autor abajo)
  ({ quote }) => `
    <figure class="manifiesto__quote">
      <blockquote class="manifiesto__big">“${quote.text}”</blockquote>
      <figcaption class="lead">
        <cite class="manifiesto__cite">${quote.book}</cite>
        <span>— ${quote.author}</span>
      </figcaption>
    </figure>
  `,
  // 2. Mecanismo: paso a paso, cada uno con su gráfico (ver mechanism() más abajo)
  `
    <p class="eyebrow">Biosonificación</p>
    ${mechanism()}
  `,
  // 3. Idioma: título arriba a la izquierda y las cuatro hojas grandes abajo,
  //    en igualdad (todavía no es tu terrario); cada una gira: hoja → su onda
  `
    <p class="manifiesto__title">Cada planta.<br />Su propia onda.</p>
    ${leafWaves({ flip: true })}
  `,
  // 4. Prueba: depende del terrario, por eso es una función (ver render)
  ({ terrario }) => `
    ${pieceGraphic(terrario)}
    <div class="manifiesto__quote">
      <p class="manifiesto__big">Esta pieza nació de esta planta, en este momento exacto.</p>
      <p class="eyebrow">${escapeHTML(terrario.name)} · ${formatDate(terrario.recorded)}</p>
    </div>
  `,
  // 5. Cierre (el botón está abajo, fuera del carrusel)
  `
    <div class="manifiesto__quote manifiesto__quote--center">
      <p class="manifiesto__big">Esto es lo que estás por escuchar.</p>
    </div>
  `,
];

// Ubicación del contenido: centrado salvo estas dos
const SLIDE_LAYOUT = {
  0: "manifiesto__slide--bottom",   // la cita, abajo a la izquierda
  2: "manifiesto__slide--split",    // título arriba, tarjetas abajo
};

export async function render(root, { params }) {
  const terrario = await pickTerrario(params.id);

  // Una cita distinta cada vez: la que sigue a la última que se mostró
  const quoteIndex = nextQuoteIndex(await get("manifiesto_quote"));
  await set("manifiesto_quote", quoteIndex);
  const quote = QUOTES[quoteIndex];

  // Con id: viene del primer escaneo → termina en el reproductor de ese terrario.
  // Sin id: se abrió desde Ajustes → "Cerrar" vuelve ahí.
  const player = params.id ? `#/escuchar/${params.id}` : "#/escuchar";
  const exit = params.id ? player : "#/ajustes";
  const last = SLIDES.length - 1;

  root.innerHTML = `
    <section class="screen manifiesto">
      <h1 class="visually-hidden" tabindex="-1">Manifiesto</h1>

      <div class="manifiesto__top">
        <ol class="manifiesto__progress" aria-hidden="true">
          ${SLIDES.map(() => `<li class="manifiesto__bar"></li>`).join("")}
        </ol>
        <div class="manifiesto__meta">
          <span class="eyebrow" data-count aria-hidden="true">01 / 0${SLIDES.length}</span>
          <a class="text-link manifiesto__skip" href="${exit}" data-done>${params.id ? "Saltar" : "Cerrar"}</a>
        </div>
      </div>

      <div class="manifiesto__track" data-track aria-roledescription="carrusel" aria-label="Manifiesto">
        ${SLIDES.map((slide, i) => `
          <section class="manifiesto__slide ${SLIDE_LAYOUT[i] ?? ""}" data-slide="${i}" aria-roledescription="pantalla"
            aria-label="${i + 1} de ${SLIDES.length}" ${i ? 'aria-hidden="true"' : ""}>
            ${typeof slide === "function" ? slide({ terrario, quote }) : slide}
          </section>`).join("")}
      </div>

      <div class="manifiesto__actions">
        <button class="text-link" type="button" data-next>Siguiente ${arrow()}</button>
        <a class="btn btn--primary" href="${player}" data-done hidden>Escuchar mi terrario</a>
      </div>
    </section>
  `;

  const track = root.querySelector("[data-track]");
  const slides = [...root.querySelectorAll("[data-slide]")];
  const bars = [...root.querySelectorAll(".manifiesto__bar")];
  const count = root.querySelector("[data-count]");
  const next = root.querySelector("[data-next]");
  const finish = root.querySelector(".btn[data-done]");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let current = 0;

  function goTo(index) {
    const target = Math.max(0, Math.min(last, index));
    track.scrollTo({ left: target * track.clientWidth, behavior: reduceMotion ? "auto" : "smooth" });
  }

  // Pinta la pantalla actual: barras de progreso, contador, botón de abajo
  function show(index) {
    current = index;
    slides[index].dataset.seen = "";   // arranca su animación de entrada (una vez)
    bars.forEach((bar, i) => bar.classList.toggle("is-done", i <= index));
    slides.forEach((slide, i) => slide.toggleAttribute("aria-hidden", i !== index));
    count.textContent = `${String(index + 1).padStart(2, "0")} / ${String(SLIDES.length).padStart(2, "0")}`;
    next.hidden = index === last;
    finish.hidden = index !== last;
  }

  // La pantalla que más se ve es la actual (sirve igual para swipe, tap o teclado)
  const observer = new IntersectionObserver(
    (entries) => entries.forEach((entry) => entry.isIntersecting && show(Number(entry.target.dataset.slide))),
    { root: track, threshold: 0.6 },
  );
  slides.forEach((slide) => observer.observe(slide));

  // Tocar: el tercio izquierdo vuelve, el resto avanza
  track.addEventListener("click", (event) => {
    const { left, width } = track.getBoundingClientRect();
    goTo(event.clientX - left < width / 3 ? current - 1 : current + 1);
  });
  next.addEventListener("click", () => goTo(current + 1));

  // Saltar / Cerrar / Escuchar mi terrario: ya lo vio
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
    document.removeEventListener("keydown", onKey);
  };
}

/* ---------------------------------------- */
/* Pantalla 2: el mecanismo, paso a paso */
/* ---------------------------------------- */

// Los tres gráficos cuentan la misma señal, cada vez más "música":
//   01  la señal eléctrica de la planta, nerviosa y continua (se dibuja sola)
//   02  el sensor la lee: muestras puntuales, una tras otra
//   03  cada muestra pasa a ser una nota (como un piano roll)
// Todos miden 320 × 64 y usan currentColor, así siguen al tema.
// Son funciones (no constantes) para poder usarlas arriba, en SLIDES.

function mechanism() {
  const steps = [
    ["Cada planta genera microfluctuaciones eléctricas constantes", signalGraphic()],
    ["Un sensor las capta en tiempo real", sensorGraphic()],
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
/* Pantalla 4: la huella de tu pieza */
/* ---------------------------------------- */

// El terrario de la pantalla 4: el recién escaneado (id en la ruta); si se
// abrió desde Ajustes, el propio o el primero de la colección; si no hay
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
