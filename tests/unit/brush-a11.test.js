'use strict';
// A11 (D32): núcleo de pinceles puro. Balde acotado, azar con semilla, estabilizador y presión.
const test = require('node:test');
const assert = require('node:assert/strict');
const MC = require('./_load').load();
const B = MC.brush;
const M = MC.model;

function canvas(w, h) { return new Uint8ClampedArray(w * h * 4); }
function set(data, w, x, y, rgba) { const i = (y * w + x) * 4; data[i] = rgba[0]; data[i + 1] = rgba[1]; data[i + 2] = rgba[2]; data[i + 3] = rgba[3]; }
function at(data, w, x, y) { const i = (y * w + x) * 4; return [data[i], data[i + 1], data[i + 2], data[i + 3]]; }

test('balde: llena solo adentro de un contorno cerrado y respeta la tolerancia', () => {
  const w = 20, h = 20, d = canvas(w, h), ink = [0, 0, 0, 255], red = [200, 30, 30, 255];
  // Un cuadrado de 10×10 (borde en 5 y 14).
  for (let i = 5; i <= 14; i++) { set(d, w, i, 5, ink); set(d, w, i, 14, ink); set(d, w, 5, i, ink); set(d, w, 14, i, ink); }
  const n = B.floodFill(d, w, h, 10, 10, red, 32);
  assert.equal(n, 8 * 8, 'el interior: 8×8');
  assert.deepEqual(at(d, w, 10, 10), red);
  assert.deepEqual(at(d, w, 2, 2), [0, 0, 0, 0], 'afuera queda transparente');
  assert.deepEqual(at(d, w, 5, 10), ink, 'el borde no se pinta');
  // Rellenar con el mismo color no hace nada (y no se cuelga).
  assert.equal(B.floodFill(d, w, h, 10, 10, red, 32), 0);
  // Tolerancia: un gris parecido entra con 40, no con 10.
  const g = canvas(4, 1);
  set(g, 4, 0, 0, [100, 100, 100, 255]); set(g, 4, 1, 0, [120, 120, 120, 255]); set(g, 4, 2, 0, [100, 100, 100, 255]); set(g, 4, 3, 0, [255, 255, 255, 255]);
  const g2 = new Uint8ClampedArray(g);
  assert.equal(B.floodFill(g, 4, 1, 0, 0, red, 10), 1);
  assert.equal(B.floodFill(g2, 4, 1, 0, 0, red, 40), 3);
  // Fuera de la hoja: nada.
  assert.equal(B.floodFill(d, w, h, -1, 3, red, 32), 0);
});

test('balde: el fondo abierto se llena entero (y una hoja grande no se cuelga)', () => {
  const w = 300, h = 300, d = canvas(w, h);
  const t0 = Date.now();
  assert.equal(B.floodFill(d, w, h, 0, 0, [1, 2, 3, 255], 0), w * h);
  assert.ok(Date.now() - t0 < 1500);
});

test('azar con semilla: aerógrafo y grafito salen iguales cada vez', () => {
  const pts = [[100, 100], [140, 120], [200, 160]];
  assert.deepEqual(B.sprayDots(pts, 10, 42), B.sprayDots(pts, 10, 42));
  assert.notDeepEqual(B.sprayDots(pts, 10, 42), B.sprayDots(pts, 10, 43));
  const dots = B.sprayDots(pts, 10, 7);
  const r = B.widthAt('airbrush', 10);
  assert.ok(dots.length > 10);
  assert.ok(dots.every(([x, y]) => pts.some((p) => Math.hypot(x - p[0], y - p[1]) <= r + 0.2)), 'los puntitos quedan cerca del trazo');
  assert.deepEqual(B.graphiteStrands(5, 8), B.graphiteStrands(5, 8));
});

test('estabilizador y presión', () => {
  const zig = [[0, 0], [10, 10], [20, 0], [30, 10], [40, 0]];
  const s = B.smooth(zig, 1);
  assert.deepEqual(s[0], [0, 0]);
  assert.deepEqual(s[4], [40, 0]);
  assert.ok(Math.abs(s[2][1] - 6.7) < 0.1, 'el pico se suaviza');
  assert.equal(B.pressureFrom('pen', 0.8, 50), 0.8, 'lápiz óptico: la presión real');
  assert.ok(B.pressureFrom('mouse', 0.5, 2) > B.pressureFrom('mouse', 0.5, 40), 'mouse: lento = más grueso');
  assert.ok(B.widthAt('nib', 10, 1) > B.widthAt('nib', 10, 0.1));
  assert.equal(B.widthAt('technical', 10, 0.1), 10);
});

test('contrato: herramientas del núcleo = las que guarda el modelo; un relleno sobrevive al saneado', () => {
  assert.deepEqual(Object.keys(B.TOOLS).sort(), M.DRAW_TOOLS.slice().sort());
  const d = M.sanitizeDrawing({ strokes: [
    { tool: 'nib', color: '#584488', width: 6, points: [[1, 2], [3, 4]], pressure: [0.2, 0.9], seed: 12 }, // color-ok: test
    { tool: 'fill', x: 500, y: 500, color: '#D98FA1', tolerance: 40 } // color-ok: test
  ], texts: [] });
  assert.equal(d.strokes.length, 2);
  assert.deepEqual(d.strokes[0].pressure, [0.2, 0.9]);
  assert.equal(d.strokes[0].seed, 12);
  assert.deepEqual(d.strokes[1], { tool: 'fill', x: 500, y: 500, color: '#D98FA1', tolerance: 40 }); // color-ok: test
});
