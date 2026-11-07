/* ============================================
   Views — Formas y ondas
   ============================================ */

// Filotaxia (#/formas-ondas; el centro de la barra, con el isotipo de la
// marca): la génesis del proyecto. Debajo del título, components/particles:
// la hoja hecha de puntos (se puede empujar y hacer explotar tocando) y,
// debajo, su nombre a la izquierda y el de su onda a la derecha, con los
// puntos de navegación abajo para elegir cuál de las cuatro hojas se ve
// (antes vivía en Guía). Después, el catálogo de suculentas de
// filotaxia.com (la página "Formas"): cada suculenta (content/plantas.js)
// con su foto y, como título sobre la foto, su nombre.
//
// Reemplaza a "Conectar" en la barra: el escáner no desapareció, se llega a
// él desde el botón "Conectar" de Mi terrario o el QR chico del bloque Pieza.

import { particles, bindParticles } from "../../components/particles/particles.js";
import { PLANTAS, LEAVES } from "../../content/plantas.js";
import { escapeHTML } from "../../utils/html.js";

export const title = "Filotaxia";
export const subtitle = "Formas y ondas";
export const header = true;

export function render(root) {
  root.innerHTML = `
    <section class="art reveal">
      ${particles()}
    </section>

    <section class="shapes-catalog reveal" aria-label="El catálogo">
      <ul class="shapes-catalog__list">
        ${PLANTAS.map(({ name, leaf, photo }) => `
          <li class="shapes-catalog__item">
            <img class="shapes-catalog__photo" src="src/assets/images/plantas/${photo}" alt="" loading="lazy" decoding="async">
            <span class="shapes-catalog__caption">
              <span class="shapes-catalog__name">${escapeHTML(name)}</span>
              <span class="shapes-catalog__leaf">${escapeHTML(LEAVES[leaf].label)}</span>
            </span>
          </li>`).join("")}
      </ul>
    </section>
  `;

  const particlesToy = bindParticles(root);
  return () => particlesToy.stop();
}
