/* ============================================
   Views — Escuchar (bloques)
   ============================================ */

// Los bloques que aparecen al bajar en el reproductor, como en la pantalla
// "reproduciendo" de Spotify (Letras · Acerca de esta canción · SongDNA ·
// Videos relacionados · Créditos · Explorá):
//
//   Partitura.             las notas MIDI de los dos Biodata (plantas y
//                          sustrato), con un cabezal que avanza con el audio
//                          (el equivalente a "Letras"); se amplía a pantalla
//                          completa (scoreFull)
//   Acerca de esta pieza.  su historia, la fecha de grabación y la duración
//   Plantas. / Ondas.      el bloque de Mi terrario: las plantas y, con el
//                          botón de la derecha, la onda de cada una
//   Capas.                 las capas del terrario, con sus imágenes en movimiento
//   Créditos.              quién hace la pieza: el sensor (Biodata) y Filotaxia
//   Más terrarios.         los otros terrarios conectados en este teléfono
//
// Cada función devuelve HTML (o "" si no hay datos para ese bloque).
// La partitura se conecta al reproductor con bindScore() (devuelve paint(time)).

import { codeOf } from "../../content/terrarios.js";
import { WAVE_NAMES } from "../../content/plantas.js";
import { LAYERS } from "../../content/ayuda.js";
import { LANES } from "../../audio/lanes.js";
import { noteName } from "../../utils/midi.js";
import { terrariumArt } from "../../components/terrarium-art/terrarium-art.js";
import { plantsBlock } from "../../components/plants-block/plants-block.js";
import { formatDate, formatTime } from "../../utils/format.js";
import { escapeHTML } from "../../utils/html.js";
import { icon, arrow } from "../../utils/icons.js";

export function sections({ terrario, lanes, others }) {
  return [
    scoreCard(terrario, lanes),
    aboutPiece(terrario),
    plantsCard(terrario),
    layersCard(),
    creditsCard(),
    moreCard(others),
  ].join("");
}

// Encabezado de un bloque: título con punto a la izquierda y, si hay,
// algo chico a la derecha
function head(title, aside = "") {
  return `
    <div class="player-card__head">
      <h2 class="player-card__title">${title}</h2>
      ${aside}
    </div>
  `;
}

/* ---------------------------------------- */
/* Partitura (en negro, como la tarjeta de Letras) */

// Las dos secuencias MIDI (audio/lanes.js), una franja por Biodata: arriba
// las plantas, abajo el sustrato. Cada nota es una rayita: el tiempo va de
// izquierda a derecha y la altura, de grave (abajo) a agudo (arriba). La tira
// entera se corre hacia la izquierda mientras suena y el cabezal queda quieto
// a un cuarto del ancho; las notas que ya sonaron se encienden.
// El botón de ampliar (como el de Letras) abre la partitura a pantalla
// completa: las franjas más altas y la nota que suena en cada una.

const CARD = { pps: 16, height: 56 };   // px por segundo y alto de cada franja
const FULL = { pps: 40, height: 160 };

function scoreCard(terrario, lanes) {
  const total = LANES.reduce((sum, { key }) => sum + lanes[key].length, 0);
  return `
    <section class="player-card player-card--inverse" aria-labelledby="card-score">
      <div class="player-card__head">
        <h2 class="player-card__title" id="card-score">Partitura.</h2>
        <button class="score-expand" type="button" data-score-open aria-label="Ampliar la partitura">${icon("maximize-2")}</button>
      </div>
      <div class="score-lanes">
        ${LANES.map((lane) => `
          <div class="score-lane">
            <p class="score-lane__label">${lane.name}</p>
            ${laneStrip(lanes[lane.key], lane.key, terrario.duration, CARD)}
          </div>`).join("")}
      </div>
      <p class="player-card__note">Dos Biodata, dos secuencias MIDI: ${total} notas de las plantas y el sustrato.</p>
    </section>
  `;
}

