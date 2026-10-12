/* ============================================
   Content — Plantas
   ============================================ */

// Catálogo de plantas, de filotaxia.com (página "Formas"): cada suculenta
// tiene una forma de hoja, y cada forma de hoja suena con un tipo de onda.
//
//   hoja Puntiaguda → onda Triangular
//   hoja Redondeada → onda Sinusoidal
//   hoja Dentada    → onda Diente de sierra
//   hoja Recta      → onda Cuadrada
//
// Los nombres de `terrario.plants` (content/terrarios.js) son los de acá.
// `wave` es el tipo de oscilador de Web Audio ("sine", "triangle"…), el mismo
// que usa `terrario.waves` en el reproductor.

export const LEAVES = {
  puntiaguda: { label: "Puntiaguda", wave: "triangle" },
  redondeada: { label: "Redondeada", wave: "sine" },
  dentada: { label: "Dentada", wave: "sawtooth" },
  recta: { label: "Recta", wave: "square" },
};

// Nombre en castellano de cada onda (para mostrar)
export const WAVE_NAMES = {
  sine: "Sinusoidal",
  triangle: "Triangular",
  sawtooth: "Diente de sierra",
  square: "Cuadrada",
};

// photo: vista desde arriba, en src/assets/images/plantas/
export const PLANTAS = [
  { name: "Aloe Aristata", leaf: "puntiaguda", photo: "aloe-aristata.webp" },
  { name: "Aloe Brevifolia", leaf: "dentada", photo: "aloe-brevifolia.webp" },
  { name: "Crassula Ovata", leaf: "redondeada", photo: "crassula-ovata.webp" },
  { name: "Echeveria Elegans", leaf: "redondeada", photo: "echeveria-elegans.webp" },
  { name: "Gasteria Bicolor", leaf: "recta", photo: "gasteria-bicolor.webp" },
  { name: "Gasteria Carinata Verrucosa", leaf: "recta", photo: "gasteria-carinata-verrucosa.webp" },
  { name: "Gasteria Flow Spiky", leaf: "dentada", photo: "gasteria-flow-spiky.webp" },
  { name: "Haworthia Attenuata", leaf: "puntiaguda", photo: "haworthia-attenuata.webp" },
  { name: "Haworthia Fasciata", leaf: "puntiaguda", photo: "haworthia-fasciata.webp" },
  { name: "Haworthia Limifolia", leaf: "puntiaguda", photo: "haworthia-limifolia.webp" },
  { name: "Haworthia Margaritifera", leaf: "puntiaguda", photo: "haworthia-margaritifera.webp" },
  { name: "Haworthia Truncata", leaf: "recta", photo: "haworthia-truncata.webp" },
  { name: "Haworthia Venosa", leaf: "puntiaguda", photo: "haworthia-venosa.webp" },
];

const PHOTO_DIR = "src/assets/images/plantas/";

// Una planta por nombre, con su hoja, su onda y la ruta de la foto.
// Si no está en el catálogo devuelve solo el nombre (se muestra igual, sin foto).
export function getPlanta(name) {
  const planta = PLANTAS.find((p) => p.name.toLowerCase() === name.toLowerCase());
  if (!planta) return { name };
  const leaf = LEAVES[planta.leaf];
  return { ...planta, photo: PHOTO_DIR + planta.photo, leafLabel: leaf.label, wave: leaf.wave };
}
