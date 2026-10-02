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

  /* ---------- Medición de almacenamiento (DA4) ---------- */
  var LARGE_THRESHOLD = 5 * 1024 * 1024; // 5 MB
  // Fotos, dibujos y adjuntos viajan como data URL (base64) dentro de la copia .json: con 4 MB de eso
  // la descarga ya pesa y tarda aunque haya poco texto, así que el aviso aparece antes del total de 5 MB.
  var MEDIA_LARGE_THRESHOLD = 4 * 1024 * 1024;
  var DATA_URL = /^data:/;

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

  /** Tamaño aproximado de un registro en JSON. Los data URL (ASCII) se cuentan por su largo, sin copiarlos. */
  function itemBytes(item) {
    if (item == null) return 0;
    if (typeof item === 'string') return utf8Bytes(item);
    var bytes = 0, rest = {};
    Object.keys(item).forEach(function (k) {
      var v = item[k];
      if (typeof v === 'string' && DATA_URL.test(v)) bytes += k.length + v.length + 6; // "k":"v",
      else rest[k] = v;
    });
    try { return bytes + utf8Bytes(JSON.stringify(rest)); } catch (e) { return bytes; }
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

  function isAudio(f) {
    return !!f && ((typeof f.type === 'string' && f.type.toLowerCase().indexOf('audio/') === 0) || (typeof f.name === 'string' && /\.(mp3|m4a|wav|ogg|aac|flac)$/i.test(f.name)));
  }

  /**
   * Cuenta registro por registro, sin guardarlos: se le pasan los de un store y se pueden soltar.
   * add(store, registro) con store = meta | days | activities | routines | pages | images | files.
   */
  function storageTally() {
    var cats = { texto: [0, 0], fotos: [0, 0], audio: [0, 0], dibujos: [0, 0], otros: [0, 0] };
    var counts = { dias: 0, actividades: 0, rutinas: 0, paginas: 0 };
    var trashCount = 0;
    var COUNT = { days: 'dias', activities: 'actividades', routines: 'rutinas', pages: 'paginas' };
    function put(cat, bytes) { cats[cat][0] += bytes; cats[cat][1]++; }
    return {
      add: function (store, r) {
        if (r == null) return;
        if (store !== 'meta' && M.isDeleted(r)) trashCount++;
        var bytes = itemBytes(r);
        if (store === 'images') put(r.kind === 'drawing' ? 'dibujos' : 'fotos', bytes);
        else if (store === 'files') put(isAudio(r) ? 'audio' : 'otros', bytes);
        else { cats.texto[0] += bytes; if (COUNT[store]) counts[COUNT[store]]++; }
      },
      result: function (estimate, options) {
        options = options || {};
        var largeThreshold = options.largeThreshold || LARGE_THRESHOLD;
        var mediaThreshold = options.mediaThreshold || MEDIA_LARGE_THRESHOLD;
        var LABELS = { texto: 'Texto', fotos: 'Fotos', audio: 'Audio', dibujos: 'Dibujos', otros: 'Otros' };
        var breakdown = {}, total = 0;
        Object.keys(cats).forEach(function (k) {
          total += cats[k][0];
          breakdown[k] = { bytes: cats[k][0], formatted: formatSize(cats[k][0]), count: cats[k][1], label: LABELS[k] };
        });
        breakdown.texto.count = counts.dias + counts.actividades + counts.rutinas + counts.paginas;
        var mediaBytes = total - cats.texto[0];
        var originUsage = (estimate && estimate.usage != null) ? estimate.usage : null;
        var originQuota = (estimate && estimate.quota != null) ? estimate.quota : null;
        return {
          total: total,
          trashCount: trashCount,
          formattedTotal: formatSize(total),
          breakdown: breakdown,
          counts: {
            dias: counts.dias, actividades: counts.actividades, rutinas: counts.rutinas, paginas: counts.paginas,
            fotos: cats.fotos[1], audio: cats.audio[1], dibujos: cats.dibujos[1], otros: cats.otros[1]
          },
          isLarge: total >= largeThreshold || mediaBytes >= mediaThreshold,
          largeThreshold: largeThreshold,
          originUsage: originUsage,
          originQuota: originQuota,
          formattedOriginUsage: originUsage != null ? formatSize(originUsage) : null
        };
      }
    };
  }

  /** Mide un cuaderno ya cargado (la forma de M.everything()). Lógica pura, cubierta por tests. */
  function measureStorage(all, estimate, options) {
    all = all || {};
    var t = storageTally();
    if (all.meta && typeof all.meta === 'object' && Object.keys(all.meta).length) t.add('meta', all.meta);
    ['days', 'activities', 'routines', 'pages', 'images', 'files'].forEach(function (s) {
      (all[s] || []).forEach(function (r) { t.add(s, r); });
    });
    return t.result(estimate, options);
  }

  /*
   * En la app se mide de a un store por vez (sin juntar todo el cuaderno con sus data URL en memoria),
   * las imágenes también se leen del store para contar las que están en papelera, y el resultado se guarda hasta el próximo
   * cambio: volver a Ajustes sin haber tocado nada no vuelve a leer nada.
   */
  var storageCache = null;
  function forgetStorage() { storageCache = null; }
  MC.on('store:changed', forgetStorage);
  MC.on('store:remote', forgetStorage);

  function collectStorage() {
    if (storageCache) return storageCache;
    var S = MC.store, t = storageTally();
    var estimateP = (root.navigator && navigator.storage && navigator.storage.estimate)
      ? navigator.storage.estimate().catch(function () { return null; })
      : Promise.resolve(null);
    var chain = S.getAll('meta').then(function (rows) { rows.forEach(function (r) { t.add('meta', r); }); });
    ['days', 'activities', 'routines', 'pages', 'files', 'images'].forEach(function (s) {
      chain = chain.then(function () { return S.getAll(s); }).then(function (rows) { rows.forEach(function (r) { t.add(s, r); }); });
    });
    var p = storageCache = Promise.all([chain, estimateP]).then(function (res) { return t.result(res[1]); });
    p.catch(function () { if (storageCache === p) storageCache = null; });
    return p;
  }

  function countDueTrash(items, days, now) {
    if (days === 0) return 0;
    var time = now == null ? Date.now() : (typeof now === 'number' ? now : Date.parse(now));
    return items.filter(function (item) { return time - Date.parse(item.row.deletedAt) > days * 86400000; }).length;
  }

  function render(main) {
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
    var moodInputs = h('ul.mood-names');
    s.moodLabels.forEach(function (l, i) {
      var inp = h('input.input', { type: 'text', value: l, maxlength: 24, 'aria-label': 'Nombre del ánimo ' + (i + 1) });
      inp.addEventListener('change', function () {
        var labels = MC.$$('input', moodInputs).map(function (x) { return x.value; });
        save({ moodLabels: labels });
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
    every.addEventListener('change', function () { save({ backupEveryDays: +every.value }); });
    var lastBackup = h('p.t-meta');
    M.getMeta('lastBackupAt', null).then(function (v) { lastBackup.textContent = D.fromISO(v) ? 'Última copia: ' + D.longLabel(D.fromISO(v)) : 'Todavía no guardaste ninguna copia.'; });

    // Cuánto ocupa mi cuaderno (DA4). Se mide recién cuando el bloque se ve (en el celular queda más abajo).
    // Solo el total es región viva: el desglose no se lee entero cada vez que se abre Ajustes.
    var storageTotal = h('p.t-meta.storage-total', { 'aria-live': 'polite' }, 'Calculando cuánto ocupa tu cuaderno…');
    var storageDetail = h('div.storage-detail');
    var storageBox = h('div.storage-info', storageTotal, storageDetail);

    function renderStorageBreakdown(data) {
      storageTotal.className = 't-text storage-total';
      storageTotal.textContent = '';
      storageTotal.append('Tu cuaderno ocupa aprox. ', h('strong.num', data.formattedTotal), ' en datos guardados.');
      if (data.trashCount) storageTotal.append(' Incluye ' + data.trashCount + ' ' + (data.trashCount === 1 ? 'elemento' : 'elementos') + ' en la papelera.');

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
        var dt = detailText(catKey);
        return h('li.storage-row', { dataset: { cat: catKey } },
          h('span.storage-row__name', MC.icon(icon), h('span.storage-row__label', label), dt ? h('span.t-meta', '(' + dt + ')') : null),
          h('span.num.storage-row__size', data.breakdown[catKey].formatted));
      }

      MC.clear(storageDetail);
      storageDetail.appendChild(h('ul.storage-list',
        row('text', 'Texto', 'texto'),
        row('sticker', 'Fotos', 'fotos'),
        row('play', 'Audio', 'audio'),
        row('edit', 'Dibujos', 'dibujos'),
        row('box', 'Otros', 'otros')));

      // Aviso sobre estimación del navegador vs datos del cuaderno
      if (data.originUsage != null) {
        storageDetail.appendChild(h('p.t-meta.storage-note',
          'El navegador estima aprox. ' + data.formattedOriginUsage + ' para este sitio (incluyendo la aplicación y la memoria en caché).'));
      }

      // Aviso de copia grande si supera el umbral
      if (data.isLarge) {
        storageDetail.appendChild(h('div.slip.slip--butter.storage-large',
          h('p', 'Tu cuaderno es grande y tiene páginas, imágenes o archivos: la copia de seguridad (.json) puede ser pesada y tardar un momento en descargarse ♡')));
      }
    }

    var storageAlive = true;
    function measureNow() {
      collectStorage().then(function (data) { if (storageAlive) renderStorageBreakdown(data); }).catch(function (err) {
        console.warn('[MI CUADERNO] No se pudo calcular el espacio:', err);
        if (storageAlive) storageTotal.textContent = 'Espacio: guardado localmente en este dispositivo.';
      });
    }
    var storageSeen = null;
    if (typeof IntersectionObserver === 'function') {
      storageSeen = new IntersectionObserver(function (entries) {
        if (!entries.some(function (e) { return e.isIntersecting; })) return;
        storageSeen.disconnect();
        storageSeen = null;
        measureNow();
      });
      storageSeen.observe(storageBox);
    } else {
      measureNow();
    }
    function stopStorage() {
      storageAlive = false;
      if (storageSeen) { storageSeen.disconnect(); storageSeen = null; }
    }

    function action(icon, label, fn, cls) {
      var b = h('button.' + (cls || 'label-btn.label-btn--soft'), { type: 'button' }, MC.icon(icon), label);
      b.addEventListener('click', fn);
      return b;
    }

    // Papelera (DA1): se abre solo cuando la persona quiere verla.
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
              var count = countDueTrash(items, chosen);
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
        if (!storageAlive) return;
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
      h('h3.subhead', 'Papelera'), trashToggle, trashPanel,
      h('div.danger-zone', action('trash', 'Borrar todo el cuaderno', wipeFlow, 'text-btn'))
    ], { id: 'st-data' }));

    if (MC.pwa) { var inst = MC.pwa.installSection(); if (inst) right.appendChild(inst); }

    var about = h('p.t-meta.about');
    about.textContent = 'MI CUADERNO ' + VERSION + ' · guardado en ' + (MC.store.kind() === 'indexeddb' ? 'este navegador' : 'memoria (temporal)');
    right.appendChild(about);

    return { destroy: function () { stopStorage(); offSettings(); note = null; } };
  }

  MC.views = MC.views || {};
  MC.views.settings = {
    render: render,
    VERSION: VERSION,
    exportFile: exportFile,
    measureStorage: measureStorage,
    collectStorage: collectStorage,
    countDueTrash: countDueTrash,
    formatSize: formatSize,
    LARGE_THRESHOLD: LARGE_THRESHOLD,
    MEDIA_LARGE_THRESHOLD: MEDIA_LARGE_THRESHOLD
  };
})(typeof window !== 'undefined' ? window : globalThis);