// La partitura a pantalla completa: un <dialog> con las dos franjas grandes,
// la nota que suena ahora en cada una, play/pausa y lo escuchado
export function scoreFull(terrario, lanes) {
  return `
    <dialog class="score-full" data-score-full aria-labelledby="score-full-title">
      <div class="score-full__inner">
        <div class="score-full__head">
          <div>
            <h2 class="score-full__title" id="score-full-title">Partitura.</h2>
            <p class="score-full__sub">${escapeHTML(codeOf(terrario))} · Filotaxia</p>
          </div>
          <button class="btn btn--icon score-full__close" type="button" data-score-close aria-label="Cerrar">${icon("x")}</button>
        </div>

        ${LANES.map((lane) => `
          <section class="score-full__lane">
            <div class="score-full__lane-head">
              <div>
                <h3 class="score-full__lane-name">${lane.name}</h3>
                <p class="score-full__lane-detail">${lane.biodata} · ${lane.detail}</p>
              </div>
              <p class="score-full__now" data-lane-now="${lane.key}" aria-hidden="true"></p>
            </div>
            ${laneStrip(lanes[lane.key], lane.key, terrario.duration, FULL)}
            ${lanes.real[lane.key] ? "" : `<p class="score-full__sim">Simulada: todavía no se cargó el MIDI de este Biodata.</p>`}
          </section>`).join("")}

        <div class="score-full__foot">
          <div class="score-full__progress"><span data-progress-line></span></div>
          <div class="score-full__controls">
            <span class="score-full__time" data-elapsed>0:00</span>
            <button class="player__play" type="button" data-toggle aria-label="Reproducir">
              <span data-icon-play>${icon("play")}</span>
              <span data-icon-pause hidden>${icon("pause")}</span>
            </button>
            <span class="score-full__time" data-remaining>-${formatTime(terrario.duration)}</span>
          </div>
        </div>
      </div>
    </dialog>
  `;
}

// Una franja: un SVG tan ancho como la pieza (pps px por segundo)
function laneStrip(notes, key, duration, { pps, height }) {
  const width = Math.ceil(duration * pps);
  const pitches = notes.map((note) => note.midi);
  const low = Math.min(...pitches);
  const range = Math.max(...pitches) - low || 1;

  const rects = notes.map((note) => {
    const y = 2 + (1 - (note.midi - low) / range) * (height - 8);
    const w = Math.max(3, note.length * pps);
    return `<rect class="score__note" x="${Math.round(note.time * pps)}" y="${Math.round(y)}" width="${Math.round(w)}" height="4" />`;
  });

  return `
    <div class="score" style="height: ${height}px" aria-hidden="true">
      <svg class="score__track" data-score-track data-lane="${key}" data-pps="${pps}"
        width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${rects.join("")}</svg>
      <span class="score__playhead"></span>
    </div>
  `;
}

// Conecta las franjas (las de la tarjeta y las de pantalla completa) con el
// tiempo del reproductor: corre cada tira y enciende las notas que ya pasaron
// (con un índice por tira, así no recorre todas en cada tick; si se vuelve
// atrás, las apaga). En pantalla completa, además, escribe la nota que suena.
export function bindScore(root, lanes) {
  const strips = [...root.querySelectorAll("[data-score-track]")].map((track) => ({
    track,
    pps: Number(track.dataset.pps),
    rects: [...track.querySelectorAll(".score__note")],
    notes: lanes[track.dataset.lane],
    played: 0,
  }));
  const readouts = [...root.querySelectorAll("[data-lane-now]")];

  return function paint(time) {
    strips.forEach((strip) => {
      strip.track.style.setProperty("--shift", `${-time * strip.pps}px`);
      let next = strip.notes.findIndex((note) => note.time > time);
      if (next === -1) next = strip.notes.length;
      for (let i = strip.played; i < next; i++) strip.rects[i].classList.add("is-played");
      for (let i = next; i < strip.played; i++) strip.rects[i].classList.remove("is-played");
      strip.played = next;
    });

    readouts.forEach((readout) => {
      const notes = lanes[readout.dataset.laneNow];
      const sounding = notes.filter((note) => note.time <= time && note.time + note.length > time);
      readout.textContent = sounding.length ? noteName(sounding[sounding.length - 1].midi) : "";   // en silencio, nada
    });
  };
}

/* ---------------------------------------- */
/* Acerca de esta pieza */

