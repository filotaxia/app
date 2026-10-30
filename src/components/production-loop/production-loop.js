/* ============================================
   Components — Production Loop
   ============================================ */

// La Producción: un dibujo que se mueve solo (CSS) y que se explora tocando.
// Cada terrario tiene dos Biodata, y cada uno lleva lo suyo a otro lado:
//
//   arriba  las plantas  → Biodata 02 → el Microfreak (el sintetizador)
//   abajo   el sustrato  → Biodata 01 → la compu (Ableton)
//
// (Los mismos nombres que las dos líneas de la Partitura, en Escuchar:
// audio/lanes.js.)
//
// Los cables van en blanco, con la corriente corriendo siempre; las partes
// (plantas, sustrato, las dos cajas, el sintetizador y la compu) en gris.
// Tocar una parte la enciende en blanco y, debajo, cuenta qué hace (como los
// puntos de la pantalla 2 del Manifiesto). Mientras tanto, por los cables
// MIDI pasan notas, el sintetizador cambia de onda y suena, y en la compu el
// cabezal recorre la pieza. Lo usa el Manifiesto (pantalla 6).
//
//   productionLoop()          → el cuadro al revés del tema (como el de la Guía)
//   bindProductionLoop(root)  → tocar una parte la explica

// Lo que se lee debajo del dibujo antes de tocar algo
const INTRO = ["/Producción", "Tocá cada parte del dibujo para ver qué hace."];

// Cada parte: [nombre, texto]. Las claves son las del data-part del dibujo.
const PARTS = {
  plantas: ["/Plantas",
    "Generan señales eléctricas con lo que pasa afuera (el tacto, la luz, la temperatura) y adentro, como la fotosíntesis. Dos electrodos en sus hojas las leen."],
  sustrato: ["/Sustrato",
    "Un electrodo en la tierra capta su actividad eléctrica: la otra mitad de la pieza."],
  "biodata-02": ["/Biodata 02",
    "Capta las bioemisiones de las plantas y, cada vez que cambia su conductividad, genera una nota MIDI. Se las pasa al Microfreak."],
  "biodata-01": ["/Biodata 01",
    "Hace lo mismo con el sustrato: vuelve sus variaciones eléctricas notas MIDI y se las pasa a la compu."],
  microfreak: ["/Microfreak",
    "Biodata entrega notas, no sonido. En el sintetizador le damos una voz a cada planta: una onda que sale de la forma de sus hojas."],
  ableton: ["/Ableton",
    "Las notas del sustrato entran a la compu y se suman a las de las plantas. Ahí queda grabada la pieza de tu terrario."],
};

// Dónde está cada cosa en el dibujo (320 × 200)
const PLANT_BOX = { x: 122, y: 36 };      // Biodata 02, el de las plantas
const SUBSTRATE_BOX = { x: 122, y: 130 }; // Biodata 01, el del sustrato
const SYNTH = { x: 200, y: 30 };          // el Microfreak

export function productionLoop() {
  const [label, text] = INTRO;
  return `
    <figure class="connect-loop connect-loop--inverse production-loop" data-production>
      <svg class="connect-loop__stage" viewBox="0 0 320 200" role="group" aria-label="Las partes de la producción">
        ${cables()}
        ${terrarium()}
        ${part("biodata-02", biodata(PLANT_BOX), PLANT_BOX.x, PLANT_BOX.y, 48, 36)}
        ${part("biodata-01", biodata(SUBSTRATE_BOX), SUBSTRATE_BOX.x, SUBSTRATE_BOX.y, 48, 36)}
        ${part("microfreak", synth(SYNTH), SYNTH.x, SYNTH.y, 110, 48)}
        ${part("ableton", computer(), 206, 118, 100, 59)}
        ${notes(172, 54, 22)}
        ${notes(172, 148, 36)}
        ${sound(SYNTH)}
      </svg>
      <figcaption class="production-loop__info" aria-live="polite">
        <span class="chip connect-loop__index" data-part-label>${label}</span>
        <span class="connect-loop__text" data-part-text>${text}</span>
      </figcaption>
    </figure>
  `;
}

