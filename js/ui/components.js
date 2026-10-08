/* Componentes de interfaz del cuaderno: parches, casillas, menú, diálogos, avisos. */
(function (root) {
  'use strict';
  var MC = root.MC || (root.MC = {});
  var h = MC.h;
  var c = MC.c = {};

  /** Contador que rueda al cambiar; el texto accesible siempre es el valor real. */
  c.rollText = function (el, text) {
    text = String(text);
    if (el.textContent === text) return;
    var previous = el.dataset.counterText;
    el.dataset.counterText = text;
    (el._counterAnimations || []).forEach(function (a) { a.cancel(); });
    MC.clear(el); el.classList.add('rolling-value');
    var current = h('span.rolling-value__current', text);
    el.appendChild(current);
    el._counterAnimations = [];
    var active = document.activeElement;
    if (!previous || !MC.motion.allows('move') || MC.motion.systemReduced() || document.hidden ||
        active && /^(INPUT|TEXTAREA)$/.test(active.tagName) || !current.animate) return;
    var old = h('span.rolling-value__old', { 'aria-hidden': 'true' }, previous);
    el.appendChild(old);
    var opts = { duration: MC.motion.duration('ui'), easing: getComputedStyle(document.documentElement).getPropertyValue('--ease-out').trim() };
    el._counterAnimations = [current.animate([{ opacity: 0, transform: 'translateY(40%)' }, { opacity: 1, transform: 'none' }], opts),
      old.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-40%)' }], opts)];
    el._counterAnimations[1].finished.then(function () { old.remove(); }, function () { old.remove(); });
  };

  /** El input nativo conserva escritura, validación y lectores de pantalla. */
  c.stepper = function (input, label) {
    var less = h('button.icon-btn', { type: 'button', 'aria-label': 'Reducir ' + label }, MC.icon('minus'));
    var more = h('button.icon-btn', { type: 'button', 'aria-label': 'Aumentar ' + label }, MC.icon('plus'));
    function paint() {
      less.disabled = input.disabled || Number(input.value) <= Number(input.min);
      more.disabled = input.disabled || Number(input.value) >= Number(input.max);
    }
    function change(dir) {
      if (input.disabled || input.readOnly) return;
      var n = Number(input.value);
      if (!Number.isFinite(n)) n = Number(input.min) || 0;
      input.value = MC.clamp(n + dir * (Number(input.step) || 1), Number(input.min), Number(input.max));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true })); paint();
    }
    less.addEventListener('click', function () { change(-1); });
    more.addEventListener('click', function () { change(1); });
    input.addEventListener('input', paint); paint();
    return h('div.adaptive-stepper', { role: 'group', 'aria-label': label }, less, input, more);
  };

  /** Lista reordenable: arrastre de manija y botones equivalentes para toque/teclado. */
  c.sortableList = function (entries, onChange) {
    var rows = entries.slice(), busy = false, dragged = null;
    var list = h('ol.sortable-list'), say = h('p.sr-only', { role: 'status' });
    function move(from, to) {
      if (busy || from === to || to < 0 || to >= rows.length) return;
      var next = rows.slice(), item = next.splice(from, 1)[0]; next.splice(to, 0, item);
      busy = true; list.setAttribute('aria-busy', 'true');
      MC.$$('button', list).forEach(function (b) { b.disabled = true; });
      Promise.resolve().then(function () { return onChange(next); }).then(function () {
        rows = next; paint();
        say.textContent = item.title + ', posición ' + (to + 1) + ' de ' + rows.length;
        var focus = list.querySelector('[data-sort-index="' + to + '"] .sortable-list__handle'); if (focus) focus.focus();
      }, function () { paint(); say.textContent = 'No se pudo guardar el orden. Probá de nuevo.'; }).finally(function () { busy = false; list.removeAttribute('aria-busy'); });
    }
    function paint() {
      MC.clear(list);
      rows.forEach(function (item, i) {
        var handle = h('button.text-btn.sortable-list__handle', { type: 'button', draggable: true, 'aria-label': 'Mover ' + item.title + '. Usá las flechas para cambiar su posición.' }, MC.icon('grid'), item.title);
        handle.addEventListener('keydown', function (e) { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); move(i, i + (e.key === 'ArrowUp' ? -1 : 1)); } });
        handle.addEventListener('dragstart', function (e) { dragged = i; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(i)); });
        handle.addEventListener('dragend', function () { dragged = null; });
        var up = h('button.icon-btn', { type: 'button', disabled: i === 0, 'aria-label': 'Subir ' + item.title }, MC.icon('arrow-left'));
        var down = h('button.icon-btn', { type: 'button', disabled: i === rows.length - 1, 'aria-label': 'Bajar ' + item.title }, MC.icon('arrow-right'));
        up.addEventListener('click', function () { move(i, i - 1); }); down.addEventListener('click', function () { move(i, i + 1); });
        var row = h('li', { dataset: { sortIndex: i } }, handle, up, down);
        row.addEventListener('dragover', function (e) { if (dragged != null) e.preventDefault(); });
        row.addEventListener('drop', function (e) { e.preventDefault(); if (dragged != null) move(dragged, i); dragged = null; });
        list.appendChild(row);
      });
    }
    paint(); return h('div', list, say);
  };

  /** Carpeta de papel: contenido real, apertura nativa con toque, Enter y espacio. */
  c.paperFolder = function (title, content, previews, open) {
    var fan = h('span.paper-folder__fan', { 'aria-hidden': 'true' }, (previews || []).slice(0, 3).map(function (text, i) {
      return h('span.paper-folder__peek', { style: { '--peek-index': i } }, String(text).slice(0, 45));
    }));
    return h('details.paper-folder', { open: !!open },
      h('summary.paper-folder__cover', fan, h('span.paper-folder__title', title), h('span.paper-folder__hint', 'Abrir las hojas')),
      h('div.paper-folder__body', content));
  };

  c.paperPocket = function (title, content) {
    return h('details.paper-pocket', { open: true }, h('summary.paper-pocket__seam', title), h('div.paper-pocket__note', content));
  };

  c.dateRange = function (opts) {
    var fromId = MC.uid('desde'), toId = MC.uid('hasta');
    var from = h('input.input', { id: fromId, type: 'date', value: opts.from || opts.min, min: opts.min, max: opts.max });
    var to = h('input.input', { id: toId, type: 'date', value: opts.to || opts.max, min: opts.min, max: opts.max });
    var error = h('p.form-error', { role: 'alert' });
    var apply = h('button.label-btn.label-btn--soft', { type: 'button', dataset: { browse: '1' } }, 'Ver período');
    var reset = h('button.text-btn', { type: 'button', dataset: { browse: '1' } }, 'Todo el año');
    var details = h('details.date-range', h('summary', 'Elegir período'),
      h('div.date-range__fields', h('div.field', h('label', { for: fromId }, 'Desde'), from), h('div.field', h('label', { for: toId }, 'Hasta'), to)), error,
      h('div.data-actions', apply, reset));
    // Son filtros de lectura, no campos del cuaderno.
    from.dataset.browse = to.dataset.browse = '1';
    function choose() {
      if (!MC.dates.isValid(from.value) || !MC.dates.isValid(to.value) || !from.checkValidity() || !to.checkValidity() || from.value > to.value) {
        error.textContent = 'Elegí dos fechas de este año, con el inicio antes del final.'; return;
      }
      error.textContent = ''; opts.onChange(from.value, to.value);
      details.querySelector('summary').textContent = 'Período: ' + MC.dates.shortLabel(from.value) + ' al ' + MC.dates.shortLabel(to.value);
      details.open = false;
    }
    apply.addEventListener('click', choose);
    reset.addEventListener('click', function () { from.value = opts.min; to.value = opts.max; choose(); });
    return details;
  };

  c.colorSelector = function (input, colors, label) {
    var name = MC.uid('paleta'), group = h('div.color-selector', { role: 'radiogroup', 'aria-label': label });
    colors.forEach(function (color) {
      var radio = h('input.sr-only', { type: 'radio', name: name, value: color.value, 'aria-label': color.label });
      radio.addEventListener('change', function () {
        input.value = color.value; input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })); group.update();
      });
      group.appendChild(h('label.color-selector__choice', radio, h('span.color-selector__swatch', { 'aria-hidden': 'true', style: { background: color.value } }), h('span', color.label)));
    });
    group.update = function () { MC.$$('input', group).forEach(function (radio) { radio.checked = radio.value.toLowerCase() === input.value.toLowerCase(); }); };
    input.addEventListener('input', group.update); input.addEventListener('change', group.update); group.update(); return group;
  };

  /** Dónde colgar menús y avisos: dentro del diálogo abierto de más arriba (si no, quedan inertes debajo). */
  c.layer = function () {
    var open = MC.$$('dialog[open]');
    return open.length ? open[open.length - 1] : document.body;
  };

  /** Palabras libres, sin escala. Las sugerencias salen solo de lo ya escrito por la persona. */
  c.feelingEditor = function (opts) {
    var values = MC.model.sanitizeFeelings(opts.value) || [];
    var input = h('input.input.feelings__input', {
      type: 'text', maxlength: 40, placeholder: 'Escribí una emoción',
      'aria-label': opts.label || 'Emoción'
    });
    var suggestions = h('div.feelings__suggestions', { 'aria-label': 'Palabras para elegir' });
    var list = h('ul.feelings__list', { 'aria-label': 'Emociones anotadas' });
    var add = h('button.label-btn.label-btn--soft', { type: 'button' }, MC.icon('plus'), 'Agregar');
    function render() {
      if (typeof paintSuggestions === 'function') paintSuggestions();
      MC.clear(list);
      values.forEach(function (value, i) {
        var remove = h('button.feeling-chip__remove', { type: 'button', 'aria-label': 'Sacar ' + value }, MC.icon('close'));
        remove.addEventListener('click', function () { values.splice(i, 1); render(); opts.onChange(values.slice()); input.focus(); });
        var color = opts.color ? opts.color(value, i) : MC.model.feelingColor(value);
        list.appendChild(h('li.feeling-chip', { dataset: { feeling: value }, style: { '--feeling-color': color } },
          c.feelingPatch(value), h('span', value), remove));
      });
    }
    function commit(word) {
      word = typeof word === 'string' ? word : input.value;
      var next = MC.model.sanitizeFeelings(values.concat(word));
      if (!word.trim() || !next || next.length === values.length) { input.value = ''; return; }
      values = next; input.value = ''; render(); opts.onChange(values.slice()); input.focus();
    }
    add.addEventListener('click', function () { commit(); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); commit(); } });
    input.addEventListener('input', function () { MC.emit('typing'); });
    // Sugerencias: nunca las que ya están anotadas acá; se vuelven a pintar al sumar o sacar una.
    var offered = [];
    function paintSuggestions() {
      MC.clear(suggestions);
      var have = values.map(MC.model.emotionKey);
      offered.filter(function (w) { return have.indexOf(MC.model.emotionKey(w)) === -1; }).slice(0, 6).forEach(function (word) {
        var button = h('button.feelings__suggestion', { type: 'button', style: { '--feeling-color': opts.color ? opts.color(word, 0) : MC.model.feelingColor(word) } }, c.feelingPatch(word), word);
        button.addEventListener('click', function () { commit(word); });
        suggestions.appendChild(button);
      });
    }
    if (opts.suggestions) Promise.resolve(opts.suggestions).then(function (words) { offered = words || []; paintSuggestions(); }).catch(function () {});
    render();
    return h('div.feelings', { role: 'group', 'aria-label': opts.label || 'Emociones' }, list,
      h('div.feelings__entry', input, add), suggestions);
  };

  /** El parchecito de una emoción (D49): dibujito de base o estrellita; el color va en `--feeling-color`. */
  c.feelingPatch = function (value) {
    return h('span.feeling-patch-wrap', { 'aria-hidden': 'true', html: MC.stickers.feelingPatchMarkup(MC.model.feelingGlyph(value)) });
  };

  /** Parche y palabra; el color es una ayuda visual, nunca el único significado. */
  c.feelingMark = function (value, palette) {
    return h('span.feeling-mark', { style: { '--feeling-color': palette ? palette.color(value) : 'var(--ink-soft)' } },
      c.feelingPatch(value), h('span', value));
  };

  /* ---------- Casilla de punto cruz ---------- */
  // Las puntadas salen del mismo dibujo que la semana y la impresión (MC.stickers.STITCH).
  var st = MC.stickers.stitchMarkup;
  var BOX_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<rect class="aida" x="2.5" y="2.5" width="19" height="19" rx="2.5"/>' +
    '<circle class="hole" cx="6" cy="6" r=".9"/><circle class="hole" cx="18" cy="6" r=".9"/>' +
    '<circle class="hole" cx="6" cy="18" r=".9"/><circle class="hole" cx="18" cy="18" r=".9"/>' +
    st('x1', 'class="mark mark--x1" pathLength="1"') +
    st('x2', 'class="mark mark--x2" pathLength="1"') +
    st('later', 'class="mark mark--later"') +
    st('knot', 'class="mark mark--knot"') +
    '</svg>';

  c.stitchBox = function (status, title) {
    var b = h('button.stitch-box', { type: 'button', dataset: { status: status }, html: BOX_SVG });
    c.setStitch(b, status, title, false);
    return b;
  };

  c.setStitch = function (box, status, title, animate) {
    box.dataset.status = status;
    box.setAttribute('aria-pressed', String(status === 'done'));
    var extra = status === 'partial' ? ' (hice un poquito)' : status === 'postponed' ? ' (lo dejé para otro día)' : status === 'skipped' ? ' (hoy no salió)' : '';
    box.setAttribute('aria-label', 'Lo hice: ' + title + extra);
    // Interrumpible: cancelar la puntada anterior también al volver a Sin marcar.
    (box._stitchAnimations || []).forEach(function (a) { a.cancel(); });
    box._stitchAnimations = [];
    if (animate && (status === 'done' || status === 'partial') && MC.motion.allows('move') && !MC.motion.systemReduced()) {
      ['.mark--x1', status === 'done' ? '.mark--x2' : null].filter(Boolean).forEach(function (selector, i) {
        var path = box.querySelector(selector);
        if (!path.animate) return;
        path.style.strokeDasharray = '1';
        var a = path.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
          { duration: MC.motion.duration('press'), delay: i * MC.motion.duration('press'), easing: getComputedStyle(document.documentElement).getPropertyValue('--ease-out').trim() });
        box._stitchAnimations.push(a);
      });
    }
  };

  /* ---------- Menú (popover con respaldo) ---------- */
  var openMenu = null;
  var supportsPopover = typeof HTMLElement !== 'undefined' && HTMLElement.prototype.hasOwnProperty('popover');

  function closeMenu(restoreFocus) {
    if (!openMenu) return;
    var m = openMenu;
    openMenu = null;
    m.closed = true;
    document.removeEventListener('pointerdown', m.onOutside, true);
    window.removeEventListener('resize', m.onResize);
    try { if (supportsPopover && m.el.matches(':popover-open')) m.el.hidePopover(); } catch (e) { /* noop */ }
    m.el.remove();
    if (restoreFocus !== false && m.anchor && m.anchor.isConnected) m.anchor.focus();
  }
  c.closeMenu = closeMenu;

  /**
   * items: [{ label, icon, checked, role: 'menuitemradio'|'menuitem', onSelect }] o 'sep'.
   */
  c.menu = function (anchor, items, label, opts) {
    closeMenu(false);
    var menu = h('div.menu', { role: 'menu', 'aria-label': label || 'Opciones', tabindex: '-1', class: opts && opts.className });
    if (supportsPopover) menu.setAttribute('popover', 'manual');
    var buttons = [];
    items.forEach(function (it) {
      if (it === 'sep') { menu.appendChild(h('hr.menu__sep', { role: 'separator' })); return; }
      var b = h('button.menu__item', {
        type: 'button', role: it.role || 'menuitem', tabindex: '-1',
        'aria-checked': it.role === 'menuitemradio' ? String(!!it.checked) : null
      }, it.icon ? MC.icon(it.icon) : null, h('span', it.label));
      b.addEventListener('click', function () { closeMenu(true); it.onSelect(); });
      buttons.push(b);
      menu.appendChild(b);
    });
    menu.addEventListener('keydown', function (e) {
      var i = buttons.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); buttons[(i + 1) % buttons.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); buttons[(i - 1 + buttons.length) % buttons.length].focus(); }
      else if (e.key === 'Home') { e.preventDefault(); buttons[0].focus(); }
      else if (e.key === 'End') { e.preventDefault(); buttons[buttons.length - 1].focus(); }
      else if (e.key === 'Escape') { e.preventDefault(); closeMenu(true); }
      else if (e.key === 'Tab') { closeMenu(false); }
    });
    c.layer().appendChild(menu);
    if (supportsPopover) menu.showPopover(); else menu.classList.add('is-open');
    position(menu, anchor);
    anchor.setAttribute('aria-expanded', 'true');
    var state = {
      el: menu, anchor: anchor,
      onOutside: function (e) { if (!menu.contains(e.target) && e.target !== anchor && !anchor.contains(e.target)) closeMenu(false); },
      onResize: function () { closeMenu(false); }
    };
    openMenu = state;
    var observer = new MutationObserver(function () { if (!menu.isConnected) { anchor.setAttribute('aria-expanded', 'false'); observer.disconnect(); } });
    observer.observe(menu.parentNode, { childList: true });
    // Se agrega en el próximo turno (el toque que abrió el menú no lo cierra); si para entonces el menú
    // ya se cerró, no se agrega: si no, quedaría colgado y cerraría el próximo menú al primer toque.
    setTimeout(function () { if (!state.closed) document.addEventListener('pointerdown', state.onOutside, true); }, 0);
    window.addEventListener('resize', state.onResize);
    var checked = buttons.filter(function (b) { return b.getAttribute('aria-checked') === 'true'; })[0];
    (checked || buttons[0]).focus();
    return menu;
  };

  c.bloomMenu = function (items) {
    var button = h('button.icon-btn.bloom-menu__trigger', { type: 'button', 'aria-label': 'Agregar a esta hoja', 'aria-haspopup': 'menu', 'aria-expanded': 'false' }, MC.icon('plus'));
    button.addEventListener('click', function () { c.menu(button, items, 'Agregar a esta hoja', { className: 'menu--bloom' }); });
    return button;
  };

  function position(menu, anchor) {
    var r = anchor.getBoundingClientRect();
    var mw = menu.offsetWidth, mh = menu.offsetHeight;
    var vw = window.innerWidth, vh = window.innerHeight;
    var left = Math.min(Math.max(8, r.right - mw), vw - mw - 8);
    var top = r.bottom + 6;
    var origin = 'top right';
    if (top + mh > vh - 8) { top = Math.max(8, r.top - mh - 6); origin = 'bottom right'; }
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
    menu.style.setProperty('--origin', origin);
  }

  /* ---------- Diálogo (hoja) ---------- */
  /**
   * opts: { title, content: Node|[Node], actions: [{label, kind:'primary'|'soft'|'text'|'danger', value, onClick}], onClose(value), labelledBy }
   * Devuelve { el, close(value) }.
   */
  c.dialog = function (opts) {
    var titleId = MC.uid('dlg');
    var dlg = h('dialog.sheet', { 'aria-labelledby': titleId, class: opts.className || null });
    if (opts.bottom !== false) dlg.classList.add('sheet--mobile-bottom');
    var body = h('div.sheet__body');
    var closeBtn = h('button.icon-btn.sheet__close', { type: 'button', 'aria-label': 'Cerrar' }, MC.icon('close'));
    body.appendChild(h('h2.sheet__title', { id: titleId }, opts.title));
    [].concat(opts.content || []).forEach(function (n) { if (n) body.appendChild(n); });
    var result = null;
    if (opts.actions && opts.actions.length) {
      var row = h('div.sheet__actions');
      opts.actions.forEach(function (a) {
        if (a.spacer) { row.appendChild(h('span.spacer')); return; }
        var cls = a.kind === 'soft' ? 'button.label-btn.label-btn--soft' : a.kind === 'text' ? 'button.text-btn' : a.kind === 'danger' ? 'button.label-btn.label-btn--rose' : 'button.label-btn';
        var b = h(cls, { type: 'button' }, a.icon ? MC.icon(a.icon) : null, a.label);
        b.addEventListener('click', function () {
          if (a.onClick) {
            var r = a.onClick();
            if (r === false) return;
            if (r && typeof r.then === 'function') {
              b.disabled = true;
              r.then(function (ok) { b.disabled = false; if (ok !== false) close(a.value); }, function () { b.disabled = false; });
              return;
            }
          }
          close(a.value);
        });
        row.appendChild(b);
      });
      body.appendChild(row);
    }
    dlg.appendChild(closeBtn);
    var grip = h('span.sheet__grip', { 'aria-hidden': 'true' });
    dlg.appendChild(grip);
    var gripStart = null;
    grip.addEventListener('pointerdown', function (e) { if (!root.matchMedia('(max-width: 699px)').matches) return; gripStart = e.clientY; grip.setPointerCapture(e.pointerId); });
    grip.addEventListener('pointermove', function (e) { if (gripStart == null || !MC.motion.allows('move') || MC.motion.systemReduced()) return; dlg.style.transform = 'translateY(' + MC.clamp(e.clientY - gripStart, 0, 90) + 'px)'; });
    function releaseGrip(e) { var dismiss = gripStart != null && e.type !== 'pointercancel' && e.clientY - gripStart > 70; gripStart = null; dlg.style.transform = ''; if (dismiss) close(null); }
    grip.addEventListener('pointerup', releaseGrip); grip.addEventListener('pointercancel', releaseGrip);
    dlg.appendChild(body);
    closeBtn.addEventListener('click', function () { close(null); });
    dlg.addEventListener('cancel', function () { result = null; });
    dlg.addEventListener('close', function () {
      dlg.remove();
      MC.emit('dialog:closed');
      if (opts.onClose) opts.onClose(result);
    });
    // Cerrar tocando el fondo
    dlg.addEventListener('pointerdown', function (e) {
      if (e.target !== dlg) return;
      var r = dlg.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close(null);
    });
    document.body.appendChild(dlg);
    dlg.showModal();
    MC.emit('dialog:opened');
    function close(value) { result = value === undefined ? null : value; if (dlg.open) dlg.close(); }
    return { el: dlg, body: body, close: close };
  };

  /** Confirmación → Promise<boolean>. */
  c.confirm = function (opts) {
    return new Promise(function (resolve) {
      c.dialog({
        title: opts.title,
        content: opts.text ? [].concat(opts.text).map(function (t) { return typeof t === 'string' ? h('p.t-text', t) : t; }) : null,
        actions: [
          { label: opts.cancel || 'Mejor no', kind: 'text', value: false },
          { label: opts.confirm || 'Sí', kind: opts.danger ? 'danger' : 'primary', value: true }
        ],
        onClose: function (v) { resolve(v === true); }
      });
    });
  };

  /** Pedir un texto corto (un nombre) → Promise<string|null>. Enter confirma. */
  c.askText = function (opts) {
    return new Promise(function (resolve) {
      var id = MC.uid('ask');
      var input = h('input.input', { id: id, type: 'text', value: opts.value || '', maxlength: opts.max || 120, placeholder: opts.placeholder || '' });
      var dlg = c.dialog({
        title: opts.title,
        content: [opts.hint ? h('p.section__hint', opts.hint) : null, h('div.field', h('label', { for: id }, opts.label || 'Nombre'), input)],
        actions: [
          { label: 'Cancelar', kind: 'text', value: null },
          { label: opts.confirm || 'Guardar', value: true, onClick: function () { dlg.value = input.value.trim() || opts.value || ''; } }
        ],
        onClose: function (v) { resolve(v === true ? (dlg.value || null) : null); }
      });
      dlg.value = null;
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); dlg.value = input.value.trim() || opts.value || ''; dlg.close(true); } });
      setTimeout(function () { input.focus(); input.select(); }, 30);
    });
  };

  /* ---------- Aviso breve ---------- */
  var toastEl = null, toastTimer = null;
  c.toast = function (text, opts) {
    opts = opts || {};
    if (!toastEl) {
      toastEl = h('div.toast', { role: 'status', 'aria-live': 'polite', hidden: true });
    }
    if (toastEl.parentNode !== c.layer()) c.layer().appendChild(toastEl);
    MC.clear(toastEl);
    toastEl.appendChild(h('span', text));
    if (opts.action) {
      var b = h('button', { type: 'button' }, opts.action);
      b.addEventListener('click', function () { hide(); opts.onAction(); });
      toastEl.appendChild(b);
    }
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hide, opts.ms || (opts.action ? 6000 : 3500));
    function hide() { toastEl.hidden = true; }
  };

  /* ---------- “guardando… → guardado ✓” (DA3, SPEC §7.13) ----------
   * Misma pieza en el día, las páginas, el scrapbook y Ajustes:
   *   note.saving()        hay un cambio en camino (silencioso para lectores de pantalla)
   *   note.saved()         IndexedDB confirmó: “guardado ✓” ~1,5 s y vuelve a reposo
   *   note.failed()        no se pudo (o la app está en modo memoria): aviso amable que se queda
   *   note.track(p, isCurrent?)  saving() y, cuando la promesa se resuelve, saved() o failed()
   *   note.flash()         = saved() (uso de antes)
   *   note.twin()          copia visual (aria-hidden) para mostrar el estado en otra barra; twin.release() la suelta
   * Solo se anuncian “guardado” (como mucho cada 15 s) y el fallo; “guardando…” nunca. */
  var SAVED_MS = 1500, ANNOUNCE_GAP = 15000;
  var FAIL_TEXT = 'Todavía no se pudo guardar en el cuaderno; queda como borrador en este dispositivo.';
  /** ¿Lo guardado sobrevive a una recarga? No en modo memoria (IndexedDB no disponible). */
  c.durable = function () { return !MC.store || MC.store.kind() !== 'memory'; };
  c.savedNote = function (opts) {
    opts = opts || {};
    var failText = opts.failText || FAIL_TEXT;
    function face() {
      var text = h('span.saved-note__text');
      var glyph = h('span.saved-note__glyph');
      var f = h('span.saved-note__face', { 'aria-hidden': 'true' }, glyph, text);
      f.paint = function (state) {
        var previous = f.dataset.saveFace;
        f.dataset.saveFace = state;
        if (f._swapAnimation) f._swapAnimation.cancel();
        MC.clear(glyph);
        var icon = state === 'saved' ? 'check' : state === 'failed' ? 'edit' : state === 'saving' ? 'rutinas' : null;
        if (icon) glyph.appendChild(MC.icon(icon));
        text.textContent = state === 'saving' ? 'guardando…' : state === 'saved' ? 'guardado' : state === 'failed' ? failText : text.textContent;
        var active = document.activeElement;
        if (previous && previous !== state && state === 'saved' && MC.motion.allows('fade') && !MC.motion.systemReduced() &&
            !document.hidden && !(active && /^(INPUT|TEXTAREA)$/.test(active.tagName)) && f.animate) {
          f._swapAnimation = f.animate([{ opacity: .45, transform: MC.motion.allows('move') ? 'translateY(3px)' : 'none' }, { opacity: 1, transform: 'none' }],
            { duration: MC.motion.duration('press'), easing: getComputedStyle(document.documentElement).getPropertyValue('--ease-out').trim() });
        }
      };
      return f;
    }
    var el = h('span.saved-note', { dataset: { state: 'idle' } });
    var main = face();
    var announcer = h('span.sr-only', { 'aria-live': 'polite' });
    var action = null;
    if (MC.backup && MC.backup.download) {
      action = h('button.text-btn.saved-note__action', { type: 'button', hidden: true }, MC.icon('download'), 'Descargar una copia');
      action.addEventListener('click', function () { MC.backup.download(); });
    }
    el.appendChild(main);
    if (action) el.appendChild(action);
    el.appendChild(announcer);

    var twins = [];
    var state = 'idle', timer = null, pending = 0, lastSavedSay = 0;

    function set(next) {
      if (next === state) return;
      state = next;
      [el].concat(twins).forEach(function (node) { node.dataset.state = next; });
      if (next !== 'idle') [main].concat(twins.map(function (t) { return t.face; })).forEach(function (f) { f.paint(next); });
      if (action) action.hidden = next !== 'failed';
    }
    function say(text) {
      // Repetir el mismo texto no se vuelve a leer: se alterna un espacio duro al final.
      announcer.textContent = announcer.textContent === text ? text + ' ' : text;
    }

    el.saving = function () {
      clearTimeout(timer);
      if (state !== 'failed') set('saving'); // con un aviso de fallo a la vista no se alterna (sin parpadeo)
    };
    el.saved = function () {
      if (!c.durable()) { el.failed(); return; }
      clearTimeout(timer);
      var now = Date.now();
      if (state === 'failed' || now - lastSavedSay > ANNOUNCE_GAP) { say('Guardado.'); lastSavedSay = now; }
      set('saved');
      timer = setTimeout(function () { if (state === 'saved') set('idle'); }, SAVED_MS);
    };
    el.failed = function () {
      clearTimeout(timer);
      if (state !== 'failed') say(failText);
      set('failed');
    };
    el.flash = el.saved;
    el.track = function (p, isCurrent) {
      pending++;
      el.saving();
      p.then(function () {
        pending--;
        if (!pending && (!isCurrent || isCurrent())) el.saved();
      }, function () {
        pending--;
        el.failed();
      });
      return p;
    };
    el.twin = function () {
      var f = face();
      var t = h('span.saved-note.saved-note--twin', { 'aria-hidden': 'true', dataset: { state: state } }, f);
      t.face = f;
      t.release = function () { twins = twins.filter(function (x) { return x !== t; }); };
      if (state !== 'idle') f.paint(state);
      twins.push(t);
      return t;
    };
    return el;
  };

  /* ---------- Textarea sobre renglones ---------- */
  c.writeArea = function (opts) {
    var ta = h('textarea.write', {
      id: opts.id, rows: opts.rows || 2, placeholder: opts.placeholder || '', value: opts.value || '',
      'aria-label': opts.ariaLabel || null, maxlength: 20000, spellcheck: 'true'
    });
    MC.autosize(ta);
    // onInput se llama en cada tecla (barato); quien guarda decide cuándo escribir en disco.
    if (opts.onInput) ta.addEventListener('input', function () { MC.emit('typing'); opts.onInput(ta.value); });
    return ta;
  };

  /* ---------- Piezas que se repiten entre vistas ---------- */
  /** Marca quieta del estado de una actividad (el texto del estado lo pone quien la usa). */
  c.statusMark = function (status) {
    return h('span.status-mark', { 'aria-hidden': 'true', html: MC.stickers.statusMarkup(status) });
  };

  /** Enlace a una página libre: ícono de hoja + título. */
  c.pageLink = function (p) {
    return h('a.text-btn.page-link', { href: MC.routes.page(p.id) }, MC.icon('paginas'), MC.model.pageTitle(p),
      p.virtual ? h('span.page-link__note', ' · se repite') : null);
  };

  /** Lista de enlaces a páginas (la página del día, la semana). */
  c.pageLinks = function (pages, className) {
    return h('ul.day-pages', { class: className || null }, pages.map(function (p) { return h('li', c.pageLink(p)); }));
  };

  /* ---------- Vacío ---------- */
  c.empty = function (text, sticker) {
    return h('div.empty', sticker ? h('span', { html: MC.stickers.markup(sticker) }) : null, h('p', text));
  };

  /** Sección con título (h2) */
  c.section = function (title, children, opts) {
    opts = opts || {};
    var id = opts.id || MC.uid('sec');
    return h('section.section', { 'aria-labelledby': id, class: opts.className },
      h('h2.section__title', { id: id }, title),
      opts.hint ? h('p.section__hint', opts.hint) : null,
      children);
  };
})(typeof window !== 'undefined' ? window : globalThis);
