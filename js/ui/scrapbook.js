/* Capa scrapbook: pegar, mover, girar y sacar stickers. Operable con puntero y con teclado. */
(function (root) {
  'use strict';
  var MC = root.MC;
  var h = MC.h;

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
  }

  /**
   * attach(pageEl, { stickers, onChange(list), label })
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

    function save() { opts.onChange(list.map(function (s) { return Object.assign({}, s); })); }

    function place(el, s) {
      el.style.left = (s.x * 100) + '%';
      el.style.top = (s.y * 100) + '%';
      el.style.setProperty('--rot', s.rot + 'deg');
      el.style.setProperty('--scale', s.scale);
    }

    function describe(s) { return (MC.stickers.ART[s.sticker] || { label: 'sticker' }).label; }

    function renderAll() {
      MC.clear(layer);
      list.forEach(function (s) { layer.appendChild(node(s)); });
    }

    function node(s) {
      var el = h('div.sticker', { dataset: { id: s.id }, html: MC.stickers.markup(s.sticker) });
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
      function move(ev) {
        s.x = MC.clamp(ox + (ev.clientX - startX) / rect.width, 0.02, 0.98);
        s.y = MC.clamp(oy + (ev.clientY - startY) / rect.height, 0.01, 0.99);
        place(el, s);
      }
      function up() {
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerup', up);
        el.removeEventListener('pointercancel', up);
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
        case '+': case '=': s.scale = MC.clamp(+(s.scale + 0.1).toFixed(2), 0.5, 2); break;
        case '-': s.scale = MC.clamp(+(s.scale - 0.1).toFixed(2), 0.5, 2); break;
        case 'Delete': case 'Backspace': remove(s); return;
        case 'Escape': select(null); el.blur(); return;
        default: handled = false;
      }
      if (handled) { e.preventDefault(); place(el, s); saveSoon(); }
    }
    var saveSoon = MC.debounce(save, 350);

    function add(name) {
      var n = list.length;
      var s = {
        id: MC.uid('stk'), sticker: name,
        // Primero en el margen derecho, bajando; así no tapa lo escrito.
        x: MC.clamp(0.93 - (Math.floor(n / 6) % 3) * 0.05, 0.1, 0.96),
        y: MC.clamp(0.2 + (n % 6) * 0.12, 0.05, 0.92),
        rot: Math.round((Math.random() * 24 - 12)),
        scale: 1
      };
      list.push(s);
      var el = node(s);
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
      toolbar.appendChild(btn('rotate-left', 'Girar a la izquierda', function () { transform(function (s) { s.rot = MC.clamp(s.rot - 8, -45, 45); }); }, none));
      toolbar.appendChild(btn('rotate', 'Girar a la derecha', function () { transform(function (s) { s.rot = MC.clamp(s.rot + 8, -45, 45); }); }, none));
      toolbar.appendChild(btn('shrink', 'Más chico', function () { transform(function (s) { s.scale = MC.clamp(+(s.scale - 0.15).toFixed(2), 0.5, 2); }); }, none));
      toolbar.appendChild(btn('grow', 'Más grande', function () { transform(function (s) { s.scale = MC.clamp(+(s.scale + 0.15).toFixed(2), 0.5, 2); }); }, none));
      toolbar.appendChild(btn('trash', 'Despegar', function () { if (selected) remove(selected); }, none));
      toolbar.appendChild(h('button.label-btn', { type: 'button', on: { click: function () { setDecorating(false); } } }, 'Listo'));
      toolbar.appendChild(status);
    }

    // Tocar el fondo de la capa deselecciona
    layer.addEventListener('pointerdown', function (e) { if (decorating && e.target === layer) select(null); });

    renderAll();
    paintTools();

    return {
      toolbar: toolbar,
      destroy: function () { saveSoon.flush(); layer.remove(); toolbar.remove(); pageEl.classList.remove('is-decorating'); }
    };
  }

  MC.scrapbook = { attach: attach, openTray: openTray };
})(window);
