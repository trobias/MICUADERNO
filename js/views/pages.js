/* HOJA SUELTA — editor de una hoja con su día y plantillas de inicio. El índice está en Mis hojas (sheets.js). Ver SPEC §7.5. */
(function (root) {
  'use strict';
  var MC = root.MC;
  var h = MC.h, D = MC.dates, M = MC.model, R = MC.routes, c = MC.c;

  var TEMPLATES = MC.templates.FACTORY;
  var PAPER_LABEL = { rayado: 'Rayado', cuadriculado: 'Cuadriculado', punteado: 'Punteado', liso: 'Liso' };
  var KIND_WORD = { text: 'renglones', list: 'lista', checks: 'casillas', columns: 'columnas' };

  function templateFor(id) { return MC.templates.byId(id) || TEMPLATES[0]; }

  /** “lista”, “renglones y columnas”: de qué está hecha una plantilla (texto de la tarjeta). */
  function kindOf(blocks) {
    var seen = [];
    (blocks || []).forEach(function (b) { var w = KIND_WORD[b.type]; if (w && seen.indexOf(w) === -1) seen.push(w); });
    return seen.length > 1 ? seen.slice(0, -1).join(', ') + ' y ' + seen[seen.length - 1] : (seen[0] || 'renglones');
  }

  /**
   * Una hoja nueva para `date`: desde una plantilla de fábrica (`{ factory: id }`) o propia (`{ own: plantilla }`).
   * La hoja guarda de dónde vino (`template` / `templateId`) pero es independiente: cambiar la plantilla no la toca.
   */
  function create(source, date) {
    var day = D.isValid(date) ? date : D.today();
    var page;
    if (source.own) {
      var t = source.own;
      var copy = MC.templates.cloneStructure(t.blocks, t.values, true);
      page = { date: day, title: t.title, template: 'own', templateId: t.id, paper: t.paper, blocks: copy.blocks, values: copy.values,
        stickers: (t.stickers || []).map(function (st) { return Object.assign({}, st, { id: MC.uid('stk') }); }) };
    } else {
      var inst = MC.templates.instantiate(source.factory);
      page = { date: day, title: inst.monthly ? inst.title + ' · ' + D.monthLabel(D.monthKey(day)) : inst.title,
        template: inst.template, paper: inst.paper, blocks: inst.blocks, values: inst.values, stickers: inst.stickers };
      if (inst.draw) source.draw = true;
    }
    return M.savePage(page).then(function (p) {
      if (source.draw) MC.ui.set('drawOnOpen', p.id); // la hoja abre con el lápiz en la mano
      location.hash = R.page(p.id);
    });
  }

  function templateCard(label, kind, sticker, onPick) {
    var b = h('button.template', { type: 'button' },
      sticker ? h('span.template__sticker', { 'aria-hidden': 'true', html: MC.stickers.markup(sticker) }) : null,
      h('span.template__title', label),
      h('span.template__kind', kind));
    b.addEventListener('click', onPick);
    return b;
  }

  /** Elegir plantilla y día. `date`: día propuesto (por defecto, hoy). La hoja aparece en ese día del calendario. */
  function templatePicker(date) {
    var dayInput = h('input.input', { id: 'tp-day', type: 'date', value: D.isValid(date) ? date : D.today() });
    var mineWrap = h('div.template-group');
    var grid = h('div.template-grid');
    TEMPLATES.forEach(function (t) {
      grid.appendChild(templateCard(t.label, t.draw ? 'con el lápiz listo' : kindOf(t.blocks), t.sticker, function () { dlg.close(); create({ factory: t.id }, dayInput.value); }));
    });
    var dlg = c.dialog({ title: 'Nueva hoja', content: [
      h('div.field.field--inline', h('label', { for: 'tp-day' }, 'Para el día'), dayInput),
      h('p.section__hint', 'Empezá en blanco o con una idea. Todo se puede cambiar, también el día.'),
      mineWrap,
      h('h3.template-group__title', 'De fábrica'), grid] });
    // Las propias primero, si hay: son las que la persona armó para sí.
    M.getTemplates().then(function (mine) {
      if (!mine.length) return;
      var g = h('div.template-grid');
      mine.forEach(function (t) {
        var st = t.stickers[0] && !/^img:/.test(t.stickers[0].sticker) ? t.stickers[0].sticker : null;
        g.appendChild(templateCard(t.title, kindOf(t.blocks), st, function () { dlg.close(); create({ own: t }, dayInput.value); }));
      });
      mineWrap.appendChild(h('h3.template-group__title', 'Mis plantillas'));
      mineWrap.appendChild(g);
    });
  }

  /**
   * “Guardar” (A7, D29): una hoja (o las notas de un día) como plantilla propia, o que se repita.
   * `src`: algo con forma de hoja ({ title, paper, blocks/values o body }). `opts.date`: semilla de la repetición.
   */
  function keep(anchor, src, opts) {
    opts = opts || {};
    function asTemplate(withContent) {
      M.templateFrom(src, { withContent: withContent, title: opts.title || M.pageTitle(src) }).then(function (t) {
        c.toast('Quedó en Mis plantillas: «' + t.title + '».', { action: 'Ver', onAction: function () { location.hash = R.template(t.id); } });
      });
    }
    function repeat(withContent) {
      MC.repeat.editor(null, function () {}, {
        date: opts.date, title: opts.title || M.pageTitle(src), rule: { type: 'weekdays', days: [D.weekday(opts.date || D.today())] },
        hint: withContent ? 'Cada vez aparece una hoja nueva con lo que tiene ahora.' : 'Cada vez aparece una hoja nueva, con la misma forma y en blanco.',
        save: function (routine) { return M.repeatSheet(src, routine, withContent); }
      });
    }
    c.menu(anchor, [
      { label: 'Como plantilla, en blanco', icon: 'paginas', onSelect: function () { asTemplate(false); } },
      { label: 'Como plantilla, con lo escrito', icon: 'paginas', onSelect: function () { asTemplate(true); } },
      'sep',
      { label: 'Que se repita, en blanco…', icon: 'loop', onSelect: function () { repeat(false); } },
      { label: 'Que se repita, con lo escrito…', icon: 'loop', onSelect: function () { repeat(true); } }
    ], 'Guardar');
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
      saved.track(M.savePage(page).then(function (p) { page.updatedAt = p.updatedAt; page.virtual = false; if (r === rev && c.durable()) MC.ui.set(draftKey, null); }),
        function () { return r === rev; });
    }, 450);
    function persist() { rev++; if (page) { MC.ui.set(draftKey, { at: Date.now(), page: page }); saved.saving(); } save(); }
    persist.flush = function () { save.flush(); };
    persist.cancel = function () { save.cancel(); MC.ui.set(draftKey, null); };

    M.getPage(id).then(function (p) {
      if (destroyed) return;
      var draft = MC.ui.get(draftKey, null);
      if (p && draft && draft.page && draft.at > Date.parse(p.updatedAt || 0)) {
        p = M.normalizePage(Object.assign({}, draft.page, { id: p.id, createdAt: p.createdAt }));
        M.savePage(p).then(function () { if (c.durable()) MC.ui.set(draftKey, null); });
      } else if (draft) MC.ui.set(draftKey, null);
      if (!p) {
        sheet.appendChild(c.empty('No encontré esta página. Quizás la borraste.', 'nube'));
        sheet.appendChild(h('a.label-btn', { href: R.sheets() }, 'Volver a Mis hojas'));
        return;
      }
      // Hojas de antes de A7 (texto o lista): pasan a bloques al abrirlas; al guardar conservan kind/body/items.
      if (!p.blocks) { var sb = M.sheetBlocks(p); p.blocks = MC.clone(sb.blocks); p.values = MC.clone(sb.values); }
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
        (page.virtual ? Promise.resolve(false) : M.isVictory('page', page.id).catch(function () { return false; })).then(pageMenu);
      });
      function pageMenu(isWin) {
        var items = M.PAPERS.map(function (paper) {
          return { label: 'Papel ' + PAPER_LABEL[paper].toLowerCase(), role: 'menuitemradio', checked: page.paper === paper, onSelect: function () { page.paper = paper; persist(); persist.flush(); sheet.className = 'page page--margin free-page paper-' + paper; } };
        });
        items.push('sep');
        items.push({ label: 'Cambiar el día…', icon: 'calendario', onSelect: changeDay });
        items.push({ label: page.pinned ? 'Desfijar del índice' : 'Fijar arriba en el índice', icon: 'pin', onSelect: function () { page.pinned = !page.pinned; persist(); persist.flush(); } });
        if (!page.virtual) items.push({ label: isWin ? 'Ya no es una pequeña victoria' : 'Es una pequeña victoria', icon: 'star', onSelect: function () {
          M.setVictory('page', page.id, !isWin).then(function () { c.toast(isWin ? 'Ya no está entre tus pequeñas victorias.' : 'Quedó entre tus pequeñas victorias, en Mi año.'); });
        } });
        items.push({ label: 'Privacidad de esta página…', icon: 'lock', onSelect: openPrivacy });
        items.push({ label: 'Borrar la página', icon: 'trash', onSelect: remove });
        c.menu(more, items, 'Opciones de la página');
      }
      moreBtn = more;
      var keepBtn = h('button.text-btn', { type: 'button', 'aria-haspopup': 'menu' }, 'Guardar');
      keepBtn.addEventListener('click', function () { persist.flush(); keep(keepBtn, page, { date: M.pageDate(page) }); });
      privacyEl = MC.privacy.button(page.privacy, openPrivacy, true);
      privacyEl.hidden = !M.sanitizePrivacy(page.privacy);
      sheet.appendChild(h('header.free-head',
        h('a.text-btn', { href: R.sheets() }, MC.icon('arrow-left'), 'Mis hojas'),
        h('span.free-head__right', privacyEl, saved, keepBtn, more)));
      sheet.appendChild(h('h1.sr-only', page.title || 'Página sin título'));
      sheet.appendChild(title);
      if (page.virtual) sheet.appendChild(h('p.page-intro.t-meta', 'Esta hoja se repite: queda guardada cuando escribas algo.'));
      sheet.appendChild(MC.sheet.editor(page, { firstTextId: 'page-body', textLabel: 'Texto de la página', placeholder: 'Esta página todavía está en blanco.', onChange: persist }));
      metaEl = null;
      sheet.appendChild(dayMeta());
      sheet.appendChild(MC.images.attachments('page:' + page.id, { onSticker: function (img) { if (scrap) scrap.addImage(img); } }));
      scrap = MC.scrapbook.attach(sheet, { stickers: page.stickers, label: 'esta página', note: saved, onChange: function (list) { if (!page) return; page.stickers = list; persist(); } });
      sheet.appendChild(scrap.toolbar);
      if (MC.ui.get('drawOnOpen', null) === page.id) {
        MC.ui.set('drawOnOpen', null);
        setTimeout(function () { if (!destroyed && scrap) scrap.draw(true); }, 280);
      }
    }

    /* Privacidad (PV1): se elige desde el menú; si hay algo prendido, el candado queda a la vista y también la abre. */
    var privacyEl = null, moreBtn = null;
    function openPrivacy() {
      MC.privacy.dialog({
        kind: 'page', privacy: page.privacy,
        onChange: function (p) { if (!page) return; page.privacy = p; persist(); persist.flush(); },
        onClose: function () {
          if (!page || !privacyEl) return;
          var hadFocus = document.activeElement === privacyEl;
          privacyEl.paint(page.privacy);
          privacyEl.hidden = !M.sanitizePrivacy(page.privacy);
          // Si se apagó todo, el candado se va: el foco vuelve al menú de la página.
          if (hadFocus && privacyEl.hidden) moreBtn.focus();
        }
      });
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

    function remove() {
      c.confirm({ title: '¿Mandar esta página a la papelera?', text: 'Podés recuperarla desde Ajustes mientras esté en la papelera.', confirm: 'Mandar a la papelera' })
        .then(function (ok) {
          if (!ok) return;
          persist.cancel();
          var id = page.id;
          // Una hoja que se repite y no se escribió: queda guardada en la papelera, así ese día no vuelve a aparecer.
          (page.virtual ? M.savePage(page) : Promise.resolve()).then(function () { return M.deletePage(id); }).then(function () {
            page = null; location.hash = R.sheets();
            c.toast('Se fue a la papelera.', { action: 'Deshacer', onAction: function () { M.restoreTrash('pages', id).then(function () { location.hash = R.page(id); }); } });
          });
        });
    }

    return {
      destroy: function () { destroyed = true; persist.flush(); if (scrap) scrap.destroy(); },
      flush: function () { persist.flush(); }
    };
  }

  /* ---------- Plantilla propia (A7): misma hoja, sin día; lo que se arma acá es la forma de las hojas nuevas ---------- */
  function renderTemplate(main, id) {
    var destroyed = false, tpl = null;
    var saved = c.savedNote();
    var sheet = h('section.page.page--margin.free-page.template-page');
    main.appendChild(h('div.spread.spread--single', sheet));
    var save = MC.debounce(function () { if (tpl) saved.track(M.saveTemplate(tpl).then(function (t) { if (tpl) tpl.updatedAt = t.updatedAt; })); }, 450);
    function persist() { if (tpl) { saved.saving(); save(); } }

    M.getTemplate(id).then(function (t) {
      if (destroyed) return;
      if (!t || t.frozen) {
        sheet.appendChild(c.empty('No encontré esta plantilla. Quizás la mandaste a la papelera.', 'nube'));
        sheet.appendChild(h('a.label-btn', { href: R.sheets() }, 'Volver a Mis hojas'));
        return;
      }
      tpl = t;
      build();
    });

    function build() {
      MC.clear(sheet);
      sheet.className = 'page page--margin free-page template-page paper-' + tpl.paper;
      var title = h('input.page-title', { type: 'text', value: tpl.title, placeholder: 'Nombre de la plantilla', 'aria-label': 'Nombre de la plantilla', maxlength: 120 });
      title.addEventListener('input', function () { tpl.title = title.value; persist(); MC.emit('typing'); });
      var use = h('button.label-btn.label-btn--soft', { type: 'button' }, MC.icon('plus'), 'Usarla en una hoja nueva');
      use.addEventListener('click', function () { save.flush(); create({ own: tpl }, D.today()); });
      var more = h('button.icon-btn', { type: 'button', 'aria-label': 'Opciones de la plantilla', 'aria-haspopup': 'menu' }, MC.icon('more'));
      more.addEventListener('click', function () {
        var items = M.PAPERS.map(function (paper) {
          return { label: 'Papel ' + PAPER_LABEL[paper].toLowerCase(), role: 'menuitemradio', checked: tpl.paper === paper, onSelect: function () { tpl.paper = paper; persist(); save.flush(); sheet.className = 'page page--margin free-page template-page paper-' + paper; } };
        });
        items.push('sep');
        items.push({ label: 'Duplicar', icon: 'paginas', onSelect: function () {
          save.flush();
          M.templateFrom(tpl, { title: tpl.title + ' (copia)' }).then(function (t) { location.hash = R.template(t.id); c.toast('Hice una copia.'); });
        } });
        items.push({ label: 'Mandar a la papelera', icon: 'trash', onSelect: function () {
          var tid = tpl.id;
          save.cancel();
          M.deleteTemplate(tid).then(function () {
            tpl = null; location.hash = R.sheets();
            c.toast('Se fue a la papelera.', { action: 'Deshacer', onAction: function () { M.restoreTrash('templates', tid).then(function () { location.hash = R.template(tid); }); } });
          });
        } });
        c.menu(more, items, 'Opciones de la plantilla');
      });
      sheet.appendChild(h('header.free-head',
        h('a.text-btn', { href: R.sheets() }, MC.icon('arrow-left'), 'Mis hojas'),
        h('span.free-head__right', saved, more)));
      sheet.appendChild(h('h1.sr-only', 'Plantilla: ' + (tpl.title || 'sin nombre')));
      sheet.appendChild(title);
      sheet.appendChild(h('p.page-intro.t-meta', 'Lo que armes y escribas acá es cómo empieza cada hoja nueva con esta plantilla. Las hojas que ya hiciste no cambian.'));
      sheet.appendChild(MC.sheet.editor(tpl, { textLabel: 'Texto inicial', placeholder: 'Si querés, un texto para empezar.', onChange: persist }));
      sheet.appendChild(h('p.page-actions', use));
    }

    return {
      destroy: function () { destroyed = true; save.flush(); },
      flush: function () { save.flush(); }
    };
  }

  MC.views = MC.views || {};
  MC.views.pages = {
    TEMPLATES: TEMPLATES, templateFor: templateFor, newPage: templatePicker, create: create, keep: keep, kindOf: kindOf
  };
  MC.views.template = { render: function (main, params) { return renderTemplate(main, params.id); } };
  MC.views.page = { render: function (main, params) { return renderPage(main, params.id); } };
})(window);
