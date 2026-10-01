/* Componentes de interfaz del cuaderno: parches, casillas, menú, diálogos, avisos. */
(function (root) {
  'use strict';
  var MC = root.MC || (root.MC = {});
  var h = MC.h;
  var c = MC.c = {};

  /** Dónde colgar menús y avisos: dentro del diálogo abierto de más arriba (si no, quedan inertes debajo). */
  c.layer = function () {
    var open = MC.$$('dialog[open]');
    return open.length ? open[open.length - 1] : document.body;
  };

  /* ---------- Parches de ánimo ---------- */
  /**
   * Grupo de 5 botones-toggle (aria-pressed). Tocar el elegido lo quita.
   * opts: { value, labels, groupLabel, onChange(value|null), small }
   */
  c.moodPicker = function (opts) {
    var value = opts.value || null;
    var group = h('div.moods', { role: 'group', 'aria-label': opts.groupLabel });
    if (opts.small) group.classList.add('moods--small');
    var buttons = [1, 2, 3, 4, 5].map(function (m) {
      var b = h('button.mood-patch', {
        type: 'button', dataset: { mood: String(m) }, 'aria-pressed': String(value === m),
        html: MC.stickers.patchMarkup(m)
      });
      b.appendChild(h('span', opts.labels[m - 1]));
      b.addEventListener('click', function () {
        value = value === m ? null : m;
        buttons.forEach(function (x, i) { x.setAttribute('aria-pressed', String(value === i + 1)); });
        if (value) {
          b.classList.remove('is-stamping');
          void b.offsetWidth;
          b.classList.add('is-stamping');
        }
        opts.onChange(value);
      });
      return b;
    });
    buttons.forEach(function (b) { group.appendChild(b); });
    return group;
  };

  /* ---------- Casilla de punto cruz ---------- */
  var BOX_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<rect class="aida" x="2.5" y="2.5" width="19" height="19" rx="2.5"/>' +
    '<circle class="hole" cx="6" cy="6" r=".9"/><circle class="hole" cx="18" cy="6" r=".9"/>' +
    '<circle class="hole" cx="6" cy="18" r=".9"/><circle class="hole" cx="18" cy="18" r=".9"/>' +
    '<path class="mark mark--x1" pathLength="1" d="M6.5 6.5 17.5 17.5"/>' +
    '<path class="mark mark--x2" pathLength="1" d="M17.5 6.5 6.5 17.5"/>' +
    '<path class="mark mark--later" d="M5.5 12h11M13 8.2l3.8 3.8-3.8 3.8"/>' +
    '<circle class="mark mark--knot" cx="12" cy="12" r="2.8"/>' +
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
    if (animate && (status === 'done' || status === 'partial') && MC.motion.allows('move')) {
      box.classList.remove('is-sewing');
      void box.offsetWidth;
      box.classList.add('is-sewing');
      setTimeout(function () { box.classList.remove('is-sewing'); }, 400);
    }
  };

  /* ---------- Menú (popover con respaldo) ---------- */
  var openMenu = null;
  var supportsPopover = typeof HTMLElement !== 'undefined' && HTMLElement.prototype.hasOwnProperty('popover');

  function closeMenu(restoreFocus) {
    if (!openMenu) return;
    var m = openMenu;
    openMenu = null;
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
  c.menu = function (anchor, items, label) {
    closeMenu(false);
    var menu = h('div.menu', { role: 'menu', 'aria-label': label || 'Opciones', tabindex: '-1' });
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
    setTimeout(function () { document.addEventListener('pointerdown', state.onOutside, true); }, 0);
    window.addEventListener('resize', state.onResize);
    var checked = buttons.filter(function (b) { return b.getAttribute('aria-checked') === 'true'; })[0];
    (checked || buttons[0]).focus();
    return menu;
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
    var dlg = h('dialog.sheet', { 'aria-labelledby': titleId });
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

  /* ---------- “guardado ♡” ---------- */
  c.savedNote = function () {
    var el = h('span.saved-note', { 'aria-live': 'polite' });
    var t = null;
    el.flash = function () {
      el.textContent = 'guardado';
      el.classList.add('is-visible');
      clearTimeout(t);
      t = setTimeout(function () { el.classList.remove('is-visible'); }, 1600);
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
