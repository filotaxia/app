/* ============================================
   Views — Terrario compare
   ============================================ */

// La portada de la ficha cuando el terrario tiene modelo 3D (model_photo):
// un "antes / después", copia del de Formas (views/formas-ondas, compare /
// bindCompare). A la izquierda de la línea, el modelo 3D; a la derecha, la
// foto (la misma que se ve en Escuchar). Las dos imágenes tienen el mismo
// encuadre, así que arrastrar la línea "revela" el terrario real.
//
//   photoCompare(terrario)  → el HTML
//   bindPhotoCompare(root)  → lo arranca; devuelve la función que lo apaga
//
// A diferencia de Formas, la línea es siempre recta (sin el resorte que la
// curva): la perilla sigue al dedo y la capa del modelo se corta en ese x.
// La línea es el propio grip (un div, no un SVG), así puede ser de vidrio.

import { codeOf } from "../../content/terrarios.js";
import { escapeHTML } from "../../utils/html.js";

export function photoCompare(terrario) {
  return `
    <div class="photo-cmp" data-photo-cmp role="slider" tabindex="0"
      aria-label="${escapeHTML(`${codeOf(terrario)}: modelo 3D o foto`)}"
      aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">
      <div class="photo-cmp__layer">
        <img class="photo-cmp__img" src="${escapeHTML(terrario.photo)}" alt="" draggable="false" decoding="async">
      </div>
      <div class="photo-cmp__layer" data-photo-cmp-before>
        <img class="photo-cmp__img" src="${escapeHTML(terrario.model_photo)}" alt="" draggable="false" decoding="async">
      </div>
      <span class="photo-cmp__grip" data-photo-cmp-grip>
        <span class="photo-cmp__knob">
          <svg width="16" height="10" viewBox="0 0 16 10" aria-hidden="true">
            <path d="M5 1 1 5l4 4M11 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      </span>
    </div>
  `;
}

export function bindPhotoCompare(root) {
  const box = root.querySelector("[data-photo-cmp]");
  if (!box) return () => {};
  const before = box.querySelector("[data-photo-cmp-before]");
  const grip = box.querySelector("[data-photo-cmp-grip]");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  let cur = 0.5;            // dónde está la línea (0 = izquierda, 1 = derecha)
  let target = null;        // adónde se desliza sola (null = a ningún lado)
  let raf = 0;
  let drag = null;

  function draw() {
    const W = box.clientWidth;
    const x = (cur * W).toFixed(2);
    before.style.clipPath = `inset(0 ${W - x}px 0 0)`;
    grip.style.left = `${x}px`;
    box.setAttribute("aria-valuenow", String(Math.round(cur * 100)));
  }

  // Desliza la línea hasta target (al tocar, con las flechas o con un tirón)
  function loop() {
    if (raf) return;
    let prev = performance.now();
    const step = (t) => {
      const dt = Math.min(0.033, (t - prev) / 1000);
      prev = t;
      cur += (target - cur) * (1 - Math.pow(0.0004, dt));
      const done = still || Math.abs(target - cur) < 0.0005;
      if (done) {
        cur = target;
        target = null;
      }
      draw();
      raf = done ? 0 : requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  const glide = (to) => { target = to; loop(); };
  // Bajo el dedo: la línea va justo donde está el dedo
  const place = (v) => {
    target = null;
    cancelAnimationFrame(raf);
    raf = 0;
    cur = v;
    draw();
  };
  const at = (clientX) => {
    const r = box.getBoundingClientRect();
    return clamp((clientX - r.left) / r.width, 0, 1);
  };

  box.addEventListener("pointerdown", (event) => {
    box.setPointerCapture?.(event.pointerId);
    const v = at(event.clientX);
    drag = { v: 0, t: performance.now(), last: v };
    box.toggleAttribute("data-held", true);
    glide(v);
  });
  box.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const v = at(event.clientX);
    const now = performance.now();
    drag.v = (v - drag.last) / Math.max(1, now - drag.t);
    drag.t = now;
    drag.last = v;
    place(v);
  });
  const onUp = (event) => {
    const d = drag;
    drag = null;
    box.toggleAttribute("data-held", false);
    if (box.hasPointerCapture?.(event.pointerId)) box.releasePointerCapture(event.pointerId);
    // un tirón con envión la lleva hasta el borde hacia el que se tiró
    if (event.type === "pointerup" && d && Math.abs(d.v) > 0.0025) glide(d.v > 0 ? 1 : 0);
  };
  box.addEventListener("pointerup", onUp);
  box.addEventListener("pointercancel", onUp);
  box.addEventListener("keydown", (event) => {
    const step = { ArrowLeft: -0.1, ArrowRight: 0.1 }[event.key];
    if (!step) return;
    event.preventDefault();
    glide(clamp((target ?? cur) + step, 0, 1));
  });

  // Se dibuja cuando la caja ya tiene tamaño (las vistas se arman fuera de la página)
  const resize = new ResizeObserver(draw);
  resize.observe(box);

  return () => {
    cancelAnimationFrame(raf);
    resize.disconnect();
  };
}
