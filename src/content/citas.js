/* ============================================
   Content — Citas
   ============================================ */

// Las citas del Manifiesto de filotaxia.com. La pantalla 1 del Manifiesto
// (views/manifiesto) muestra una distinta cada vez que se abre, en este orden.
//
//   { text, book, author }

export const QUOTES = [
  {
    text: "El intervalo de una octava contiene la forma de la hoja. La filotaxia es un patrón que puede escucharse como armonía musical.",
    book: "Harmonia Plantarum",
    author: "Hans Kayser",
  },
  {
    text: "Las plantas vibran con ritmos que apenas percibimos. Responden de manera distinta a cada tipo de música, como si entendieran un lenguaje propio.",
    book: "La vida secreta de las plantas",
    author: "Peter Tompkins & Christopher Bird",
  },
  {
    text: "La naturaleza escribe en geometría: cada curva y espiral responde a leyes constantes. No hay azar, sino un orden que sostiene la vida.",
    book: "Sobre el crecimiento y la forma",
    author: "D’Arcy W. Thompson",
  },
  {
    text: "La música de las plantas combina ciencia y arte. A través del biosonificador, las plantas expresan su estado interno como sonido real.",
    book: "Sonic Plants",
    author: "Rodrigo Tamay",
  },
  {
    text: "La vida vegetal sigue algoritmos en movimiento. Cada hoja y ramificación se organiza mediante reglas simples que generan estructuras complejas.",
    book: "La belleza algorítmica de las plantas",
    author: "Prusinkiewicz & Lindenmayer",
  },
  {
    text: "La naturaleza diseña flujos que optimizan energía y forma. Cada hoja revela un mapa de eficiencia y movimiento.",
    book: "Diseño en la naturaleza",
    author: "Adrian Bejan & J. Peder Zane",
  },
];

// La cita que sigue a la última que se mostró (null = todavía ninguna → la primera).
// Da la vuelta al llegar al final, así nunca se repite dos veces seguidas.
export function nextQuoteIndex(last) {
  return Number.isInteger(last) ? (last + 1) % QUOTES.length : 0;
}
