export const RECITAL_TIME_ZONE = "America/Argentina/Buenos_Aires";

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  timeZone: "UTC",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export function isValidDateKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function getArgentinaDateKey(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: RECITAL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function formatRecitalDate(dateKey) {
  if (!isValidDateKey(dateKey)) return "";
  const [year, month, day] = dateKey.split("-").map(Number);
  return dateFormatter.format(new Date(Date.UTC(year, month - 1, day))).toLocaleUpperCase("es-AR");
}

export function isValidGoogleMapsUrl(value) {
  if (!value) return false;

  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return false;

    const hostname = url.hostname.toLowerCase();
    if (hostname === "maps.app.goo.gl") return true;
    if (hostname === "goo.gl") return url.pathname.toLowerCase().startsWith("/maps");

    const googleMapsHosts = new Set([
      "google.com",
      "www.google.com",
      "maps.google.com",
      "google.com.ar",
      "www.google.com.ar",
      "maps.google.com.ar",
    ]);
    return googleMapsHosts.has(hostname) && (hostname.startsWith("maps.") || url.pathname.toLowerCase().startsWith("/maps"));
  } catch {
    return false;
  }
}

export function classifyRecitales(recitales, today = getArgentinaDateKey()) {
  if (!isValidDateKey(today)) throw new Error("La fecha de referencia debe usar el formato YYYY-MM-DD.");

  const vigentes = [];
  const finalizados = [];
  const sinFechaCompleta = [];

  for (const recital of recitales || []) {
    const dateKey = recital.fecha_evento;
    if (!isValidDateKey(dateKey)) sinFechaCompleta.push(recital);
    else if (dateKey >= today) vigentes.push(recital);
    else finalizados.push(recital);
  }

  vigentes.sort((a, b) => a.fecha_evento.localeCompare(b.fecha_evento));
  finalizados.sort((a, b) => b.fecha_evento.localeCompare(a.fecha_evento));
  return { vigentes, finalizados, sinFechaCompleta };
}
