/* ============================================
   Content — Terrarios
   ============================================ */

// Catálogo de terrarios. Cada terrario tiene un QR pegado en la base
// con su número (ver utils/qr.js). `recorded` es el día en que la planta
// empezó a sonar ("YYYY-MM-DD") y `duration` el largo de la pieza en segundos.
//
// `care`: sus cuidados (ver utils/care.js) — cada cuántos días regar y
// ventilar (null = ecosistema abierto, no se ventila), rangos ideales de
// humedad y temperatura, tipo y horas de luz.
//
// Opcionales (el 01 es el ejemplo completo; del 02 al 06 por ahora solo
// tienen modelo y foto, las de producto de filotaxia.com):
//   model    código del modelo ("TR01")
//   photo    foto del terrario, en src/assets/images/terrarios/ (si no hay, se dibuja el brote)
//   specs    { ecosistema, recipiente, medidas }
//   plants   nombres de las plantas (los de content/plantas.js, que suma foto, hoja y onda)
//   waves    formas de onda de su pieza ("triangle", "sine"...); por defecto, seno
//
// Cuando haya backend, este catálogo pasa a ser una tabla y cada terrario
// suma su archivo de audio grabado; mientras tanto la pieza se genera con
// audio/score.js a partir del id.

export const TERRARIOS = [
  {
    // Ejemplo con contenido real: el TR01 de filotaxia.com
    // (https://filotaxia.com/src/pages/terrarios/terrario01.html)
    id: "01",
    name: "Sustrato Base",
    model: "TR01",
    recorded: "2026-06-14",
    duration: 251,
    story: "Este terrario reúne tres suculentas con formas triangulares y sinusoidales. La combinación de estas ondas genera una pieza musical marcada por contrastes: sonidos definidos y rítmicos de las ondas triangulares junto a matices suaves y continuos de las ondas sinusoidales.",
    photo: "src/assets/images/terrarios/tr01.jpg",   // la de producto de filotaxia.com, como las demás
    specs: { ecosistema: "Abierto", recipiente: "Vidrio", medidas: "25 × 20 × 17 cm" },
    plants: ["Haworthia Attenuata", "Haworthia Fasciata", "Haworthia Venosa"],
    waves: ["triangle", "sine"],
    care: { riego_days: 30, ventilacion_days: null, humidity: [35, 60], temp: [15, 26], light: "Indirecta", light_hours: [5, 8] },
  },
  {
    id: "02",
    name: "Gota Cayendo",
    model: "TR02",
    photo: "src/assets/images/terrarios/tr02.jpg",
    recorded: "2026-07-22",
    duration: 198,
    story: "La condensación del vidrio vuelve a la tierra en gotas. Cada una dejó una nota corta y brillante.",
    care: { riego_days: 30, ventilacion_days: 2, humidity: [80, 95], temp: [18, 24], light: "Indirecta", light_hours: [4, 7] },
  },
  {
    id: "03",
    name: "4 Rocas",
    model: "TR03",
    photo: "src/assets/images/terrarios/tr03.jpg",
    recorded: "2026-08-30",
    duration: 236,
    story: "Cuatro piedras y un helecho que crece entre ellas. Un ritmo quieto, con silencios largos.",
    care: { riego_days: 30, ventilacion_days: 3, humidity: [70, 90], temp: [18, 24], light: "Indirecta", light_hours: [4, 8] },
  },
  {
    id: "04",
    name: "Las Flechas",
    model: "TR04",
    photo: "src/assets/images/terrarios/tr04.jpg",
    recorded: "2026-10-09",
    duration: 222,
    story: "Cada microfluctuación de esta planta se convirtió en una pieza sonora única.",
    care: { riego_days: 30, ventilacion_days: 3, humidity: [70, 90], temp: [18, 25], light: "Indirecta", light_hours: [5, 8] },
  },
  {
    id: "05",
    name: "Raíz Lenta",
    model: "TR05",
    photo: "src/assets/images/terrarios/tr05.jpg",
    recorded: "2026-09-12",
    duration: 264,
    story: "Una suculenta que casi no se mueve. Su pieza avanza como sus raíces: de a poco y hacia abajo.",
    care: { riego_days: 30, ventilacion_days: 7, humidity: [40, 60], temp: [18, 28], light: "Sol suave", light_hours: [6, 10] },
  },
  {
    id: "06",
    name: "Niebla Baja",
    model: "TR06",
    photo: "src/assets/images/terrarios/tr06.jpg",
    recorded: "2026-09-27",
    duration: 210,
    story: "Un terrario cerrado que amanece empañado. Suena más claro a medida que el vidrio se despeja.",
    care: { riego_days: 30, ventilacion_days: 5, humidity: [85, 98], temp: [16, 23], light: "Indirecta", light_hours: [3, 6] },
  },
];

export const TERRARIO_IDS = TERRARIOS.map((terrario) => terrario.id);

export function getTerrario(id) {
  return TERRARIOS.find((terrario) => terrario.id === id) ?? null;
}

// El código corto del terrario, como en filotaxia.com: "TR01"
export function codeOf(terrario) {
  return terrario.model ?? `TR${terrario.id}`;
}
