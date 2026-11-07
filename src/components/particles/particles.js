/* ============================================
   Components — Particles
   ============================================ */

// ══ Particles ════════════════════════════════════════════
// A shape made of dots. Move over it and the dots are pushed
// away from the pointer and spring home behind it; press and a
// shockwave throws them out, and they gather again into the
// NEXT shape — the four leaf shapes of the catalog below
// (puntiaguda, redondeada, dentada, recta; content/plantas.js),
// round again.
//
// ── ONE SET OF DOTS, MANY SHAPES ────────────────────────
// The dots never change, only where home is. Every shape is
// sampled to the same number of points, and a change of shape
// pairs each dot with a new home by angle round the middle, so
// the swarm sweeps round into the new outline rather than
// crossing itself.
//
// ── LAS FORMAS SALEN DE LAS FOTOS ───────────────────────
// Cada forma es una de las cuatro fotos de hoja (fondo
// transparente) de src/assets/images/hojas/ — las mismas que usa
// leaf-waves en su cara "hoja". Se dibuja la foto en un canvas
// aparte y se muestrean sus puntos donde el alfa no es
// transparente; el resultado (y la imagen ya cargada) se
// cachean, así cambiar de forma la segunda vez es instantáneo.
//
// ── STRETCHED BY SPEED ──────────────────────────────────
// A dot at rest is round; a moving one is drawn a little long
// along the way it is going, which is what makes a burst read
// as a splash rather than a scatter of points.
//
// Portado de un componente React (Bencho, MIT) a JS plano para
// este proyecto (sin build, sin React): en vez de hooks, un
// closure por instancia armado en bindParticles(root), con el
// mismo loop de física. El color de los puntos sigue a
// --color-text (ver particles.css), así sigue al tema igual
// que el resto de los dibujos de línea de la app.
//
//   particles()               → el <canvas>, listo para insertar
//   bindParticles(root, opts) → arranca el dibujo y los eventos;
//                                devuelve { stop() } para el cleanup

import { LEAVES, WAVE_NAMES } from "../../content/plantas.js";

// Se lee una sola vez, como el resto de los chequeos de
// "reducir movimiento" de la app (el Manifiesto, por ejemplo):
// una preferencia, no algo que cambia en vivo.
const stillness = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const W = 480;
const H = 400;
const CX = W / 2;
const CY = H / 2;
// cuántos puntos tiene cada forma
const N = 720;

// Las cuatro hojas del catálogo (content/plantas.js), en el mismo orden
// que leaf-waves
export const SHAPES = Object.keys(LEAVES);
const LEAF_DIR = "src/assets/images/hojas/";
// margen alrededor de la hoja dentro del lienzo de muestreo
const PAD = 36;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// Carga (una sola vez por hoja) la foto de src/assets/images/hojas/
const leafImages = new Map();
function leafImage(key) {
  if (!leafImages.has(key)) {
    leafImages.set(
      key,
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = LEAF_DIR + key + ".webp";
      })
    );
  }
  return leafImages.get(key);
}

// ── N puntos, repartidos parejo adentro de la silueta de la hoja ──
// Una grilla hexagonal espaciada para que la forma tenga alrededor de N
// puntos — su área sobre N, que es el espaciado que la llena pareja — y
// después se recorta o se completa hasta llegar a exactamente N (como la
// vieja grilla de formas vectoriales, pero el "adentro" ahora lo decide el
// alfa de la foto en vez de un Path2D).
async function homes(key) {
  const img = await leafImage(key);
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  const scale = Math.min((W - PAD * 2) / img.width, (H - PAD * 2) / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  g.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  const { data } = g.getImageData(0, 0, W, H);
  const opaque = (x, y) => {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || iy < 0 || ix >= W || iy >= H) return false;
    return data[(iy * W + ix) * 4 + 3] > 128;
  };
  let area = 0;
  for (let y = 1; y < H; y += 2) for (let x = 1; x < W; x += 2) if (opaque(x, y)) area += 4;
  const sp = Math.sqrt((area / N) * (2 / Math.sqrt(3)));
  const rowH = (sp * Math.sqrt(3)) / 2;
  const pts = [];
  for (let y = rowH / 2, row = 0; y < H; y += rowH, row++) {
    for (let x = sp / 2 + (row % 2) * (sp / 2); x < W; x += sp) {
      if (opaque(x, y)) pts.push([x, y]);
    }
  }
  // a unos pocos de N de cualquier lado: se descarta o se repite parejo
  const out = [];
  for (let i = 0; i < N; i++) out.push(pts[Math.floor((i * pts.length) / N)]);
  return out;
}