// Tocar una parte (o elegirla con el teclado: Enter o espacio) la enciende
// y cuenta qué hace
export function bindProductionLoop(root) {
  const box = root.querySelector("[data-production]");
  if (!box) return;
  const parts = [...box.querySelectorAll("[data-part]")];
  const label = box.querySelector("[data-part-label]");
  const text = box.querySelector("[data-part-text]");

  function pick(chosen) {
    parts.forEach((p) => p.setAttribute("aria-pressed", String(p === chosen)));
    [label.textContent, text.textContent] = PARTS[chosen.dataset.part];
  }

  parts.forEach((p) => {
    p.addEventListener("click", () => pick(p));
    p.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      // un click (los elementos SVG no tienen .click()), así el Manifiesto
      // también frena el autoplay
      p.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
  });
}

// Una parte que se toca: su dibujo y, debajo, un rectángulo invisible que
// agranda el área para el dedo (y marca el foco con el teclado)
function part(key, drawing, x, y, width, height, pad = 6) {
  return `
    <g class="production-loop__part" data-part="${key}" role="button" tabindex="0"
      aria-pressed="false" aria-label="${PARTS[key][0].slice(1)}">
      <rect class="production-loop__hit" x="${x - pad}" y="${y - pad}"
        width="${width + pad * 2}" height="${height + pad * 2}" rx="4" />
      ${drawing}
    </g>
  `;
}

// Los cables, siempre blancos y con corriente: la línea y, encima, rayitas
// que corren en el sentido del cable (de la planta a Biodata, de Biodata al
// sintetizador o a la compu), como energía que pasa. Los de los electrodos
// salen de las hojas por la boca de la pecera y del sustrato.
function cables() {
  const paths = [
    "M41 95C40 50 90 44 122 50",
    "M55 93C58 60 96 62 122 58",
    "M62 126C82 126 100 148 122 148",
    "M170 54h30",
    "M170 148h44",
  ];
  return `
    <g class="production-loop__cables">
      ${paths.map((d) => `
        <path class="production-loop__cable" d="${d}" />
        <path class="production-loop__flow" d="${d}" />`).join("")}
    </g>
  `;
}

// La pecera del TR01 (el mismo dibujo que en connect-loop, agrandado 4,5
// veces), partida en dos partes que se tocan: las plantas (con un electrodo
// en cada hoja) y el sustrato (con el suyo). El vidrio queda siempre gris.
// El área del sustrato baja un poco más allá del vidrio: así mide 44px para el dedo.
function terrarium() {
  const scaled = (paths) => `
    <g transform="translate(48 100) scale(4.5) translate(-12 -12)">
      ${paths.map((d) => `<path d="${d}" />`).join("")}
    </g>`;
  return `
    <g class="production-loop__glass">
      ${scaled([
        "M8.5 4.5h7",
        "M8.5 4.5C5.8 5.9 4 8.7 4 12a8 8 0 0 0 16 0c0-3.3-1.8-6.1-4.5-7.5",
      ])}
    </g>
    ${part("plantas", `
      ${scaled([
        "M12 15.5v-4.5",
        "M12 13c-1.8 0-3-1.2-3-3 1.8 0 3 1.2 3 3z",
        "M12 12c1.8 0 3-1.2 3-3-1.8 0-3 1.2-3 3z",
      ])}
      <circle class="connect-loop__fill" cx="41" cy="95" r="2.5" />
      <circle class="connect-loop__fill" cx="55" cy="93" r="2.5" />`, 22, 78, 52, 37, 2)}
    ${part("sustrato", `
      ${scaled(["M5 15.5h14"])}
      <circle class="connect-loop__fill" cx="62" cy="126" r="2.5" />`, 22, 117, 52, 36, 2)}
  `;
}

// Una caja de Biodata (48 × 36) con su logo: un brote cuyas raíces son un circuito
function biodata({ x, y }) {
  const cx = x + 24;
  return `
    <rect x="${x}" y="${y}" width="48" height="36" rx="4" />
    <path d="M${cx} ${y + 13}c-5 0-8-3-8-7 5 0 8 3 8 7z" />
    <path d="M${cx} ${y + 13}c5 0 8-3 8-7-5 0-8 3-8 7z" />
    <path d="M${cx} ${y + 13}v7M${cx} ${y + 20}l-8 5v3M${cx} ${y + 20}l8 5v3M${cx} ${y + 20}v8" />
    ${[-8, 0, 8].map((dx) => `<circle class="connect-loop__fill" cx="${cx + dx}" cy="${y + 29.5}" r="1.5" />`).join("")}
  `;
}

