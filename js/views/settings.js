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

  /* ---------- Medición de almacenamiento (DA4) ---------- */
  var LARGE_THRESHOLD = 5 * 1024 * 1024; // 5 MB

  function utf8Bytes(str) {
    if (!str) return 0;
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(str).length;
    var b = 0;
    for (var i = 0; i < str.length; i++) {
      var ch = str.charCodeAt(i);
      if (ch < 0x80) b += 1;
      else if (ch < 0x800) b += 2;
      else if (ch >= 0xd800 && ch <= 0xdbff) { b += 4; i++; }
      else b += 3;
    }
    return b;
  }

  function itemBytes(item) {
    if (item == null) return 0;
    try {
      return utf8Bytes(typeof item === 'string' ? item : JSON.stringify(item));
    } catch (e) {
      return 0;
    }
  }

  function formatSize(bytes) {
    if (bytes == null || isNaN(bytes) || bytes <= 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) {
      var kb = bytes / 1024;
      var strKb = (kb < 10 ? kb.toFixed(1) : Math.round(kb).toString()).replace('.0', '').replace('.', ',');
      return strKb + ' KB';
    }
    var mb = bytes / (1024 * 1024);
    var strMb = (mb < 100 ? mb.toFixed(1) : Math.round(mb).toString()).replace('.0', '').replace('.', ',');
    return strMb + ' MB';
  }

  function measureStorage(all, estimate, options) {
    options = options || {};
    var largeThreshold = options.largeThreshold || LARGE_THRESHOLD;
    all = all || {};

    var days = all.days || [];
    var activities = all.activities || [];
    var routines = all.routines || [];
    var pages = all.pages || [];
    var images = all.images || [];
    var files = all.files || [];

    // Texto: meta, días, actividades, rutinas, páginas
    var textoBytes = (all.meta && typeof all.meta === 'object' && Object.keys(all.meta).length) ? itemBytes(all.meta) : 0;
    for (var i = 0; i < days.length; i++) textoBytes += itemBytes(days[i]);
    for (var j = 0; j < activities.length; j++) textoBytes += itemBytes(activities[j]);
    for (var k = 0; k < routines.length; k++) textoBytes += itemBytes(routines[k]);
    for (var l = 0; l < pages.length; l++) textoBytes += itemBytes(pages[l]);

    // Fotos vs Dibujos
    var fotosBytes = 0;
    var fotosCount = 0;
    var dibujosBytes = 0;
    var dibujosCount = 0;
    for (var m = 0; m < images.length; m++) {
      var img = images[m];
      var sz = itemBytes(img);
      if (img && img.kind === 'drawing') {
        dibujosBytes += sz;
        dibujosCount++;
      } else {
        fotosBytes += sz;
        fotosCount++;
      }
    }

    // Audio vs Otros (archivos adjuntos)
    var audioBytes = 0;
    var audioCount = 0;
    var otrosBytes = 0;
    var otrosCount = 0;
    for (var n = 0; n < files.length; n++) {
      var f = files[n];
      var fSz = itemBytes(f);
      var isAudio = f && ((typeof f.type === 'string' && f.type.toLowerCase().indexOf('audio/') === 0) || (typeof f.name === 'string' && /\.(mp3|m4a|wav|ogg|aac|flac)$/i.test(f.name)));
      if (isAudio) {
        audioBytes += fSz;
        audioCount++;
      } else {
        otrosBytes += fSz;
        otrosCount++;
      }
    }

    var totalNotebookBytes = textoBytes + fotosBytes + audioBytes + dibujosBytes + otrosBytes;
    var originUsage = (estimate && estimate.usage != null) ? estimate.usage : null;
    var originQuota = (estimate && estimate.quota != null) ? estimate.quota : null;

    var mediaBytes = fotosBytes + audioBytes + dibujosBytes + otrosBytes;
    var isLarge = totalNotebookBytes >= largeThreshold || mediaBytes >= 4 * 1024 * 1024;

    return {
      total: totalNotebookBytes,
      formattedTotal: formatSize(totalNotebookBytes),
      breakdown: {
        texto: {
          bytes: textoBytes,
          formatted: formatSize(textoBytes),
          count: days.length + activities.length + routines.length + pages.length,
          label: 'Texto'
        },
        fotos: {
          bytes: fotosBytes,
          formatted: formatSize(fotosBytes),
          count: fotosCount,
          label: 'Fotos'
        },
        audio: {
          bytes: audioBytes,
          formatted: formatSize(audioBytes),
          count: audioCount,
          label: 'Audio'
        },
        dibujos: {
          bytes: dibujosBytes,
          formatted: formatSize(dibujosBytes),
          count: dibujosCount,
          label: 'Dibujos'
        },
        otros: {
          bytes: otrosBytes,
          formatted: formatSize(otrosBytes),
          count: otrosCount,
          label: 'Otros'
        }
      },
      counts: {
        dias: days.length,
        actividades: activities.length,
        rutinas: routines.length,
        paginas: pages.length,
        fotos: fotosCount,
        audio: audioCount,
        dibujos: dibujosCount,
        otros: otrosCount
      },
      isLarge: isLarge,
      largeThreshold: largeThreshold,
      originUsage: originUsage,
      originQuota: originQuota,
      formattedOriginUsage: originUsage != null ? formatSize(originUsage) : null
    };
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
      moodInputs.appendChild(h('li', c.moodMark(i + 1), inp));
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
    every.addEventListener('change', function () { save({ backupEveryDays: +every.value }, 'Guardado.'); });
    var lastBackup = h('p.t-meta');
    M.getMeta('lastBackupAt', null).then(function (v) { lastBackup.textContent = D.fromISO(v) ? 'Última copia: ' + D.longLabel(D.fromISO(v)) : 'Todavía no guardaste ninguna copia.'; });

    // Bloque de cuánto ocupa mi cuaderno (DA4)
    var storageBox = h('div.storage-info', { 'aria-live': 'polite' });
    storageBox.appendChild(h('p.t-meta', 'Calculando cuánto ocupa tu cuaderno…'));

    function renderStorageBreakdown(data) {
      storageBox.innerHTML = '';

      var totalText = h('p.t-text', { style: { margin: '0 0 var(--s-3)' } },
        'Tu cuaderno ocupa aprox. ',
        h('strong.num', data.formattedTotal),
        ' en datos guardados.'
      );

      function detailText(cat) {
        if (cat === 'texto') {
          var parts = [];
          if (data.counts.dias) parts.push(data.counts.dias + ' ' + (data.counts.dias === 1 ? 'día' : 'días'));
          if (data.counts.paginas) parts.push(data.counts.paginas + ' ' + (data.counts.paginas === 1 ? 'página' : 'páginas'));
          if (!parts.length) return 'días, páginas, rutinas';
          return parts.join(', ');
        }
        if (cat === 'fotos') {
          return data.counts.fotos === 0 ? 'ninguna' : (data.counts.fotos + ' ' + (data.counts.fotos === 1 ? 'foto' : 'fotos'));
        }
        if (cat === 'audio') {
          return data.counts.audio === 0 ? 'ninguno' : (data.counts.audio + ' ' + (data.counts.audio === 1 ? 'audio' : 'audios'));
        }
        if (cat === 'dibujos') {
          return data.counts.dibujos === 0 ? 'ninguno' : (data.counts.dibujos + ' ' + (data.counts.dibujos === 1 ? 'dibujo' : 'dibujos'));
        }
        if (cat === 'otros') {
          return data.counts.otros === 0 ? 'ninguno' : (data.counts.otros + ' ' + (data.counts.otros === 1 ? 'adjunto' : 'adjuntos'));
        }
        return '';
      }

      function row(icon, label, catKey) {
        var cat = data.breakdown[catKey];
        var dt = detailText(catKey);
        return h('li.storage-row', {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 0',
            borderBottom: '1px dashed var(--rule)',
            fontSize: 'var(--fs-sm, 0.9375rem)'
          }
        },
          h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
            MC.icon(icon),
            h('span', { style: { fontWeight: '500' } }, label),
            dt ? h('span.t-meta', '(' + dt + ')') : null
          ),
          h('span.num', { style: { fontWeight: '600' } }, cat.formatted)
        );
      }

      var list = h('ul.storage-list', { style: { listStyle: 'none', margin: '0 0 var(--s-3)', padding: 0 } },
        row('text', 'Texto', 'texto'),
        row('sticker', 'Fotos', 'fotos'),
        row('play', 'Audio', 'audio'),
        row('edit', 'Dibujos', 'dibujos'),
        row('box', 'Otros', 'otros')
      );

      storageBox.appendChild(totalText);
      storageBox.appendChild(list);

      // Aviso sobre estimación del navegador vs datos del cuaderno
      if (data.originUsage != null) {
        var originNote = h('p.t-meta', { style: { margin: 'var(--s-2) 0' } },
          'El navegador estima aprox. ' + data.formattedOriginUsage + ' para este sitio (incluyendo la aplicación y la memoria en caché).'
        );
        storageBox.appendChild(originNote);
      }

      // Aviso de copia grande si supera el umbral
      if (data.isLarge) {
        var largeSlip = h('div.slip.slip--butter', { style: { margin: 'var(--s-3) 0' } },
          h('p', 'Tu cuaderno es grande y tiene páginas, imágenes o archivos: la copia de seguridad (.json) puede ser pesada y tardar un momento en descargarse ♡')
        );
        storageBox.appendChild(largeSlip);
      }
    }

    var estimateP = (navigator.storage && navigator.storage.estimate)
      ? navigator.storage.estimate().catch(function () { return null; })
      : Promise.resolve(null);

    Promise.all([M.everything(), estimateP]).then(function (res) {
      var all = res[0];
      var est = res[1];
      var data = measureStorage(all, est);
      renderStorageBreakdown(data);
    }).catch(function (err) {
      console.warn('[MI CUADERNO] No se pudo calcular el espacio:', err);
      storageBox.textContent = 'Espacio: guardado localmente en este dispositivo.';
    });

    function action(icon, label, fn, cls) {
      var b = h('button.' + (cls || 'label-btn.label-btn--soft'), { type: 'button' }, MC.icon(icon), label);
      b.addEventListener('click', fn);
      return b;
    }

    right.appendChild(c.section('Mis datos', [
      h('p.privacy.t-text', MC.icon('lock'), 'Tus páginas viven en este dispositivo. No se mandan a ningún lado. Por eso conviene hacer una copia de vez en cuando ♡'),
      h('h3.subhead', 'Cuánto ocupa mi cuaderno'),
      storageBox,
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
      h('div.danger-zone', action('trash', 'Borrar todo el cuaderno', wipeFlow, 'text-btn'))
    ], { id: 'st-data' }));

    if (MC.pwa) { var inst = MC.pwa.installSection(); if (inst) right.appendChild(inst); }

    var about = h('p.t-meta.about');
    about.textContent = 'MI CUADERNO ' + VERSION + ' · guardado en ' + (MC.store.kind() === 'indexeddb' ? 'este navegador' : 'memoria (temporal)');
    right.appendChild(about);

    return { destroy: function () {} };
  }

  MC.views = MC.views || {};
  MC.views.settings = {
    render: render,
    VERSION: VERSION,
    exportFile: exportFile,
    measureStorage: measureStorage,
    formatSize: formatSize,
    LARGE_THRESHOLD: LARGE_THRESHOLD
  };
  MC.measureStorage = measureStorage;
})(typeof window !== 'undefined' ? window : globalThis);
