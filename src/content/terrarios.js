/* ============================================
   Content — Terrarios
   ============================================ */

// Catálogo de terrarios. Ya no está escrito acá: vive en Supabase (tabla
// `terrarios`) y lo carga store/catalog.js al arrancar la app (main.js),
// antes de pintar la primera pantalla. Este archivo lo guarda y lo sirve a
// las vistas igual que siempre: TERRARIOS, getTerrario(id), codeOf(terrario).
//
// Cada terrario tiene un QR pegado en la base con el link
// https://app.filotaxia.com/t/<qr_code> (ver utils/qr.js). Su nombre es su
// código: "TR01" (codeOf(), abajo); no tienen otro nombre. `recorded` es el
// día en que la planta empezó a sonar ("YYYY-MM-DD") y `duration` el largo
// de la pieza en segundos.
//
// `care`: sus cuidados (ver utils/care.js) — cada cuántos días regar y
// ventilar (null = ecosistema abierto, no se ventila), rangos ideales de
// humedad y temperatura, tipo y horas de luz.
//
// Otros campos (la forma la arma utils/catalog.js a partir de la fila):
//   qr_code  el código del QR impreso: "k7f2q9" (no cambia nunca)
//   status   "publicado" o "retirado" (los borradores no llegan a la app)
//   model    código del modelo ("TR01")
//   photo    foto del terrario (src/assets/… o Supabase Storage; si no hay, se dibuja el brote)
//   specs    { ecosistema, recipiente, medidas }
//   plants   nombres de las plantas (los de content/plantas.js, que suma foto, hoja y onda)
//   waves    formas de onda de su pieza ("triangle", "sine"...); por defecto, seno
//   video    video del terrario para el fondo del reproductor ("Cambiar a video");
//            si no hay, el reproductor usa el GIF de la capa Plantas de filotaxia.com
//   midi     las dos secuencias MIDI grabadas con los Biodata: { plantas, sustrato }
//            plantas = Biodata 02 (suculentas); sustrato = Biodata 01 (sustrato,
//            gravas, piedra pómez y ambient). Se ven en la Partitura del reproductor
//            (audio/lanes.js); si falta uno, esa secuencia se simula

// El array es siempre el mismo (las vistas lo importan una vez);
// setCatalog() le cambia el contenido.
export const TERRARIOS = [];

export function setCatalog(terrarios) {
  const sorted = [...terrarios].sort((a, b) => a.id.localeCompare(b.id));
  TERRARIOS.splice(0, TERRARIOS.length, ...sorted);
}

export function terrarioIds() {
  return TERRARIOS.map((terrario) => terrario.id);
}

export function getTerrario(id) {
  return TERRARIOS.find((terrario) => terrario.id === id) ?? null;
}

export function getTerrarioByQr(code) {
  return TERRARIOS.find((terrario) => terrario.qr_code === code) ?? null;
}

// El código corto del terrario, como en filotaxia.com: "TR01"
export function codeOf(terrario) {
  return terrario.model ?? `TR${terrario.id}`;
}