// Tres notas que pasan por un cable MIDI, una detrás de la otra.
// `run` es el largo del cable: hasta dónde llegan.
function notes(x, y, run) {
  return `
    <g class="production-loop__notes" style="--run: ${run}px">
      ${[0, 1, 2].map((i) => `<circle class="connect-loop__fill production-loop__note" style="--i: ${i}" cx="${x}" cy="${y}" r="2.2" />`).join("")}
    </g>
  `;
}

// El Microfreak (110 × 48): perillas y pantalla arriba, el teclado plano abajo.
// Las teclas se encienden, la segunda perilla gira y la pantalla cambia de onda
// (seno → triángulo → sierra, como las formas de las hojas).
function synth({ x, y }) {
  const keyWidth = 110 / 14;
  const round = (n) => Math.round(n * 10) / 10;
  const keyLines = Array.from({ length: 13 }, (_, k) => `M${round(x + (k + 1) * keyWidth)} ${y + 24}v24`).join("");
  // Las teclas que se encienden: una nota distinta cada vez
  const keys = [2, 6, 9, 4]
    .map((k, i) => `<rect class="connect-loop__fill production-loop__key" style="--i: ${i}"
      x="${round(x + k * keyWidth + 1.5)}" y="${y + 26}" width="4.9" height="20" rx="1" />`)
    .join("");
  const knob = (kx) => `<circle cx="${kx}" cy="${y + 12}" r="4.5" /><path d="M${kx} ${y + 12}v-4.5" />`;
  const wave = y + 12;   // la línea del medio de la pantalla

  return `
    <rect x="${x}" y="${y}" width="110" height="48" rx="4" />
    <path d="M${x} ${y + 24}h110" />
    <path d="${keyLines}" />
    ${keys}
    ${knob(x + 12)}
    <g class="production-loop__knob" style="transform-origin: ${x + 26}px ${y + 12}px">${knob(x + 26)}</g>
    ${knob(x + 40)}
    <rect x="${x + 50}" y="${y + 6}" width="26" height="12" rx="1.5" />
    <path class="production-loop__wave production-loop__wave--sine" d="M${x + 52} ${wave}q2.75-5 5.5 0t5.5 0t5.5 0t5.5 0" />
    <path class="production-loop__wave production-loop__wave--triangle" d="M${x + 52} ${wave}l2.75-3.5 5.5 7 5.5-7 5.5 7 2.75-3.5" />
    <path class="production-loop__wave production-loop__wave--saw" d="M${x + 52} ${wave + 3.5}l5.5-7v7l5.5-7v7l5.5-7v7l5.5-7v7" />
    ${knob(x + 88)}
    ${knob(x + 100)}
  `;
}

// El sonido que sale del sintetizador: tres arcos, de adentro hacia afuera
function sound({ x, y }) {
  return `
    <g class="production-loop__sound">
      ${[[43, 8, 12, 7], [37, 15, 18, 10], [31, 22, 24, 13]]
        .map(([dx, dy, half, rise], i) => `<path class="production-loop__arc" style="--i: ${i}"
          d="M${x + dx} ${y - dy}q${half}-${rise} ${half * 2} 0" />`).join("")}
    </g>
  `;
}

// La compu con Ableton: las pistas de la pieza (rectángulos, como los clips)
// y el cabezal que las recorre
function computer() {
  const tracks = [
    [[220, 22], [246, 30], [280, 12]],
    [[226, 34], [264, 24]],
    [[220, 16], [240, 20], [266, 26]],
    [[232, 40], [276, 16]],
  ];
  const clips = tracks
    .flatMap((row, r) => row.map(([x, w]) => `<rect x="${x}" y="${126 + r * 10}" width="${w}" height="6" rx="1" />`))
    .join("");

  return `
    <rect x="214" y="118" width="84" height="52" rx="3" />
    <path d="M206 170h100l-5 7h-90z" />
    ${clips}
    <line class="production-loop__playhead" x1="218" y1="122" x2="218" y2="166" />
  `;
}