function aboutPiece(terrario) {
  const waves = terrario.waves ?? ["sine"];
  return `
    <section class="player-card" aria-labelledby="card-about">
      ${head(`<span id="card-about">Acerca de esta pieza.</span>`)}
      ${terrario.story ? `<p class="player-card__story">${escapeHTML(terrario.story)}</p>` : ""}
      <dl class="player-card__facts">
        <div><dt>Grabada</dt><dd>${formatDate(terrario.recorded)}</dd></div>
        <div><dt>Duración</dt><dd>${formatTime(terrario.duration)}</dd></div>
        <div><dt>Ondas</dt><dd>${waves.map((wave) => WAVE_NAMES[wave] ?? wave).join(" · ")}</dd></div>
      </dl>
    </section>
  `;
}

/* ---------------------------------------- */
/* Plantas / Ondas */

// El mismo bloque que en Mi terrario (components/plants-block): las plantas
// en filas y, arriba a la derecha, el botón negro que cambia a sus ondas.
// Si el terrario no tiene plantas cargadas, una tarjeta con sus ondas.
function plantsCard(terrario) {
  return plantsBlock(terrario) || wavesCard(terrario);
}

function wavesCard(terrario) {
  const waves = terrario.waves ?? ["sine"];
  return `
    <section class="player-card" aria-labelledby="card-waves">
      ${head(`<span id="card-waves">Ondas.</span>`)}
      <ul class="dna" role="list">
        ${waves.map((wave) => `
          <li class="dna__item">
            <span class="dna__art dna__art--wave">${icon(`wave-${wave}`)}</span>
            <span class="dna__name">${WAVE_NAMES[wave] ?? wave}</span>
          </li>`).join("")}
      </ul>
    </section>
  `;
}

/* ---------------------------------------- */
/* Las cuatro capas (como Videos relacionados) */

// Fila que se desliza de costado. Las imágenes son los GIF de filotaxia.com
// (content/ayuda.js); loading="lazy" para no bajarlos hasta que se ven.
function layersCard() {
  return `
    <section class="player-card player-card--rail" aria-labelledby="card-layers">
      ${head(`<span id="card-layers">Capas.</span>`)}
      <ul class="rail" role="list">
        ${LAYERS.map(([name, material, , media], i) => `
          <li class="rail__item">
            <span class="rail__media">
              <img src="${media}" alt="" loading="lazy" decoding="async" />
              <span class="rail__badge">Capa${String(i + 1).padStart(2, "0")}/</span>
            </span>
            <span class="rail__name">${name}</span>
            <span class="rail__detail">${material}</span>
          </li>`).join("")}
      </ul>
    </section>
  `;
}

/* ---------------------------------------- */
/* Créditos */

// Quién hace la pieza: el sensor que lee las plantas y Filotaxia
const CREDITS = [
  ["Biodata", "Sensor · lee la señal eléctrica de las hojas"],
  ["Filotaxia", "Producción musical · Sintetizador"],
];

function creditsCard() {
  const rows = CREDITS;

  return `
    <section class="player-card" aria-labelledby="card-credits">
      ${head(`<span id="card-credits">Créditos.</span>`)}
      <ul class="credits" role="list">
        ${rows.map(([name, role]) => `
          <li class="credits__row">
            <span class="credits__name">${escapeHTML(name)}</span>
            <span class="credits__role">${role}</span>
          </li>`).join("")}
      </ul>
    </section>
  `;
}

/* ---------------------------------------- */
/* Más terrarios (como "Explorá…") */

// Los otros terrarios conectados en este teléfono; si no hay, no se muestra
function moreCard(others) {
  if (!others.length) return "";
  return `
    <section class="player-card player-card--rail" aria-labelledby="card-more">
      ${head(`<span id="card-more">Más terrarios.</span>`, `<a class="player-card__link" href="#/coleccion">Colección ${arrow()}</a>`)}
      <ul class="rail rail--square" role="list">
        ${others.map((other) => `
          <li class="rail__item">
            <a class="rail__link" href="#/escuchar/${other.id}">
              <span class="rail__media">${terrariumArt({ photo: other.photo, size: "sm" })}</span>
              <span class="rail__name">${escapeHTML(codeOf(other))}</span>
              <span class="rail__detail">${formatTime(other.duration)}</span>
            </a>
          </li>`).join("")}
      </ul>
    </section>
  `;
}
