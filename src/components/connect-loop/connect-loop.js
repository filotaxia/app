/* ============================================
   Components — Connect Loop
   ============================================ */

// Cómo se conecta un terrario, en una animación que se repite (12 s, solo CSS):
//
//   01  el terrario, con el QR abajo en el vidrio (el QR late)
//   02  entra el teléfono y su cámara lee el QR (una línea lo recorre)
//   03  el terrario se va y el teléfono muestra la app: play y la pieza sonando
//
// Debajo del dibujo, dentro del mismo cuadro gris, el paso que se está
// viendo, con el texto chico del Manifiesto: "/Paso01" en el color del texto
// y su texto en gris (como "/Capa02").
// Es un dibujo de línea en currentColor (sigue al tema), como los gráficos
// del Manifiesto. Lo usa Mi terrario cuando todavía no hay terrario.
//
//   connectLoop() → el cuadro gris con el dibujo y los pasos

const STEPS = ["El QR de su base", "Conectalo con la cámara", "Escuchá su pieza"];

export function connectLoop() {
  return `
    <figure class="connect-loop">
      <svg class="connect-loop__stage" viewBox="0 0 320 200" aria-hidden="true">
        ${terrarium()}
        <line class="connect-loop__beam" x1="196" y1="122" x2="114" y2="141" />
        ${phone()}
      </svg>
      <figcaption>
        <ol class="connect-loop__steps">
          ${STEPS.map((text, i) => `
            <li class="connect-loop__step" style="--step: ${i}">
              <span class="connect-loop__index">/Paso${String(i + 1).padStart(2, "0")}</span>
              <span class="connect-loop__text">${text}</span>
            </li>`).join("")}
        </ol>
      </figcaption>
    </figure>
  `;
}

// La pecera redonda del TR01 (el mismo dibujo que el ícono de Mi terrario
// en la barra, agrandado 7,5 veces: así mide lo mismo que el teléfono, 116,
// y arranca a su misma altura) con el QR pegado en el vidrio, abajo, a la
// altura del sustrato (como en los terrarios de verdad).
function terrarium() {
  return `
    <g class="connect-loop__terrarium">
      <g transform="translate(160 98.25) scale(7.5) translate(-12 -12)">
        <path d="M8.5 4.5h7" />
        <path d="M8.5 4.5C5.8 5.9 4 8.7 4 12a8 8 0 0 0 16 0c0-3.3-1.8-6.1-4.5-7.5" />
        <path d="M5 15.5h14" />
        <path d="M12 15.5v-4.5" />
        <path d="M12 13c-1.8 0-3-1.2-3-3 1.8 0 3 1.2 3 3z" />
        <path d="M12 12c1.8 0 3-1.2 3-3-1.8 0-3 1.2-3 3z" />
      </g>
      <g class="connect-loop__qr">${qr(152, 133, 16)}</g>
    </g>
  `;
}

// El teléfono: adentro, la vista de la cámara (el QR entre las esquinas del
// visor y la línea que lo lee) y, después, la app (play y la pieza sonando).
function phone() {
  const bars = [10, 16, 8, 14, 6]
    .map((h, i) => `<line class="connect-loop__bar" style="--i: ${i}" x1="${214 + i * 7}" y1="136" x2="${214 + i * 7}" y2="${136 - h}" />`)
    .join("");

  return `
    <g class="connect-loop__phone">
      <rect class="connect-loop__body" x="196" y="42" width="64" height="116" rx="10" />
      <path d="M222 50h12" />
      <g class="connect-loop__camera">
        <path d="M212 90v-6h6M238 84h6v6M244 110v6h-6M218 116h-6v-6" />
        ${qr(218, 90, 20)}
        <line class="connect-loop__scan" x1="212" y1="84" x2="244" y2="84" />
      </g>
      <g class="connect-loop__app">
        <circle cx="228" cy="94" r="13" />
        <path class="connect-loop__play" d="M225 88.5v11l8.5-5.5z" />
        ${bars}
      </g>
    </g>
  `;
}

// Un QR mínimo de lado `size`: el cuadrado, sus tres esquinas y un punto
function qr(x, y, size) {
  const s = size / 4;
  const corner = (cx, cy) => `<rect class="connect-loop__fill" x="${cx}" y="${cy}" width="${s}" height="${s}" />`;
  return `
    <rect x="${x}" y="${y}" width="${size}" height="${size}" />
    ${corner(x + s / 2, y + s / 2)}
    ${corner(x + size - s * 1.5, y + s / 2)}
    ${corner(x + s / 2, y + size - s * 1.5)}
    ${corner(x + size / 2, y + size / 2)}
  `;
}
