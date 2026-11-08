/* ============================================
   Components — Loader
   ============================================ */

// El loader del sitio: una forma que muda de círculo a cuadrado, triángulo,
// hexágono y rombo y vuelve, girando despacio — "Morph", de
// beui.dev/components/motion/loader (MIT). El original usa React + Framer
// Motion para interpolar la `d` del <path>; acá, sin ninguna de las dos, se
// arma cada cuadro a mano con un loop de requestAnimationFrame (mismo
// patrón que particles.js), interpolando punto a punto entre las formas —
// las cinco tienen los mismos 24 puntos, así el tween es real y no un salto.
//
//   loader({ size })        → el <span role="status">, listo para insertar
//   bindLoader(root, opts)  → arranca el morph; devuelve { stop() }, para el
//                              cleanup de la vista cuando el loader se saca

const POINTS = 24;
const SIZE = 100; // viewBox 0 0 100 100, como el original
const RADIUS = 46;

function ngonRadius(angle, sides, phase = 0) {
  const seg = (2 * Math.PI) / sides;
  const a = angle - phase;
  const local = (((a % seg) + seg) % seg) - seg / 2;
  return Math.cos(Math.PI / sides) / Math.cos(local);
}

// Los 24 puntos de una forma, sobre el borde de su radio en cada ángulo
function shape(radiusAt) {
  const pts = [];
  for (let i = 0; i < POINTS; i++) {
    const angle = (i / POINTS) * 2 * Math.PI - Math.PI / 2;
    const r = Math.min(1.05, radiusAt(angle));
    pts.push([SIZE / 2 + Math.cos(angle) * RADIUS * r, SIZE / 2 + Math.sin(angle) * RADIUS * r]);
  }
  return pts;
}

// Círculo, cuadrado, triángulo, hexágono, rombo — las mismas cinco del original
const SHAPES = [
  shape(() => 1),
  shape((a) => ngonRadius(a, 4, Math.PI / 4)),
  shape((a) => ngonRadius(a, 3)),
  shape((a) => ngonRadius(a, 6)),
  shape((a) => ngonRadius(a, 4)),
];

// Cada forma aparece dos veces seguidas (se arma y queda quieta un momento)
// antes de mudar a la siguiente; el giro y la escala solo cambian en los
// tramos de cambio de forma, así una forma ya armada no se mueve
const SEQUENCE = [...SHAPES.flatMap((s) => [s, s]), SHAPES[0]];
const ROTATION = [0, 0, 72, 72, 144, 144, 216, 216, 288, 288, 360];
const SCALE = [1, 1, 0.88, 0.88, 1, 1, 0.88, 0.88, 1, 1, 1];

const pathOf = (pts) => `${pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ")} Z`;
const lerp = (a, b, t) => a + (b - a) * t;
const lerpPoints = (a, b, t) => a.map(([x, y], i) => [lerp(x, b[i][0], t), lerp(y, b[i][1], t)]);

// Aproxima --ease-standard (cubic-bezier(.4,0,.2,1)), la curva del resto de la app
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

const stillness = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// `label` describe lo que está cargando ("Cargando", "Conectando"…); si al
// lado ya hay un texto que lo dice (admin-form.js, con aria-live en el
// párrafo que lo contiene), pasá `label: null` y el loader queda decorativo
// (aria-hidden), para no anunciarlo dos veces.
export function loader({ size = 32, label = "Cargando" } = {}) {
  const a11y = label ? `role="status" aria-label="${label}"` : `aria-hidden="true"`;
  return `
    <span class="loader" ${a11y} style="--loader-size: ${size}px">
      <svg class="loader__svg" viewBox="0 0 ${SIZE} ${SIZE}" aria-hidden="true">
        <path class="loader__path" d="${pathOf(SHAPES[0])}" fill="currentColor"></path>
      </svg>
    </span>
  `;
}

// Arranca el morph sobre el primer .loader de adentro de `root` (si hay más
// de uno, pasale un root más chico, por ejemplo el nodo recién insertado).
// `speed`: los segundos que tarda una vuelta completa (las cinco formas y
// volver al círculo).
export function bindLoader(root, { speed = 5 } = {}) {
  const el = root.querySelector(".loader");
  const svg = root.querySelector(".loader__svg");
  const path = root.querySelector(".loader__path");
  if (!el || !svg || !path) return { stop() {} };

  // Sin movimiento: ni gira ni cambia de forma, solo parpadea despacio
  // (mismo criterio que particles.js y el Manifiesto)
  if (stillness()) {
    el.classList.add("loader--reduced");
    return { stop() {} };
  }

  const segments = SEQUENCE.length - 1;
  const segDuration = (speed * 1000) / segments;
  let raf = 0;
  let start = 0;

  function tick(t) {
    if (!start) start = t;
    const elapsed = (t - start) % (speed * 1000);
    const seg = Math.min(segments - 1, Math.floor(elapsed / segDuration));
    const local = easeInOut((elapsed - seg * segDuration) / segDuration);
    path.setAttribute("d", pathOf(lerpPoints(SEQUENCE[seg], SEQUENCE[seg + 1], local)));
    svg.style.transform = `rotate(${lerp(ROTATION[seg], ROTATION[seg + 1], local)}deg) scale(${lerp(SCALE[seg], SCALE[seg + 1], local)})`;
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  return {
    stop() {
      cancelAnimationFrame(raf);
    },
  };
}
