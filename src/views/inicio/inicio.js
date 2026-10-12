/* ============================================
   Views — Inicio
   ============================================ */

// Splash: la marca de filotaxia.com (las dos hojas + el logotipo) y
// "Armonía en Plantas" al centro. Las imágenes se pintan con una máscara
// en CSS, así toman el color del texto en tema claro y oscuro.
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
        <span class="splash__isotipo" aria-hidden="true"></span>
        <h1 class="splash__title" tabindex="-1">
          <span class="splash__logotipo" aria-hidden="true"></span>
          <span class="visually-hidden">Filotaxia</span>
        </h1>
        <p class="splash__tagline">Armonía en Plantas</p>
      </div>
    </a>
  `;

  const timer = setTimeout(() => location.replace(next), DELAY);
  return () => clearTimeout(timer);
}
