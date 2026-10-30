/* ============================================
   Content — Ayuda
   ============================================ */

// Textos de ayuda, tomados de filotaxia.com: "¿Cómo funciona?" en tres pasos
// y las preguntas de cuidados (página del TR01), cómo se hace la música
// (página "Formas"), las cuatro capas del terrario y el contacto.
// CARE_GUIDE (la guía de Cuidados) y los pasos 04 y 05 de STEPS son un
// borrador propio, armado con lo que dice la web: revisarlos antes de publicar.

// "¿Cómo funciona?" de la página de cada terrario: tres pasos, cada uno con
// su foto (la ficha cambia la foto al tocar el paso, views/terrario).
// Las fotos son las de la web (cuidados/sq10, sq5, sq7) a 800px; la de la
// ventana va en el paso 01, que habla de la luz (en la web estaba en el 02).
export const HOW_IT_WORKS = [
  {
    text: "Colocá el terrario en un lugar con luz indirecta, preferentemente cerca de una ventana. Esto asegura que las plantas reciban la iluminación adecuada para mantenerse saludables.",
    image: "src/assets/images/ficha/ventana.jpg",
    alt: "Un terrario de vidrio con suculentas junto a una ventana",
  },
  {
    text: "Escaneando el código QR accedés directamente a la armonía de las plantas: la pieza musical generada a partir de su actividad y al mismo tiempo a material exclusivo asociado a tu terrario.",
    image: "src/assets/images/ficha/jeringa.jpg",
    alt: "Una mano riega un terrario con una jeringa",
  },
  {
    text: "Vas a escuchar el terrario y descubrir una conversación sutil que nace del ecosistema mismo y se traduce en música. De esta manera podés oír y observar al mismo tiempo tu terrario.",
    image: "src/assets/images/ficha/pinza.jpg",
    alt: "Una mano acomoda las plantas de un terrario con una pinza",
  },
];

// Las tres características de cada terrario (la página de cada terrario en
// filotaxia.com), con sus fotos a 800px. La ficha las muestra en un slider.
export const FEATURES = [
  {
    title: "Recipiente resistente",
    text: "El contenedor está fabricado en vidrio duradero, fácil de limpiar y diseñado para proteger el ecosistema sin alterar su equilibrio.",
    image: "src/assets/images/ficha/recipiente.jpg",
    alt: "Un terrario en un recipiente cilíndrico de vidrio, visto desde arriba",
  },
  {
    title: "QR integrado",
    text: "Cada terrario incluye un código QR que permite escuchar la biosonificación de sus plantas en formato musical.",
    image: "src/assets/images/ficha/qr.jpg",
    alt: "Suculentas y piedras de un terrario, vistas desde arriba",
  },
  {
    title: "Composición única",
    text: "La selección de especies y el orden de sus capas garantizan un diseño equilibrado y funcional en cada terrario.",
    image: "src/assets/images/ficha/composicion.jpg",
    alt: "Suculentas de hojas puntiagudas de un terrario, de cerca",
  },
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
    short: "Riego y la guía de cuidados.",
    text: "Regá de a poco, más o menos cada 30 días, y ventilalo si es cerrado. En Cuidados ves cuándo toca regar y todo lo que necesita.",
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
// [nombre, material, texto, video]. Los videos son los GIF de
// filotaxia.com/terrarios pasados a MP4 livianos (src/assets/videos/capas/,
// 400px, sin sonido, en loop): los GIF de giphy pesaban 49 MB entre los
// cuatro y hacían lento al Manifiesto en el celular; los MP4, 1,3 MB.
// Se muestran con <video muted loop playsinline autoplay>. Cuando haya
// videos propios, se reemplazan esos archivos.
export const LAYERS = [
  ["Plantas", "Suculentas", "La vida visible del terrario. Sus impulsos eléctricos se convierten en melodías que reflejan su actividad.",
    "src/assets/videos/capas/capa01-plantas.mp4"],
  ["Sustrato", "Tierra, perlita, arena gruesa", "La base oculta: regula el agua, el aire y los nutrientes que necesitan las raíces para expandirse.",
    "src/assets/videos/capas/capa02-sustrato.mp4"],
  ["Metal", "Rejilla metálica", "Un límite protector que impide que las raíces lleguen al fondo y se pudran por exceso de humedad.",
    "src/assets/videos/capas/capa03-metal.mp4"],
  ["Piedras", "Piedra pómez", "El drenaje natural: evita el exceso de agua y deja circular el aire para que las raíces estén sanas.",
    "src/assets/videos/capas/capa04-piedras.mp4"],
];

// El terrario de la pantalla 4 del Manifiesto: la foto del TR01 (la de
// producto de filotaxia.com, la misma de la colección), con un punto por capa
// (`layer`: su lugar en LAYERS) y uno por planta (`name`: el de
// content/plantas.js). x / y son el lugar del punto, en % del ancho y del
// alto de la foto (cambialos para moverlos).
export const INSIDE_TERRARIUM = {
  image: "src/assets/images/terrarios/tr01.jpg",
  alt: "El terrario TR01: una pecera redonda de vidrio con suculentas, piedras y sustrato",
  spots: [
    { kind: "capa", layer: 0, x: 45, y: 37 },
    { kind: "capa", layer: 1, x: 28, y: 72 },
    { kind: "capa", layer: 2, x: 74, y: 73 },
    { kind: "capa", layer: 3, x: 52, y: 78 },
    { kind: "planta", name: "Haworthia Attenuata", x: 38, y: 60 },
    { kind: "planta", name: "Haworthia Fasciata", x: 68, y: 48 },
    { kind: "planta", name: "Haworthia Venosa", x: 57, y: 55 },
  ],
};

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
