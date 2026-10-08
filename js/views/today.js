/* HOY — la página de un día. Ver SPEC §7.2. */
(function (root) {
  'use strict';
  var MC = root.MC;
  var h = MC.h, D = MC.dates, M = MC.model, R = MC.routes, c = MC.c;

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
    var suggestions = M.emotionSuggestions();
    var day = null;
    var items = [];
    var saved = c.savedNote();
    var destroyed = false;
    var scrap = null;
    var trashNotice = null;

    // Borrador local: cada cambio se anota al instante en localStorage para que nada se pierda
    // si la pestaña se cierra antes de que IndexedDB termine de guardar. Se limpia al guardar.
    // En modo memoria (sin IndexedDB) el borrador se queda: es lo único que sobrevive a una recarga.
    var draftKey = 'draft.' + date;
    var rev = 0;
    var save = MC.debounce(function () {
      var r = rev;
      saved.track(M.saveDay(day).then(function (d) {
        day.createdAt = d.createdAt; day.updatedAt = d.updatedAt;
        day.deletedAt = d.deletedAt;
        if (trashNotice) trashNotice.hidden = !M.isDeleted(d);
        if (r === rev && c.durable()) MC.ui.set(draftKey, null);
      }), function () { return r === rev; });
    }, 400);
    function persist() { rev++; MC.ui.set(draftKey, { at: Date.now(), day: day }); saved.saving(); save(); }
    persist.flush = function () { save.flush(); };

    var spread = h('div.spread');
    var left = h('section.page.page--margin.page--left', { 'aria-label': 'Mañana y lista del día' });
    var right = h('section.page.page--margin.page--right', { 'aria-label': 'Durante el día y cierre' });
    spread.appendChild(left);
    spread.appendChild(h('div.spine', { 'aria-hidden': 'true' }));
    spread.appendChild(right);
    main.appendChild(spread);

    var pagesToday = [];
    M.ensureWeeklyDefaults().then(function () { return Promise.all([M.getDay(date, { includeDeleted: true }), M.itemsForDay(date), M.pagesOn(date)]); }).then(function (res) {
      if (destroyed) return;
      day = recoverDraft(res[0]);
      items = res[1];
      pagesToday = res[2];
      build();
    });

    function recoverDraft(stored) {
      var draft = MC.ui.get(draftKey, null);
      if (!draft || !draft.day) return stored;
      // Quien mira el cuaderno de otra persona sin poder editar el día: un borrador viejo no se intenta guardar (D51).
      if (MC.access && MC.access.guest() && MC.access.level(['escritura', 'emociones']) !== 'editar') { MC.ui.set(draftKey, null); return stored; }
      var storedAt = stored.updatedAt ? Date.parse(stored.updatedAt) : 0;
      if (draft.at <= storedAt) { MC.ui.set(draftKey, null); return stored; }
      var recovered = M.normalizeDay(draft.day, date);
      setTimeout(function () { saved.track(M.saveDay(recovered).then(function (d) {
        recovered.deletedAt = d.deletedAt;
        if (trashNotice) trashNotice.hidden = !M.isDeleted(d);
        if (c.durable()) MC.ui.set(draftKey, null);
      })); }, 0);
      return recovered;
    }

    /* ---------- Encabezado ---------- */
    function header() {
      var prev = h('button.icon-btn', { type: 'button', 'aria-label': 'Día anterior' }, MC.icon('arrow-left'));
      var next = h('button.icon-btn', { type: 'button', 'aria-label': 'Día siguiente' }, MC.icon('arrow-right'));
      prev.addEventListener('click', function () { location.hash = R.day(D.addDays(date, -1)); });
      next.addEventListener('click', function () { location.hash = R.day(D.addDays(date, 1)); });
      var p = D.parse(date);
      var rel = D.relativeLabel(date, today);

      return h('header.day-head',
        h('div.day-head__top',
          // Quien mira el cuaderno de otra persona no es saludada con el nombre de la dueña (D53).
          isToday && MC.sync && MC.sync.mode === 'guest' ? h('p.day-head__greet', 'Cuaderno de ' + ((MC.sync.share && MC.sync.share.name) || 'otra persona')) :
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
          !isToday ? h('a.text-btn', { href: R.today() }, MC.icon('hoy'), 'Ir a hoy') : null,
          privacyEl = MC.privacy.button(day.privacy, openPrivacy, false, day.hide),
          keepButton(), memoryButton()),
        trashNotice = h('p.slip', { hidden: !M.isDeleted(day) }, 'Este día está en la papelera. Si lo editás, vuelve a tu cuaderno con lo que ya habías guardado.')
      );
    }

    function memoryButton() {
      if (!MC.memories.allowed()) return null;
      var b = h('button.text-btn.memory-btn', { type: 'button', 'aria-haspopup': 'menu' }, MC.icon('star'), 'Este día…');
      b.addEventListener('click', function () {
        c.menu(b, [MC.memories.item('day', date, 'recuerdo', 'Un día que quiero guardar…', { date: date, title: D.longLabel(date) }),
          MC.memories.item('day', date, 'victoria', 'Mi pequeña victoria…', { date: date, title: D.longLabel(date) })], 'Recuerdos de este día');
      });
      return b;
    }

    /* “Guardar” del día (D45): que se repita (sus actividades), como plantilla de día, o usar una plantilla. */
    function keepButton() {
      var b = h('button.text-btn.keep-btn', { type: 'button', 'aria-haspopup': 'menu', 'aria-label': 'Guardar este día: que se repita o como plantilla' }, MC.icon('loop'), 'Guardar');
      b.addEventListener('click', function () {
        // Lo del día tal como está guardado ahora (otra pestaña o la nube pudieron sumar algo).
        Promise.all([M.getDayTemplates(), M.itemsForDay(date)]).then(function (r) {
          var tpls = r[0];
          items = r[1];
          var own = items.filter(function (it) { return !it.routineId && !it.virtual; }).length;
          var list = [];
          list.push({ label: 'Que se repita este día…', icon: 'loop', onSelect: function () {
            if (!own) { c.toast('Este día todavía no tiene actividades propias para repetir. Anotá alguna primero.'); return; }
            MC.repeat.editor(null, function () { refreshList(); }, {
              date: date, noTitle: true, title: 'Este día', dialogTitle: 'Que se repita este día',
              rule: { type: 'weekdays', days: [D.weekday(date)] },
              hint: own === 1 ? 'La actividad de este día va a aparecer sola en los días que elijas.' : 'Las ' + own + ' actividades de este día van a aparecer solas en los días que elijas (cada una se puede cambiar después en Mis hojas).',
              save: function (routine) { return M.repeatDay(items, routine).then(function (made) { return made[0] || routine; }); }
            });
          } });
          list.push({ label: 'Como plantilla de día…', icon: 'paginas', onSelect: function () {
            persist.flush();
            c.askText({ title: 'Guardar como plantilla de día', label: 'Nombre de la plantilla', value: D.capitalize(D.DAYS[D.weekday(date)]),
              hint: 'Guarda las actividades (sin marcar), la intención y las notas, para empezar otro día igual.' }).then(function (name) {
              if (!name) return;
              M.dayTemplateFrom(day, items, name).then(function (t) { c.toast('Quedó la plantilla de día «' + t.title + '».'); });
            });
          } });
          if (tpls.length) {
            list.push('sep');
            tpls.forEach(function (t) {
              list.push({ label: 'Usar «' + t.title + '»', icon: 'plus', onSelect: function () {
                persist.flush();
                M.applyDayTemplate(date, t).then(function (n) {
                  reload();
                  c.toast(n ? (n === 1 ? 'Sumé una actividad' : 'Sumé ' + n + ' actividades') + ' de «' + t.title + '».' : 'Listo: «' + t.title + '» ya estaba en este día.');
                });
              } });
            });
            list.push({ label: 'Borrar una plantilla de día…', icon: 'trash', onSelect: function () { setTimeout(function () { dropDayTemplate(b, tpls); }, 0); } });
          }
          c.menu(b, list, 'Guardar este día');
        });
      });
      return b;
    }
    function dropDayTemplate(anchor, tpls) {
      c.menu(anchor, tpls.map(function (t) {
        return { label: 'Mandar «' + t.title + '» a la papelera', icon: 'trash', onSelect: function () {
          M.deleteTemplate(t.id).then(function () {
            c.toast('Se fue a la papelera.', { action: 'Deshacer', onAction: function () { M.restoreTrash('templates', t.id); } });
          });
        } };
      }), 'Plantillas de día');
    }
    function reload() {
      if (destroyed) return;
      Promise.all([M.getDay(date, { includeDeleted: true }), M.itemsForDay(date)]).then(function (res) {
        day = recoverDraft(res[0]); items = res[1];
        if (scrap) scrap.destroy();
        build();
      });
    }

    /* Privacidad de este día (PV1): un acceso discreto en el encabezado; el estado se dice en palabras. */
    var privacyEl = null;
    function openPrivacy() {
      MC.privacy.dialog({
        kind: 'day', privacy: day.privacy, empty: M.isEmptyDay(day),
        onChange: function (p) {
          day.privacy = p;
          persist(); persist.flush();
          privacyEl.paint(p, day.hide);
        },
        // Qué ven quienes miran (D53).
        share: MC.privacy.canShare() ? { store: 'days', parts: MC.privacy.DAY_PARTS, hide: day.hide, onChange: function (hd) {
          if (hd) day.hide = hd; else delete day.hide;
          persist(); persist.flush();
          privacyEl.paint(day.privacy, day.hide);
        } } : null
      });
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
          c.feelingEditor({
            value: M.feelingsOf(day.morning, s), label: 'Cómo te sentiste al empezar el día', suggestions: suggestions,
            onChange: function (v) { day.morning = { feelings: v, at: v.length ? MC.nowISO() : null }; persist(); persist.flush(); }
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
        saved.track(M.addActivity(date, t).then(function (a) {
          if (!a) return;
          items.push(a);
          listEl.appendChild(row(a));
          updateEmpty();
        }));
      });
      input.addEventListener('input', function () { MC.emit('typing'); });
      var add = h('label.add-activity', MC.icon('plus'), input);
      var empty = h('p.section__hint.activities-empty', 'Tu lista está vacía. Podés anotar algo o dejarla así.');
      empty.hidden = items.length > 0;
      function updateEmpty() { empty.hidden = listEl.children.length > 0; }
      listEl.updateEmpty = updateEmpty;
      return c.section(isToday ? 'Lo de hoy' : 'Lo de ese día', [empty, listEl, add], { id: 'q-list' });
    }

    /** La fila es la misma que en la Agenda (js/ui/activity.js). */
    function row(it) {
      return MC.activityRow(it, {
        saved: saved,
        onRemoved: function (gone) { items = items.filter(function (x) { return x !== gone; }); listEl.updateEmpty(); },
        onRestored: refreshList,
        onMoved: refreshList
      });
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

      right.appendChild(pagesSection());
      // Adjuntos del día: una foto, una entrada, un PDF… (una imagen se puede pegar como sticker).
      right.appendChild(MC.images.attachments('day:' + date, { onSticker: function (img) { if (scrap) scrap.addImage(img); } }));
      if (!isFuture && (s.track.energy || s.track.sleep)) right.appendChild(bodySection());
      if (!isFuture && (s.track.evening || s.track.reflection)) right.appendChild(closingSection());

      right.appendChild(h('p.page-num', { 'aria-hidden': 'true' }, String(dayOfYear(date))));

      scrap = MC.scrapbook.attach(right, {
        stickers: day.stickers,
        label: 'esta página',
        note: saved,
        onChange: function (list) { day.stickers = list; persist(); }
      });
      right.appendChild(scrap.toolbar);
    }

    /* Hojas de este día: las empezadas acá y, de hoy en adelante, las que se repiten (A7). */
    function pagesSection() {
      var start = h('button.text-btn', { type: 'button' }, MC.icon('plus'), 'Agregar una hoja');
      start.addEventListener('click', function () { MC.views.pages.newPage(date); });
      return c.section(pagesToday.length === 1 ? 'Una hoja de este día' : 'Hojas de este día',
        [pagesToday.length ? c.pageLinks(pagesToday) : null, start], { id: 'q-pages' });
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
      var hasEvening = M.feelingsOf(day.evening, s).length || REFLECTIONS.some(function (r) { return day.reflection[r.key].trim(); });
      var hr = new Date().getHours();
      var startOpen = !isToday || hasEvening || hr >= 17;
      var regionId = MC.uid('closing');
      var content = h('div.closing__content', { id: regionId });

      if (s.track.evening) {
        content.appendChild(c.feelingEditor({
          value: M.feelingsOf(day.evening, s), label: 'Cómo te sentiste al terminar el día', suggestions: suggestions,
          onChange: function (v) {
            var first = !M.feelingsOf(day.evening, s).length && v.length;
            day.evening = { feelings: v, at: v.length ? MC.nowISO() : null };
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
        var refDay = D.fromISO(ref);
        if (!refDay) return;
        var since = D.diffDays(refDay, today);
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
        var sel = focus === 'notes' ? '#notes' : '.section--mood .feelings__input';
        // Si la tapa sigue puesta, la tapa enfoca esto al abrirse.
        if (document.querySelector('.cover')) MC.pendingFocus = sel;
        else setTimeout(function () { var el = MC.$(sel); if (el) { el.focus(); el.scrollIntoView({ block: 'center' }); } }, 60);
      }
      MC.emit('view:ready', { name: 'today', scenesAnchor: right });
    }

    return {
      destroy: function () { destroyed = true; persist.flush(); if (scrap) scrap.destroy(); },
      flush: function () { persist.flush(); },
      refresh: reload
    };
  }

  MC.views = MC.views || {};
  MC.views.today = { render: render };
})(window);
