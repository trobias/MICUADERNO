/* HOY — la página de un día. Ver SPEC §7.2. */
(function (root) {
  'use strict';
  var MC = root.MC;
  var h = MC.h, D = MC.dates, M = MC.model, c = MC.c;

  var REFLECTIONS = [
    { key: 'good', label: 'Qué me hizo bien' },
    { key: 'hard', label: 'Algo difícil' },
    { key: 'lovely', label: 'Algo lindo' },
    { key: 'keep', label: 'Qué quiero guardar', hint: 'queda en tus recuerdos', icon: 'star' },
    { key: 'free', label: 'Lo que quieras' }
  ];

  function greeting(name) {
    var hr = new Date().getHours();
    var base = hr < 5 ? 'Buenas noches' : hr < 13 ? 'Buenos días' : hr < 20 ? 'Buenas tardes' : 'Buenas noches';
    return base + (name ? ', ' + name : '');
  }

  function dayOfYear(key) { return D.diffDays(key.slice(0, 4) + '-01-01', key) + 1; }

  function render(main, params) {
    var date = params.date;
    var today = D.today();
    var isToday = date === today;
    var isFuture = date > today;
    var s = M.settings();
    var labels = s.moodLabels;
    var day = null;
    var items = [];
    var saved = c.savedNote();
    var destroyed = false;
    var scrap = null;

    // Borrador local: cada cambio se anota al instante en localStorage para que nada se pierda
    // si la pestaña se cierra antes de que IndexedDB termine de guardar. Se limpia al guardar.
    var draftKey = 'draft.' + date;
    var rev = 0;
    var save = MC.debounce(function () {
      var r = rev;
      M.saveDay(day).then(function (d) {
        day.createdAt = d.createdAt; day.updatedAt = d.updatedAt;
        if (r === rev) MC.ui.set(draftKey, null);
        saved.flash();
      });
    }, 400);
    function persist() { rev++; MC.ui.set(draftKey, { at: Date.now(), day: day }); save(); }
    persist.flush = function () { save.flush(); };

    var spread = h('div.spread');
    var left = h('section.page.page--margin.page--left', { 'aria-label': 'Mañana y lista del día' });
    var right = h('section.page.page--margin.page--right', { 'aria-label': 'Durante el día y cierre' });
    spread.appendChild(left);
    spread.appendChild(h('div.spine', { 'aria-hidden': 'true' }));
    spread.appendChild(right);
    main.appendChild(spread);

    Promise.all([M.getDay(date), M.itemsForDay(date)]).then(function (res) {
      if (destroyed) return;
      day = recoverDraft(res[0]);
      items = res[1];
      build();
    });

    function recoverDraft(stored) {
      var draft = MC.ui.get(draftKey, null);
      if (!draft || !draft.day) return stored;
      var storedAt = stored.updatedAt ? Date.parse(stored.updatedAt) : 0;
      if (draft.at <= storedAt) { MC.ui.set(draftKey, null); return stored; }
      var recovered = M.normalizeDay(draft.day, date);
      setTimeout(function () { M.saveDay(recovered).then(function () { MC.ui.set(draftKey, null); }); }, 0);
      return recovered;
    }

    /* ---------- Encabezado ---------- */
    function header() {
      var prev = h('button.icon-btn', { type: 'button', 'aria-label': 'Día anterior' }, MC.icon('arrow-left'));
      var next = h('button.icon-btn', { type: 'button', 'aria-label': 'Día siguiente' }, MC.icon('arrow-right'));
      prev.addEventListener('click', function () { location.hash = '#/dia/' + D.addDays(date, -1); });
      next.addEventListener('click', function () { location.hash = '#/dia/' + D.addDays(date, 1); });
      var p = D.parse(date);
      var rel = D.relativeLabel(date, today);
      var dateInput = h('input.day-head__picker', { type: 'date', value: date, 'aria-label': 'Ir a una fecha' });
      dateInput.addEventListener('change', function () { if (D.isValid(dateInput.value)) location.hash = '#/dia/' + dateInput.value; });

      return h('header.day-head',
        h('div.day-head__top',
          isToday ? h('p.day-head__greet', greeting(s.name), h('span.t-hand', ' ♡')) :
            h('p.day-head__greet', rel ? D.capitalize(rel) : (isFuture ? 'Un día que todavía no llegó' : 'Un día de tu cuaderno')),
          saved),
        h('div.day-head__row',
          prev,
          h('div.day-head__date',
            h('h1.t-display.day-head__weekday', D.capitalize(D.DAYS[D.weekday(date)])),
            h('p.day-head__long', p.d + ' de ' + D.MONTHS[p.m - 1] + (p.y !== +today.slice(0, 4) ? ' de ' + p.y : ''))),
          next),
        h('div.day-head__tools',
          !isToday ? h('a.text-btn', { href: '#/hoy' }, MC.icon('hoy'), 'Volver a hoy') : null,
          h('label.text-btn.day-head__pick', MC.icon('calendario'), h('span', 'Ir a una fecha'), dateInput))
      );
    }

    /* ---------- Hoja izquierda ---------- */
    function buildLeft() {
      MC.clear(left);
      left.appendChild(h('div.ribbon', { 'aria-hidden': 'true' }));
      left.appendChild(header());

      if (isToday) {
        var reminder = backupReminder();
        if (reminder) left.appendChild(reminder);
        if (MC.notify) { var offer = MC.notify.offerSlip(); if (offer) left.appendChild(offer); }
      }
      if (isFuture) {
        left.appendChild(h('p.future-note.t-text', 'Esta página todavía no llegó. Podés dejar anotado lo que querés hacer ese día.'));
      }

      if (s.track.morning && !isFuture) {
        left.appendChild(c.section(isToday ? '¿Cómo arrancaste hoy?' : '¿Cómo arrancó ese día?',
          c.moodPicker({
            value: day.morning.mood, labels: labels, groupLabel: 'Ánimo al empezar el día',
            onChange: function (v) { day.morning = { mood: v, at: v ? MC.nowISO() : null }; persist(); persist.flush(); }
          }), { id: 'q-morning', className: 'section--mood' }));
      }

      left.appendChild(intentionNote());

      if (s.track.activities) left.appendChild(activitiesSection());
    }

    function intentionNote() {
      var ta = c.writeArea({
        id: 'intention', value: day.intention, rows: 1,
        placeholder: 'una cosa chiquita alcanza',
        onInput: function (v) { day.intention = v; persist(); }
      });
      return h('div.sticky.intention',
        h('span.washi.washi--lavender', { 'aria-hidden': 'true' }),
        h('label', { for: 'intention' }, isFuture ? 'Algo que quiero cuidar ese día…' : 'Algo que quiero cuidar hoy…'),
        ta);
    }

    /* ---------- Lista del día ---------- */
    var listEl = null;

    function activitiesSection() {
      listEl = h('ul.activities', { 'aria-label': 'Actividades del día' });
      items.forEach(function (it) { listEl.appendChild(row(it)); });
      var input = h('input', { type: 'text', placeholder: 'agregar algo para ' + (isToday ? 'hoy' : 'este día') + '…', 'aria-label': 'Agregar una actividad', maxlength: 200, enterkeyhint: 'done' });
      input.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' || e.isComposing) return;
        e.preventDefault();
        var t = input.value.trim();
        if (!t) return;
        input.value = '';
        M.addActivity(date, t).then(function (a) {
          if (!a) return;
          items.push(a);
          listEl.appendChild(row(a));
          updateEmpty();
          saved.flash();
        });
      });
      input.addEventListener('input', function () { MC.emit('typing'); });
      var add = h('label.add-activity', MC.icon('plus'), input);
      var empty = h('p.section__hint.activities-empty', 'Tu lista está vacía. Podés anotar algo o dejarla así.');
      empty.hidden = items.length > 0;
      function updateEmpty() { empty.hidden = listEl.children.length > 0; }
      listEl.updateEmpty = updateEmpty;
      return c.section(isToday ? 'Lo de hoy' : 'Lo de ese día', [empty, listEl, add], { id: 'q-list' });
    }

    function statusNote(it) {
      if (it.status === 'postponed') return h('span.activity__note', 'otro día');
      if (it.status === 'partial') return h('span.activity__note.activity__note--partial', 'un poquito');
      if (it.status === 'skipped') return h('span.activity__note.activity__note--skip', 'hoy no salió');
      return null;
    }

    function row(it) {
      var li = h('li.activity', { dataset: { status: it.status, id: it.id } });
      var box = c.stitchBox(it.status, it.title);
      var title = h('span.activity__title', it.title);
      var meta = h('span.activity__meta');
      var text = h('div.activity__text', title, meta);
      var more = h('button.icon-btn.icon-btn--sm', { type: 'button', 'aria-label': 'Más opciones para ' + it.title, 'aria-haspopup': 'menu', 'aria-expanded': 'false' }, MC.icon('more'));

      function paintMeta() {
        MC.clear(meta);
        if (it.routineId) {
          meta.appendChild(h('span.activity__routine', MC.icon('rutinas'), it.routineGone ? 'rutina (ya no está)' : 'rutina'));
        }
        if (it.movedFrom) meta.appendChild(h('span.activity__routine', MC.icon('later'), 'viene del ' + D.shortLabel(it.movedFrom)));
        var n = statusNote(it);
        if (n) meta.appendChild(n);
        meta.hidden = !meta.firstChild;
      }
      paintMeta();

      function setStatus(status) {
        var prev = it.status;
        it.status = status;
        li.dataset.status = status;
        c.setStitch(box, status, it.title, prev !== status);
        paintMeta();
        return M.setStatus(it, status).then(function (stored) {
          Object.assign(it, { id: stored.id, virtual: undefined, updatedAt: stored.updatedAt });
          li.dataset.id = stored.id;
          saved.flash();
          MC.emit('activity:status', { item: it, prev: prev });
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
            M.renameActivity(it, v).then(function (stored) { Object.assign(it, { id: stored.id, title: stored.title, virtual: undefined }); title.textContent = it.title; saved.flash(); });
            title.textContent = v;
          }
          input.replaceWith(title);
          box.setAttribute('aria-label', 'Lo hice: ' + (v || it.title));
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

      more.addEventListener('click', function () {
        var opts = M.STATUSES.map(function (st) {
          return {
            label: st === 'pending' ? 'Sin marcar' : M.STATUS_LABEL[st], role: 'menuitemradio', checked: it.status === st,
            icon: { pending: 'box', done: 'stitch', partial: 'half', postponed: 'later', skipped: 'knot' }[st],
            onSelect: function () { setStatus(st); }
          };
        });
        opts.push('sep');
        opts.push({ label: 'Pasar a mañana', icon: 'later', onSelect: function () {
          M.moveToTomorrow(it).then(function () {
            it.status = 'postponed'; li.dataset.status = 'postponed'; c.setStitch(box, 'postponed', it.title, false); paintMeta();
            c.toast('Quedó anotado para mañana.');
          });
        } });
        opts.push({ label: 'Cambiar el nombre', icon: 'edit', onSelect: startRename });
        if (it.routineId && !it.routineGone) {
          opts.push({ label: 'Ver la rutina', icon: 'rutinas', onSelect: function () { location.hash = '#/rutinas'; } });
        }
        if (!it.virtual) {
          opts.push({ label: 'Sacar de la lista', icon: 'trash', onSelect: function () {
            var snapshot = MC.clone(it);
            M.deleteActivity(it).then(function () {
              li.remove();
              items = items.filter(function (x) { return x !== it; });
              listEl.updateEmpty();
              c.toast('Lo saqué de la lista.', { action: 'Deshacer', onAction: function () {
                MC.store.put('activities', M.normalizeActivity(snapshot)).then(refreshList);
              } });
            });
          } });
        }
        c.menu(more, opts, 'Opciones de ' + it.title);
      });

      li.appendChild(box);
      li.appendChild(text);
      li.appendChild(more);
      return li;
    }

    function refreshList() {
      M.itemsForDay(date).then(function (list) {
        items = list;
        if (!listEl) return;
        MC.clear(listEl);
        items.forEach(function (it) { listEl.appendChild(row(it)); });
        listEl.updateEmpty();
      });
    }

    /* ---------- Hoja derecha ---------- */
    function buildRight() {
      MC.clear(right);
      right.appendChild(c.section(isFuture ? 'Notas para ese día' : 'Durante el día',
        c.writeArea({ id: 'notes', value: day.notes, rows: 5, ariaLabel: 'Durante el día', placeholder: 'Cuando quieras, escribí la primera línea.', onInput: function (v) { day.notes = v; persist(); } }),
        { id: 'q-notes' }));

      if (!isFuture && (s.track.energy || s.track.sleep)) right.appendChild(bodySection());
      if (!isFuture && (s.track.evening || s.track.reflection)) right.appendChild(closingSection());

      right.appendChild(h('p.page-num', { 'aria-hidden': 'true' }, String(dayOfYear(date))));

      scrap = MC.scrapbook.attach(right, {
        stickers: day.stickers,
        label: 'esta página',
        onChange: function (list) { day.stickers = list; persist(); }
      });
      right.appendChild(scrap.toolbar);
    }

    function bodySection() {
      var parts = [];
      if (s.track.energy) {
        var names = ['poquita', 'media', 'mucha'];
        var row = h('div.choice-row', { role: 'group', 'aria-label': 'Energía' });
        names.forEach(function (n, i) {
          var b = h('button.choice', { type: 'button', 'aria-pressed': String(day.energy === i + 1) }, MC.icon('energy' + (i + 1)), n);
          b.addEventListener('click', function () {
            day.energy = day.energy === i + 1 ? null : i + 1;
            MC.$$('.choice', row).forEach(function (x, j) { x.setAttribute('aria-pressed', String(day.energy === j + 1)); });
            persist();
          });
          row.appendChild(b);
        });
        parts.push(h('div.body-field', h('span.body-field__label', 'Energía'), row));
      }
      if (s.track.sleep) {
        var val = h('span.stepper__value', { 'aria-live': 'polite' });
        var paint = function () { val.textContent = day.sleep == null ? '—' : String(day.sleep).replace('.', ',') + ' h'; };
        var step = function (d) {
          day.sleep = day.sleep == null ? 7 : MC.clamp(day.sleep + d, 0, 14);
          paint(); persist();
        };
        var minus = h('button.icon-btn.icon-btn--sm', { type: 'button', 'aria-label': 'Menos horas de sueño' }, MC.icon('minus'));
        var plus = h('button.icon-btn.icon-btn--sm', { type: 'button', 'aria-label': 'Más horas de sueño' }, MC.icon('plus'));
        minus.addEventListener('click', function () { step(-0.5); });
        plus.addEventListener('click', function () { step(0.5); });
        var clearBtn = h('button.text-btn', { type: 'button' }, 'borrar');
        clearBtn.addEventListener('click', function () { day.sleep = null; paint(); persist(); });
        paint();
        parts.push(h('div.body-field', h('span.body-field__label', 'Dormí'), h('div.stepper', minus, val, plus), clearBtn));
      }
      return c.section('Cómo está el cuerpo', h('div.body-fields', parts), { id: 'q-body' });
    }

    function closingSection() {
      var hasEvening = day.evening.mood || REFLECTIONS.some(function (r) { return day.reflection[r.key].trim(); });
      var hr = new Date().getHours();
      var startOpen = !isToday || hasEvening || hr >= 17;
      var regionId = MC.uid('closing');
      var content = h('div.closing__content', { id: regionId });

      if (s.track.evening) {
        content.appendChild(c.moodPicker({
          value: day.evening.mood, labels: labels, groupLabel: 'Ánimo al terminar el día',
          onChange: function (v) {
            var first = !day.evening.mood && v;
            day.evening = { mood: v, at: v ? MC.nowISO() : null };
            persist(); persist.flush();
            if (first) closingFlourish(content);
          }
        }));
      }
      if (s.track.reflection) {
        var list = h('div.reflections');
        REFLECTIONS.forEach(function (r) {
          var id = 'refl-' + r.key;
          list.appendChild(h('div.reflection',
            h('label.reflection__label', { for: id }, r.icon ? MC.icon(r.icon) : null, r.label, r.hint ? h('span.reflection__hint', ' · ' + r.hint) : null),
            c.writeArea({ id: id, value: day.reflection[r.key], rows: 1, onInput: function (v) { day.reflection[r.key] = v; persist(); } })));
        });
        content.appendChild(list);
      }

      var title = h('h2.section__title', { id: 'q-closing' }, isToday ? '¿Cómo terminó tu día?' : '¿Cómo terminó ese día?');
      var section = h('section.section.closing', { 'aria-labelledby': 'q-closing' }, title);
      if (startOpen) {
        section.appendChild(content);
      } else {
        var toggle = h('button.label-btn.label-btn--soft.closing__open', { type: 'button', 'aria-expanded': 'false', 'aria-controls': regionId }, MC.icon('moon'), 'Cerrar el día');
        content.hidden = true;
        toggle.addEventListener('click', function () {
          content.hidden = false;
          toggle.remove();
          var first = content.querySelector('button, textarea');
          if (first) first.focus();
        });
        section.appendChild(h('p.section__hint', 'Para más tarde, cuando el día se vaya apagando.'));
        section.appendChild(toggle);
        section.appendChild(content);
      }
      return section;
    }

    /** Pequeña ramita que aparece una vez al cerrar el día. */
    function closingFlourish(anchor) {
      var el = h('span.closing-flourish', { 'aria-hidden': 'true', html: MC.stickers.markup(new Date().getHours() >= 19 ? 'luna' : 'ramita') });
      anchor.appendChild(el);
      if (MC.motion.allows('fade') && el.animate) {
        el.animate([{ opacity: 0, transform: 'translateY(' + (6 * (MC.motion.allows('move') ? 1 : 0)) + 'px) rotate(-6deg)' }, { opacity: 1, transform: 'translateY(0) rotate(-6deg)' }],
          { duration: 600, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'both' });
      }
      c.toast('Día cerrado. Podés volver cuando quieras.');
    }

    /* ---------- Recordatorio de copia ---------- */
    function backupReminder() {
      var every = s.backupEveryDays;
      if (!every) return null;
      var snooze = MC.ui.get('backupSnooze', null);
      if (snooze && snooze > today) return null;
      var slip = h('div.slip.slip--butter.backup-slip', { hidden: true },
        h('p', 'Hace un tiempo que no guardás una copia de tu cuaderno. Hacé una de vez en cuando ♡'),
        h('div.slip__actions',
          h('button.label-btn', { type: 'button', on: { click: function () { MC.backup.download().then(function () { slip.remove(); c.toast('Copia guardada en tus descargas.'); }); } } }, MC.icon('download'), 'Guardar una copia'),
          h('button.text-btn', { type: 'button', on: { click: function () { MC.ui.set('backupSnooze', D.addDays(today, 3)); slip.remove(); } } }, 'Ahora no')));
      Promise.all([M.getMeta('lastBackupAt', null), M.getMeta('createdAt', null), MC.store.getAll('days')]).then(function (r) {
        if (destroyed || r[2].length < 3) return;
        var ref = r[0] || r[1];
        if (!ref) return;
        var since = D.diffDays(D.fromDate(new Date(ref)), today);
        if (since >= every) slip.hidden = false;
      });
      return slip;
    }

    function build() {
      buildLeft();
      buildRight();
      var focus = MC.ui.get('focusOnLoad', null);
      if (focus) {
        MC.ui.set('focusOnLoad', null);
        var sel = focus === 'notes' ? '#notes' : '.section--mood .mood-patch';
        // Si la tapa sigue puesta, la tapa enfoca esto al abrirse.
        if (document.querySelector('.cover')) MC.pendingFocus = sel;
        else setTimeout(function () { var el = MC.$(sel); if (el) { el.focus(); el.scrollIntoView({ block: 'center' }); } }, 60);
      }
      MC.emit('view:ready', { name: 'today', scenesAnchor: right });
    }

    return {
      destroy: function () { destroyed = true; persist.flush(); if (scrap) scrap.destroy(); },
      flush: function () { persist.flush(); },
      refresh: function () {
        if (destroyed) return;
        Promise.all([M.getDay(date), M.itemsForDay(date)]).then(function (res) {
          day = recoverDraft(res[0]); items = res[1];
          if (scrap) scrap.destroy();
          build();
        });
      }
    };
  }

  MC.views = MC.views || {};
  MC.views.today = { render: render };
})(window);
