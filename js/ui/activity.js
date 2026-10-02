/* Fila de actividad: casilla de punto cruz + texto + menú (estados, mover, renombrar, sacar).
   La misma fila en la página del día y en la Agenda (DECISIONS D22). */
(function (root) {
  'use strict';
  var MC = root.MC;
  var h = MC.h, D = MC.dates, M = MC.model, R = MC.routes, c = MC.c;
  var history = MC.history.create();
  MC.on('route', function () { history.clear(); if (MC.history.active() === history) MC.history.activate(null); });
  MC.on('panel', function (open) { if (!open) { history.clear(); if (MC.history.active() === history) MC.history.activate(null); } });
  function activateFor(li) {
    history.setSurface(li.closest('.spread') || li.closest('#panel-body'));
    MC.history.activate(history);
  }

  var STATUS_ICON = { pending: 'box', done: 'stitch', partial: 'half', postponed: 'later', skipped: 'knot' };

  function statusNote(it) {
    if (it.status === 'postponed') return h('span.activity__note', 'otro día');
    if (it.status === 'partial') return h('span.activity__note.activity__note--partial', 'un poquito');
    if (it.status === 'skipped') return h('span.activity__note.activity__note--skip', 'hoy no salió');
    return null;
  }

  /** Pide un día con un diálogo chico → Promise<'AAAA-MM-DD' | null>. opts: { title, value, confirm, hint } */
  c.askDate = function (opts) {
    return new Promise(function (resolve) {
      var id = MC.uid('fecha');
      var input = h('input.input', { id: id, type: 'date', value: opts.value || D.today(), required: true });
      var err = h('p.form-error', { role: 'alert' });
      var picked = null;
      c.dialog({
        title: opts.title,
        content: [opts.hint ? h('p.section__hint', opts.hint) : null, h('div.field', h('label', { for: id }, 'Qué día'), input, err)],
        actions: [
          { label: 'Cancelar', kind: 'text' },
          { label: opts.confirm || 'Listo', onClick: function () {
            if (!D.isValid(input.value)) { err.textContent = 'Elegí un día del calendario.'; input.focus(); return false; }
            picked = input.value;
          } }
        ],
        onClose: function () { resolve(picked); }
      });
      setTimeout(function () { input.focus(); }, 30);
    });
  };

  /**
   * opts: {
   *   saved: nota “guardado” (opcional),
   *   onRemoved(it), onRestored(): al sacar y al deshacer,
   *   onMoved(it, fecha): después de pasarla a otro día
   * }
   */
  function activityRow(it, opts) {
    opts = opts || {};
    var flash = function () { if (opts.saved) opts.saved.flash(); };
    var li = h('li.activity', { dataset: { status: it.status, id: it.id } });
    var box = c.stitchBox(it.status, it.title);
    var title = h('span.activity__title', it.title);
    var meta = h('span.activity__meta');
    var text = h('div.activity__text', title, meta);
    var more = h('button.icon-btn.icon-btn--sm', { type: 'button', 'aria-label': 'Más opciones para ' + it.title, 'aria-haspopup': 'menu', 'aria-expanded': 'false' }, MC.icon('more'));

    function refresh() { if (opts.onRestored) opts.onRestored(); }
    function restoreSource(before, after) {
      return before.virtual ? M.deleteActivity(after) : M.saveItem(before, before);
    }
    function recordChange(label, before, after) {
      history.push({ label: label,
        undo: function () { return restoreSource(before, after).then(refresh); },
        redo: function () { return M.saveItem(after, after).then(refresh); }
      });
      activateFor(li);
    }
    function recordMove(before, after, copy) {
      history.push({ label: 'Pasar actividad a otro día',
        undo: function () {
          return (copy ? M.deleteActivity(copy) : Promise.resolve()).then(function () { return restoreSource(before, after); }).then(refresh);
        },
        redo: function () {
          return M.saveItem(after, after).then(function () { return copy ? M.saveItem(copy, copy) : null; }).then(refresh);
        }
      });
      activateFor(li);
    }
    function movedSource(before, result) {
      if (!before.routineId && !before.virtual && result.id === before.id) return Promise.resolve(result);
      return M.itemsForDay(before.date).then(function (items) {
        return items.filter(function (x) { return before.routineId ? x.routineId === before.routineId && !x.virtual : x.id === before.id; })[0];
      });
    }

    function paintMeta() {
      MC.clear(meta);
      if (it.routineId) meta.appendChild(h('span.activity__routine', MC.icon('rutinas'), it.routineGone ? 'rutina (ya no está)' : 'rutina'));
      // “Viene del…” lleva al día de donde se pasó.
      if (it.movedFrom) meta.appendChild(h('a.activity__routine.activity__from', { href: R.day(it.movedFrom) }, MC.icon('later'), 'viene del ' + D.shortLabel(it.movedFrom)));
      var n = statusNote(it);
      if (n) meta.appendChild(n);
      meta.hidden = !meta.firstChild;
    }
    paintMeta();

    function setStatus(status) {
      var prev = it.status;
      if (prev === status) return Promise.resolve();
      var before = MC.clone(it);
      it.status = status;
      li.dataset.status = status;
      c.setStitch(box, status, it.title, prev !== status);
      paintMeta();
      return M.setStatus(it, status).then(function (stored) {
        Object.assign(it, { id: stored.id, virtual: undefined, updatedAt: stored.updatedAt });
        li.dataset.id = stored.id;
        flash();
        MC.emit('activity:status', { item: it, prev: prev });
        recordChange('Cambiar estado de actividad', before, MC.clone(it));
      });
    }

    box.addEventListener('click', function () { setStatus(it.status === 'done' ? 'pending' : 'done'); });
    title.addEventListener('dblclick', startRename);

    function startRename() {
      var input = h('input.activity__edit.write', { type: 'text', value: it.title, 'aria-label': 'Nombre de la actividad', maxlength: 200 });
      var done = false;
      function finish(save) {
        if (done) return;
        done = true;
        var v = input.value.trim();
        if (save && v && v !== it.title) {
          var before = MC.clone(it);
          M.renameActivity(it, v).then(function (stored) { Object.assign(it, { id: stored.id, title: stored.title, virtual: undefined }); title.textContent = it.title; flash(); recordChange('Cambiar nombre de actividad', before, MC.clone(it)); });
          title.textContent = v;
        }
        input.replaceWith(title);
        box.setAttribute('aria-label', 'Lo hice: ' + (v || it.title));
        more.setAttribute('aria-label', 'Más opciones para ' + (v || it.title));
        more.focus();
      }
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); finish(true); }
        if (e.key === 'Escape') { e.preventDefault(); finish(false); }
      });
      input.addEventListener('blur', function () { finish(true); });
      title.replaceWith(input);
      input.focus();
      input.select();
    }

    function moveTo() {
      var from = it.date;
      c.askDate({
        title: 'Pasar «' + it.title + '» a otro día', value: D.addDays(from, 1), confirm: 'Pasar',
        hint: it.routineId ? 'Acá queda como “lo dejo para otro día” y en el día nuevo aparece suelta.' : null
      }).then(function (date) {
        if (!date || date === from) return;
        var before = MC.clone(it);
        M.moveActivity(it, date).then(function (result) { return movedSource(before, result).then(function (after) {
          recordMove(before, MC.clone(after), before.routineId || before.virtual ? MC.clone(result) : null);
          c.toast('Quedó para el ' + D.longLabel(date) + '.', { action: 'Ver ese día', onAction: function () { location.hash = R.day(date); } });
          if (opts.onMoved) opts.onMoved(it, date);
        }); });
      });
    }

    more.addEventListener('click', function () {
      var items = M.STATUSES.map(function (st) {
        return {
          label: st === 'pending' ? 'Sin marcar' : M.STATUS_LABEL[st], role: 'menuitemradio', checked: it.status === st,
          icon: STATUS_ICON[st], onSelect: function () { setStatus(st); }
        };
      });
      items.push('sep');
      items.push({ label: 'Pasar a mañana', icon: 'later', onSelect: function () {
        var before = MC.clone(it);
        M.moveToTomorrow(it).then(function (copy) { return movedSource(before, copy).then(function (after) {
          recordMove(before, MC.clone(after), MC.clone(copy));
          it.status = 'postponed'; li.dataset.status = 'postponed'; c.setStitch(box, 'postponed', it.title, false); paintMeta();
          c.toast('Quedó anotado para mañana.');
          if (opts.onMoved) opts.onMoved(it, D.addDays(it.date, 1));
        }); });
      } });
      items.push({ label: 'Pasar a otro día…', icon: 'calendario', onSelect: moveTo });
      items.push({ label: 'Cambiar el nombre', icon: 'edit', onSelect: startRename });
      if (it.routineId && !it.routineGone) items.push({ label: 'Ver la rutina', icon: 'rutinas', onSelect: function () { location.hash = R.routine(it.routineId); } });
      if (!it.virtual) {
        items.push({ label: 'Sacar de la lista', icon: 'trash', onSelect: function () {
          var snapshot = MC.clone(it);
          var surface = li.closest('.spread') || li.closest('#panel-body');
          M.deleteActivity(it).then(function () {
            li.remove();
            if (opts.onRemoved) opts.onRemoved(it);
            history.push({ label: 'Sacar actividad',
              undo: function () { return M.saveItem(snapshot, { deletedAt: null }).then(function () { if (opts.onRestored) opts.onRestored(); }); },
              redo: function () { return M.deleteActivity(snapshot).then(function () {
                // Al deshacer se dibujó una fila nueva: se saca esa, no la original.
                MC.$$('li.activity[data-id="' + snapshot.id + '"]').forEach(function (el) { el.remove(); });
                if (opts.onRemoved) opts.onRemoved(snapshot);
              }); }
            });
            history.setSurface(surface);
            MC.history.activate(history);
            c.toast('Lo saqué de la lista.', { action: 'Deshacer', onAction: function () { if (surface && surface.isConnected) history.undo(); } });
          });
        } });
      }
      c.menu(more, items, 'Opciones de ' + it.title);
    });

    li.appendChild(box);
    li.appendChild(text);
    li.appendChild(more);
    return li;
  }

  MC.activityRow = activityRow;
})(window);