// Los puntos de cada hoja, calculados una sola vez (muestrear la foto no es
// gratis): la segunda vez que se pasa por esa forma ya está lista.
const homesCache = new Map();
function homesFor(key) {
  if (!homesCache.has(key)) homesCache.set(key, homes(key));
  return homesCache.get(key);
}

const angle = (x, y) => Math.atan2(y - CY, x - CX);

// El canvas (la hoja hecha de puntos) y, debajo, donde la referencia pone
// sus dos números (00:00 … 03:33:09), el nombre de la hoja a la izquierda y
// el de su onda a la derecha; más abajo, los puntos de navegación, uno por
// hoja — tocar el canvas en el celular no debe cambiar la forma por
// accidente, así que el cambio de forma vive en los puntos, no en el canvas
// (que solo empuja y hace la onda de choque).
export function particles() {
  const leaf = LEAVES[SHAPES[0]];
  return `
    <div class="ptc">
      <canvas class="ptc-canvas" role="img"
        aria-label="Las hojas del catálogo, hechas de puntos. Moveté encima o tocá para empujar los puntos."></canvas>
      <div class="ptc-info">
        <p class="ptc-info__item">
          <span class="ptc-info__caption">forma</span>
          <span class="ptc-info__leaf" data-leaf-name>${leaf.label}</span>
        </p>
        <p class="ptc-info__item ptc-info__item--end">
          <span class="ptc-info__caption">onda</span>
          <span class="ptc-info__wave" data-wave-name>${WAVE_NAMES[leaf.wave]}</span>
        </p>
      </div>
      <div class="ptc-nav" role="group" aria-label="Hoja">
        ${SHAPES.map((key) => `
          <button class="ptc-dot" type="button" data-shape="${key}" aria-pressed="false" aria-label="Mostrar hoja ${LEAVES[key].label}"></button>
        `).join("")}
      </div>
    </div>
  `;
}

