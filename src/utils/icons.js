/* ============================================
   Utils — Icons
   ============================================ */

// Íconos de Lucide (https://lucide.dev, licencia ISC), copiados como SVG inline.
// Las flechas NO son íconos: como en filotaxia.com, son el carácter "→" de la
// tipografía (ver arrow() más abajo).
// Sin dependencia: si hace falta uno nuevo, se agrega su contenido acá.
// Las cuatro ondas ("wave-sine"…) son propias, dibujadas como los íconos de
// los osciladores de filotaxia.com; el nombre sigue al tipo de onda de Web Audio.
//
//   icon("check")                      → <svg> de 24px que hereda el color del texto
//   icon("play", "player__icon")       → con una clase para darle tamaño

const PATHS = {
  "audio-lines": `<path d="M2 10v3"/><path d="M6 6v11"/><path d="M10 3v18"/><path d="M14 8v7"/><path d="M18 5v13"/><path d="M22 10v3"/>`,
  "book-open": `<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>`,
  "calendar": `<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>`,
  "check": `<path d="M20 6 9 17l-5-5"/>`,
  "image-plus": `<path d="M16 5h6"/><path d="M19 2v6"/><path d="M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/><circle cx="9" cy="9" r="2"/>`,
  "pause": `<rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none"/><rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none"/>`,
  "play": `<path d="M6 4.8a1 1 0 0 1 1.5-.86l11.4 7.2a1 1 0 0 1 0 1.72L7.5 20.06A1 1 0 0 1 6 19.2z" fill="currentColor" stroke="none"/>`,
  "plus": `<path d="M5 12h14"/><path d="M12 5v14"/>`,
  "qr-code": `<rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/>`,
  "rotate-ccw": `<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>`,
  "rotate-cw": `<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>`,
  "scan-line": `<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/>`,
  "sprout": `<path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>`,
  "sun": `<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>`,
  "thermometer": `<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>`,
  "wind": `<path d="M12.8 19.6A2 2 0 1 0 14 16H2"/><path d="M17.5 8a2.5 2.5 0 1 1 2 4H2"/><path d="M9.8 4.4A2 2 0 1 1 11 8H2"/>`,
  "wave-sawtooth": `<path d="M2 18 12 6v12L22 6v12"/>`,
  "wave-sine": `<path d="M2 12c1.7-4.7 3.3-7 5-7s3.3 2.3 5 7 3.3 7 5 7 3.3-2.3 5-7"/>`,
  "wave-square": `<path d="M2 17V7h10v10h10V7"/>`,
  "wave-triangle": `<path d="m2 12 5-7 10 14 5-7"/>`,
  "x": `<path d="M18 6 6 18"/><path d="m6 6 12 12"/>`,
};

export function icon(name, className = "") {
  const paths = PATHS[name] ?? PATHS.check;
  const cls = className ? ` class="${className}"` : "";
  return `<svg${cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;
}

// Flecha de texto, la misma de filotaxia.com ("Ver Manifiesto →"):
//   arrow()        → "→"      arrow("left") → "←"
// Decorativa: el texto del link ya dice adónde va.
export function arrow(direction = "right") {
  return `<span class="arrow" aria-hidden="true">${direction === "left" ? "←" : "→"}</span>`;
}
