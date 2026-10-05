/* AJUSTES — vos, tapa, qué registrar, motion, recordatorios, datos. Ver SPEC §7.7. */
(function (root) {
  'use strict';
  var MC = root.MC;
  var h = MC.h, D = MC.dates, M = MC.model, c = MC.c;
  var VERSION = '1.0.0';

  var MOTION_INFO = {
    completas: ['Completas', 'La tapa se abre, las hojas se deslizan y a veces aparece una escena chiquita.'],
    suaves: ['Suaves', 'Casi todo, más breve. Escenas muy de vez en cuando.'],
    reducidas: ['Reducidas', 'Solo fundidos suaves. Nada se desplaza ni aparece solo.'],
    ninguna: ['Ninguna', 'Todo cambia al instante.']
  };

  // Cada cambio se confirma con el indicador “guardando… → guardado ✓” de la hoja (DA3), sin avisos flotantes.
  var note = null;
  function save(patch) {
    var p = M.saveSettings(patch);
    return note ? note.track(p) : p;
  }

  function checkRow(id, label, checked, onChange, hint) {
    var cb = h('input', { type: 'checkbox', id: id, checked: !!checked });
    cb.addEventListener('change', function () { onChange(cb.checked); });
    return h('li', h('label.check', { for: id }, cb, h('span', label, hint ? h('span.check__hint', hint) : null)));
  }

  /* ---------- Colores propios (A9) ---------- */
  var THEME_FIELDS = [['cloth', 'Tela'], ['paper', 'Hojas'], ['ink', 'Tinta']];
  var FINISH_LABEL = { mate: 'Mate', satinado: 'Satinado', brillante: 'Brillante' };

  function themeSection(s) {
    var T = MC.theme;
    var theme = s.theme ? MC.clone(s.theme) : null;
    var saveLater = MC.debounce(function () { save({ theme: theme }); }, 400);
    var status = h('p.theme-status.t-meta', { 'aria-live': 'polite' });
    var notes = h('p.theme-notes.t-meta', { 'aria-live': 'polite' });
    var presets = h('div.theme-presets');
    var custom = h('div.theme-custom', { id: 'st-theme-custom', hidden: true });
    var reset = h('button.text-btn', { type: 'button' }, 'Volver a la tela de la tapa');

    function label() {
      if (!theme) return 'Ahora: la tela de tu tapa (de fábrica).';
      var p = T.byId(theme.preset);
      return 'Ahora: ' + (p ? p.label : 'mis colores') + '.';
    }
    function paintState() {
      status.textContent = label();
      reset.hidden = !theme;
      MC.$$('.theme-choice', presets).forEach(function (b) { b.setAttribute('aria-pressed', String(!!theme && theme.preset === b.dataset.preset)); });
      var d = theme ? T.derive(theme) : null;
      notes.textContent = MC.themeUI.systemWins() && theme ? 'Tu sistema pide alto contraste: mientras siga así, el cuaderno usa sus colores de fábrica.'
        : d ? (d.fixes.length ? d.fixes.join(' ') : 'Todo se lee bien (contraste AA o más).') : '';
    }
    function changed(now) {
      MC.themeUI.apply(theme);
      paintState();
      if (now) { saveLater.cancel(); save({ theme: theme }); } else saveLater();
    }

    // Presets por familia: cada uno es una muestra de tela con su hoja y sus acentos.
    var families = [];
    T.PRESETS.forEach(function (p) { if (families.indexOf(p.family) === -1) families.push(p.family); });
    families.forEach(function (fam) {
      var row = h('div.theme-row', { role: 'group', 'aria-label': fam });
      T.PRESETS.filter(function (p) { return p.family === fam; }).forEach(function (p) {
        var sw = h('span.theme-choice__swatch', { 'aria-hidden': 'true', style: { background: p.cloth2 ? 'linear-gradient(' + (p.angle || 135) + 'deg, ' + p.cloth + ', ' + p.cloth2 + ')' : p.cloth } },
          h('span.theme-choice__paper', { style: { background: p.paper, color: p.ink } }, 'Aa',
            h('span.theme-choice__dots', p.accents.map(function (a) { return h('i', { style: { background: a } }); }))));
        var b = h('button.theme-choice', { type: 'button', 'aria-pressed': 'false', dataset: { preset: p.id } }, sw, h('span', p.label));
        b.addEventListener('click', function () { theme = T.fromPreset(p.id); paintCustom(); changed(true); });
        row.appendChild(b);
      });
      presets.appendChild(h('div.theme-family', h('h3.theme-family__title', fam), row));
    });

    // Mis colores: cada superficie con selector y código; degradado, ángulo y acabado solo si se eligen.
    function colorField(key, text, value, onSet) {
      var id = 'st-th-' + key;
      var swatch = h('input', { type: 'color', id: id, value: value || '#FFFFFF' }); // color-ok: valor inicial del selector nativo
      var code = h('input.input.theme-code', { type: 'text', value: value || '', maxlength: 7, placeholder: '#RRGGBB', 'aria-label': 'Código de ' + text.toLowerCase() });
      swatch.addEventListener('input', function () { code.value = swatch.value.toUpperCase(); code.removeAttribute('aria-invalid'); onSet(code.value); });
      code.addEventListener('change', function () {
        var v = code.value.trim();
        if (!/^#[0-9a-fA-F]{6}$/.test(v)) { code.setAttribute('aria-invalid', 'true'); return; }
        code.removeAttribute('aria-invalid');
        code.value = v.toUpperCase(); swatch.value = v; onSet(code.value);
      });
      return h('div.theme-field', h('label', { for: id }, text), swatch, code);
    }
    function base() {
      if (theme) { theme.preset = 'propio'; return theme; }
      var cs = getComputedStyle(document.body);
      var read = function (k) { var v = cs.getPropertyValue(k).trim().toUpperCase(); return /^#[0-9A-F]{6}$/.test(v) ? v : null; };
      theme = { preset: 'propio', cloth: read('--cloth'), cloth2: null, paper: read('--paper'), ink: read('--ink'), angle: 135,
        accents: ['--butter', '--rose', '--sage', '--lavender'].map(read).filter(Boolean), finish: 'mate' };
      return theme;
    }
    function paintCustom() {
      MC.clear(custom);
      var t = theme || {};
      THEME_FIELDS.forEach(function (f) { custom.appendChild(colorField(f[0], f[1], t[f[0]], function (v) { base()[f[0]] = v; changed(); })); });
      [0, 1, 2, 3].forEach(function (i) {
        custom.appendChild(colorField('acc' + i, 'Acento ' + (i + 1), t.accents && t.accents[i], function (v) { var th = base(); th.accents = (th.accents || []).slice(0, 4); th.accents[i] = v; changed(); }));
      });
      var grad = h('input', { type: 'checkbox', id: 'st-th-grad', checked: !!t.cloth2 });
      var second = colorField('cloth2', 'Segundo color de la tela', t.cloth2 || t.cloth, function (v) { base().cloth2 = v; changed(); });
      var angle = h('input', { type: 'range', id: 'st-th-angle', min: 0, max: 360, step: 15, value: t.angle || 135 });
      var gradExtra = h('div.theme-grad', second, h('div.theme-field', h('label', { for: 'st-th-angle' }, 'Dirección'), angle));
      gradExtra.hidden = !t.cloth2;
      grad.addEventListener('change', function () {
        var th = base();
        th.cloth2 = grad.checked ? (th.cloth2 || th.cloth) : null;
        gradExtra.hidden = !grad.checked;
        changed(true);
      });
      angle.addEventListener('input', function () { base().angle = +angle.value; changed(); });
      custom.appendChild(h('label.check', { for: 'st-th-grad' }, grad, h('span', 'Degradado en la tela', h('span.check__hint', 'Solo si te gusta: de fábrica la tela es lisa.'))));
      custom.appendChild(gradExtra);
      var finish = h('div.choice-row', { role: 'radiogroup', 'aria-label': 'Acabado de la tela' });
      T.FINISHES.forEach(function (f) {
        var b = h('button.choice', { type: 'button', role: 'radio', 'aria-checked': String((t.finish || 'mate') === f) }, FINISH_LABEL[f]);
        b.addEventListener('click', function () {
          base().finish = f;
          MC.$$('.choice', finish).forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
          changed(true);
        });
        finish.appendChild(b);
      });
      custom.appendChild(h('div.field', h('span', 'Acabado'), finish));
    }
    var openCustom = h('button.label-btn.label-btn--soft', { type: 'button', 'aria-expanded': 'false', 'aria-controls': custom.id }, MC.icon('edit'), 'Elegir mis colores');
    openCustom.addEventListener('click', function () {
      var open = custom.hidden;
      if (open) paintCustom();
      custom.hidden = !open;
      openCustom.setAttribute('aria-expanded', String(open));
    });
    reset.addEventListener('click', function () { theme = null; paintCustom(); changed(true); });

    // Una hojita de muestra (todo el cuaderno ya cambió, pero acá se ve junto).
    var preview = h('div.theme-preview', { 'aria-hidden': 'true' },
      h('span.theme-preview__tab', 'Hoy'),
      h('span.theme-preview__page', h('span.theme-preview__title', 'Lunes'), h('span.theme-preview__text', 'Nicole escribió una línea.'), h('span.theme-preview__soft', 'guardado')));

    paintState();
    return c.section('Colores propios', [
      h('p.section__hint', 'De fábrica, el cuaderno es de la tela de tu tapa. Si querés, elegí otros colores: todo cambia al momento y siempre se puede volver.'),
      status, preview, presets, h('div.theme-actions', openCustom, reset), custom, notes
    ], { id: 'st-theme' });
  }

  /* ---------- Exportaciones ---------- */
  function exportFile(kind) {
    return M.activeEverything().then(function (all) {
      var E = MC.exporters;
      var name = MC.backup.filename;
      if (kind === 'txt') MC.download(name('mi-cuaderno', 'txt'), E.toTXT(all), 'text/plain;charset=utf-8');
      else if (kind === 'csv-dias') MC.download(name('mi-cuaderno-dias', 'csv'), E.toCSV(E.daysTable(all)), 'text/csv;charset=utf-8');
      else if (kind === 'csv-act') MC.download(name('mi-cuaderno-actividades', 'csv'), E.toCSV(E.activitiesTable(all)), 'text/csv;charset=utf-8');
      else if (kind === 'xlsx') MC.download(name('mi-cuaderno', 'xlsx'), new Blob([E.workbook(all)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      c.toast('Listo: quedó en tus descargas.');
    });
  }

  /* ---------- Restaurar ---------- */
  function restoreFlow(file) {
    var reader = new FileReader();
    reader.onerror = function () { c.dialog({ title: 'No pude leer el archivo', content: h('p.t-text', 'Probá elegirlo de nuevo.'), actions: [{ label: 'Entendido' }] }); };
    reader.onload = function () {
      var v = MC.backup.validate(String(reader.result || ''));
      if (!v.ok) {
        c.dialog({ title: 'Esta copia no se puede abrir', content: h('p.t-text', v.error), actions: [{ label: 'Entendido' }] });
        return;
      }
      var s = v.summary;
      var parts = [s.days + ' ' + (s.days === 1 ? 'día' : 'días'), s.activities + ' actividades', s.routines + ' rutinas', s.pages + ' páginas'];
      c.dialog({
        title: 'Abrir esta copia',
        content: [
          h('p.t-text', 'Es ' + (s.name ? 'el cuaderno de ' + s.name : 'un cuaderno') + (D.fromISO(s.exportedAt) ? ', guardado el ' + D.longLabel(D.fromISO(s.exportedAt)) : '') + '.'),
          h('p.t-text', 'Tiene ' + parts.join(', ') + (s.from ? ', del ' + D.shortLabel(s.from) + ' ' + s.from.slice(0, 4) + ' al ' + D.shortLabel(s.to) + ' ' + s.to.slice(0, 4) : '') + '.'),
          h('div.slip.slip--rose', h('p', 'Al abrirla, reemplaza todo lo que hay ahora en este cuaderno. Si querés conservarlo, descargá una copia primero.'))
        ],
        actions: [
          { label: 'Descargar mi cuaderno actual', kind: 'text', icon: 'download', onClick: function () { MC.backup.download(); c.toast('Copia actual guardada.'); return false; } },
          { spacer: true },
          { label: 'Cancelar', kind: 'text' },
          { label: 'Reemplazar mi cuaderno', kind: 'danger', onClick: function () {
            return MC.backup.restore(v.payload).then(function (settings) {
              MC.app.applySettings(settings);
              c.toast('Listo, tu cuaderno está de vuelta.');
              if (location.hash === MC.routes.today()) MC.app.refresh(); else location.hash = MC.routes.today();
            }, function (err) {
              console.error(err);
              c.toast('No se pudo restaurar. Tu cuaderno actual quedó como estaba.');
            });
          } }
        ]
      });
    };
    reader.readAsText(file);
  }

  function wipeFlow() {
    var input = h('input.input', { type: 'text', id: 'wipe-confirm', autocomplete: 'off', placeholder: 'borrar' });
    c.dialog({
      title: 'Borrar todo el cuaderno',
      content: [
        h('p.t-text', 'Se borran todos tus días, rutinas y páginas de este dispositivo. No se puede deshacer.'),
        h('div.field', h('label', { for: 'wipe-confirm' }, 'Para confirmar, escribí “borrar”.'), input)
      ],
      actions: [
        { label: 'Descargar una copia antes', kind: 'text', icon: 'download', onClick: function () { MC.backup.download(); return false; } },
        { spacer: true },
        { label: 'Cancelar', kind: 'text' },
        { label: 'Borrar todo', kind: 'danger', onClick: function () {
          if (input.value.trim().toLowerCase() !== 'borrar') { input.focus(); input.setAttribute('aria-invalid', 'true'); return false; }
          return MC.backup.wipe().then(function (s) {
            MC.app.applySettings(s);
            MC.ui.set('coverOpens', 0);
            location.hash = MC.routes.welcome();
          });
        } }
      ]
    });
  }

  function render(main) {
    var cleanups = [];
    var s = MC.clone(M.settings());
    var left = h('section.page.page--margin.settings-page');
    var right = h('section.page.page--margin.settings-page');
    main.appendChild(h('div.spread', left, h('div.spine', { 'aria-hidden': 'true' }), right));

    note = c.savedNote({ failText: 'Todavía no se pudo guardar en el cuaderno; el cambio sigue en esta ventana.' });
    // Lo que se guarda desde otras piezas de Ajustes (recordatorios) también se confirma acá.
    var offSettings = MC.on('settings', function () { if (note) note.saved(); });
    left.appendChild(h('div.saved-row', h('h1.t-display.settings-title', 'Ajustes'), note));

    // Vos
    var name = h('input.input', { id: 'st-name', type: 'text', value: s.name, maxlength: 40, autocomplete: 'given-name' });
    name.addEventListener('change', function () { save({ name: name.value.trim() }); });
    left.appendChild(c.section('Vos', h('div.field', h('label', { for: 'st-name' }, 'Cómo querés que te llame'), name), { id: 'st-you' }));

    // Los colores son opcionales; las palabras se escriben libremente en los días y actividades.
    var emotionList = h('ul.emotion-colors');
    var newEmotion = h('input.input', { type: 'text', maxlength: 40, placeholder: 'Una palabra tuya', 'aria-label': 'Emoción para elegir color' });
    var newColor = h('input', { type: 'color', value: '#0A5A9A', 'aria-label': 'Color de la nueva emoción' }); // color-ok: valor inicial del selector nativo
    var colorHint = h('p.t-meta', 'Si no elegís uno, el calendario asigna un hilo según las emociones que aparecen en esa vista.');
    function paintEmotionColors(words) {
      MC.clear(emotionList);
      var colors = M.settings().emotionColors;
      words.forEach(function (word) {
        var key = M.emotionKey(word);
        var chosen = colors[key];
        var swatch = h('input', { type: 'color', value: chosen || '#0A5A9A', 'aria-label': 'Color de ' + word }); // color-ok: valor inicial del selector nativo
        var code = h('input.input.emotion-colors__code', { type: 'text', value: chosen || '', maxlength: 7,
          placeholder: '#RRGGBB', 'aria-label': 'Código de color de ' + word });
        function setColor(value) {
          var next = Object.assign({}, M.settings().emotionColors);
          if (value) next[key] = value; else delete next[key];
          save({ emotionColors: next });
          code.value = value || '';
          if (value) swatch.value = value;
          code.setAttribute('aria-invalid', 'false');
        }
        swatch.addEventListener('change', function () { setColor(swatch.value.toUpperCase()); });
        code.addEventListener('change', function () {
          var value = code.value.trim();
          if (value && !/^#[0-9a-fA-F]{6}$/.test(value)) { code.setAttribute('aria-invalid', 'true'); return; }
          setColor(value.toUpperCase());
        });
        emotionList.appendChild(h('li', h('span', word), swatch, code));
      });
    }
    var knownEmotions = [];
    M.emotionSuggestions().then(function (words) {
      if (!left.isConnected) return;
      knownEmotions = words.concat(Object.keys(M.settings().emotionColors).filter(function (key) { return !words.some(function (word) { return M.emotionKey(word) === key; }); }));
      paintEmotionColors(knownEmotions);
    });
    var addEmotionColor = h('button.label-btn.label-btn--soft', { type: 'button' }, MC.icon('plus'), 'Elegir color');
    addEmotionColor.addEventListener('click', function () {
      var word = M.sanitizeFeelings([newEmotion.value]);
      if (!word || !word.length) { newEmotion.focus(); return; }
      var key = M.emotionKey(word[0]);
      var next = Object.assign({}, M.settings().emotionColors); next[key] = newColor.value.toUpperCase();
      save({ emotionColors: next });
      if (!knownEmotions.some(function (value) { return M.emotionKey(value) === key; })) knownEmotions.push(word[0]);
      paintEmotionColors(knownEmotions);
      newEmotion.value = '';
      newEmotion.focus();
    });
    left.appendChild(c.section('Mis emociones', [colorHint, emotionList,
      h('div.emotion-colors__add', newEmotion, newColor, addEmotionColor)], { id: 'st-emotions' }));

    // Tapa
    var covers = h('div.cover-choices', { role: 'group', 'aria-label': 'Tapas' });
    M.COVERS.forEach(function (cv) {
      var b = h('button.cover-choice', { type: 'button', 'aria-pressed': String(s.cover === cv), dataset: { cover: cv } },
        h('span.cover-choice__swatch', { 'aria-hidden': 'true' }), h('span', MC.views.onboarding.COVER_NAMES[cv]));
      b.addEventListener('click', function () {
        MC.$$('.cover-choice', covers).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        save({ cover: cv });
      });
      covers.appendChild(b);
    });
    left.appendChild(c.section('Tu tapa', covers, { id: 'st-cover' }));

    // Colores propios (A9, D30): de fábrica, la tela de la tapa. Todo cambia al momento; se guarda con un respiro.
    left.appendChild(themeSection(s));

    // Qué registrar
    var track = h('ul.check-list');
    MC.views.onboarding.TRACK.forEach(function (t) {
      track.appendChild(checkRow('st-' + t[0], t[1], s.track[t[0]], function (on) {
        var next = Object.assign({}, M.settings().track); next[t[0]] = on; save({ track: next });
      }));
    });
    left.appendChild(c.section('Qué querés registrar', track, { id: 'st-track' }));

    // Motion
    var motion = h('div.motion-choices', { role: 'radiogroup', 'aria-label': 'Animaciones' });
    M.MOTION.forEach(function (m) {
      var b = h('button.motion-choice', { type: 'button', role: 'radio', 'aria-checked': String(s.motion === m) },
        h('span.motion-choice__name', MOTION_INFO[m][0]), h('span.motion-choice__desc', MOTION_INFO[m][1]));
      b.addEventListener('click', function () {
        MC.$$('.motion-choice', motion).forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
        save({ motion: m, motionChosen: true });
      });
      motion.appendChild(b);
    });
    var motionExtras = h('ul.check-list',
      checkRow('st-scenes', 'Escenas ocasionales', s.scenes, function (on) { save({ scenes: on }); }, 'Una mariposa, un poco de vapor… muy de vez en cuando, nunca mientras escribís.'),
      checkRow('st-cover-show', 'Mostrar la tapa al abrir', s.showCover, function (on) { save({ showCover: on }); }));
    left.appendChild(c.section('Cómo se mueve', [motion, motionExtras],
      { id: 'st-motion', hint: MC.motion.systemReduced() ? 'Tu dispositivo pide menos movimiento: si las animaciones te marean, elegí “Reducidas” o “Ninguna”.' : null }));

    // Recordatorios
    if (MC.notify) right.appendChild(MC.notify.settingsSection());

    // Mis datos
    var fileInput = h('input.sr-only', { type: 'file', accept: 'application/json,.json', id: 'st-restore', tabindex: '-1' });
    fileInput.addEventListener('change', function () { if (fileInput.files[0]) restoreFlow(fileInput.files[0]); fileInput.value = ''; });
    var every = h('select.select', { id: 'st-every' }, [[7, 'Cada semana'], [14, 'Cada dos semanas'], [30, 'Cada mes'], [0, 'No me recuerdes']].map(function (o) {
      return h('option', { value: o[0], selected: s.backupEveryDays === o[0] }, o[1]);
    }));
    every.addEventListener('change', function () { save({ backupEveryDays: +every.value }); });
    var lastBackup = h('p.t-meta');
    M.getMeta('lastBackupAt', null).then(function (v) { lastBackup.textContent = D.fromISO(v) ? 'Última copia: ' + D.longLabel(D.fromISO(v)) : 'Todavía no guardaste ninguna copia.'; });

    function action(icon, label, fn, cls) {
      var b = h('button.' + (cls || 'label-btn.label-btn--soft'), { type: 'button' }, MC.icon(icon), label);
      b.addEventListener('click', fn);
      return b;
    }

    // Papelera (DA1): se abre solo cuando la persona quiere verla.
    var alive = true;
    var trashList = h('ul.trash-list');
    var trashEmpty = h('p.slip', 'La papelera está limpia ♡');
    var retentionNote = h('p.t-meta', { id: 'st-retention-note', role: 'status' });
    var emptyButton = action('trash', 'Vaciar papelera', function () {
      c.confirm({ title: '¿Vaciar la papelera?', text: 'Se borrará lo que hay en ella y esta acción no se puede deshacer.', confirm: 'Vaciar papelera' }).then(function (ok) {
        if (ok) M.emptyTrash().then(function () { paintTrash(); trashToggle.focus(); c.toast('La papelera quedó limpia.'); });
      });
    });
    var trashPanel = h('div.trash-panel', { id: 'st-trash-panel' },
      h('p.t-text', 'Lo que mandás acá se puede recuperar durante el tiempo que elijas.'),
      h('div.field', h('label', { for: 'st-retention' }, 'Conservar en la papelera'),
        (function () {
          var select = h('select.select', { id: 'st-retention' }, [[7, '7 días'], [15, '15 días'], [30, '30 días'], [60, '60 días'], [0, 'Siempre']].map(function (o) {
            return h('option', { value: o[0], selected: s.trashRetentionDays === o[0] }, o[1]);
          }));
          select.setAttribute('aria-describedby', 'st-retention-note');
          select.addEventListener('change', function () {
            var before = M.settings().trashRetentionDays;
            var chosen = +select.value;
            save({ trashRetentionDays: chosen });
            retentionNote.textContent = '';
            if (chosen === 0 || (before !== 0 && chosen >= before)) return;
            M.trashItems().then(function (items) {
              if (+select.value !== chosen) return;
              var count = M.countDueTrash(items, chosen);
              if (count) retentionNote.textContent = count + ' ' + (count === 1 ? 'cosa se borraría' : 'cosas se borrarían') + ' definitivamente la próxima vez que abras el cuaderno. Podés restaurarlas antes desde esta papelera.';
            }).catch(function () {
              if (+select.value === chosen) retentionNote.textContent = 'No se pudo revisar qué vencería. Podés conservar siempre lo que hay en la papelera.';
            });
          });
          return select;
        })(), retentionNote), trashEmpty, trashList, emptyButton);
    var trashToggle = action('trash', 'Ver papelera', function () {
      trashPanel.hidden = !trashPanel.hidden;
      trashToggle.setAttribute('aria-expanded', String(!trashPanel.hidden));
      if (!trashPanel.hidden) paintTrash();
    });
    trashToggle.setAttribute('aria-expanded', 'false');
    trashToggle.setAttribute('aria-controls', 'st-trash-panel');
    trashPanel.hidden = true;
    function paintTrash() {
      var labels = { days: 'Día', activities: 'Actividad', routines: 'Rutina', pages: 'Página', images: 'Imagen o dibujo', files: 'Adjunto' };
      M.trashItems().then(function (items) {
        if (!alive) return;
        MC.clear(trashList);
        trashEmpty.hidden = items.length > 0;
        emptyButton.hidden = items.length === 0;
        items.forEach(function (item) {
          var row = item.row;
          var title = item.store === 'days' ? D.longLabel(row.date) : (row.title || row.name || 'Sin título');
          var when = D.fromISO(row.deletedAt);
          var restore = action('arrow-left', 'Restaurar', function () {
            M.restoreTrash(item.store, item.id).then(function () { paintTrash(); trashToggle.focus(); c.toast('Volvió a tu cuaderno.'); });
          });
          var remove = action('trash', 'Borrar definitivamente', function () {
            c.confirm({ title: '¿Borrar definitivamente «' + title + '»?', text: 'Después no se puede recuperar desde este cuaderno.', confirm: 'Borrar definitivamente' }).then(function (ok) {
              if (ok) M.deleteForever(item.store, item.id).then(function () { paintTrash(); trashToggle.focus(); c.toast('Listo, salió de la papelera.'); });
            });
          });
          trashList.appendChild(h('li.trash-item',
            h('div', h('strong', labels[item.store] + ': ' + title),
              h('p.t-meta', when ? 'En la papelera desde el ' + D.longLabel(when) : 'En la papelera')),
            h('div.data-actions', restore, remove)));
        });
      });
    }

    // Con cuentas (etapa B, D37): quién tiene la sesión y un enlace a su cuenta. Sin cuentas no aparece.
    if (MC.cloud && MC.cloud.on && MC.cloud.person) {
      var who = h('p.t-text', 'Este cuaderno es de la persona con sesión en este dispositivo.');
      var showMe = function (me) { who.textContent = 'Entraste como ' + me.name + ' (' + me.username + ').'; };
      if (MC.cloud.me) showMe(MC.cloud.me);
      var offMe = MC.on('cloud:me', showMe);
      right.appendChild(c.section('Mi cuenta', [
        who,
        h('p.t-text', h('a', { href: MC.cloud.accountUrl }, 'Mi cuenta'), ': cambiar el PIN, avisos en este dispositivo y quién puede ver mi cuaderno.')
      ], { id: 'st-account' }));
      cleanups.push(offMe);
    }

    right.appendChild(c.section('Mis datos', [
      h('p.privacy.t-text', MC.icon('lock'), 'Tus páginas viven en este dispositivo. No se mandan a ningún lado. Por eso conviene hacer una copia de vez en cuando ♡'),
      h('h3.subhead', 'Copia de seguridad'),
      h('div.data-actions',
        action('download', 'Guardar una copia (.json)', function () { MC.backup.download().then(function () { c.toast('Copia guardada en tus descargas.'); M.getMeta('lastBackupAt').then(function (v) { lastBackup.textContent = 'Última copia: ' + D.longLabel(D.fromDate(new Date(v))); }); }); }, 'label-btn'),
        h('label.label-btn.label-btn--soft', { for: 'st-restore', tabindex: '0', role: 'button', on: { keydown: function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } } } }, MC.icon('upload'), 'Abrir una copia…'),
        fileInput),
      lastBackup,
      h('div.field', h('label', { for: 'st-every' }, 'Recordarme hacer una copia'), every),
      h('h3.subhead', 'Llevarme mi cuaderno'),
      h('div.data-actions',
        action('print', 'Imprimir mi cuaderno', function () { location.hash = MC.routes.print(); }, 'label-btn'),
        action('download', 'Texto (.txt)', function () { exportFile('txt'); }),
        action('download', 'Planilla (.xlsx)', function () { exportFile('xlsx'); }),
        action('download', 'Días (.csv)', function () { exportFile('csv-dias'); }),
        action('download', 'Actividades (.csv)', function () { exportFile('csv-act'); })),
      h('h3.subhead', 'Papelera'), trashToggle, trashPanel,
      h('div.danger-zone', action('trash', 'Borrar todo el cuaderno', wipeFlow, 'text-btn'))
    ], { id: 'st-data' }));

    if (MC.pwa) { var inst = MC.pwa.installSection(); if (inst) right.appendChild(inst); }

    var about = h('p.t-meta.about');
    about.textContent = 'MI CUADERNO ' + VERSION + ' · guardado en ' + (MC.store.kind() === 'indexeddb' ? 'este navegador' : 'memoria (temporal)');
    right.appendChild(about);

    return { destroy: function () { alive = false; offSettings(); cleanups.forEach(function (f) { f(); }); note = null; } };
  }

  MC.views = MC.views || {};
  MC.views.settings = {
    render: render,
    VERSION: VERSION,
    exportFile: exportFile
  };
})(typeof window !== 'undefined' ? window : globalThis);