// Arranca el dibujo y los eventos sobre el <canvas> de dentro de `root`.
//   shape  la hoja con la que abre ("puntiaguda", "redondeada", "dentada" o "recta")
//   reach  hasta dónde llega el empuje del puntero, en px
//   force  qué tan fuerte empuja, 0..100
//   grain  el tamaño de cada punto ("Fine" o "Coarse")
// Devuelve { stop() }, para cuando se sale de la pantalla.
export function bindParticles(root, { shape = SHAPES[0], reach = 80, force = 60, grain = "Fine" } = {}) {
  const canvas = root.querySelector(".ptc-canvas");
  if (!canvas) return { stop() {} };
  const navDots = [...root.querySelectorAll(".ptc-dot")];
  const leafName = root.querySelector("[data-leaf-name]");
  const waveName = root.querySelector("[data-wave-name]");

  const still = stillness();
  const dots = [];
  let at = SHAPES[0];
  let hand = null;
  let raf = 0;
  let gen = 0;   // para que un become() viejo no pise a uno más nuevo
  const knobs = { reach, force, grain };

  // ── le da a cada punto una casa en una hoja ──────────────
  // homesFor() es async (muestrea la foto la primera vez), así que un
  // segundo become() puede llegar antes de que el primero termine: `gen`
  // descarta la respuesta vieja.
  async function become(s) {
    at = s;
    // los nombres y los puntos cambian al toque, no esperan a la foto
    const leaf = LEAVES[s];
    if (leafName) leafName.textContent = leaf.label;
    if (waveName) waveName.textContent = WAVE_NAMES[leaf.wave];
    navDots.forEach((dot) => dot.setAttribute("aria-pressed", String(dot.dataset.shape === s)));
    const myGen = ++gen;
    const next = await homesFor(s);
    if (myGen !== gen) return;
    if (!dots.length) {
      next.forEach(([x, y]) => dots.push({ hx: x, hy: y, x, y, vx: 0, vy: 0 }));
    } else {
      // se emparejan por ángulo alrededor del centro, así el enjambre barre
      const a = dots.map((d, i) => [angle(d.x, d.y), i]).sort((p, q) => p[0] - q[0]);
      const b = next.map((h, i) => [angle(h[0], h[1]), i]).sort((p, q) => p[0] - q[0]);
      a.forEach(([, di], k) => {
        const h = next[b[k][1]];
        dots[di].hx = h[0];
        dots[di].hy = h[1];
        if (still) { dots[di].x = h[0]; dots[di].y = h[1]; }
      });
    }
    draw();
    run();
  }

  function draw() {
    const x = canvas.getContext("2d");
    const k = canvas.width / W;
    x.setTransform(k, 0, 0, k, 0, 0);
    x.clearRect(0, 0, W, H);
    x.fillStyle = getComputedStyle(canvas).color;
    const r = knobs.grain === "Coarse" ? 2.7 : 1.9;
    x.beginPath();
    for (const d of dots) {
      const sp = Math.hypot(d.vx, d.vy);
      if (sp < 0.3) {
        x.moveTo(d.x + r, d.y);
        x.arc(d.x, d.y, r, 0, Math.PI * 2);
      } else {
        // largo en el sentido en que va, un poco fino a través
        const s = Math.min(2.6, 1 + sp * 0.12);
        const rot = Math.atan2(d.vy, d.vx);
        x.moveTo(d.x + Math.cos(rot) * r * s, d.y + Math.sin(rot) * r * s);
        x.ellipse(d.x, d.y, r * s, r / Math.sqrt(s), rot, 0, Math.PI * 2);
      }
    }
    x.fill();
  }

  function run() {
    if (raf) return;
    let prev = 0;
    const tick = (t) => {
      const dt = prev ? clamp((t - prev) / 16.67, 0, 2.5) : 1;
      prev = t;
      const R = clamp(knobs.reach, 30, 160);
      const S = (clamp(knobs.force, 0, 100) / 100) * 11;
      let busy = !!hand;
      for (const d of dots) {
        if (hand) {
          const dx = d.x - hand.x;
          const dy = d.y - hand.y;
          const dd = Math.hypot(dx, dy);
          if (dd < R && dd > 0.01) {
            const f = Math.pow(1 - dd / R, 2) * S;
            d.vx += (dx / dd) * f * dt;
            d.vy += (dy / dd) * f * dt;
          }
        }
        d.vx = (d.vx + (d.hx - d.x) * 0.05 * dt) * Math.pow(0.84, dt);
        d.vy = (d.vy + (d.hy - d.y) * 0.05 * dt) * Math.pow(0.84, dt);
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        if (Math.abs(d.hx - d.x) < 0.05 && Math.abs(d.hy - d.y) < 0.05 && Math.abs(d.vx) < 0.02 && Math.abs(d.vy) < 0.02) {
          d.x = d.hx; d.y = d.hy; d.vx = 0; d.vy = 0;
        } else busy = true;
      }
      draw();
      raf = busy ? requestAnimationFrame(tick) : 0;
    };
    raf = requestAnimationFrame(tick);
  }

  function where(event) {
    const r = canvas.getBoundingClientRect();
    const k = r.width / W;
    return { x: (event.clientX - r.left) / k, y: (event.clientY - r.top) / k };
  }

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);

  const s = SHAPES.includes(shape) ? shape : SHAPES[0];
  become(s);

  function onMove(event) {
    if (still) return;
    hand = where(event);
    run();
  }
  function onLeave() {
    hand = null;
    run();
  }
  function onDown(event) {
    // solo la onda de choque: la forma no cambia al tocar el canvas (en el
    // celular un toque sin querer no debe cambiarla); eso lo hacen los
    // puntos de abajo (ptc-nav)
    if (still) return;
    const p = where(event);
    const S = 0.4 + (clamp(knobs.force, 0, 100) / 100) * 1.2;
    for (const d of dots) {
      const dx = d.x - p.x;
      const dy = d.y - p.y;
      const dd = Math.hypot(dx, dy);
      if (dd > 200 || dd < 0.01) continue;
      const f = (1 - dd / 200) * 30 * S;
      d.vx += (dx / dd) * f;
      d.vy += (dy / dd) * f;
    }
    run();
  }
  function onNavClick(event) {
    become(event.currentTarget.dataset.shape);
  }

  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerleave", onLeave);
  canvas.addEventListener("pointerdown", onDown);
  navDots.forEach((dot) => dot.addEventListener("click", onNavClick));

  // Si cambia el tema (claro/oscuro) mientras está quieto, lo vuelve a pintar
  const mo = new MutationObserver(draw);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  return {
    stop() {
      cancelAnimationFrame(raf);
      raf = 0;
      mo.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerdown", onDown);
      navDots.forEach((dot) => dot.removeEventListener("click", onNavClick));
    },
  };
}
