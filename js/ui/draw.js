/* Dibujar: una hojita para dibujar con los hilos del cuaderno (técnico, plumilla, grafito, resaltador,
   aerógrafo, balde, goma, texto, deshacer). Los pinceles viven en js/core/brush.js (A11, D32).
   El dibujo se guarda como imagen propia (recortada, fondo transparente) + sus trazos, así se
   puede volver a editar, y se pega como sticker en cualquier hoja (DECISIONS D24). */
(function (root) {
  'use strict';
  var MC = root.MC;
  var h = MC.h, c = MC.c, M = MC.model;

  var SIZE = 1000;            // coordenadas lógicas (0..1000) en los dos ejes
  // Colores: los mismos tokens del cuaderno (se leen de css/tokens.css al abrir).
  var COLORS = [['--ink', 'tinta'], ['--mood-1', 'violeta'], ['--mood-2', 'ciruela'], ['--mood-3', 'rosa fuerte'], ['--mood-4', 'naranja'],
    ['--mood-5', 'mostaza'], ['--thread-done', 'verde'], ['--thread-later', 'lavanda fuerte'], ['--rose', 'rosa'], ['--sage', 'salvia'], ['--butter', 'manteca'], ['--paper', 'papel']];
  var WIDTHS = [['fino', 4], ['medio', 10], ['grueso', 24]];
  var FONTS = { hand: ['a mano', '--font-hand', 1.25], text: ['de libro', '--font-text', 1], display: ['de título', '--font-display', 1], ui: ['simple', '--font-ui', 0.95] };
  var TEXT_SIZES = [['chica', 36], ['mediana', 64], ['grande', 110]];

  function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function toHex(v) {
    if (/^#[0-9a-f]{6}$/i.test(v)) return v.toUpperCase();
    var probe = document.createElement('canvas').getContext('2d');
    probe.fillStyle = v || '#000'; // color-ok: sonda funcional
    return /^#[0-9a-f]{6}$/i.test(probe.fillStyle) ? probe.fillStyle.toUpperCase() : '#493D3B'; // color-ok: tinta por defecto de un trazo
  }

  function rgbaOf(hex, alpha) {
    var n = parseInt(String(hex).slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, Math.round((alpha == null ? 1 : alpha) * 255)];
  }

  /** Un camino suave por los puntos medios (técnico, resaltador, goma). */
  function smoothPath(ctx, p, scale, ox, oy) {
    ctx.beginPath();
    ctx.moveTo(p[0][0] * scale - ox, p[0][1] * scale - oy);
    for (var i = 1; i < p.length - 1; i++) {
      var mx = (p[i][0] + p[i + 1][0]) / 2, my = (p[i][1] + p[i + 1][1]) / 2;
      ctx.quadraticCurveTo(p[i][0] * scale - ox, p[i][1] * scale - oy, mx * scale - ox, my * scale - oy);
    }
    var last = p[p.length - 1];
    ctx.lineTo(last[0] * scale - ox, last[1] * scale - oy);
    ctx.stroke();
  }

  /** Tramo a tramo, con grosor según la presión (plumilla, grafito). */
  function pressurePath(ctx, s, scale, ox, oy, dx, dy) {
    var p = s.points, pr = s.pressure || [];
    for (var i = 1; i < p.length; i++) {
      var w = MC.brush.widthAt(s.tool, s.width, ((pr[i - 1] == null ? 0.5 : pr[i - 1]) + (pr[i] == null ? 0.5 : pr[i])) / 2);
      ctx.lineWidth = Math.max(0.5, w * scale);
      ctx.beginPath();
      ctx.moveTo((p[i - 1][0] + dx) * scale - ox, (p[i - 1][1] + dy) * scale - oy);
      ctx.lineTo((p[i][0] + dx) * scale - ox, (p[i][1] + dy) * scale - oy);
      ctx.stroke();
    }
  }

  /** Dibuja trazos, rellenos y textos en un contexto (escala = px por unidad lógica). */
  function paint(ctx, drawing, scale, offsetX, offsetY) {
    offsetX = offsetX || 0; offsetY = offsetY || 0;
    var B = MC.brush;
    drawing.strokes.forEach(function (s) {
      // Balde: rellena lo que ya está pintado en este lienzo, en el orden en que se hizo.
      if (s.tool === 'fill') {
        if (!ctx.getImageData) return;
        var cw = ctx.canvas.width, ch = ctx.canvas.height;
        var img = ctx.getImageData(0, 0, cw, ch);
        B.floodFill(img.data, cw, ch, s.x * scale - offsetX, s.y * scale - offsetY, rgbaOf(s.color), s.tolerance);
        ctx.putImageData(img, 0, 0);
        return;
      }
      if (!s.points || !s.points.length) return;
      var info = B.TOOLS[s.tool] || B.TOOLS.technical;
      ctx.save();
      ctx.globalCompositeOperation = s.erase ? 'destination-out' : (s.tool === 'highlighter' ? 'multiply' : 'source-over');
      ctx.globalAlpha = s.erase ? 1 : info.alpha;
      ctx.strokeStyle = s.erase ? '#000' : s.color; // color-ok: la goma borra con cualquier color opaco
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      var p = s.points;
      if (!s.erase && s.tool === 'airbrush') {
        B.sprayDots(p, s.width, s.seed).forEach(function (d) {
          ctx.beginPath();
          ctx.arc(d[0] * scale - offsetX, d[1] * scale - offsetY, Math.max(0.4, d[2] * scale), 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (p.length === 1) {
        ctx.beginPath();
        ctx.arc(p[0][0] * scale - offsetX, p[0][1] * scale - offsetY, B.widthAt(s.erase ? 'technical' : s.tool, s.width, s.pressure && s.pressure[0]) * scale / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (!s.erase && s.tool === 'nib') {
        pressurePath(ctx, s, scale, offsetX, offsetY, 0, 0);
      } else if (!s.erase && s.tool === 'graphite') {
        // Tres hebras finitas y un poco corridas: grano de lápiz sin pintar píxeles.
        B.graphiteStrands(s.seed, s.width).forEach(function (st) {
          ctx.globalAlpha = info.alpha * st[2];
          pressurePath(ctx, s, scale, offsetX, offsetY, st[0], st[1]);
        });
      } else {
        ctx.lineWidth = B.widthAt(s.erase ? 'technical' : s.tool, s.width) * scale;
        smoothPath(ctx, p, scale, offsetX, offsetY);
      }
      ctx.restore();
    });
    drawing.texts.forEach(function (t) {
      var f = FONTS[t.font] || FONTS.hand;
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = t.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = Math.round(t.size * f[2] * scale) + 'px ' + cssVar(f[1]);
      ctx.fillText(t.text, t.x * scale - offsetX, t.y * scale - offsetY);
      ctx.restore();
    });
  }

  /**
   * Exporta el dibujo recortado → { src, w, h } (WebP si el navegador puede, si no PNG). Se pinta entero y
   * se recorta por lo que quedó con color: así un relleno de balde también entra en la imagen.
   */
  function rasterize(drawing) {
    var scale = 0.9;
    var full = document.createElement('canvas');
    full.width = full.height = Math.round(SIZE * scale);
    var fctx = full.getContext('2d');
    paint(fctx, drawing, scale, 0, 0);
    var data = fctx.getImageData(0, 0, full.width, full.height).data;
    var x0 = full.width, y0 = full.height, x1 = -1, y1 = -1;
    for (var y = 0; y < full.height; y++) {
      for (var x = 0; x < full.width; x++) {
        if (data[(y * full.width + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
    }
    if (x1 < 0) return null;
    var pad = 10;
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad);
    x1 = Math.min(full.width - 1, x1 + pad); y1 = Math.min(full.height - 1, y1 + pad);
    var cv = document.createElement('canvas');
    cv.width = x1 - x0 + 1; cv.height = y1 - y0 + 1;
    cv.getContext('2d').drawImage(full, x0, y0, cv.width, cv.height, 0, 0, cv.width, cv.height);
    var src = cv.toDataURL('image/webp', 0.9);
    if (src.indexOf('data:image/webp') !== 0) src = cv.toDataURL('image/png');
    return { src: src, w: cv.width, h: cv.height };
  }

  /**
   * Abre la hoja de dibujo. opts: { image (un dibujo guardado, para editarlo), confirm }
   * → Promise<imagen guardada | null>
   */
  function open(opts) {
    opts = opts || {};
    var existing = opts.image && opts.image.kind === 'drawing' ? opts.image : null;
    var drawing = existing && existing.drawing ? MC.clone(existing.drawing) : { strokes: [], texts: [] };
    var history = MC.history.create();
    var previousHistory = MC.history.activate(history);
    var tool = 'technical';
    var palette = COLORS.map(function (col) { return [toHex(cssVar(col[0])), col[1]]; });
    var color = palette[0][0];
    var width = WIDTHS[1][1];
    var font = 'hand';
    var textSize = TEXT_SIZES[1][1];

    return new Promise(function (resolve) {
      var result = null;
      var canvas = h('canvas.draw__canvas', { width: SIZE, height: SIZE, 'aria-label': 'Hoja para dibujar. Con el texto podés escribir sin dibujar.', role: 'img' });
      history.setSurface(canvas);
      var ctx = canvas.getContext('2d');
      function redraw() {
        ctx.clearRect(0, 0, SIZE, SIZE);
        paint(ctx, drawing, 1);
        undoBtn.disabled = !history.canUndo();
        undoBtn.setAttribute('aria-disabled', String(undoBtn.disabled));
        undoBtn.setAttribute('aria-label', 'Deshacer' + (history.undoLabel() ? ' ' + history.undoLabel() : ''));
        redoBtn.disabled = !history.canRedo();
        redoBtn.setAttribute('aria-disabled', String(redoBtn.disabled));
        redoBtn.setAttribute('aria-label', 'Rehacer' + (history.redoLabel() ? ' ' + history.redoLabel() : ''));
        clearBtn.disabled = !drawing.strokes.length && !drawing.texts.length;
      }
      function remember(before, label) {
        var after = MC.clone(drawing);
        history.push({ label: label, undo: function () { drawing = MC.clone(before); redraw(); }, redo: function () { drawing = MC.clone(after); redraw(); } });
        redraw();
      }

      /* ---------- herramientas ---------- */
      function radios(label, items, current, onPick, cls) {
        var row = h('div.draw__row' + (cls ? '.' + cls : ''), { role: 'radiogroup', 'aria-label': label });
        items.forEach(function (it) {
          var b = h('button.draw__opt', { type: 'button', role: 'radio', 'aria-checked': String(it.value === current), 'aria-label': it.label, title: it.label }, it.content);
          b.addEventListener('click', function () {
            MC.$$('.draw__opt', row).forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
            onPick(it.value);
          });
          row.appendChild(b);
        });
        return row;
      }
      var tools = radios('Herramienta', [
        { value: 'technical', label: 'Lápiz técnico', content: [MC.icon('edit'), h('span', 'Técnico')] },
        { value: 'nib', label: 'Plumilla (más finita si vas rápido o apretás menos)', content: [MC.icon('nib'), h('span', 'Plumilla')] },
        { value: 'graphite', label: 'Grafito', content: [MC.icon('graphite'), h('span', 'Grafito')] },
        { value: 'highlighter', label: 'Resaltador', content: [MC.icon('marker'), h('span', 'Resaltador')] },
        { value: 'airbrush', label: 'Aerógrafo', content: [MC.icon('spray'), h('span', 'Aerógrafo')] },
        { value: 'fill', label: 'Balde: rellena una zona cerrada', content: [MC.icon('bucket'), h('span', 'Balde')] },
        { value: 'erase', label: 'Goma', content: [MC.icon('eraser'), h('span', 'Goma')] },
        { value: 'text', label: 'Texto', content: [MC.icon('text'), h('span', 'Texto')] }
      ], tool, function (v) { tool = v; textRow.hidden = v !== 'text'; canvas.dataset.tool = v; if (v === 'text') textInput.focus(); }, 'draw__tools');
      var colors = radios('Color', palette.map(function (p) {
        return { value: p[0], label: p[1], content: h('span.draw__swatch', { style: { background: p[0] } }) };
      }), color, function (v) { color = v; }, 'draw__colors');
      var widths = radios('Grosor', WIDTHS.map(function (w) {
        return { value: w[1], label: 'Trazo ' + w[0], content: h('span.draw__width', { style: { '--w': Math.max(3, w[1] / 2) + 'px' } }) };
      }), width, function (v) { width = v; }, 'draw__widths');

      var textInput = h('input.input.draw__text-input', { type: 'text', maxlength: 120, placeholder: 'escribí y tocá la hoja donde va', 'aria-label': 'Texto para poner en el dibujo' });
      var fontSel = h('select.select', { 'aria-label': 'Letra' }, Object.keys(FONTS).map(function (k) { return h('option', { value: k, selected: k === font }, 'Letra ' + FONTS[k][0]); }));
      fontSel.addEventListener('change', function () { font = fontSel.value; });
      var sizeSel = h('select.select', { 'aria-label': 'Tamaño de la letra' }, TEXT_SIZES.map(function (s) { return h('option', { value: s[1], selected: s[1] === textSize }, s[0]); }));
      sizeSel.addEventListener('change', function () { textSize = +sizeSel.value; });
      var center = h('button.text-btn', { type: 'button' }, 'Ponerlo en el medio');
      center.addEventListener('click', function () { placeText(500, 500); });
      var textRow = h('div.draw__text', textInput, fontSel, sizeSel, center);
      textRow.hidden = true;
      textInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); placeText(500, 500); } });

      function placeText(x, y) {
        var t = textInput.value.trim();
        if (!t) { textInput.focus(); return; }
        var before = MC.clone(drawing);
        drawing.texts.push({ text: t, x: x, y: y, size: textSize, font: font, color: color });
        textInput.value = '';
        remember(before, 'Poner texto');
      }

      var undoBtn = h('button.label-btn.label-btn--soft.is-history-disabled', { type: 'button', 'aria-label': 'Deshacer' }, MC.icon('undo'), 'Deshacer');
      undoBtn.addEventListener('click', function () { history.undo(); });
      var redoBtn = h('button.label-btn.label-btn--soft.is-history-disabled', { type: 'button', 'aria-label': 'Rehacer' }, MC.icon('redo'), 'Rehacer');
      redoBtn.addEventListener('click', function () { history.redo(); });
      var clearBtn = h('button.text-btn', { type: 'button' }, 'Borrar todo');
      clearBtn.addEventListener('click', function () { var before = MC.clone(drawing); drawing = { strokes: [], texts: [] }; remember(before, 'Borrar dibujo'); });

      /* ---------- dibujar con el puntero ---------- */
      var current = null;
      var strokeBefore = null;
      function pt(e) {
        var r = canvas.getBoundingClientRect();
        return [MC.clamp((e.clientX - r.left) / r.width * SIZE, 0, SIZE), MC.clamp((e.clientY - r.top) / r.height * SIZE, 0, SIZE)];
      }
      canvas.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        var p = pt(e);
        if (tool === 'text') { placeText(p[0], p[1]); return; }
        if (tool === 'fill') {
          var beforeFill = MC.clone(drawing);
          drawing.strokes.push({ tool: 'fill', x: Math.round(p[0]), y: Math.round(p[1]), color: color, tolerance: 40 });
          remember(beforeFill, 'Rellenar');
          return;
        }
        canvas.setPointerCapture(e.pointerId);
        strokeBefore = MC.clone(drawing);
        var erase = tool === 'erase';
        current = { tool: erase ? 'technical' : tool, color: erase ? null : color, erase: erase, width: erase ? width * 2 : width, points: [p] };
        if (!erase && MC.brush.TOOLS[tool].pressure) current.pressure = [MC.brush.pressureFrom(e.pointerType, e.pressure, 0)];
        if (!erase && (tool === 'airbrush' || tool === 'graphite')) current.seed = Math.floor(Math.random() * 2147483646) + 1;
        drawing.strokes.push(current);
        // Mientras se dibuja, lo de antes queda en una foto y solo se repinta el trazo nuevo (el balde es caro).
        base = document.createElement('canvas');
        base.width = base.height = SIZE;
        paint(base.getContext('2d'), { strokes: drawing.strokes.slice(0, -1), texts: drawing.texts }, 1);
        live();
      });
      var base = null;
      function live() {
        if (!base || !current) { redraw(); return; }
        ctx.clearRect(0, 0, SIZE, SIZE);
        ctx.drawImage(base, 0, 0);
        paint(ctx, { strokes: [current], texts: [] }, 1);
      }
      canvas.addEventListener('pointermove', function (e) {
        if (!current) return;
        var p = pt(e);
        var last = current.points[current.points.length - 1];
        var dist = Math.abs(p[0] - last[0]) + Math.abs(p[1] - last[1]);
        if (dist < 2) return;
        current.points.push([Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]);
        if (current.pressure) current.pressure.push(MC.brush.pressureFrom(e.pointerType, e.pressure, dist));
        live();
      });
      function end() {
        if (current && strokeBefore) {
          // Estabilizador suave al soltar (no en el aerógrafo ni la goma): el trazo queda prolijo y editable.
          if (!current.erase && current.tool !== 'airbrush') current.points = MC.brush.smooth(current.points, 1);
          remember(strokeBefore, 'Dibujar trazo');
        }
        current = null; strokeBefore = null; base = null;
      }
      canvas.addEventListener('pointerup', end);
      canvas.addEventListener('pointercancel', end);

      var nameInput = h('input.input', { id: 'draw-name', type: 'text', maxlength: 80, value: existing ? existing.name : '', placeholder: 'Dibujo' });
      var err = h('p.form-error', { role: 'alert' });

      c.dialog({
        title: existing ? 'Editar el dibujo' : 'Dibujar',
        className: 'sheet--draw',
        content: [
          h('div.draw', h('div.draw__bar', tools, colors, widths), textRow,
            h('div.draw__paper', canvas),
            h('div.draw__bar.draw__bar--end', undoBtn, redoBtn, clearBtn,
              h('label.draw__name', { for: 'draw-name' }, 'Nombre', nameInput))),
          err
        ],
        actions: [
          { label: 'Cancelar', kind: 'text' },
          { label: opts.confirm || (existing ? 'Guardar' : 'Pegar en la hoja'), onClick: function () {
            var r = rasterize(drawing);
            if (!r) { err.textContent = 'La hoja está en blanco: dibujá algo primero.'; return false; }
            return M.saveImage({
              id: existing ? existing.id : undefined, kind: 'drawing', name: nameInput.value.trim() || 'Dibujo',
              src: r.src, w: r.w, h: r.h, drawing: drawing, createdAt: existing ? existing.createdAt : undefined
            }).then(function (img) { result = img; }, function () { err.textContent = 'No se pudo guardar el dibujo (¿es muy grande?).'; return false; });
          } }
        ],
        onClose: function () { offHistory(); if (MC.history.active() === history) MC.history.activate(previousHistory); resolve(result); }
      });
      var offHistory = history.onChange(redraw);
      redraw();
    });
  }

  MC.draw = { open: open, paint: paint, rasterize: rasterize };
})(window);
