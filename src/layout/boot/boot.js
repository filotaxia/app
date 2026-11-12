/* ============================================
   Layout — Boot
   ============================================ */

// El loader de arranque: una esfera de puntos conectados por líneas finas
// (una red, no un dibujo fijo), que gira despacio — como el "Connecting
// Orb" de referencia (particle node graph), pero en vanilla JS/SVG, sin
// React ni ninguna librería, y en blanco/negro/gris (DESIGN.md).
//
// Los puntos se reparten parejo sobre una esfera (espiral de Fibonacci, los
// mismos N para siempre: nada al azar, así el dibujo es igual cada vez) y
// se conectan con sus vecinos más cercanos en 3D — esa distancia no cambia
// al girar (es un sólido rígido), así las líneas se calculan una sola vez.
// Cada cuadro solo gira los puntos (Y y un poco en X, con el tiempo) y
// vuelve a proyectarlos: el punto que queda "adelante" se dibuja más grande
// y más claro (más cerca), el de atrás más chico y apagado — así se lee la
// esfera sin necesitar 3D de verdad. Un puñado de líneas llevan, además,
// una "señal" que las recorre en loop.
//
// Arranca solo (self.js, primer <script type="module"> del body: corre
// antes que main.js) y se saca solo: espera BOOT_MS Y a que el router haya
// pintado la primera pantalla ("filotaxia:ready", que dispara main.js); lo
// que tarde más de los dos. "Reducir movimiento": ni gira, queda quieta.

const N = 34;              // puntos de la esfera
const NEIGHBORS = 2;       // aristas por punto (a sus vecinos más cercanos)
const SIGNALS = 5;         // cuántas aristas llevan una señal viajera
const R = 86;              // radio de la esfera, en el viewBox de 240×240
const CX = 120, CY = 120;
const BOOT_MS = 5000;
const SIGNAL_MS = 2200;

const stillness = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Espiral de Fibonacci: N puntos parejos sobre la esfera unitaria
function spherePoints(count) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const pts = [];
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    pts.push({ x: Math.cos(theta) * ring, y, z: Math.sin(theta) * ring });
  }
  return pts;
}

// Las aristas: cada punto con sus `k` vecinos más cercanos (en el radio
// unitario, antes de escalar — da lo mismo, la distancia relativa no cambia)
function nearestEdges(pts, k) {
  const edges = new Set();
  pts.forEach((p, i) => {
    const dists = pts
      .map((q, j) => [j, (p.x - q.x) ** 2 + (p.y - q.y) ** 2 + (p.z - q.z) ** 2])
      .filter(([j]) => j !== i)
      .sort((a, b) => a[1] - b[1])
      .slice(0, k);
    dists.forEach(([j]) => edges.add(i < j ? `${i}-${j}` : `${j}-${i}`));
  });
  return [...edges].map((key) => key.split("-").map(Number));
}

export function bindBoot(root) {
  const svg = root.querySelector("[data-boot-orb]");
  if (!svg) return;

  const points = spherePoints(N);
  const edges = nearestEdges(points, NEIGHBORS);
  const signalEdges = edges.filter((_, i) => i % Math.ceil(edges.length / SIGNALS) === 0).slice(0, SIGNALS);

  const ns = "http://www.w3.org/2000/svg";
  const make = (tag) => document.createElementNS(ns, tag);

  const lineEls = edges.map(() => {
    const line = make("line");
    line.setAttribute("class", "boot__link");
    svg.append(line);
    return line;
  });
  const dotEls = points.map(() => {
    const circle = make("circle");
    circle.setAttribute("class", "boot__node");
    svg.append(circle);
    return circle;
  });
  const signalEls = signalEdges.map(() => {
    const circle = make("circle");
    circle.setAttribute("class", "boot__signal");
    circle.setAttribute("r", "2.6");
    svg.append(circle);
    return circle;
  });

  const still = stillness();
  const projected = points.map((p) => ({ ...p }));

  function project(t) {
    const angleY = still ? 0.6 : t * 0.00022;
    const angleX = still ? 0.2 : Math.sin(t * 0.00015) * 0.3;
    const cosY = Math.cos(angleY), sinY = Math.sin(angleY);
    const cosX = Math.cos(angleX), sinX = Math.sin(angleX);

    points.forEach((p, i) => {
      const x1 = p.x * cosY + p.z * sinY;
      const z1 = -p.x * sinY + p.z * cosY;
      const y1 = p.y * cosX - z1 * sinX;
      const z2 = p.y * sinX + z1 * cosX;
      const q = projected[i];
      q.x = x1; q.y = y1; q.z = z2;
      q.sx = CX + x1 * R;
      q.sy = CY + y1 * R;
      q.depth = clamp((z2 + 1) / 2, 0, 1);   // 0 atrás, 1 adelante
    });
  }

  function paint(t) {
    project(t);

    dotEls.forEach((circle, i) => {
      const q = projected[i];
      circle.setAttribute("cx", q.sx.toFixed(2));
      circle.setAttribute("cy", q.sy.toFixed(2));
      circle.setAttribute("r", lerp(1.1, 4, q.depth).toFixed(2));
      circle.style.opacity = lerp(0.32, 1, q.depth).toFixed(2);
    });

    edges.forEach(([a, b], i) => {
      const line = lineEls[i];
      line.setAttribute("x1", projected[a].sx.toFixed(2));
      line.setAttribute("y1", projected[a].sy.toFixed(2));
      line.setAttribute("x2", projected[b].sx.toFixed(2));
      line.setAttribute("y2", projected[b].sy.toFixed(2));
    });

    signalEdges.forEach(([a, b], i) => {
      const k = ((t / SIGNAL_MS + i / signalEdges.length) % 1);
      const pa = projected[a], pb = projected[b];
      const circle = signalEls[i];
      circle.setAttribute("cx", lerp(pa.sx, pb.sx, k).toFixed(2));
      circle.setAttribute("cy", lerp(pa.sy, pb.sy, k).toFixed(2));
      // se prende y se apaga yendo de una punta a la otra, no aparece de golpe
      circle.style.opacity = (Math.sin(k * Math.PI) * 0.9).toFixed(2);
    });
  }

  let raf = 0;
  if (still) {
    paint(0);
  } else {
    const tick = (t) => { paint(t); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
  }

  // Se saca sola: BOOT_MS como mínimo, y recién cuando el router ya pintó
  // la primera pantalla (main.js avisa con este evento al terminar)
  const boot = root.querySelector("[data-boot]");
  const start = performance.now();
  let ready = false;
  let done = false;

  function finish() {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    boot.addEventListener("transitionend", () => boot.classList.add("boot--done"), { once: true });
    boot.classList.add("boot--out");
  }

  function maybeFinish() {
    if (!ready) return;
    const rest = BOOT_MS - (performance.now() - start);
    if (rest > 0) setTimeout(finish, rest);
    else finish();
  }

  window.addEventListener("filotaxia:ready", () => { ready = true; maybeFinish(); }, { once: true });
}
