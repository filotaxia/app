/* ============================================
   Views — Formas y ondas
   ============================================ */

// Filotaxia (#/formas-ondas; se llega por la card "Plantas." o el rombo de
// la barra): la génesis del proyecto. Header propio (no el de app-header):
// título "Formas" + subtítulo + Ajustes, adentro del mismo cuadro oscuro
// que "leafwave": un "antes / después" (la hoja a la izquierda de la
// línea, su onda a la derecha; arrastrar la línea pasa de una a la otra) y,
// abajo, cuatro botones para elegir la forma de hoja — ver compare /
// bindCompare. El proceso ("1 proceso / 3 etapas") vive en la Guía.
// Debajo del cuadro, el nombre de la planta que se está
// mostrando ("Planta" de bajada, eyebrow) y components/particles: la hoja
// hecha de puntos (se puede empujar y hacer explotar tocando); las flechas
// ‹ › ya no recorren las cuatro formas únicas: recorren el catálogo de
// suculentas de abajo, planta por planta (bindParticles(root, { onStep })
// le pasa el mando de las flechas a esta vista, ver particles.js); tocar
// una planta del catálogo va directo a ella. Debajo del dibujo, su forma y
// su onda; y al final, el catálogo.

import { particles, bindParticles } from "../../components/particles/particles.js";
import { PLANTAS, LEAVES, WAVE_NAMES } from "../../content/plantas.js";
import { escapeHTML } from "../../utils/html.js";
import { settingsLink } from "../../components/settings-link/settings-link.js";

let currentIndex = 0;

export const title = "Formas";
export const header = false;

