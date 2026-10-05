/* Motor de bloques de una hoja o una plantilla (A7, D29): renglones, lista, casillas y columnas.
   MC.sheet.editor(model, opts) — `model` = { blocks, values } (se modifica en el lugar); `opts.onChange()` se
   llama en cada cambio (quien lo usa decide cuándo guardar). El primer bloque de renglones lleva el id
   `opts.firstTextId` (en la hoja, `page-body`). La estructura se cambia desde el menú de cada bloque y con
   “Agregar”: lo nuevo se descubre ahí, sin sumar botones a la vista (progressive disclosure). */
(function (root) {
  'use strict';
  var MC = root.MC;
  var h = MC.h, c = MC.c;

  var TYPE_LABEL = { text: 'Renglones', list: 'Lista', checks: 'Casillas', columns: 'Columnas' };
  var TYPE_ICON = { text: 'text', list: 'list', checks: 'box', columns: 'grid' };
  var MAX_BLOCKS = 24;

  function newBlock(type) {
    var b = { id: MC.uid('blk'), type: type, title: '' };
    if (type === 'columns') b.columns = [{ id: MC.uid('col'), title: '' }, { id: MC.uid('col'), title: '' }];
    return b;
  }

  function editor(model, opts) {
    opts = opts || {};
    var changed = opts.onChange || function () {};
    var wrap = h('div.sheet-blocks');
    var titled = {}; // bloques a los que se les pidió título aunque todavía esté vacío

    function touch() { MC.emit('typing'); changed(); }

    function build(focusSel) {
      MC.clear(wrap);
      var firstText = true;
      model.blocks.forEach(function (b, i) {
        var useId = b.type === 'text' && firstText && opts.firstTextId;
        if (b.type === 'text') firstText = false;
        wrap.appendChild(blockEl(b, i, useId ? opts.firstTextId : null));
      });
      if (model.blocks.length < MAX_BLOCKS) {
        var add = h('button.text-btn.sheet-add', { type: 'button', 'aria-haspopup': 'menu', dataset: { focus: 'sheet-add' } }, MC.icon('plus'), 'Agregar a la hoja');
        add.addEventListener('click', function () {
          c.menu(add, ['text', 'list', 'checks', 'columns'].map(function (t) {
            return { label: TYPE_LABEL[t], icon: TYPE_ICON[t], onSelect: function () {
              var nb = newBlock(t);
              model.blocks.push(nb);
              touch();
              build('[data-block="' + nb.id + '"] textarea, [data-block="' + nb.id + '"] input');
            } };
          }), 'Agregar a la hoja');
        });
        wrap.appendChild(add);
      }
      if (focusSel) {
        var el = wrap.querySelector(focusSel);
        if (el) setTimeout(function () { el.focus(); }, 0);
      }
    }

    function blockEl(b, i, textId) {
      var sec = h('section.sheet-block', { class: 'sheet-block--' + b.type, dataset: { block: b.id }, 'aria-label': b.title || TYPE_LABEL[b.type] });
      var tools = h('button.icon-btn.icon-btn--sm.sheet-block__more', { type: 'button', 'aria-label': 'Opciones de este bloque (' + (b.title || TYPE_LABEL[b.type]).toLowerCase() + ')', 'aria-haspopup': 'menu', dataset: { focus: 'more:' + b.id } }, MC.icon('more'));
      tools.addEventListener('click', function () { blockMenu(b, tools); });
      var head = h('div.sheet-block__head');
      if (b.title || titled[b.id]) {
        var t = h('input.sheet-block__title', { type: 'text', value: b.title, maxlength: 80, placeholder: 'un título', 'aria-label': 'Título del bloque' });
        t.addEventListener('input', function () { b.title = t.value; touch(); });
        head.appendChild(t);
      }
      head.appendChild(tools);
      sec.appendChild(head);
      if (b.type === 'text') sec.appendChild(textBody(b, textId));
      else if (b.type === 'list' || b.type === 'checks') sec.appendChild(listBody(b));
      else if (b.type === 'columns') sec.appendChild(columnsBody(b));
      return sec;
    }

    function blockMenu(b, anchor) {
      var i = model.blocks.indexOf(b);
      var items = [];
      items.push(b.title || titled[b.id]
        ? { label: 'Sacar el título', icon: 'close', onSelect: function () { b.title = ''; delete titled[b.id]; touch(); build('[data-focus="more:' + b.id + '"]'); } }
        : { label: 'Ponerle un título', icon: 'edit', onSelect: function () { titled[b.id] = true; build('[data-block="' + b.id + '"] .sheet-block__title'); } });
      if (b.type === 'columns') {
        if (b.columns.length < 4) items.push({ label: 'Sumar una columna', icon: 'plus', onSelect: function () { b.columns.push({ id: MC.uid('col'), title: '' }); touch(); build('[data-focus="more:' + b.id + '"]'); } });
        if (b.columns.length > 2) items.push({ label: 'Sacar la última columna', icon: 'minus', onSelect: function () {
          var col = b.columns.pop();
          if (model.values[b.id]) delete model.values[b.id][col.id];
          touch(); build('[data-focus="more:' + b.id + '"]');
        } });
      }
      if (b.type === 'list' || b.type === 'checks') {
        var other = b.type === 'list' ? 'checks' : 'list';
        items.push({ label: other === 'checks' ? 'Pasar a casillas' : 'Pasar a lista', icon: TYPE_ICON[other], onSelect: function () {
          b.type = other;
          (model.values[b.id] || []).forEach(function (it) { if (other === 'checks') it.done = !!it.done; else delete it.done; });
          touch(); build('[data-focus="more:' + b.id + '"]');
        } });
      }
      if (i > 0) items.push({ label: 'Subir', icon: 'arrow-left', onSelect: function () { move(b, -1); } });
      if (i < model.blocks.length - 1) items.push({ label: 'Bajar', icon: 'arrow-right', onSelect: function () { move(b, 1); } });
      if (model.blocks.length > 1) {
        items.push('sep');
        items.push({ label: 'Sacar este bloque', icon: 'trash', onSelect: function () { removeBlock(b); } });
      }
      c.menu(anchor, items, 'Opciones del bloque');
    }

    function move(b, dir) {
      var i = model.blocks.indexOf(b);
      model.blocks.splice(i, 1);
      model.blocks.splice(i + dir, 0, b);
      touch();
      build('[data-focus="more:' + b.id + '"]');
    }

    function removeBlock(b) {
      var i = model.blocks.indexOf(b);
      var had = model.values[b.id];
      var empty = had == null || (typeof had === 'string' ? !had.trim() : Array.isArray(had) ? !had.some(function (it) { return it.text.trim(); }) : !Object.keys(had).some(function (k) { return String(had[k]).trim(); }));
      model.blocks.splice(i, 1);
      delete model.values[b.id];
      touch();
      var next = model.blocks[Math.min(i, model.blocks.length - 1)];
      build(next ? '[data-focus="more:' + next.id + '"]' : '[data-focus="sheet-add"]');
      if (!empty) {
        c.toast('Saqué el bloque.', { action: 'Deshacer', onAction: function () {
          model.blocks.splice(i, 0, b);
          model.values[b.id] = had;
          touch();
          build('[data-focus="more:' + b.id + '"]');
        } });
      }
    }

    function textBody(b, textId) {
      return c.writeArea({
        id: textId || undefined, value: typeof model.values[b.id] === 'string' ? model.values[b.id] : '', rows: model.blocks.length === 1 ? 12 : 4,
        ariaLabel: b.title || opts.textLabel || 'Texto de la hoja', placeholder: model.blocks.length === 1 ? (opts.placeholder || 'Esta hoja todavía está en blanco.') : 'escribí acá…',
        onInput: function (v) { model.values[b.id] = v; changed(); }
      });
    }

    function listBody(b) {
      var checks = b.type === 'checks';
      if (!Array.isArray(model.values[b.id])) model.values[b.id] = [];
      var items = model.values[b.id];
      var ul = h('ul.free-list', { class: checks ? 'free-list--checks' : null });
      function itemRow(it) {
        var input = h('input.write', { type: 'text', value: it.text, 'aria-label': checks ? 'Casilla' : 'Ítem', maxlength: 500, placeholder: 'escribí algo…', enterkeyhint: 'next' });
        input.addEventListener('input', function () {
          it.text = input.value;
          if (box) c.setStitch(box, it.done ? 'done' : 'pending', it.text || 'esta casilla', false);
          touch();
        });
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' && !e.isComposing) {
            e.preventDefault();
            var nu = { id: MC.uid('itm'), text: '' };
            if (checks) nu.done = false;
            items.splice(items.indexOf(it) + 1, 0, nu);
            var r = itemRow(nu);
            li.after(r);
            r.querySelector('input').focus();
            changed();
          } else if (e.key === 'Backspace' && !input.value && items.length > 1) {
            e.preventDefault();
            items.splice(items.indexOf(it), 1);
            var prevLi = li.previousElementSibling || li.nextElementSibling;
            li.remove();
            if (prevLi) { var pi = prevLi.querySelector('input'); pi.focus(); pi.setSelectionRange(pi.value.length, pi.value.length); }
            changed();
          }
        });
        var box = null;
        if (checks) {
          box = c.stitchBox(it.done ? 'done' : 'pending', it.text || 'esta casilla');
          box.addEventListener('click', function () {
            it.done = !it.done;
            c.setStitch(box, it.done ? 'done' : 'pending', it.text || 'esta casilla', true);
            changed();
          });
        }
        var li = h('li.free-list__item', box || h('span.free-list__bullet', { 'aria-hidden': 'true' }), input);
        return li;
      }
      if (!items.length) items.push(checks ? { id: MC.uid('itm'), text: '', done: false } : { id: MC.uid('itm'), text: '' });
      items.forEach(function (it) { ul.appendChild(itemRow(it)); });
      var add = h('button.text-btn', { type: 'button' }, MC.icon('plus'), 'Agregar otra');
      add.addEventListener('click', function () {
        var nu = { id: MC.uid('itm'), text: '' };
        if (checks) nu.done = false;
        items.push(nu);
        var r = itemRow(nu);
        ul.appendChild(r);
        r.querySelector('input').focus();
      });
      return h('div.free-list-wrap', ul, add);
    }

    function columnsBody(b) {
      if (!model.values[b.id] || typeof model.values[b.id] !== 'object' || Array.isArray(model.values[b.id])) model.values[b.id] = {};
      var vals = model.values[b.id];
      var grid = h('div.sheet-cols', { style: '--cols:' + b.columns.length });
      b.columns.forEach(function (col, i) {
        var title = h('input.sheet-col__title', { type: 'text', value: col.title, maxlength: 60, placeholder: 'columna ' + (i + 1), 'aria-label': 'Título de la columna ' + (i + 1) });
        title.addEventListener('input', function () { col.title = title.value; touch(); });
        var ta = c.writeArea({ value: vals[col.id] || '', rows: 4, ariaLabel: col.title || 'Columna ' + (i + 1), placeholder: '…', onInput: function (v) { vals[col.id] = v; changed(); } });
        grid.appendChild(h('div.sheet-col', title, ta));
      });
      return grid;
    }

    build();
    wrap.rebuild = build;
    return wrap;
  }

  MC.sheet = { editor: editor, TYPE_LABEL: TYPE_LABEL };
})(window);
