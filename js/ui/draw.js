/* Dibujar: una hojita para dibujar con los hilos del cuaderno (lápiz, goma, texto, deshacer).
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

  /** Dibuja trazos y textos en un contexto (escala = px por unidad lógica). */
  function paint(ctx, drawing, scale, offsetX, offsetY) {
    offsetX = offsetX || 0; offsetY = offsetY || 0;
    drawing.strokes.forEach(function (s) {
      // Pasos que este editor todavía no sabe pintar (p. ej. un relleno, D32): se saltean sin romper el dibujo.
      if (!s.points || !s.points.length) return;
      ctx.save();
      ctx.globalCompositeOperation = s.erase ? 'destination-out' : 'source-over';
      ctx.strokeStyle = s.erase ? '#000' : s.color; // color-ok: la goma borra con cualquier color opaco
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = s.width * scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      var p = s.points;
      if (p.length === 1) {
        ctx.beginPath();
        ctx.arc(p[0][0] * scale - offsetX, p[0][1] * scale - offsetY, s.width * scale / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(p[0][0] * scale - offsetX, p[0][1] * scale - offsetY);
        for (var i = 1; i < p.length - 1; i++) {
          // Curvas por los puntos medios: el trazo sale suave, como con lápiz.
          var mx = (p[i][0] + p[i + 1][0]) / 2, my = (p[i][1] + p[i + 1][1]) / 2;
          ctx.quadraticCurveTo(p[i][0] * scale - offsetX, p[i][1] * scale - offsetY, mx * scale - offsetX, my * scale - offsetY);
        }
        var last = p[p.length - 1];
        ctx.lineTo(last[0] * scale - offsetX, last[1] * scale - offsetY);
        ctx.stroke();
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

  /** Caja que ocupa el dibujo (en unidades lógicas), con un margen. */
  function bounds(drawing, ctx) {
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    drawing.strokes.forEach(function (s) {
      if (s.erase) return;
      s.points.forEach(function (p) {
        x0 = Math.min(x0, p[0] - s.width); y0 = Math.min(y0, p[1] - s.width);
        x1 = Math.max(x1, p[0] + s.width); y1 = Math.max(y1, p[1] + s.width);
      });
    });
    drawing.texts.forEach(function (t) {
      var f = FONTS[t.font] || FONTS.hand;
      ctx.font = Math.round(t.size * f[2]) + 'px ' + cssVar(f[1]);
      var w = ctx.measureText(t.text).width / 2 + 8, hh = t.size * f[2] * 0.7;
      x0 = Math.min(x0, t.x - w); x1 = Math.max(x1, t.x + w);
      y0 = Math.min(y0, t.y - hh); y1 = Math.max(y1, t.y + hh);
    });
    if (!isFinite(x0)) return null;
    var pad = 12;
    return { x: Math.max(0, x0 - pad), y: Math.max(0, y0 - pad), w: Math.min(SIZE, x1 + pad) - Math.max(0, x0 - pad), h: Math.min(SIZE, y1 + pad) - Math.max(0, y0 - pad) };
  }

  /** Exporta el dibujo recortado → { src, w, h } (WebP si el navegador puede, si no PNG). */
  function rasterize(drawing) {
    var probe = document.createElement('canvas').getContext('2d');
    var b = bounds(drawing, probe);
    if (!b) return null;
    var scale = Math.min(1, 900 / Math.max(b.w, b.h)) * 1;
    var cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.round(b.w * scale));
    cv.height = Math.max(1, Math.round(b.h * scale));
    paint(cv.getContext('2d'), drawing, scale, b.x * scale, b.y * scale);
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
    var tool = 'pen';
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
        { value: 'pen', label: 'Lápiz', content: [MC.icon('edit'), h('span', 'Lápiz')] },
        { value: 'erase', label: 'Goma', content: [MC.icon('trash'), h('span', 'Goma')] },
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
        canvas.setPointerCapture(e.pointerId);
        strokeBefore = MC.clone(drawing);
        current = { color: tool === 'erase' ? null : color, erase: tool === 'erase', width: tool === 'erase' ? width * 2 : width, points: [p] };
        drawing.strokes.push(current);
        redraw();
      });
      canvas.addEventListener('pointermove', function (e) {
        if (!current) return;
        var p = pt(e);
        var last = current.points[current.points.length - 1];
        if (Math.abs(p[0] - last[0]) + Math.abs(p[1] - last[1]) < 2) return;
        current.points.push([Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10]);
        redraw();
      });
      function end() { if (current && strokeBefore) remember(strokeBefore, 'Dibujar trazo'); current = null; strokeBefore = null; }
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
