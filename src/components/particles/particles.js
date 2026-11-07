/* ============================================
   Components — Particles
   ============================================ */

// ══ Particles ════════════════════════════════════════════
// A shape made of dots. Move over it and the dots are pushed
// away from the pointer and spring home behind it; press and a
// shockwave throws them out, and they gather again into the
// NEXT shape — circle, square, flower, round again.
//
// ── ONE SET OF DOTS, MANY SHAPES ────────────────────────
// The dots never change, only where home is. Every shape is
// sampled to the same number of points, and a change of shape
// pairs each dot with a new home by angle round the middle, so
// the swarm sweeps round into the new outline rather than
// crossing itself.
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

export const SHAPES = ["Circle", "Square", "Flower"];

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function outline(s) {
  const p = new Path2D();
  if (s === "Circle") p.arc(CX, CY, 150, 0, Math.PI * 2);
  else if (s === "Square") p.roundRect(CX - 140, CY - 140, 280, 280, 36);
  else {
    // cinco pétalos redondos alrededor de un centro más chico —
    // círculos dibujados todos en el mismo sentido, así el relleno
    // es su unión; los pétalos apenas se tocan con sus vecinos,
    // para que las muescas entre ellos se vean del mismo grano
    // que los puntos
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
      const x = CX + Math.cos(a) * 104;
      const y = CY + 8 + Math.sin(a) * 104;
      p.moveTo(x + 60, y);
      p.arc(x, y, 60, 0, Math.PI * 2);
    }
    p.moveTo(CX + 58, CY + 8);
    p.arc(CX, CY + 8, 58, 0, Math.PI * 2);
  }
  return p;
}

// ── N puntos, repartidos parejo adentro de una forma ──
// Una grilla hexagonal espaciada para que la forma tenga
// alrededor de N puntos — su área sobre N, que es el espaciado
// que la llena pareja — y después se recorta o se completa hasta
// llegar a exactamente N. Antes era una grilla fina fija
// adelgazada con un paso, y el paso pulsaba contra la grilla: el
// círculo salía en bandas de zigzag.
function homes(s) {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  const path = outline(s);
  let area = 0;
  for (let y = 1; y < H; y += 2) for (let x = 1; x < W; x += 2) if (g.isPointInPath(path, x, y)) area += 4;
  const sp = Math.sqrt((area / N) * (2 / Math.sqrt(3)));
  const rowH = (sp * Math.sqrt(3)) / 2;
  const pts = [];
  for (let y = rowH / 2, row = 0; y < H; y += rowH, row++) {
    for (let x = sp / 2 + (row % 2) * (sp / 2); x < W; x += sp) {
      if (g.isPointInPath(path, x, y)) pts.push([x, y]);
    }
  }
  // a unos pocos de N de cualquier lado: se descarta o se repite parejo
  const out = [];
  for (let i = 0; i < N; i++) out.push(pts[Math.floor((i * pts.length) / N)]);
  return out;
}

const angle = (x, y) => Math.atan2(y - CY, x - CX);

// El <canvas>, listo para insertar con innerHTML.
export function particles() {
  return `
    <div class="ptc">
      <canvas class="ptc-canvas" role="img"
        aria-label="Una forma hecha de puntos. Moveté encima; tocá para cambiar la forma."></canvas>
    </div>
  `;
}

// Arranca el dibujo y los eventos sobre el <canvas> de dentro de `root`.
//   shape  la forma con la que abre ("Circle", "Square" o "Flower")
//   reach  hasta dónde llega el empuje del puntero, en px
//   force  qué tan fuerte empuja, 0..100
//   grain  el tamaño de cada punto ("Fine" o "Coarse")
// Devuelve { stop() }, para cuando se sale de la pantalla.
export function bindParticles(root, { shape = "Circle", reach = 80, force = 60, grain = "Fine" } = {}) {
  const canvas = root.querySelector(".ptc-canvas");
  if (!canvas) return { stop() {} };

  const still = stillness();
  const dots = [];
  let at = "Circle";
  let hand = null;
  let raf = 0;
  const knobs = { reach, force, grain };

  // ── le da a cada punto una casa en una forma ──────────────
  function become(s) {
    at = s;
    const next = homes(s);
    if (!dots.length) {
      next.forEach(([x, y]) => dots.push({ hx: x, hy: y, x, y, vx: 0, vy: 0 }));
      return;
    }
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

  const s = SHAPES.includes(shape) ? shape : "Circle";
  become(s);
  draw();
  run();

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
    // la onda de choque, y después la próxima forma
    const p = where(event);
    if (!still) {
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
    }
    become(SHAPES[(SHAPES.indexOf(at) + 1) % SHAPES.length]);
    draw();
    run();
  }

  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerleave", onLeave);
  canvas.addEventListener("pointerdown", onDown);

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
    },
  };
}
