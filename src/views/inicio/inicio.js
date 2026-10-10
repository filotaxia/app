/* ============================================
   Views — Inicio
   ============================================ */

// Splash: FILOTAXIA y "Armonía en Plantas" al centro.
// Sigue solo después de un momento (o al tocar): si ya tiene su terrario
// va a Mi terrario; si no, a escanear el QR.

import { myTerrarioId } from "../../store/my-terrario.js";

export const title = "Filotaxia";
export const nav = false;

const DELAY = 1800;

export async function render(root) {
  const next = (await myTerrarioId()) ? "#/mi-terrario" : "#/escanear";

  root.innerHTML = `
    <a class="screen splash" href="${next}" aria-label="Entrar a Filotaxia">
      <div class="splash__brand reveal">
        <h1 class="splash__title" tabindex="-1">Filotaxia</h1>
        <p class="splash__tagline">Armonía en Plantas</p>
      </div>
    </a>
  `;

  const timer = setTimeout(() => location.replace(next), DELAY);
  return () => clearTimeout(timer);
}
