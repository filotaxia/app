/* ============================================
   Content — Ayuda
   ============================================ */

// Textos de ayuda, tomados de filotaxia.com: "¿Cómo funciona?" en tres pasos
// y las preguntas de cuidados (página del TR01), cómo se hace la música
// (página "Formas"), las cuatro capas del terrario y el contacto.
// CARE_GUIDE (la guía de Cuidados) y los pasos 04 y 05 de STEPS son un
// borrador propio, armado con lo que dice la web: revisarlos antes de publicar.

export const HOW_IT_WORKS = [
  "Colocá el terrario en un lugar con luz indirecta, preferentemente cerca de una ventana. Esto asegura que las plantas reciban la iluminación adecuada para mantenerse saludables.",
  "Escaneando el código QR accedés directamente a la armonía de las plantas: la pieza musical generada a partir de su actividad y al mismo tiempo a material exclusivo asociado a tu terrario.",
  "Vas a escuchar el terrario y descubrir una conversación sutil que nace del ecosistema mismo y se traduce en música. De esta manera podés oír y observar al mismo tiempo tu terrario.",
];

export const CARE_FAQ = [
  [
    "¿Los terrarios necesitan mucho mantenimiento?",
    "No, los terrarios requieren pocos cuidados. Con una correcta ubicación, riego moderado y ventilación, se mantienen saludables durante mucho tiempo.",
  ],
  [
    "¿Cada cuánto hay que regar un terrario abierto?",
    "Depende del clima y la estación, pero en general basta con regar cada 30 días. Lo importante es observar la humedad del sustrato y evitar el exceso de agua.",
  ],
  [
    "¿Puedo poner el terrario en cualquier lugar de la casa?",
    "Lo ideal es ubicarlo en un lugar con buena luz natural indirecta y temperatura estable. Evitá el sol directo para que las hojas no se quemen.",
  ],
  [
    "¿Qué pasa si una planta crece demasiado dentro del terrario?",
    "Si una planta crece más de lo esperado, se puede podar sin problemas para mantener el equilibrio del ecosistema y la estética del terrario.",
  ],
  [
    "¿Qué hago si una planta dentro del terrario se daña o muere?",
    "Podés retirarla y reemplazarla fácilmente sin afectar al resto del ecosistema. Así el terrario se mantiene vivo y en equilibrio.",
  ],
];

// La experiencia paso a paso (views/filotaxia): lo que hace la persona,
// de la caja a la bitácora.
//   key     el paso en el recorrido (store/journey.js sabe si ya está hecho)
//   title   el título de la fila
//   short   una línea debajo del título (resumen de filotaxia.com o borrador propio)
//   text    el texto completo, en la hoja del video (los tres primeros son los de
//           "¿Cómo funciona?" de filotaxia.com; los dos últimos, un borrador propio)
//   video   el video tutorial, en src/assets/videos/ (null = todavía no está:
//           la hoja muestra "Video en preparación")
export const STEPS = [
  {
    key: "ubicado",
    title: "Ubicá tu terrario",
    short: "Luz indirecta, cerca de una ventana.",
    text: HOW_IT_WORKS[0],
    video: null,
  },
  {
    key: "escaneado",
    title: "Conectá tu terrario",
    short: "Con el QR de su base.",
    text: HOW_IT_WORKS[1],
    video: null,
  },
  {
    key: "escuchado",
    title: "Escuchá su pieza",
    short: "Sus plantas, convertidas en música.",
    text: HOW_IT_WORKS[2],
    video: null,
  },
  {
    key: "cuidado",
    title: "Cuidalo",
    short: "Riego, ventilación y la guía.",
    text: "Regá de a poco, más o menos cada 30 días, y ventilalo si es cerrado. En Mi terrario ves cuándo toca y en Cuidados, todo lo que necesita.",
    video: null,
  },
  {
    key: "anotado",
    title: "Anotá en la bitácora",
    short: "Notas y fotos de cómo cambia.",
    text: "Un brote nuevo, el último riego, cómo sonaba hoy. Sumá notas y fotos para ver cómo cambia con el tiempo.",
    video: null,
  },
];

