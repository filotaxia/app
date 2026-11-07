/* ============================================
   Views — Inicio
   ============================================ */

// Splash: la marca de filotaxia.com (las dos hojas + el logotipo) y
// "Armonía en Plantas" al centro. Las imágenes se pintan con una máscara
// en CSS, así toman el color del texto en tema claro y oscuro.
// La entrada es la misma que el preloader de filotaxia.com (inspo/
// proyecto-filotaxia/src/js/components/preloader-site.js, con GSAP): solo
// el isotipo (las hojas) baja 30px con fade, 0.8s ease-out (acá, --ease-out,
// la misma curva que su power2.out); el logotipo ("Filotaxia") y la bajada
// quedan fijos, sin animar, como en el sitio — acá sin GSAP, con una
// animación CSS (ver animation/reveal.css: .reveal sube 12px, esto baja
// 30px). Al irse, la pantalla entera se apaga con fade (como el preloader
// cuando termina) y recién ahí se sigue. Sigue sola después de un momento
// (o al tocar): si ya tiene su terrario va a Mi terrario; si no, a escanear.

import { myTerrarioId } from "../../store/my-terrario.js";

export const title = "Filotaxia";
export const nav = false;

const DELAY = 2600;
const FADE_OUT = 400;

export async function render(root) {
  const next = (await myTerrarioId()) ? "#/mi-terrario" : "#/escanear";

  root.innerHTML = `
    <a class="screen splash" href="${next}" aria-label="Entrar a Filotaxia">
      <div class="splash__brand">
        <span class="splash__isotipo splash__isotipo--in" aria-hidden="true"></span>
        <h1 class="splash__title" tabindex="-1">
          <span class="splash__logotipo" aria-hidden="true"></span>
          <span class="visually-hidden">Filotaxia</span>
        </h1>
        <p class="splash__tagline">Armonía en Plantas</p>
      </div>
    </a>
  `;

  const screen = root.querySelector(".splash");
  const leaveTimer = setTimeout(() => screen.classList.add("splash--out"), DELAY - FADE_OUT);
  const navTimer = setTimeout(() => location.replace(next), DELAY);
  return () => {
    clearTimeout(leaveTimer);
    clearTimeout(navTimer);
  };
}
