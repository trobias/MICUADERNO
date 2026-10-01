/* MIS PÁGINAS — índice y editor de páginas libres. Ver SPEC §7.5. */
(function (root) {
  'use strict';
  var MC = root.MC;
  var h = MC.h, D = MC.dates, M = MC.model, R = MC.routes, c = MC.c;

  var TEMPLATES = [
    { id: 'blank', title: '', kind: 'text', paper: 'rayado', label: 'En blanco', hint: 'Una hoja libre.' },
    { id: 'goodThings', title: 'Cosas que me hacen bien', kind: 'list', label: 'Cosas que me hacen bien', sticker: 'sol' },
    { id: 'places', title: 'Lugares que amo', kind: 'list', label: 'Lugares que amo', sticker: 'hoja' },
    { id: 'people', title: 'Personas importantes', kind: 'list', label: 'Personas importantes', sticker: 'corazon' },
    { id: 'songs', title: 'Canciones de este momento', kind: 'list', label: 'Canciones de este momento', sticker: 'auriculares' },
    { id: 'wins', title: 'Mis pequeñas victorias', kind: 'list', label: 'Pequeñas victorias', sticker: 'estrella' },
    { id: 'try', title: 'Cosas que quiero probar', kind: 'list', label: 'Cosas que quiero probar', sticker: 'brillito' },
    { id: 'letter', title: 'Carta para mi yo futuro', kind: 'text', paper: 'rayado', label: 'Carta para mi yo futuro', sticker: 'sobre', body: 'Querida persona del futuro:\n\n' },
    { id: 'dump', title: 'Vaciar la cabeza', kind: 'text', paper: 'cuadriculado', label: 'Vaciar la cabeza', hint: 'Todo lo que da vueltas, sin orden.', sticker: 'nube' },
    { id: 'gratitude', title: 'Gracias', kind: 'list', label: 'Gratitud', sticker: 'margarita' },
    { id: 'dreams', title: 'Sueños', kind: 'text', paper: 'punteado', label: 'Sueños', sticker: 'luna' },
    { id: 'wishes', title: 'Lista de deseos', kind: 'list', label: 'Lista de deseos', sticker: 'mono' },
    { id: 'month', title: 'Reflexión del mes', kind: 'text', paper: 'rayado', label: 'Reflexión del mes', sticker: 'hoja',
      body: 'Lo que más me gustó:\n\nLo que me costó:\n\nLo que quiero para el mes que viene:\n' }
  ];
  var PAPER_LABEL = { rayado: 'Rayado', cuadriculado: 'Cuadriculado', punteado: 'Punteado', liso: 'Liso' };

  function templateFor(id) { return TEMPLATES.filter(function (t) { return t.id === id; })[0] || TEMPLATES[0]; }

  function create(tpl, date) {
    var day = D.isValid(date) ? date : D.today();
    var page = {
      date: day,
      title: tpl.id === 'month' ? tpl.title + ' · ' + D.monthLabel(D.monthKey(day)) : tpl.title,
      template: tpl.id, kind: tpl.kind, paper: tpl.paper || (tpl.kind === 'list' ? 'punteado' : 'rayado'),
      body: tpl.body || '', items: tpl.kind === 'list' ? [{ text: '' }] : [],
      stickers: tpl.sticker ? [{ id: MC.uid('stk'), sticker: tpl.sticker, x: 0.86, y: 0.07, rot: 8, scale: 0.9 }] : []
    };
    return M.savePage(page).then(function (p) { location.hash = R.page(p.id); });
  }

  /** Elegir plantilla y día. `date`: día propuesto (por defecto, hoy). La página aparece en ese día del calendario. */
  function templatePicker(date) {
    var dayInput = h('input.input', { id: 'tp-day', type: 'date', value: D.isValid(date) ? date : D.today() });
    var grid = h('div.template-grid');
    TEMPLATES.forEach(function (t) {
      var b = h('button.template', { type: 'button' },
        t.sticker ? h('span.template__sticker', { 'aria-hidden': 'true', html: MC.stickers.markup(t.sticker) }) : null,
        h('span.template__title', t.label),
        h('span.template__kind', t.kind === 'list' ? 'lista' : 'texto'));
      b.addEventListener('click', function () { dlg.close(); create(t, dayInput.value); });
      grid.appendChild(b);
    });
    var dlg = c.dialog({ title: 'Nueva página', content: [
      h('div.field.field--inline', h('label', { for: 'tp-day' }, 'Para el día'), dayInput),
      h('p.section__hint', 'Empezá en blanco o con una idea. Todo se puede cambiar, también el día.'), grid] });
  }

  /* ---------- Índice ---------- */
  function renderIndex(main) {
    var destroyed = false;
    var page = h('section.page.page--margin.index-page');
    main.appendChild(h('div.spread.spread--single', page));
    M.getPages().then(function (pages) {
      if (destroyed) return;
      var add = h('button.label-btn', { type: 'button' }, MC.icon('plus'), 'Nueva página');
      add.addEventListener('click', function () { templatePicker(); });
      page.appendChild(h('header.page-head', h('h1.t-display', 'Mis páginas'), add));
      if (!pages.length) {
        page.appendChild(c.empty('Todavía no hay páginas. Una lista, una carta, lo que quieras: esta parte del cuaderno es libre.', 'libro'));
        return;
      }
      var ol = h('ol.toc', { 'aria-label': 'Índice' });
      pages.forEach(function (p, i) {
        var preview = p.kind === 'list' ? p.items.filter(function (it) { return it.text.trim(); }).length + ' cosas' : (p.body.trim() ? p.body.trim().split('\n')[0].slice(0, 70) : 'en blanco');
        preview += ' · ' + D.shortLabel(M.pageDate(p));
        ol.appendChild(h('li.toc__item',
          h('a.toc__link', { href: R.page(p.id) },
            p.pinned ? h('span.toc__pin', { 'aria-label': 'fijada' }, MC.icon('pin')) : null,
            h('span.toc__title', M.pageTitle(p)),
            h('span.toc__dots', { 'aria-hidden': 'true' }),
            h('span.toc__num', String(i + 1))),
          h('p.toc__preview', preview)));
      });
      page.appendChild(ol);
    });
    return { destroy: function () { destroyed = true; } };
  }

  /* ---------- Página ---------- */
  function renderPage(main, id) {
    var destroyed = false;
    var page = null;
    var scrap = null;
    var saved = c.savedNote();
    var sheet = h('section.page.page--margin.free-page');
    main.appendChild(h('div.spread.spread--single', sheet));
    // Mismo resguardo que en Hoy: borrador local inmediato, IndexedDB con un respiro.
    var draftKey = 'draft.page.' + id;
    var rev = 0;
    var save = MC.debounce(function () {
      if (!page) return;
      var r = rev;
      M.savePage(page).then(function (p) { page.updatedAt = p.updatedAt; if (r === rev) MC.ui.set(draftKey, null); saved.flash(); });
    }, 450);
    function persist() { rev++; if (page) MC.ui.set(draftKey, { at: Date.now(), page: page }); save(); }
    persist.flush = function () { save.flush(); };
    persist.cancel = function () { save.cancel(); MC.ui.set(draftKey, null); };

    M.getPage(id).then(function (p) {
      if (destroyed) return;
      var draft = MC.ui.get(draftKey, null);
      if (p && draft && draft.page && draft.at > Date.parse(p.updatedAt || 0)) {
        p = M.normalizePage(Object.assign({}, draft.page, { id: p.id, createdAt: p.createdAt }));
        M.savePage(p).then(function () { MC.ui.set(draftKey, null); });
      } else if (draft) MC.ui.set(draftKey, null);
      if (!p) {
        sheet.appendChild(c.empty('No encontré esta página. Quizás la borraste.', 'nube'));
        sheet.appendChild(h('a.label-btn', { href: R.pages() }, 'Volver al índice'));
        return;
      }
      page = p;
      build();
    });

    function build() {
      MC.clear(sheet);
      sheet.className = 'page page--margin free-page paper-' + page.paper;
      var title = h('input.page-title', { type: 'text', value: page.title, placeholder: 'Título', 'aria-label': 'Título de la página', maxlength: 120 });
      title.addEventListener('input', function () { page.title = title.value; persist(); MC.emit('typing'); });
      var more = h('button.icon-btn', { type: 'button', 'aria-label': 'Opciones de la página', 'aria-haspopup': 'menu', 'aria-expanded': 'false' }, MC.icon('more'));
      more.addEventListener('click', function () {
        var items = M.PAPERS.map(function (paper) {
          return { label: 'Papel ' + PAPER_LABEL[paper].toLowerCase(), role: 'menuitemradio', checked: page.paper === paper, onSelect: function () { page.paper = paper; persist(); persist.flush(); sheet.className = 'page page--margin free-page paper-' + paper; } };
        });
        items.push('sep');
        items.push({ label: page.kind === 'list' ? 'Pasar a texto' : 'Pasar a lista', icon: page.kind === 'list' ? 'text' : 'list', onSelect: switchKind });
        items.push({ label: 'Cambiar el día…', icon: 'calendario', onSelect: changeDay });
        items.push({ label: page.pinned ? 'Desfijar del índice' : 'Fijar arriba en el índice', icon: 'pin', onSelect: function () { page.pinned = !page.pinned; persist(); persist.flush(); } });
        items.push({ label: 'Borrar la página', icon: 'trash', onSelect: remove });
        c.menu(more, items, 'Opciones de la página');
      });
      sheet.appendChild(h('header.free-head',
        h('a.text-btn', { href: R.pages() }, MC.icon('arrow-left'), 'Índice'),
        h('span.free-head__right', saved, more)));
      sheet.appendChild(h('h1.sr-only', page.title || 'Página sin título'));
      sheet.appendChild(title);
      sheet.appendChild(page.kind === 'list' ? listEditor() : c.writeArea({
        id: 'page-body', value: page.body, rows: 12, ariaLabel: 'Texto de la página', placeholder: 'Esta página todavía está en blanco.',
        onInput: function (v) { page.body = v; persist(); }
      }));
      metaEl = null;
      sheet.appendChild(dayMeta());
      scrap = MC.scrapbook.attach(sheet, { stickers: page.stickers, label: 'esta página', onChange: function (list) { page.stickers = list; persist(); } });
      sheet.appendChild(scrap.toolbar);
    }

    /** “En el calendario: jueves 8 de octubre · Cambiar el día”. La fecha lleva a ese día. */
    var metaEl = null;
    function dayMeta() {
      var k = M.pageDate(page);
      var change = h('button.text-btn', { type: 'button' }, 'Cambiar el día');
      change.addEventListener('click', changeDay);
      var el = h('p.page-meta.t-meta', 'En el calendario: ', h('a', { href: R.day(k) }, D.longLabel(k) + (k.slice(0, 4) !== D.today().slice(0, 4) ? ' de ' + k.slice(0, 4) : '')), ' · ', change);
      if (metaEl && metaEl.isConnected) metaEl.replaceWith(el);
      metaEl = el;
      return el;
    }

    function changeDay() {
      c.askDate({ title: '¿En qué día va esta página?', value: M.pageDate(page), confirm: 'Cambiar', hint: 'La página aparece en ese día del calendario.' }).then(function (k) {
        if (!k || !page) return;
        page.date = k;
        persist(); persist.flush();
        dayMeta();
        c.toast('La página quedó en el ' + D.longLabel(k) + '.');
      });
    }

    function listEditor() {
      var ul = h('ul.free-list');
      function itemRow(it) {
        var input = h('input.write', { type: 'text', value: it.text, 'aria-label': 'Ítem', maxlength: 500, placeholder: 'escribí algo…', enterkeyhint: 'next' });
        input.addEventListener('input', function () { it.text = input.value; persist(); MC.emit('typing'); });
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' && !e.isComposing) {
            e.preventDefault();
            var idx = page.items.indexOf(it);
            var nu = { id: MC.uid('itm'), text: '' };
            page.items.splice(idx + 1, 0, nu);
            var r = itemRow(nu);
            li.after(r);
            r.querySelector('input').focus();
            persist();
          } else if (e.key === 'Backspace' && !input.value && page.items.length > 1) {
            e.preventDefault();
            var i = page.items.indexOf(it);
            page.items.splice(i, 1);
            var prevLi = li.previousElementSibling || li.nextElementSibling;
            li.remove();
            if (prevLi) { var pi = prevLi.querySelector('input'); pi.focus(); pi.setSelectionRange(pi.value.length, pi.value.length); }
            persist();
          }
        });
        var li = h('li.free-list__item', h('span.free-list__bullet', { 'aria-hidden': 'true' }), input);
        return li;
      }
      if (!page.items.length) page.items.push({ id: MC.uid('itm'), text: '' });
      page.items.forEach(function (it) { ul.appendChild(itemRow(it)); });
      var add = h('button.text-btn', { type: 'button' }, MC.icon('plus'), 'Agregar otra');
      add.addEventListener('click', function () {
        var nu = { id: MC.uid('itm'), text: '' };
        page.items.push(nu);
        var r = itemRow(nu);
        ul.appendChild(r);
        r.querySelector('input').focus();
      });
      return h('div.free-list-wrap', ul, add);
    }

    function switchKind() {
      if (page.kind === 'list') {
        page.body = page.items.map(function (it) { return it.text; }).filter(function (t) { return t.trim(); }).join('\n');
        page.kind = 'text';
      } else {
        page.items = page.body.split('\n').filter(function (t) { return t.trim(); }).map(function (t) { return { id: MC.uid('itm'), text: t }; });
        page.kind = 'list';
      }
      persist(); persist.flush();
      if (scrap) scrap.destroy();
      build();
    }

    function remove() {
      c.confirm({ title: '¿Borrar esta página?', text: 'No se puede deshacer. Si querés, primero guardá una copia del cuaderno.', confirm: 'Borrar la página', danger: true })
        .then(function (ok) {
          if (!ok) return;
          persist.cancel();
          M.deletePage(page.id).then(function () { page = null; c.toast('Página borrada.'); location.hash = R.pages(); });
        });
    }

    return {
      destroy: function () { destroyed = true; persist.flush(); if (scrap) scrap.destroy(); },
      flush: function () { persist.flush(); }
    };
  }

  MC.views = MC.views || {};
  MC.views.pages = { render: function (main) { return renderIndex(main); }, TEMPLATES: TEMPLATES, templateFor: templateFor, newPage: templatePicker };
  MC.views.page = { render: function (main, params) { return renderPage(main, params.id); } };
})(window);
