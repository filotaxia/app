/* ============================================
   Utils — Care
   ============================================ */

// Cuidados del terrario: cuándo toca regar y ventilar, las lecturas del día
// y la frase de estado ("Todo en equilibrio."). Todo puro y testeado.
//
// LECTURAS SIMULADAS: hasta que el terrario tenga sensores, la humedad,
// la temperatura y las horas de luz se generan con semilla (terrario + día),
// así no cambian al recargar. La humedad sí depende de lo que hace la
// persona: baja a medida que pasan los días sin regar.
//
// `care` de cada terrario (content/terrarios.js):
//   { riego_days, ventilacion_days, humidity: [min, max], temp: [min, max],
//     light: "Indirecta", light_hours: [min, max] }
// ventilacion_days es null en los ecosistemas abiertos (no se ventilan).

import { addDays, daysBetween } from "./dates.js";
import { random, seedFrom } from "./random.js";

// last: último día que se hizo · every: cada cuántos días · today: hoy
// → daysLeft (negativo = atrasado) y fraction (1 = recién hecho, 0 = toca)
export function nextCare({ last, every, today }) {
  const daysLeft = every - daysBetween(last, today);
  return { daysLeft, fraction: Math.min(1, Math.max(0, daysLeft / every)) };
}

export function dueLabel(daysLeft) {
  if (daysLeft > 1) return `${daysLeft} días`;
  if (daysLeft === 1) return "Mañana";
  if (daysLeft === 0) return "Hoy";
  return daysLeft === -1 ? "Hace 1 día" : `Hace ${-daysLeft} días`;
}

// Humedad del aire según los días desde el último riego: recién regado
// queda arriba del rango ideal; al día de riego, apenas sobre el mínimo;
// después, por debajo. Más un poco de ruido del día.
function humidityFor(care, daysSinceRiego, noise) {
  const [min, max] = care.humidity;
  const dryness = Math.max(0, daysSinceRiego) / care.riego_days;
  const value = max - 3 - dryness * (max - min - 5) + (noise - 0.5) * 4;
  return Math.round(Math.min(100, Math.max(0, value)));
}

export function readings({ terrario, today, daysSinceRiego }) {
  const { care } = terrario;
  const rand = random(seedFrom(`${terrario.id}:${today}`));
  const randYesterday = random(seedFrom(`${terrario.id}:${addDays(today, -1)}`));

  // Ayer: un día menos sin regar (si se regó hoy, ayer estaba al final del ciclo)
  const yesterdaySince = daysSinceRiego > 0 ? daysSinceRiego - 1 : care.riego_days;

  const [tempMin, tempMax] = care.temp;
  const [lightMin, lightMax] = care.light_hours ?? [4, 8];

  return {
    humidity: humidityFor(care, daysSinceRiego, rand()),
    yesterdayHumidity: humidityFor(care, yesterdaySince, randYesterday()),
    temp: Math.round((tempMin + tempMax) / 2 + (rand() - 0.5) * (tempMax - tempMin)),
    lightHours: Math.round(lightMin + rand() * (lightMax - lightMin)),
  };
}

// La frase de estado debajo del nombre: lo más urgente primero
export function careStatus({ care, reading, riegoLeft, ventilacionLeft }) {
  const [humMin, humMax] = care.humidity;
  const [tempMin, tempMax] = care.temp;

  if (riegoLeft < 0) return "Necesita riego.";
  if (riegoLeft === 0) return "Hoy toca regar.";
  if (reading.humidity < humMin) return "Le falta humedad.";
  if (reading.humidity > humMax) {
    return care.ventilacion_days ? "Demasiada humedad. Ventilalo." : "Demasiada humedad. Esperá para regar.";
  }
  if (reading.temp < tempMin || reading.temp > tempMax) return "Está fuera de su temperatura.";
  if (care.ventilacion_days && ventilacionLeft <= 0) return "Hoy toca ventilar.";
  return "Todo en equilibrio.";
}
