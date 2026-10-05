/* Núcleo de pinceles (A11, D32): puro, sin DOM, para que el dibujo se pueda volver a editar y probar.
   - `random(seed)`: azar con semilla (el aerógrafo y el grafito salen iguales cada vez que se dibujan).
   - `smooth(points, n)`: estabilizador (promedio móvil que conserva las puntas).
   - `pressureFrom(…)`: presión real del lápiz óptico o, con mouse/dedo, una presión suave por velocidad.
   - `widthAt(tool, base, p)`: grosor según herramienta y presión.
   - `sprayDots(points, width, seed)`: los puntitos del aerógrafo.
   - `floodFill(data, w, h, x, y, rgba, tolerance)`: balde acotado por tolerancia, sobre un ImageData. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { var MC = root.MC || (root.MC = {}); MC.brush = api; }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  // Cómo se ve cada herramienta. `alpha`: opacidad del trazo; `pressure`: si guarda presión.
  var TOOLS = {
    technical: { label: 'Técnico', alpha: 1, pressure: false },
    nib: { label: 'Plumilla', alpha: 1, pressure: true },
    graphite: { label: 'Grafito', alpha: 0.75, pressure: true },
    highlighter: { label: 'Resaltador', alpha: 0.35, pressure: false },
    airbrush: { label: 'Aerógrafo', alpha: 0.5, pressure: false }
  };

  /** mulberry32: rápido y suficiente para que un trazo se repita igual. */
  function random(seed) {
    var a = (seed >>> 0) || 1;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Estabilizador: cada punto pasa a ser el promedio de sus vecinos (radio n); la primera y la última quedan. */
  function smooth(points, n) {
    if (!points || points.length < 3 || !n) return (points || []).slice();
    return points.map(function (p, i) {
      if (i === 0 || i === points.length - 1) return p.slice();
      var lo = Math.max(0, i - n), hi = Math.min(points.length - 1, i + n), sx = 0, sy = 0;
      for (var k = lo; k <= hi; k++) { sx += points[k][0]; sy += points[k][1]; }
      var c = hi - lo + 1;
      return [Math.round(sx / c * 10) / 10, Math.round(sy / c * 10) / 10];
    });
  }

  /**
   * Presión de un punto: la del lápiz óptico si la hay; si no (mouse, dedo), más rápido = más finito,
   * como una plumilla de verdad. `dist`: distancia desde el punto anterior (unidades 0..1000).
   */
  function pressureFrom(pointerType, pressure, dist) {
    if (pointerType === 'pen' && pressure > 0) return Math.round(Math.min(1, Math.max(0.05, pressure)) * 1000) / 1000;
    var p = 1 - Math.min(1, (dist || 0) / 40) * 0.65;
    return Math.round(p * 1000) / 1000;
  }

  /** Grosor efectivo (unidades lógicas) de un tramo. */
  function widthAt(tool, base, p) {
    var pr = p == null ? 0.5 : p;
    if (tool === 'nib') return base * (0.3 + pr * 1.1);
    if (tool === 'graphite') return Math.max(1, base * (0.35 + pr * 0.45));
    if (tool === 'highlighter') return base * 2.4;
    if (tool === 'airbrush') return base * 2.2;
    return base;
  }

  /** Puntitos del aerógrafo a lo largo del trazo: [[x, y, r]]. Siempre los mismos para la misma semilla. */
  function sprayDots(points, width, seed) {
    var rnd = random(seed || 1), out = [];
    var radius = widthAt('airbrush', width);
    var per = Math.max(6, Math.round(radius * 0.9));
    (points || []).forEach(function (p, i) {
      if (i > 0) {
        var q = points[i - 1];
        if (Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) < radius * 0.25 && i !== points.length - 1) return;
      }
      for (var k = 0; k < per; k++) {
        // Más denso en el centro: radio por raíz del azar.
        var ang = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * radius;
        out.push([Math.round((p[0] + Math.cos(ang) * d) * 10) / 10, Math.round((p[1] + Math.sin(ang) * d) * 10) / 10, Math.round((0.6 + rnd() * 1.2) * 10) / 10]);
      }
    });
    return out.slice(0, 20000);
  }

  /** Desplazamientos de las hebras del grafito (le dan grano sin raster). */
  function graphiteStrands(seed, width) {
    var rnd = random(seed || 1), n = 3, out = [];
    for (var i = 0; i < n; i++) out.push([(rnd() - 0.5) * width * 0.6, (rnd() - 0.5) * width * 0.6, 0.35 + rnd() * 0.4]);
    return out;
  }

  /**
   * Balde: pinta la zona conectada (4 vecinos) cuyo color se parece al del punto de partida, dentro de
   * `tolerance` (0..255, por canal, también alfa). Modifica `data` (RGBA) y devuelve cuántos píxeles pintó.
   * Si el color de partida ya es el de relleno, no hace nada (así no se cuelga).
   */
  function floodFill(data, w, h, x, y, rgba, tolerance) {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || y < 0 || x >= w || y >= h) return 0;
    var tol = Math.max(0, Math.min(255, tolerance == null ? 32 : tolerance));
    var i0 = (y * w + x) * 4;
    var sr = data[i0], sg = data[i0 + 1], sb = data[i0 + 2], sa = data[i0 + 3];
    if (Math.abs(sr - rgba[0]) <= 0 && Math.abs(sg - rgba[1]) <= 0 && Math.abs(sb - rgba[2]) <= 0 && Math.abs(sa - rgba[3]) <= 0) return 0;
    var seen = new Uint8Array(w * h);
    function like(i) {
      return Math.abs(data[i] - sr) <= tol && Math.abs(data[i + 1] - sg) <= tol && Math.abs(data[i + 2] - sb) <= tol && Math.abs(data[i + 3] - sa) <= tol;
    }
    var stack = [x, y], count = 0;
    while (stack.length) {
      var cy = stack.pop(), cx = stack.pop();
      // Avanza a la izquierda mientras se parezca; después pinta la fila hacia la derecha (scanline).
      var lx = cx;
      while (lx >= 0 && !seen[cy * w + lx] && like((cy * w + lx) * 4)) lx--;
      lx++;
      var upOpen = false, downOpen = false;
      for (var px = lx; px < w; px++) {
        var idx = cy * w + px;
        if (seen[idx] || !like(idx * 4)) break;
        seen[idx] = 1;
        var di = idx * 4;
        data[di] = rgba[0]; data[di + 1] = rgba[1]; data[di + 2] = rgba[2]; data[di + 3] = rgba[3];
        count++;
        if (cy > 0) {
          var u = idx - w;
          if (!seen[u] && like(u * 4)) { if (!upOpen) { stack.push(px, cy - 1); upOpen = true; } } else upOpen = false;
        }
        if (cy < h - 1) {
          var dn = idx + w;
          if (!seen[dn] && like(dn * 4)) { if (!downOpen) { stack.push(px, cy + 1); downOpen = true; } } else downOpen = false;
        }
      }
    }
    return count;
  }

  return { TOOLS: TOOLS, random: random, smooth: smooth, pressureFrom: pressureFrom, widthAt: widthAt, sprayDots: sprayDots, graphiteStrands: graphiteStrands, floodFill: floodFill };
});