// Guía general de cuidados (views/cuidados): la misma para todos los
// terrarios, no cambia según las plantas. [tema, texto]
export const CARE_GUIDE = [
  [
    "Riego",
    "En general alcanza con regar cada 30 días. Antes, tocá el sustrato: si todavía está húmedo, esperá. Regá de a poco sobre el sustrato, no sobre las hojas; es mejor quedarse corto que pasarse.",
  ],
  [
    "Luz",
    "Un lugar con mucha luz natural indirecta, cerca de una ventana. Evitá el sol directo: a través del vidrio quema las hojas. Si las plantas se estiran hacia un lado, les falta luz.",
  ],
  [
    "Sustrato",
    "Tierra, perlita y arena gruesa sobre una rejilla de metal y piedra pómez: las capas están armadas para que el agua drene y el aire circule. No lo compactes ni lo mezcles; si ves agua acumulada en el fondo, dejá de regar hasta que se seque.",
  ],
];

// De la planta a la pieza: las tres etapas (página "Formas")
export const PROCESS = [
  [
    "Selección y armado",
    "Las plantas se eligen por su forma, tamaño y color. El armado incluye las cuatro capas esenciales: plantas, sustrato, metal y piedras.",
  ],
  [
    "Biosonificación",
    "Con un instrumento llamado Biodata conectamos electrodos a cada planta. Cuando cambia su conductividad, la planta genera notas MIDI: así se escuchan procesos biológicos que no se ven.",
  ],
  [
    "Producción musical",
    "Esas notas pasan por un sintetizador y se graban en una pieza única para cada terrario, la que escuchás al escanear su QR.",
  ],
];

// Las cuatro capas de un terrario, de arriba hacia abajo (páginas "Capa01…04"):
// [nombre, material, texto, imagen en movimiento]. Las imágenes son los GIF
// que usa filotaxia.com/terrarios (enlazados desde giphy, como en la web);
// cuando haya videos propios van en src/assets/videos/ y se cambian acá.
export const LAYERS = [
  ["Plantas", "Suculentas", "La vida visible del terrario. Sus impulsos eléctricos se convierten en melodías que reflejan su actividad.",
    "https://media3.giphy.com/media/txCo7WXCwZpmM/giphy.gif"],
  ["Sustrato", "Tierra, perlita, arena gruesa", "La base oculta: regula el agua, el aire y los nutrientes que necesitan las raíces para expandirse.",
    "https://media0.giphy.com/media/l9md6q8WS4pwJrO4qc/giphy.gif"],
  ["Metal", "Rejilla metálica", "Un límite protector que impide que las raíces lleguen al fondo y se pudran por exceso de humedad.",
    "https://media3.giphy.com/media/OhBO5rAr1G0VhxM8X4/giphy.gif"],
  ["Piedras", "Piedra pómez", "El drenaje natural: evita el exceso de agua y deja circular el aire para que las raíces estén sanas.",
    "https://media0.giphy.com/media/55jWt7O2wPB5e/giphy.gif"],
];

// Preguntas sobre el sonido (página "Formas")
export const SOUND_FAQ = [
  [
    "¿Qué es la biosonificación?",
    "Un proceso que registra las variaciones eléctricas naturales de las plantas con sensores. Esos datos se convierten en información MIDI, que después se transforma en sonido y composiciones musicales.",
  ],
  [
    "¿Cómo se relacionan las hojas con las ondas?",
    "Cada forma de hoja equivale a un tipo de onda: la puntiaguda suena triangular, la redondeada sinusoidal, la dentada en diente de sierra y la recta cuadrada.",
  ],
  [
    "¿El sonido sale directamente de la planta?",
    "No es un sonido audible de la planta en sí, sino una traducción de su actividad eléctrica a datos musicales, que después se procesan en sintetizadores.",
  ],
];

export const CONTACT = {
  email: "hola@filotaxia.com",
  instagram: "filotaxiar",
};
