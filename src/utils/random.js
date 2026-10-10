/* ============================================
   Utils — Random
   ============================================ */

// Azar con semilla: el mismo texto da siempre los mismos números.
// Lo usan la partitura de cada terrario (audio/score.js) y las lecturas
// simuladas de sus sensores (utils/care.js).
//
//   const rand = random(seedFrom("04"));
//   rand();   // 0..1, siempre la misma secuencia para "04"

// Texto → número de 32 bits (hash FNV-1a)
export function seedFrom(text) {
  let hash = 2166136261;
  for (const char of String(text)) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// Generador pseudoaleatorio con semilla (mulberry32): devuelve 0..1
export function random(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
