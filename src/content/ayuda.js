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
    text: HOW_IT_WORKS[0].text,
    video: null,
  },
  {
    key: "escaneado",
    title: "Conectá tu terrario",
    short: "Con el QR de su base.",
    text: HOW_IT_WORKS[1].text,
    video: null,
  },
  {
    key: "escuchado",
    title: "Escuchá su pieza",
    short: "Sus plantas, convertidas en música.",
    text: HOW_IT_WORKS[2].text,
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
// terrarios, no cambia según las plantas. Misma forma que HOW_IT_WORKS (foto
// + texto): la sección cambia la foto al tocar el paso, igual que "Cómo
// funciona" en la ficha (mismas clases .how, terrario.css). Los 4 textos son
// los de la sección "Cuidados" de filotaxia.com/src/pages/terrarios.html
// (data-text de cada h2, tal cual están ahí — el de Ubicación habla de
// ventilación, así está en la web). Las fotos son las de esa misma sección
// (sq5, sq10, sq9, sq11): jeringa.jpg y ventana.jpg ya estaban en ficha/;
// pinza.jpg también (es sq11, ya recortada en horizontal para HOW_IT_WORKS);
// ubicacion.jpg es nueva, sq9 a 800px.
export const CARE_GUIDE = [
  {
    topic: "Riego",
    text: "Regar demasiado ahoga, regar poco reseca: lo ideal es encontrar un ritmo constante. Deja que la tierra se seque entre cada riego para que respire.",
    image: "src/assets/images/ficha/jeringa.jpg",
    alt: "Una mano riega un terrario con una jeringa",
  },
  {
    topic: "Luz",
    text: "Necesitan un equilibrio entre sol directo y sombra, evitando los extremos que las debilitan. Una ventana luminosa o un espacio bien iluminado favorece su crecimiento armónico.",
    image: "src/assets/images/ficha/ventana.jpg",
    alt: "Un terrario de vidrio con suculentas junto a una ventana",
  },
  {
    topic: "Ubicación",
    text: "El aire en movimiento renueva y fortalece. Una buena ventilación evita enfermedades y ayuda a que la planta respire sin tensiones. No se trata de un viento fuerte, sino de una brisa que acaricia.",
    image: "src/assets/images/ficha/ubicacion.jpg",
    alt: "Un terrario de vidrio con suculentas sobre un estante, entre libros",
  },
  {
    topic: "Mantenimiento",
    text: "Cada planta tiene un nivel de cuidado distinto: algunas requieren atención diaria, otras apenas pequeños gestos. Entender esa dificultad es parte del vínculo.",
    image: "src/assets/images/ficha/pinza.jpg",
    alt: "Una mano acomoda las plantas de un terrario con una pinza",
  },
];

// "1 proceso / 3 etapas" de la página Música de filotaxia.com (la Guía):
// la frase de arriba, las fotos del slider (las de la web a 800px, en
// src/assets/images/guia/) y las tres etapas [título, texto]. Los textos de las
// etapas son los de la web, acortados para leerlos en el celular.
export const PROCESS_INTRO =
  "Las bioemisiones de las plantas son traducidas en sonido a partir de una onda definida por la forma de sus hojas.";

export const PROCESS_PHOTOS = [
  { image: "src/assets/images/guia/proceso-01.jpg", alt: "Un terrario redondo de vidrio visto desde arriba, con suculentas y piedras" },
  { image: "src/assets/images/guia/proceso-02.jpg", alt: "Una mano acomoda con una pinza las plantas de un terrario" },
  { image: "src/assets/images/guia/proceso-03.jpg", alt: "Suculentas entre piedras, vistas desde arriba" },
  { image: "src/assets/images/guia/proceso-04.jpg", alt: "Una pinza dentro de un terrario cilíndrico de vidrio" },
  { image: "src/assets/images/guia/proceso-05.jpg", alt: "Un terrario redondo de vidrio con suculentas, de frente" },
];

export const PROCESS = [
  [
    "Selección y armado del terrario",
    "Elegimos las plantas por su forma, tamaño y color, y armamos el terrario en 4 capas: plantas, sustrato, metal y piedras. Es la base de todo lo que vas a ver y escuchar.",
  ],
  [
    "Biosonificación",
    "Con Biodata conectamos electrodos a cada planta. Cada vez que cambia su conductividad, la planta genera una nota MIDI: así se escucha lo que pasa adentro de ella.",
  ],
  [
    "Producción musical",
    "Esas notas pasan al sintetizador Microfreak y a Ableton, donde le damos una voz a cada planta. El resultado es una pieza única para cada terrario, que suena al escanear su QR.",
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

// El terrario de la pantalla 2 del Manifiesto: la foto del TR01 (la de
// producto de filotaxia.com), con un punto por capa (`layer`: su lugar en
// LAYERS) y uno por planta (`name`: el de content/plantas.js). x / y son el
// lugar del punto, en % del ancho y del alto de la foto (cambialos para
// moverlos). Tiene su propio archivo, tr01-por-dentro.jpg (el recorte viejo):
// los puntos están medidos sobre ese recorte, así que tr01.jpg (la de la
// colección, centrada en el terrario) puede cambiar sin moverlos.
// Sin el punto de la capa "Plantas" (layer 0): ya están los de cada planta
// con su propio nombre, y repetirlo como capa era redundante. El primero
// (Piedras) es el que se ve por defecto al abrir la pantalla.
export const INSIDE_TERRARIUM = {
  image: "src/assets/images/terrarios/tr01-por-dentro.jpg",
  alt: "El terrario TR01: una pecera redonda de vidrio con suculentas, piedras y sustrato",
  spots: [
    { kind: "capa", layer: 3, x: 52, y: 78 },
    { kind: "capa", layer: 1, x: 28, y: 72 },
    { kind: "capa", layer: 2, x: 74, y: 73 },
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

// Preguntas del Manifiesto de filotaxia.com (no las de Cuidados: la ficha
// repite el "(PMF)" pero no las mismas 5 preguntas, para no duplicar texto
// entre la ficha y Cuidados). Van en la ficha (terrario-secciones.js).
export const MANIFESTO_FAQ = [
  [
    "¿Cuál es el propósito de Filotaxia?",
    "En Filotaxia creemos que el futuro es vegetal. Mientras la inteligencia artificial y la tecnología avanzan a un ritmo galopante, los seres humanos estaremos cada vez más interpelados por su impacto. Nuestro proyecto busca ofrecer un contrapunto: un espacio de conexión directa con la naturaleza. A través de los terrarios y la biosonificación, invitamos a escuchar a las plantas y redescubrir lo que siempre estuvo ahí. Es una manera de detenerse, observar y tener un momento de armonía con lo vivo en medio de un mundo cada vez más digital.",
  ],
  [
    "¿Qué significa “armonía en plantas”?",
    "Se refiere a la relación entre las formas, patrones y ritmos presentes en la naturaleza y cómo estos pueden expresarse también en vibraciones sonoras. La armonía surge al conectar lo visual con lo auditivo, mostrando que ambos lenguajes son parte de un mismo fenómeno vital.",
  ],
  [
    "¿Por qué transformar hojas y formas en música?",
    "Porque las plantas no solo son organismos vivos, también son portadoras de patrones universales. Al traducir esos patrones en sonido, hacemos audible una parte de la vida que normalmente solo percibimos con la vista, creando un puente entre arte, ciencia y percepción sensorial.",
  ],
  [
    "¿Qué papel cumple la tecnología en el proyecto?",
    "La tecnología es el puente que hace posible la biosonificación y la traducción de formas en sonido. Sin embargo, no reemplaza a la planta: solo amplifica lo que ya existe. La naturaleza sigue siendo la protagonista; la tecnología ayuda a escucharla de otra manera.",
  ],
  [
    "¿Cuál es la intención del manifiesto?",
    "El manifiesto busca invitar a reflexionar sobre la conexión entre humanos y naturaleza. No se trata solo de producir música experimental, sino de generar conciencia sobre los ritmos ocultos de la vida, y cómo al observarlos podemos encontrar nuevas formas de relación con el mundo natural.",
  ],
];

export const CONTACT = {
  email: "hola@filotaxia.com",
  instagram: "filotaxiar",
};
