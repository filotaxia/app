/* ============================================
   Views — Escanear
   ============================================ */

// Escaneo del QR del terrario, con la cámara del celular.
//
// - La cámara se ve dentro del visor; al leer un QR de Filotaxia se abre
//   la ficha (camera/qr-camera.js: anda en iPhone y en Android).
// - Si la persona no da permiso, se explica cómo darlo y se puede reintentar.
// - También se puede escanear con la app de cámara del teléfono: el QR es
//   un link a la ficha (…/#/terrario/04) y abre la app directo ahí.
// - "Simular escaneo" abre la ficha de un terrario de prueba.

import { TERRARIO_IDS } from "../../content/terrarios.js";
import { linkedIds } from "../../store/collection.js";
import { startQrCamera } from "../../camera/qr-camera.js";
import { parseTerrarioCode } from "../../utils/qr.js";
import { icon } from "../../utils/icons.js";

export const title = "Escanear";

const HINTS = {
  default: "Lo vas a encontrar pegado en la base<br />del terrario, discreto, junto al sustrato.",
  denied: "Para escanear, permití el acceso a la cámara<br />en los ajustes del navegador.",
  insecure: "La cámara necesita una conexión segura (https).<br />Podés escanear con la cámara del teléfono.",
  unknown: "Este QR no es de un terrario de Filotaxia.<br />Probá con el que está en la base.",
};

export async function render(root) {
  root.innerHTML = `
    <section class="screen scan">
      <h1 class="scan__title reveal" tabindex="-1">Escaneá el QR<br />de tu terrario</h1>

      <div class="scan__middle reveal">
        <div class="scan__frame" data-frame data-state="starting">
          <video class="scan__video" data-video playsinline muted autoplay></video>
          <span class="scan__corner scan__corner--tl" aria-hidden="true"></span>
          <span class="scan__corner scan__corner--tr" aria-hidden="true"></span>
          <span class="scan__corner scan__corner--bl" aria-hidden="true"></span>
          <span class="scan__corner scan__corner--br" aria-hidden="true"></span>
        </div>
        <p class="scan__hint lead" data-hint aria-live="polite">${HINTS.default}</p>
        <button class="btn btn--ghost" type="button" data-retry hidden>Reintentar</button>
      </div>

      <div class="screen__actions">
        <button class="text-link" type="button" data-simulate>Simular escaneo ${icon("arrow-right")}</button>
      </div>
    </section>
  `;

  const frame = root.querySelector("[data-frame]");
  const hint = root.querySelector("[data-hint]");
  const retry = root.querySelector("[data-retry]");
  const video = root.querySelector("[data-video]");

  root.querySelector("[data-simulate]").addEventListener("click", async () => {
    location.hash = `#/terrario/${await simulatedId()}`;
  });

  let lastUnknown = "";
  let stop = () => {};

  const start = () => {
    stop();
    stop = startQrCamera(video, {
      onState(state) {
        frame.dataset.state = state;
        hint.innerHTML = HINTS[state] ?? HINTS.default;
        retry.hidden = state !== "denied";
      },
      onCode(text) {
        const id = parseTerrarioCode(text, TERRARIO_IDS);
        if (id) {
          stop();
          navigator.vibrate?.(30);
          location.hash = `#/terrario/${id}`;
        } else if (text !== lastUnknown) {
          // Un QR que no es nuestro: se avisa una vez, sin cortar la cámara
          lastUnknown = text;
          hint.innerHTML = HINTS.unknown;
        }
      },
    });
  };

  retry.addEventListener("click", start);
  start();

  return () => stop();
}

// El terrario de prueba: el Nº 01 (el ejemplo completo, TR01) o, si ya está
// en la colección, el primero que falte. Así la demo siempre suma uno nuevo.
async function simulatedId() {
  const linked = await linkedIds();
  return TERRARIO_IDS.find((id) => !linked.includes(id)) ?? "01";
}