export function render(root) {
  currentIndex = 0;

  root.innerHTML = `
    <section class="leafwave reveal" aria-label="Cada forma de hoja y su onda">
      <header class="formas-hero-top">
        <div>
          <h1 class="formas-hero-title" tabindex="-1">Formas</h1>
          <p class="formas-hero-subtitle">De la forma a la vibración</p>
        </div>
        ${settingsLink()}
      </header>
      ${compare(SHAPES[0])}
      <div class="cmp-shapes" role="group" aria-label="Forma de hoja">
        ${SHAPES.map((key, i) => `
          <button class="cmp-shapes__option" type="button" data-shape="${key}" aria-pressed="${i === 0}">
            ${escapeHTML(LEAVES[key].label)}
          </button>`).join("")}
      </div>
    </section>

    <section class="art reveal" data-art>
      <header class="plant-heading">
        <h2 class="plant-heading__catalog">Catálogo</h2>
        <div class="plant-heading__current">
          <h3 class="plant-heading__name" data-plant-name>${escapeHTML(PLANTAS[currentIndex].name)}</h3>
          <p class="plant-heading__label">Planta</p>
        </div>
      </header>
      ${particles()}
    </section>

    <section class="shapes-catalog reveal" aria-label="El catálogo">
      <ul class="shapes-catalog__list">
        ${PLANTAS.map(({ name, leaf, photo }, i) => `
          <li>
            <button class="shapes-catalog__item" type="button" data-index="${i}"
              aria-label="Ver la hoja de ${escapeHTML(name)} en el dibujo de puntos">
              <img class="shapes-catalog__photo" src="src/assets/images/plantas/${photo}" alt="" loading="lazy" decoding="async">
              <span class="shapes-catalog__caption">
                <span class="shapes-catalog__name">${escapeHTML(name)}</span>
                <span class="shapes-catalog__leaf">${escapeHTML(LEAVES[leaf].label)}</span>
              </span>
            </button>
          </li>`).join("")}
      </ul>
    </section>
  `;

  const stopCompare = bindCompare(root);

  const art = root.querySelector("[data-art]");
  const nameEl = root.querySelector("[data-plant-name]");

  // Las flechas del canvas recorren este mismo catálogo (goTo), no las
  // cuatro formas; particlesToy se arma antes de goTo pero goTo se usa
  // recién al tocar una flecha o una planta, así que el orden no importa.
  const particlesToy = bindParticles(root, {
    shape: PLANTAS[currentIndex].leaf,
    onStep: (dir) => goTo(currentIndex + dir),
  });

  function goTo(i) {
    const n = PLANTAS.length;
    currentIndex = ((i % n) + n) % n;
    const plant = PLANTAS[currentIndex];
    particlesToy.show(plant.leaf);
    nameEl.textContent = plant.name;
    document.title = `${plant.name} · Filotaxia`;
  }

  root.querySelectorAll("[data-index]").forEach((button) => {
    button.addEventListener("click", () => {
      goTo(Number(button.dataset.index));
      art.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  return () => {
    particlesToy.stop();
    stopCompare();
  };
}

// Hoja → onda: un "antes / después" (portado de un componente React,
// "Image compare"). A la izquierda de la línea, la hoja; a la derecha, su
// onda: arrastrar la línea muestra una forma o la otra. Abajo, cuatro
// botones cambian de hoja (las cuatro formas de content/plantas.js).
//
//   compare(key)       → el HTML, con la hoja `key` ("puntiaguda"…)
//   bindCompare(root)  → la arranca; devuelve la función que la apaga
//
// LA LÍNEA ES GELATINA: la perilla está justo donde está el dedo; las dos
// puntas de la línea no: la siguen con un resorte, así un tirón fuerte las
// deja atrás y la línea se curva, y se endereza al soltar. La capa de la
// hoja se corta por la MISMA curva (clip-path: path(), en píxeles de la
// caja), así el borde de la foto se dobla con la línea. Arrastrar despacio
// la deja donde se suelta; un tirón con envión la lleva hasta el borde.
const SHAPES = Object.keys(LEAVES);

function compare(key) {
  const { label, wave } = LEAVES[key];
  return `
    <div class="cmp" data-cmp role="slider" tabindex="0"
      aria-label="Hoja ${escapeHTML(label.toLowerCase())} u onda ${escapeHTML(WAVE_NAMES[wave].toLowerCase())}"
      aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">
      <div class="cmp__layer cmp__layer--after">
        <span class="cmp__wave leaf-wave__icon leaf-wave__icon--${wave}" data-cmp-wave aria-hidden="true"></span>
        <span class="cmp__tag cmp__tag--after" data-cmp-tag="after"><span class="cmp__caption">onda</span> ${escapeHTML(WAVE_NAMES[wave])}</span>
      </div>
      <div class="cmp__layer cmp__layer--before" data-cmp-before>
        <img class="cmp__leaf" src="src/assets/images/hojas/${key}.webp" alt="" draggable="false" decoding="async" data-cmp-leaf>
        <span class="cmp__tag" data-cmp-tag="before"><span class="cmp__caption">hoja</span> ${escapeHTML(label)}</span>
      </div>
      <svg class="cmp__line" data-cmp-line aria-hidden="true"><path /></svg>
      <span class="cmp__grip" data-cmp-grip>
        <span class="cmp__knob">
          <svg width="16" height="10" viewBox="0 0 16 10" aria-hidden="true">
            <path d="M5 1 1 5l4 4M11 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      </span>
    </div>
  `;
}

function bindCompare(root) {
  const box = root.querySelector("[data-cmp]");
  const before = box.querySelector("[data-cmp-before]");
  const svg = box.querySelector("[data-cmp-line]");
  const line = svg.querySelector("path");
  const grip = box.querySelector("[data-cmp-grip]");
  const tagBefore = box.querySelector('[data-cmp-tag="before"]');
  const tagAfter = box.querySelector('[data-cmp-tag="after"]');
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  let cur = 0.5;            // dónde está la perilla (0 = izquierda, 1 = derecha)
  let target = null;        // adónde se desliza sola (null = a ningún lado)
  const ends = { x: 0.5, v: 0 };   // las puntas de la línea y su velocidad
  let bend = 0;
  let raf = 0;
  let drag = null;

  function draw() {
    const W = box.clientWidth;
    const H = box.clientHeight;
    const x = cur * W;
    const top = x - bend;
    const mid = x + bend;   // el punto de control: así la curva pasa justo por la perilla
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    line.setAttribute("d", `M ${top.toFixed(2)} 0 Q ${mid.toFixed(2)} ${H / 2} ${top.toFixed(2)} ${H}`);
    before.style.clipPath = `path("M 0 0 L ${top.toFixed(2)} 0 Q ${mid.toFixed(2)} ${H / 2} ${top.toFixed(2)} ${H} L 0 ${H} Z")`;
    grip.style.left = `${x}px`;
    box.setAttribute("aria-valuenow", String(Math.round(cur * 100)));
  }

  // Un solo loop para los dos movimientos (deslizarse hasta target y las
  // puntas alcanzando a la perilla); se frena solo cuando todo está quieto
  function loop() {
    if (raf) return;
    let prev = performance.now();
    const step = (t) => {
      const dt = Math.min(0.033, (t - prev) / 1000);
      prev = t;
      if (target !== null) {
        cur += (target - cur) * (1 - Math.pow(0.0004, dt));
        if (still || Math.abs(target - cur) < 0.0005) {
          cur = target;
          target = null;
        }
      }
      ends.v += ((cur - ends.x) * 620 - ends.v * 44) * dt;
      ends.x += ends.v * dt;
      if (still) ends.x = cur;
      bend = clamp((cur - ends.x) * box.clientWidth * 0.5, -9, 9);
      const done = target === null && Math.abs(cur - ends.x) < 0.0006 && Math.abs(ends.v) < 0.002;
      if (done) {
        ends.x = cur;
        ends.v = 0;
        bend = 0;
      }
      draw();
      raf = done ? 0 : requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  const glide = (to) => { target = to; loop(); };
  // Bajo el dedo: la perilla se dibuja ya; solo las puntas quedan para el loop
  const place = (v) => { target = null; cur = v; draw(); loop(); };
  const at = (clientX) => {
    const r = box.getBoundingClientRect();
    return clamp((clientX - r.left) / r.width, 0, 1);
  };

  const onDown = (event) => {
    box.setPointerCapture?.(event.pointerId);
    const v = at(event.clientX);
    drag = { v: 0, t: performance.now(), last: v };
    box.toggleAttribute("data-held", true);
    glide(v);
  };
  const onMove = (event) => {
    if (!drag) return;
    const v = at(event.clientX);
    const now = performance.now();
    drag.v = (v - drag.last) / Math.max(1, now - drag.t);
    drag.t = now;
    drag.last = v;
    place(v);
  };
  const onUp = (event) => {
    const d = drag;
    drag = null;
    box.toggleAttribute("data-held", false);
    if (box.hasPointerCapture?.(event.pointerId)) box.releasePointerCapture(event.pointerId);
    // un tirón con envión la lleva hasta el borde hacia el que se tiró
    if (event.type === "pointerup" && d && Math.abs(d.v) > 0.0025) glide(d.v > 0 ? 1 : 0);
  };
  const onKey = (event) => {
    const step = { ArrowLeft: -0.1, ArrowRight: 0.1 }[event.key];
    if (!step) return;
    event.preventDefault();
    glide(clamp((target ?? cur) + step, 0, 1));
  };

  // Cambiar de hoja: la foto, la onda y los nombres; la línea queda donde está
  const options = [...root.querySelectorAll("[data-shape]")];
  const onPick = (event) => {
    const button = event.target.closest("[data-shape]");
    if (!button) return;
    const key = button.dataset.shape;
    const { label, wave } = LEAVES[key];
    options.forEach((option) => option.setAttribute("aria-pressed", String(option === button)));
    box.querySelector("[data-cmp-leaf]").src = `src/assets/images/hojas/${key}.webp`;
    box.querySelector("[data-cmp-wave]").className = `cmp__wave leaf-wave__icon leaf-wave__icon--${wave}`;
    tagBefore.lastChild.textContent = ` ${label}`;
    tagAfter.lastChild.textContent = ` ${WAVE_NAMES[wave]}`;
    box.setAttribute("aria-label", `Hoja ${label.toLowerCase()} u onda ${WAVE_NAMES[wave].toLowerCase()}`);
  };
  const shapes = root.querySelector(".cmp-shapes");

  box.addEventListener("pointerdown", onDown);
  box.addEventListener("pointermove", onMove);
  box.addEventListener("pointerup", onUp);
  box.addEventListener("pointercancel", onUp);
  box.addEventListener("keydown", onKey);
  shapes.addEventListener("click", onPick);
  // Se dibuja cuando la caja ya tiene tamaño (las vistas se arman fuera de la página)
  const resize = new ResizeObserver(draw);
  resize.observe(box);

  return () => {
    cancelAnimationFrame(raf);
    resize.disconnect();
    shapes.removeEventListener("click", onPick);
  };
}
