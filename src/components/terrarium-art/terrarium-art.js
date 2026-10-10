/* ============================================
   Components — Terrarium Art
   ============================================ */

// Imagen de un terrario: su foto, o (si no tiene) un cuadro gris claro con
// luz arriba a la izquierda y el brote dibujado al centro. El brote queda
// siempre debajo: si la foto no carga (sin conexión), se ve el dibujo.
//
//   terrariumArt()                          → tamaño del contenedor
//   terrariumArt({ photo: terrario.photo }) → con la foto del terrario
//   terrariumArt({ size: "sm" })            → brote más chico (grilla de la colección)
//   terrariumArt({ live: true })            → el brote "respira" (reproductor sonando)

export function terrariumArt({ photo = "", size = "lg", live = false } = {}) {
  return `
    <div class="terrarium-art terrarium-art--${size}" ${live ? "data-live" : ""} aria-hidden="true">
      <svg class="terrarium-art__plant" viewBox="0 0 64 64" fill="none" stroke="currentColor"
        stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M32 58V14" />
        <path d="M32 40c-10 1-18-4-21-12 9-2 18 1 21 12Z" />
        <path d="M32 40c10 1 18-4 21-12-9-2-18 1-21 12Z" />
      </svg>
      ${photo
        ? `<img class="terrarium-art__photo" src="${photo}" alt="" loading="lazy" decoding="async"
             onerror="this.remove()" />`
        : ""}
    </div>
  `;
}
