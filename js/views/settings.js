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

  function save(patch, msg) {
    return M.saveSettings(patch).then(function () { if (msg) c.toast(msg); });
  }

  function checkRow(id, label, checked, onChange, hint) {
    var cb = h('input', { type: 'checkbox', id: id, checked: !!checked });
    cb.addEventListener('change', function () { onChange(cb.checked); });
    return h('li', h('label.check', { for: id }, cb, h('span', label, hint ? h('span.check__hint', hint) : null)));
  }

  /* ---------- Exportaciones ---------- */
  function exportFile(kind) {
    return M.everything().then(function (all) {
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
          h('p.t-text', 'Es ' + (s.name ? 'el cuaderno de ' + s.name : 'un cuaderno') + (s.exportedAt ? ', guardado el ' + D.longLabel(D.fromDate(new Date(s.exportedAt))) : '') + '.'),
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
              if (location.hash === '#/hoy') MC.app.refresh(); else location.hash = '#/hoy';
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
            location.hash = '#/bienvenida';
          });
        } }
      ]
    });
  }

  function render(main) {
    var s = MC.clone(M.settings());
    var left = h('section.page.page--margin.settings-page');
    var right = h('section.page.page--margin.settings-page');
    main.appendChild(h('div.spread', left, h('div.spine', { 'aria-hidden': 'true' }), right));

    left.appendChild(h('h1.t-display.settings-title', 'Ajustes'));

    // Vos
    var name = h('input.input', { id: 'st-name', type: 'text', value: s.name, maxlength: 40, autocomplete: 'given-name' });
    name.addEventListener('change', function () { save({ name: name.value.trim() }, 'Guardado.'); });
    var moodInputs = h('ul.mood-names');
    s.moodLabels.forEach(function (l, i) {
      var inp = h('input.input', { type: 'text', value: l, maxlength: 24, 'aria-label': 'Nombre del ánimo ' + (i + 1) });
      inp.addEventListener('change', function () {
        var labels = MC.$$('input', moodInputs).map(function (x) { return x.value; });
        save({ moodLabels: labels }, 'Nombres guardados.');
      });
      moodInputs.appendChild(h('li', h('span', { html: MC.stickers.miniPatchMarkup(i + 1) }), inp));
    });
    left.appendChild(c.section('Vos', [
      h('div.field', h('label', { for: 'st-name' }, 'Cómo querés que te llame'), name),
      h('div.field', h('span', 'Cómo se llaman tus ánimos'), moodInputs)
    ], { id: 'st-you' }));

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
        save({ motion: m });
      });
      motion.appendChild(b);
    });
    var motionExtras = h('ul.check-list',
      checkRow('st-scenes', 'Escenas ocasionales', s.scenes, function (on) { save({ scenes: on }); }, 'Una mariposa, un poco de vapor… muy de vez en cuando, nunca mientras escribís.'),
      checkRow('st-cover-show', 'Mostrar la tapa al abrir', s.showCover, function (on) { save({ showCover: on }); }));
    left.appendChild(c.section('Cómo se mueve', [motion, motionExtras],
      { id: 'st-motion', hint: MC.motion.systemReduced() ? 'Tu dispositivo pide menos movimiento; por eso empezamos en “Reducidas”.' : null }));

    // Recordatorios
    if (MC.notify) right.appendChild(MC.notify.settingsSection());

    // Mis datos
    var fileInput = h('input.sr-only', { type: 'file', accept: 'application/json,.json', id: 'st-restore', tabindex: '-1' });
    fileInput.addEventListener('change', function () { if (fileInput.files[0]) restoreFlow(fileInput.files[0]); fileInput.value = ''; });
    var every = h('select.select', { id: 'st-every' }, [[7, 'Cada semana'], [14, 'Cada dos semanas'], [30, 'Cada mes'], [0, 'No me recuerdes']].map(function (o) {
      return h('option', { value: o[0], selected: s.backupEveryDays === o[0] }, o[1]);
    }));
    every.addEventListener('change', function () { save({ backupEveryDays: +every.value }, 'Guardado.'); });
    var lastBackup = h('p.t-meta');
    M.getMeta('lastBackupAt', null).then(function (v) { lastBackup.textContent = v ? 'Última copia: ' + D.longLabel(D.fromDate(new Date(v))) : 'Todavía no guardaste ninguna copia.'; });

    function action(icon, label, fn, cls) {
      var b = h('button.' + (cls || 'label-btn.label-btn--soft'), { type: 'button' }, MC.icon(icon), label);
      b.addEventListener('click', fn);
      return b;
    }

    right.appendChild(c.section('Mis datos', [
      h('p.privacy.t-text', MC.icon('lock'), 'Tus páginas viven en este dispositivo. No se mandan a ningún lado. Por eso conviene hacer una copia de vez en cuando ♡'),
      h('div.data-actions',
        action('download', 'Guardar una copia (.json)', function () { MC.backup.download().then(function () { c.toast('Copia guardada en tus descargas.'); M.getMeta('lastBackupAt').then(function (v) { lastBackup.textContent = 'Última copia: ' + D.longLabel(D.fromDate(new Date(v))); }); }); }, 'label-btn'),
        h('label.label-btn.label-btn--soft', { for: 'st-restore', tabindex: '0', role: 'button', on: { keydown: function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } } } }, MC.icon('upload'), 'Abrir una copia…'),
        fileInput),
      lastBackup,
      h('div.field', h('label', { for: 'st-every' }, 'Recordarme hacer una copia'), every),
      h('h3.subhead', 'Llevarme mi cuaderno'),
      h('div.data-actions',
        action('print', 'Imprimir mi cuaderno', function () { location.hash = '#/imprimir'; }, 'label-btn'),
        action('download', 'Texto (.txt)', function () { exportFile('txt'); }),
        action('download', 'Planilla (.xlsx)', function () { exportFile('xlsx'); }),
        action('download', 'Días (.csv)', function () { exportFile('csv-dias'); }),
        action('download', 'Actividades (.csv)', function () { exportFile('csv-act'); })),
      h('div.danger-zone', action('trash', 'Borrar todo el cuaderno', wipeFlow, 'text-btn'))
    ], { id: 'st-data' }));

    if (MC.pwa) { var inst = MC.pwa.installSection(); if (inst) right.appendChild(inst); }

    var about = h('p.t-meta.about');
    about.textContent = 'MI CUADERNO ' + VERSION + ' · guardado en ' + (MC.store.kind() === 'indexeddb' ? 'este navegador' : 'memoria (temporal)');
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(function (e) {
        if (e && e.usage != null) about.textContent += ' · ocupa ' + (e.usage / 1024 / 1024).toFixed(1).replace('.', ',') + ' MB';
      }).catch(function () {});
    }
    right.appendChild(about);

    return { destroy: function () {} };
  }

  MC.views = MC.views || {};
  MC.views.settings = { render: render, VERSION: VERSION, exportFile: exportFile };
})(window);
