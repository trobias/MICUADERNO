/* Capa scrapbook: pegar, mover, girar y sacar stickers. Operable con puntero y con teclado. */
(function (root) {
  'use strict';
  var MC = root.MC;
  var h = MC.h;

  var M = MC.model;

  /** Un sticker puede ser arte del cuaderno ('mariposa') o una imagen propia ('img:<id>', subida o dibujada). */
  function ownImage(name) { return typeof name === 'string' && name.indexOf('img:') === 0 ? M.imageById(name.slice(4)) : null; }
  function isOwn(name) { return typeof name === 'string' && name.indexOf('img:') === 0; }

  /** “Mis stickers”: imágenes subidas y dibujos, con su alta (subir, dibujar) y baja. */
  function ownGroup(dlg, onPick) {
    var grid = h('div.sticker-tray.sticker-tray--own');
    var saved = MC.c.savedNote();
    function paint() {
      MC.clear(grid);
      M.images().forEach(function (img) {
        var pick = h('button.sticker-pick.sticker-pick--img', { type: 'button', 'aria-label': img.name + (img.kind === 'drawing' ? ' (dibujo)' : '') },
          h('img', { src: img.src, alt: '' }));
        pick.addEventListener('click', function () { dlg.close('img:' + img.id); });
        var del = h('button.sticker-pick__del', { type: 'button', 'aria-label': 'Sacar «' + img.name + '» de mis stickers', title: 'Sacar de mis stickers' }, MC.icon('close'));
        del.addEventListener('click', function () {
          MC.c.confirm({ title: '¿Sacar «' + img.name + '» de tus stickers?', text: 'También se despega de las hojas donde esté pegado.', confirm: 'Sacar', danger: true })
            .then(function (ok) { if (ok) saved.track(M.deleteImage(img.id)).then(paint, function () { /* El indicador conserva el aviso. */ }); });
        });
        grid.appendChild(h('div.sticker-own', pick, del));
      });
    }
    paint();
    var upload = h('button.label-btn.label-btn--soft', { type: 'button' }, MC.icon('upload'), 'Subir una imagen');
    upload.addEventListener('click', function () {
      dlg.close(null);
      MC.images.uploadStickers().then(function (saved) { saved.forEach(function (img) { onPick('img:' + img.id); }); });
    });
    var draw = h('button.label-btn.label-btn--soft', { type: 'button' }, MC.icon('edit'), 'Dibujar uno');
    draw.addEventListener('click', function () {
      dlg.close(null);
      MC.draw.open().then(function (img) { if (img) onPick('img:' + img.id); });
    });
    return h('div.sticker-tray__group',
      h('div.saved-row', h('h3', 'Mis stickers'), saved),
      M.images().length ? grid : h('p.section__hint', 'Subí una foto o una imagen (PNG, JPG, lo que tengas) o dibujá uno: quedan acá para pegarlos en cualquier hoja.'),
      h('div.sticker-tray__own-actions', upload, draw));
  }

  function openTray(onPick) {
    var groups = MC.stickers.GROUPS.map(function (g) {
      var grid = h('div.sticker-tray');
      MC.stickers.names.filter(function (n) { return MC.stickers.ART[n].group === g[0]; }).forEach(function (n) {
        var b = h('button.sticker-pick', { type: 'button', 'aria-label': MC.stickers.ART[n].label, html: MC.stickers.markup(n) });
        b.addEventListener('click', function () { dlg.close(n); });
        grid.appendChild(b);
      });
      return h('div.sticker-tray__group', h('h3', g[1]), grid);
    });
    var dlg = MC.c.dialog({
      title: 'Sobre de stickers',
      content: [h('p.section__hint', 'Elegí uno y después movelo a donde quieras.')].concat(groups),
      onClose: function (v) { if (v) onPick(v); }
    });
    dlg.body.insertBefore(ownGroup(dlg, onPick), dlg.body.children[2] || null);
  }

  /**
   * attach(pageEl, { stickers, onChange(list), label, note })
   * `note` (opcional): el c.savedNote de la hoja; mientras se decora, su estado se ve también en la barra (DA3).
   * Devuelve { toolbar, destroy }.
   */
  function attach(pageEl, opts) {
    var list = (opts.stickers || []).map(function (s) { return Object.assign({}, s); });
    var decorating = false;
    var selected = null;
    var layer = h('div.sticker-layer');
    pageEl.appendChild(layer);
    var toolbar = h('div.sticker-tools.is-idle', { role: 'toolbar', 'aria-label': 'Decorar ' + (opts.label || 'la página') });
    var status = h('span.sr-only', { 'aria-live': 'polite' });
    var noteTwin = opts.note && opts.note.twin ? opts.note.twin() : null;

    function save() { opts.onChange(list.map(function (s) { return Object.assign({}, s); })); }

    function place(el, s) {
      el.style.left = (s.x * 100) + '%';
      el.style.top = (s.y * 100) + '%';
      el.style.setProperty('--rot', s.rot + 'deg');
      el.style.setProperty('--scale', s.scale);
    }

    function describe(s) { var img = ownImage(s.sticker); return img ? img.name : (MC.stickers.ART[s.sticker] || { label: 'sticker' }).label; }

    function renderAll() {
      MC.clear(layer);
      list.forEach(function (s) { var el = node(s); if (el) layer.appendChild(el); });
    }

    function node(s) {
      var el;
      if (isOwn(s.sticker)) {
        var img = ownImage(s.sticker);
        if (!img) return null; // la imagen se sacó de “Mis stickers”
        el = h('div.sticker.sticker--img', { dataset: { id: s.id } }, h('img', { src: img.src, alt: '', draggable: 'false' }));
      } else {
        el = h('div.sticker', { dataset: { id: s.id }, html: MC.stickers.markup(s.sticker) });
      }
      place(el, s);
      syncA11y(el, s);
      el.addEventListener('pointerdown', function (e) { if (decorating) startDrag(e, el, s); });
      el.addEventListener('keydown', function (e) { if (decorating) onKey(e, el, s); });
      el.addEventListener('focus', function () { if (decorating) select(s); });
      return el;
    }

    function syncA11y(el, s) {
      if (decorating) {
        el.setAttribute('tabindex', '0');
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', describe(s) + '. Flechas para mover, corchetes para girar, más y menos para el tamaño, Suprimir para sacarlo.');
        el.setAttribute('aria-selected', String(selected === s));
      } else {
        el.removeAttribute('tabindex');
        el.setAttribute('role', 'img');
        el.setAttribute('aria-label', 'Sticker: ' + describe(s));
        el.removeAttribute('aria-selected');
      }
    }

    function elFor(s) { return layer.querySelector('[data-id="' + s.id + '"]'); }

    function select(s) {
      selected = s;
      MC.$$('.sticker', layer).forEach(function (el) { el.setAttribute('aria-selected', String(el.dataset.id === (s && s.id))); });
      paintTools();
    }

    function settle(el) {
      if (!MC.motion.allows('move')) return;
      el.classList.remove('is-settling');
      void el.offsetWidth;
      el.classList.add('is-settling');
      setTimeout(function () { el.classList.remove('is-settling'); }, 320);
    }

    function startDrag(e, el, s) {
      e.preventDefault();
      select(s);
      el.setPointerCapture(e.pointerId);
      var rect = layer.getBoundingClientRect();
      var startX = e.clientX, startY = e.clientY, ox = s.x, oy = s.y;
      var moved = false;
      function move(ev) {
        // Umbral de 4px: un toque selecciona, no mueve.
        if (!moved && Math.abs(ev.clientX - startX) + Math.abs(ev.clientY - startY) < 4) return;
        moved = true;
        s.x = MC.clamp(ox + (ev.clientX - startX) / rect.width, 0.02, 0.98);
        s.y = MC.clamp(oy + (ev.clientY - startY) / rect.height, 0.01, 0.99);
        place(el, s);
      }
      function up() {
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerup', up);
        el.removeEventListener('pointercancel', up);
        if (!moved) return;
        settle(el);
        save();
      }
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
    }

    function onKey(e, el, s) {
      var step = e.shiftKey ? 0.05 : 0.01;
      var handled = true;
      switch (e.key) {
        case 'ArrowLeft': s.x = MC.clamp(s.x - step, 0.02, 0.98); break;
        case 'ArrowRight': s.x = MC.clamp(s.x + step, 0.02, 0.98); break;
        case 'ArrowUp': s.y = MC.clamp(s.y - step * 0.6, 0.01, 0.99); break;
        case 'ArrowDown': s.y = MC.clamp(s.y + step * 0.6, 0.01, 0.99); break;
        case '[': s.rot = MC.clamp(s.rot - 5, -45, 45); break;
        case ']': s.rot = MC.clamp(s.rot + 5, -45, 45); break;
        case '+': case '=': s.scale = MC.clamp(+(s.scale + 0.1).toFixed(2), 0.4, 3); break;
        case '-': s.scale = MC.clamp(+(s.scale - 0.1).toFixed(2), 0.4, 3); break;
        case 'Delete': case 'Backspace': remove(s); return;
        case 'Escape': select(null); el.blur(); return;
        default: handled = false;
      }
      if (handled) { e.preventDefault(); place(el, s); saveSoon(); }
    }
    var saveSoon = MC.debounce(save, 350);

    /** at (opcional): { x, y, rot, scale } — p. ej. un dibujo grande en el medio de la hoja. */
    function add(name, at) {
      var n = list.length;
      var s = Object.assign({
        id: MC.uid('stk'), sticker: name,
        // Primero en el margen derecho, bajando; así no tapa lo escrito.
        x: MC.clamp(0.93 - (Math.floor(n / 6) % 3) * 0.05, 0.1, 0.96),
        y: MC.clamp(0.2 + (n % 6) * 0.12, 0.05, 0.92),
        rot: Math.round((Math.random() * 24 - 12)),
        scale: 1
      }, at || {});
      list.push(s);
      var el = node(s);
      if (!el) return;
      layer.appendChild(el);
      settle(el);
      select(s);
      el.focus({ preventScroll: true });
      status.textContent = describe(s) + ' pegado.';
      save();
    }

    function remove(s) {
      var el = elFor(s);
      list = list.filter(function (x) { return x !== s; });
      if (el) el.remove();
      select(null);
      status.textContent = describe(s) + ' despegado.';
      save();
    }

    function transform(fn) {
      if (!selected) return;
      fn(selected);
      var el = elFor(selected);
      if (el) place(el, selected);
      saveSoon();
    }

    function setDecorating(on) {
      decorating = on;
      pageEl.classList.toggle('is-decorating', on);
      MC.$$('.sticker', layer).forEach(function (el) {
        var s = list.filter(function (x) { return x.id === el.dataset.id; })[0];
        if (s) syncA11y(el, s);
      });
      if (!on) select(null);
      paintTools();
      MC.emit('decorating', on);
    }

    function btn(icon, label, fn, disabled) {
      var b = h('button.icon-btn.icon-btn--sm', { type: 'button', 'aria-label': label, title: label }, MC.icon(icon));
      if (disabled) b.disabled = true;
      b.addEventListener('click', fn);
      return b;
    }

    function paintTools() {
      MC.clear(toolbar);
      toolbar.classList.toggle('is-idle', !decorating);
      if (!decorating) {
        var start = h('button.text-btn', { type: 'button' }, MC.icon('sticker'), list.length ? 'Decorar' : 'Pegar un sticker');
        start.addEventListener('click', function () {
          setDecorating(true);
          if (!list.length) openTray(add);
        });
        toolbar.appendChild(start);
        toolbar.appendChild(status);
        return;
      }
      var none = !selected;
      toolbar.appendChild(h('button.label-btn.label-btn--soft', { type: 'button', on: { click: function () { openTray(add); } } }, MC.icon('plus'), 'Sticker'));
      toolbar.appendChild(h('button.label-btn.label-btn--soft', { type: 'button', on: { click: function () { drawNew(); } } }, MC.icon('edit'), 'Dibujar'));
      var selImg = selected && ownImage(selected.sticker);
      if (selImg && selImg.kind === 'drawing') {
        toolbar.appendChild(h('button.text-btn', { type: 'button', on: { click: function () {
          MC.draw.open({ image: selImg }).then(function (img) { if (img) { renderAll(); select(selected); } });
        } } }, 'Editar el dibujo'));
      }
      toolbar.appendChild(btn('rotate-left', 'Girar a la izquierda', function () { transform(function (s) { s.rot = MC.clamp(s.rot - 8, -45, 45); }); }, none));
      toolbar.appendChild(btn('rotate', 'Girar a la derecha', function () { transform(function (s) { s.rot = MC.clamp(s.rot + 8, -45, 45); }); }, none));
      toolbar.appendChild(btn('shrink', 'Más chico', function () { transform(function (s) { s.scale = MC.clamp(+(s.scale - 0.15).toFixed(2), 0.4, 3); }); }, none));
      toolbar.appendChild(btn('grow', 'Más grande', function () { transform(function (s) { s.scale = MC.clamp(+(s.scale + 0.15).toFixed(2), 0.4, 3); }); }, none));
      toolbar.appendChild(btn('trash', 'Despegar', function () { if (selected) remove(selected); }, none));
      toolbar.appendChild(h('button.label-btn', { type: 'button', on: { click: function () { setDecorating(false); } } }, 'Listo'));
      if (noteTwin) toolbar.appendChild(noteTwin);
      toolbar.appendChild(status);
    }

    /** Dibujar uno nuevo y pegarlo acá (big: grande y al medio, para una hoja de dibujo). */
    function drawNew(big) {
      if (!decorating) setDecorating(true);
      MC.draw.open().then(function (img) { if (img) add('img:' + img.id, big === true ? { x: 0.5, y: 0.42, rot: 0, scale: 2.4 } : null); });
    }

    // Tocar el fondo de la capa deselecciona
    layer.addEventListener('pointerdown', function (e) { if (decorating && e.target === layer) select(null); });

    renderAll();
    paintTools();

    return {
      toolbar: toolbar,
      draw: drawNew,
      /** Pegar una imagen propia (p. ej. un adjunto usado como sticker). */
      addImage: function (img) { if (!decorating) setDecorating(true); add('img:' + img.id); },
      destroy: function () { saveSoon.flush(); if (noteTwin) noteTwin.release(); layer.remove(); toolbar.remove(); pageEl.classList.remove('is-decorating'); }
    };
  }

  MC.scrapbook = { attach: attach, openTray: openTray };
})(window);
