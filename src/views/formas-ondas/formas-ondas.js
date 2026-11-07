/* ============================================
   Views — Formas y ondas
   ============================================ */

// Filotaxia (#/formas-ondas; el centro de la barra, con el isotipo de la
// marca): la génesis del proyecto. Debajo del título, "Arte y música
// experimental" (components/particles: puntos que se juntan en una forma —
// círculo, cuadrado, flor — y se los puede empujar y hacer explotar
// tocando; antes vivía en Guía). Después, el catálogo de suculentas de
// filotaxia.com (la página "Formas"): la grilla hoja → onda
// (components/leaf-waves, sin flip) y cada suculenta (content/plantas.js)
// con su foto y su hoja.
//
// Reemplaza a "Conectar" en la barra: el escáner no desapareció, se llega a
// él desde el botón "Conectar" de Mi terrario o el QR chico del bloque Pieza.

import { leafWaves } from "../../components/leaf-waves/leaf-waves.js";
import { particles, bindParticles } from "../../components/particles/particles.js";
import { PLANTAS, LEAVES } from "../../content/plantas.js";
import { escapeHTML } from "../../utils/html.js";

export const title = "Filotaxia";
export const subtitle = "Formas y ondas";
export const header = true;

export function render(root) {
  root.innerHTML = `
    <section class="art reveal" aria-labelledby="art-title">
      <h2 class="guide-title" id="art-title">Arte y música experimental</h2>
      ${particles()}
    </section>

    <section class="shapes reveal">
      ${leafWaves()}
    </section>

    <section class="shapes-catalog reveal" aria-labelledby="catalog-title">
      <h2 class="guide-title" id="catalog-title">El catálogo</h2>
      <ul class="shapes-catalog__list">
        ${PLANTAS.map(({ name, leaf, photo }) => `
          <li class="shapes-catalog__item">
            <img class="shapes-catalog__photo" src="src/assets/images/plantas/${photo}" alt="" loading="lazy" decoding="async">
            <span class="shapes-catalog__name">${escapeHTML(name)}</span>
            <span class="shapes-catalog__leaf">${escapeHTML(LEAVES[leaf].label)}</span>
          </li>`).join("")}
      </ul>
    </section>
  `;

  const particlesToy = bindParticles(root);
  return () => particlesToy.stop();
}
