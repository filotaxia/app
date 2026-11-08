/* ============================================
   Views — Formas y ondas
   ============================================ */

// Filotaxia (#/formas-ondas; el centro de la barra, con el isotipo de la
// marca): la génesis del proyecto. Debajo del título, components/particles:
// la hoja hecha de puntos (se puede empujar y hacer explotar tocando). El
// título grande de arriba (donde antes decía siempre "Filotaxia", con la
// bajada fija "Formas y ondas") ahora es el nombre de la planta que se está
// mostrando, con "Planta" de bajada (eyebrow); las flechas ‹ › ya no
// recorren las cuatro formas únicas: recorren el catálogo de suculentas de
// abajo, planta por planta (bindParticles(root, { onStep }) le pasa el
// mando de las flechas a esta vista, ver particles.js); tocar una planta del
// catálogo va directo a ella. Debajo del dibujo, su forma y su onda.

import { particles, bindParticles } from "../../components/particles/particles.js";
import { PLANTAS, LEAVES } from "../../content/plantas.js";
import { escapeHTML } from "../../utils/html.js";
import { setHeader } from "../../layout/header/header.js";

let currentIndex = 0;

export const title = () => PLANTAS[currentIndex]?.name ?? "Filotaxia";
export const subtitle = "Planta";
export const header = true;

export function render(root) {
  currentIndex = 0;

  root.innerHTML = `
    <section class="art reveal" data-art>
      ${particles()}
    </section>

    <section class="shapes-catalog reveal" aria-label="El catálogo">
      <ul class="shapes-catalog__list">
        ${PLANTAS.map(({ name, leaf, photo }, i) => `
          <li>
            <button class="shapes-catalog__item" type="button" data-index="${i}"
              aria-label="Ver la hoja de ${escapeHTML(name)} en el dibujo de puntos">
              <img class="shapes-catalog__photo" src="src/assets/images/plantas/${photo}" alt="" loading="lazy" decoding="async">
              <span class="shapes-catalog__caption">
                <span class="shapes-catalog__name">${escapeHTML(name)}</span>
                <span class="shapes-catalog__leaf">${escapeHTML(LEAVES[leaf].label)}</span>
              </span>
            </button>
          </li>`).join("")}
      </ul>
    </section>
  `;

  const art = root.querySelector("[data-art]");

  // Las flechas del canvas recorren este mismo catálogo (goTo), no las
  // cuatro formas; particlesToy se arma antes de goTo pero goTo se usa
  // recién al tocar una flecha o una planta, así que el orden no importa.
  const particlesToy = bindParticles(root, {
    shape: PLANTAS[currentIndex].leaf,
    onStep: (dir) => goTo(currentIndex + dir),
  });

  function goTo(i) {
    const n = PLANTAS.length;
    currentIndex = ((i % n) + n) % n;
    const plant = PLANTAS[currentIndex];
    particlesToy.show(plant.leaf);
    setHeader({ title: plant.name, subtitle });
    document.title = `${plant.name} · Filotaxia`;
  }

  root.querySelectorAll("[data-index]").forEach((button) => {
    button.addEventListener("click", () => {
      goTo(Number(button.dataset.index));
      art.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  return () => particlesToy.stop();
}
