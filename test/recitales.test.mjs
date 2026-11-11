import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../lib/recitales.js", import.meta.url), "utf8");
const recitales = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
const { classifyRecitales, getRecitalTicketLink, isInstagramUrl, validateRecitalLinks } = recitales;

test("reconoce únicamente dominios de Instagram sobre HTTP/HTTPS", () => {
  assert.equal(isInstagramUrl("https://www.instagram.com/terra_okey/"), true);
  assert.equal(isInstagramUrl("https://instagr.am/terra_okey/"), true);
  assert.equal(isInstagramUrl("https://instagram.com.ejemplo.com/terra_okey/"), false);
  assert.equal(isInstagramUrl("ftp://instagram.com/terra_okey/"), false);
});

test("impide guardar Instagram y compra simultáneamente", () => {
  assert.throws(
    () => validateRecitalLinks({ instagram_url: "https://instagram.com/show", ticket_url: "https://tickets.example/show" }),
    /no se pueden guardar ambos/,
  );
});

test("impide usar Instagram como enlace de compra", () => {
  assert.throws(
    () => validateRecitalLinks({ instagram_url: null, ticket_url: "https://instagram.com/show" }),
    /no puede ser un enlace de Instagram/,
  );
});

test("prioriza Instagram cuando el recital tiene un enlace de consulta", () => {
  assert.deepEqual(
    getRecitalTicketLink({ instagram_url: " https://instagram.com/show/ ", ticket_url: null }, "https://instagram.com/terra/"),
    { href: "https://instagram.com/show/", label: "CONSULTAR POR IG" },
  );
});

test("usa la venta externa cuando no hay un enlace de Instagram", () => {
  assert.deepEqual(
    getRecitalTicketLink({ instagram_url: null, ticket_url: " https://tickets.example/show " }, "https://instagram.com/terra/"),
    { href: "https://tickets.example/show", label: "COMPRAR ENTRADA" },
  );
});

test("conserva Instagram oficial como respaldo para recitales existentes", () => {
  assert.deepEqual(
    getRecitalTicketLink({ instagram_url: "", ticket_url: null }, "https://instagram.com/terra/"),
    { href: "https://instagram.com/terra/", label: "CONSULTAR POR IG" },
  );
});

test("la clasificación de recitales no cambia con los enlaces de entradas", () => {
  const yesterday = { id: 1, fecha_evento: "2026-11-10", ticket_url: "https://tickets.example/1" };
  const today = { id: 2, fecha_evento: "2026-11-11", instagram_url: "https://instagram.com/show" };
  const tomorrow = { id: 3, fecha_evento: "2026-11-12" };

  const result = classifyRecitales([tomorrow, yesterday, today], "2026-11-11");

  assert.deepEqual(result.vigentes.map(({ id }) => id), [2, 3]);
  assert.deepEqual(result.finalizados.map(({ id }) => id), [1]);
  assert.deepEqual(result.sinFechaCompleta, []);
});
