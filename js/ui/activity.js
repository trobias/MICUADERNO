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
      if (it.routineId) meta.appendChild(h('span.activity__routine', MC.icon('rutinas'), it.routineGone ? 'ya no se repite' : 'se repite'));
      if (it.flexible) meta.appendChild(h('span.activity__routine', 'elegís el día'));
      if (it.targetNote) meta.appendChild(h('span.activity__routine', it.targetNote));
      // “Viene del…” lleva al día de donde se pasó.
      if (it.movedFrom) meta.appendChild(h('a.activity__routine.activity__from', { href: R.day(it.movedFrom) }, MC.icon('later'), 'viene del ' + D.shortLabel(it.movedFrom)));
      var n = statusNote(it);
      if (n) meta.appendChild(n);
      if (it.feel) {
        if (it.feel.before && it.feel.before.length) meta.appendChild(h('span.activity__feeling', 'Antes: ' + it.feel.before.join(', ')));
        if (it.feel.after && it.feel.after.length) meta.appendChild(h('span.activity__feeling', 'Después: ' + it.feel.after.join(', ')));
      }
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

    /** “Pasar a mañana” y “Pasar a otro día…” son lo mismo con otra fecha (una sola regla en el modelo, D34). */
    function moveToDate(date, message) {
      var before = MC.clone(it);
      return M.moveActivity(it, date).then(function (result) { return movedSource(before, result).then(function (after) {
        recordMove(before, MC.clone(after), before.routineId || before.virtual ? MC.clone(result) : null);
        c.toast(message || 'Quedó para el ' + D.longLabel(date) + '.', { action: 'Ver ese día', onAction: function () { location.hash = R.day(date); } });
        if (opts.onMoved) opts.onMoved(it, date);
      }); });
    }

    function moveTo() {
      var from = it.date;
      c.askDate({
        title: 'Pasar «' + it.title + '» a otro día', value: D.addDays(from, 1), confirm: 'Pasar',
        hint: it.routineId ? 'Acá queda como “lo dejo para otro día” y en el día nuevo aparece suelta.' : null
      }).then(function (date) {
        if (!date || date === from) return;
        moveToDate(date);
      });
    }

    function editFeelings() {
      var before = MC.clone(it);
      var feel = M.sanitizeFeel(it.feel) || { before: [], after: [] };
      var suggestions = M.emotionSuggestions();
      c.dialog({ title: 'Cómo te sentiste con «' + it.title + '»', content: [
        h('div.field', h('h3', 'Antes de hacerla'), c.feelingEditor({ value: feel.before, label: 'Antes de ' + it.title,
          suggestions: suggestions, onChange: function (v) { feel.before = v; } })),
        h('div.field', h('h3', 'Después de hacerla'), c.feelingEditor({ value: feel.after, label: 'Después de ' + it.title,
          suggestions: suggestions, onChange: function (v) { feel.after = v; } }))
      ], actions: [
        { label: 'Cancelar', kind: 'text' },
        { label: 'Guardar', onClick: function () {
          return M.saveItem(it, { feel: M.sanitizeFeel(feel) }).then(function (stored) {
            Object.assign(it, stored, { virtual: undefined });
            li.dataset.id = stored.id;
            paintMeta();
            recordChange('Cambiar emociones de actividad', before, MC.clone(it));
          });
        } }
      ] });
    }

    function withRoutine(fn) {
      M.getRoutines().then(function (list) {
        var r = list.filter(function (x) { return x.id === it.routineId; })[0];
        if (r) fn(r); else c.toast('Eso ya no se repite.');
      });
    }

    /** La actividad suelta pasa a ser la primera vez de lo que ahora se repite (si cae ese día): no queda doble. */
    function adopt(r) {
      if (!r || !MC.recurrence.occursOn(r, it.date)) return;
      var status = it.status;
      M.deleteActivity(it).then(function () { return M.itemsForDay(it.date); }).then(function (list) {
        var occ = list.filter(function (x) { return x.routineId === r.id; })[0];
        return occ && status !== 'pending' ? M.setStatus(occ, status) : null;
      }).then(function () { if (opts.onRestored) opts.onRestored(); });
    }

    /** Dejar de repetir desde este día: lo que ya se marcó queda en sus días (A5). */
    function stopRepeating() {
      withRoutine(function (r) {
        c.confirm({ title: '¿Dejar de repetir «' + r.title + '»?', text: 'Deja de aparecer desde el ' + D.longLabel(it.date) + '. Lo que ya marcaste queda en tus días, y la podés retomar desde Mis hojas.', confirm: 'Dejar de repetir' })
          .then(function (ok) {
            if (!ok) return;
            var end = D.addDays(it.date, -1);
            var next = end < r.startDate ? Object.assign({}, r, { archived: true }) : Object.assign({}, r, { endDate: end });
            return M.saveRoutine(next).then(function () {
              c.toast('Listo: «' + r.title + '» ya no se repite.', { action: 'Deshacer', onAction: function () { M.saveRoutine(r); } });
            });
          });
      });
    }

    more.addEventListener('click', function () {
      // Saber si ya es una pequeña victoria (A8) antes de armar el menú; una ocurrencia virtual todavía no puede serlo.
      (it.virtual ? Promise.resolve(false) : M.isVictory('activity', it.id).catch(function () { return false; })).then(openMenu);
    });
    function openMenu(isWin) {
      var items = M.STATUSES.map(function (st) {
        return {
          label: M.STATUS_LABEL[st], role: 'menuitemradio', checked: it.status === st,
          icon: STATUS_ICON[st], onSelect: function () { setStatus(st); }
        };
      });
      items.push('sep');
      items.push({ label: 'Cómo me sentí antes y después…', icon: 'edit', onSelect: editFeelings });
      if (!it.virtual) items.push({ label: isWin ? 'Ya no es una pequeña victoria' : 'Es una pequeña victoria', icon: 'star', onSelect: function () {
        M.setVictory('activity', it.id, !isWin).then(function () {
          if (isWin) c.toast('Ya no está entre tus pequeñas victorias.');
          else c.toast('Quedó entre tus pequeñas victorias.', { action: 'Ver', onAction: function () { location.hash = R.year(it.date.slice(0, 4)); } });
        });
      } });
      if (MC.memories.allowed()) {
        if (!it.virtual) {
          items.push(MC.memories.item('activity', it.id, 'victoria', 'Elegir mi pequeña victoria…', { title: it.title, date: it.date }));
          items.push(MC.memories.item('activity', it.id, 'recuerdo', 'Quiero recordarlo…', { title: it.title, date: it.date }));
        }
        items.push(MC.memories.item(it.routineId ? 'routine' : 'activity', it.routineId || it.id, 'especial', 'Esto es especial para mí…', { title: it.title, date: it.date }));
      }
      items.push({ label: 'Pasar a mañana', icon: 'later', onSelect: function () { moveToDate(D.addDays(it.date, 1), 'Quedó anotado para mañana.'); } });
      items.push({ label: 'Pasar a otro día…', icon: 'calendario', onSelect: moveTo });
      items.push({ label: 'Cambiar el nombre', icon: 'edit', onSelect: startRename });
      if (it.routineId && !it.routineGone) {
        items.push({ label: 'Cambiar cómo se repite…', icon: 'rutinas', onSelect: function () { withRoutine(function (r) { MC.repeat.editor(r, null, { date: it.date }); }); } });
        items.push({ label: 'Dejar de repetir', icon: 'pause', onSelect: stopRepeating });
        items.push({ label: 'Ver en el calendario', icon: 'calendario', onSelect: function () { location.hash = R.month(D.monthKey(it.date), { routine: it.routineId }); } });
        items.push({ label: 'Ver lo que se repite', icon: 'rutinas', onSelect: function () { location.hash = R.routine(it.routineId); } });
      }
      // Repetir una actividad suelta: el editor de repetición empieza con su nombre y su día (A5).
      else if (!it.routineId) items.push({ label: 'Que se repita…', icon: 'rutinas', onSelect: function () { MC.repeat.editor(null, adopt, { date: it.date, title: it.title }); } });
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
    }

    li.appendChild(box);
    li.appendChild(text);
    li.appendChild(more);
    return li;
  }

  MC.activityRow = activityRow;
})(window);
