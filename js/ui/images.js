/* Imágenes propias y adjuntos (DECISIONS D24).
   - Subir una imagen (PNG, JPG, WebP, GIF, SVG, AVIF… lo que el navegador sepa leer): se achica a 900 px,
     se pasa a WebP/PNG y queda en “Mis stickers” para pegarla en cualquier hoja.
   - Adjuntos: cualquier archivo guardado en un día o en una página, para abrirlo desde ahí. */
(function (root) {
  'use strict';
  var MC = root.MC;
  var h = MC.h, c = MC.c, M = MC.model;

  var MAX_SIDE = 900;
  var MAX_ATTACH = 10 * 1024 * 1024;

  /** Pide archivos con el selector del sistema → Promise<File[]> */
  function pickFiles(accept, multiple) {
    return new Promise(function (resolve) {
      var input = h('input', { type: 'file', accept: accept || null, multiple: !!multiple, hidden: true });
      input.addEventListener('change', function () { resolve(Array.prototype.slice.call(input.files || [])); input.remove(); });
      c.layer().appendChild(input);
      input.click();
    });
  }

  function decode(file) {
    // createImageBitmap entiende casi todo; si no está o falla (p. ej. SVG en algunos navegadores), <img>.
    var viaImg = function () {
      return new Promise(function (resolve, reject) {
        var url = URL.createObjectURL(file);
        var img = new Image();
        img.onload = function () { resolve({ src: img, w: img.naturalWidth || 400, h: img.naturalHeight || 400, done: function () { URL.revokeObjectURL(url); } }); };
        img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('formato')); };
        img.src = url;
      });
    };
    if (root.createImageBitmap && !/svg/i.test(file.type)) {
      return root.createImageBitmap(file).then(function (bmp) { return { src: bmp, w: bmp.width, h: bmp.height, done: function () { if (bmp.close) bmp.close(); } }; }, viaImg);
    }
    return viaImg();
  }

  /** Archivo de imagen → imagen propia guardada (rasterizada: nada de SVG ni scripts guardados). */
  function importImage(file) {
    return decode(file).then(function (d) {
      var scale = Math.min(1, MAX_SIDE / Math.max(d.w, d.h));
      var cv = document.createElement('canvas');
      cv.width = Math.max(1, Math.round(d.w * scale));
      cv.height = Math.max(1, Math.round(d.h * scale));
      cv.getContext('2d').drawImage(d.src, 0, 0, cv.width, cv.height);
      d.done();
      var src = cv.toDataURL('image/webp', 0.86);
      if (src.indexOf('data:image/webp') !== 0) src = cv.toDataURL('image/png');
      return M.saveImage({ kind: 'upload', name: (file.name || 'Imagen').replace(/\.[^.]+$/, ''), src: src, w: cv.width, h: cv.height });
    });
  }

  /** Elegir imágenes y guardarlas en “Mis stickers” → Promise<imagen[]> */
  function uploadStickers() {
    return pickFiles('image/*', true).then(function (files) {
      if (!files.length) return [];
      var saved = [];
      return files.reduce(function (p, f) {
        return p.then(function () {
          return importImage(f).then(function (img) { saved.push(img); }, function () {
            c.toast('No pude leer «' + f.name + '». Probá con PNG o JPG.');
          });
        });
      }, Promise.resolve()).then(function () {
        if (saved.length) c.toast(saved.length === 1 ? 'Quedó en Mis stickers.' : 'Quedaron ' + saved.length + ' en Mis stickers.');
        return saved;
      });
    });
  }

  /* ---------- Adjuntos ---------- */
  function readAsDataURL(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(r.result); };
      r.onerror = function () { reject(r.error); };
      r.readAsDataURL(file);
    });
  }

  function dataToBlob(data, type) {
    var i = data.indexOf(',');
    var bin = atob(data.slice(i + 1));
    var bytes = new Uint8Array(bin.length);
    for (var k = 0; k < bin.length; k++) bytes[k] = bin.charCodeAt(k);
    return new Blob([bytes], { type: type || 'application/octet-stream' });
  }

  function sizeLabel(n) {
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
    return (n / 1024 / 1024).toFixed(1).replace('.', ',') + ' MB';
  }

  var PREVIEW = /^image\/(png|jpeg|webp|gif|avif)$/;

  /**
   * Sección “Adjuntos” para un día (owner 'day:AAAA-MM-DD') o una página ('page:<id>').
   * opts: { title, onSticker(imagen) } — onSticker: una imagen adjunta se puede pegar como sticker.
   */
  function attachments(owner, opts) {
    opts = opts || {};
    var list = h('ul.attachments');
    var empty = h('p.section__hint', 'Fotos, entradas, un PDF, un audio… lo que quieras guardar con esta hoja.');
    var add = h('button.text-btn', { type: 'button' }, MC.icon('plus'), 'Adjuntar un archivo');
    var section = c.section(opts.title || 'Adjuntos', [empty, list, add], { id: MC.uid('adj'), className: 'section--attachments' });

    function load() {
      M.filesFor(owner).then(function (files) {
        MC.clear(list);
        empty.hidden = files.length > 0;
        files.forEach(function (f) { list.appendChild(row(f)); });
      });
    }

    function row(f) {
      var isImg = PREVIEW.test(f.type);
      var open = h('button.text-btn.attachment__open', { type: 'button', title: 'Descargar o abrir ' + f.name },
        isImg ? h('img.attachment__thumb', { src: f.data, alt: '' }) : MC.icon('download'),
        h('span.attachment__name', f.name), h('span.attachment__size', sizeLabel(f.size)));
      open.dataset.browse = '1';
      open.addEventListener('click', function () { if (isImg) c.imageViewer([{ src: f.data, name: f.name }], 0); else MC.download(f.name, dataToBlob(f.data, f.type), f.type); });
      var download = h('button.icon-btn', { type: 'button', 'aria-label': 'Descargar ' + f.name, dataset: { browse: '1' } }, MC.icon('download'));
      download.addEventListener('click', function () { MC.download(f.name, dataToBlob(f.data, f.type), f.type); });
      var more = [];
      if (isImg && opts.onSticker) {
        var st = h('button.icon-btn.icon-btn--sm', { type: 'button', 'aria-label': 'Usar «' + f.name + '» como sticker', title: 'Usar como sticker' }, MC.icon('sticker'));
        st.addEventListener('click', function () {
          importImage(new File([dataToBlob(f.data, f.type)], f.name, { type: f.type })).then(opts.onSticker, function () { c.toast('No pude usar esa imagen como sticker.'); });
        });
        more.push(st);
      }
      var del = h('button.icon-btn.icon-btn--sm', { type: 'button', 'aria-label': 'Sacar el adjunto ' + f.name }, MC.icon('trash'));
      del.addEventListener('click', function () {
        c.confirm({ title: '¿Sacar «' + f.name + '»?', text: 'Se va a la papelera. Podés recuperarlo desde Ajustes.', confirm: 'Sacar' }).then(function (ok) {
          if (!ok) return;
          M.deleteFile(f.id).then(function () { load(); c.toast('Se fue a la papelera.', { action: 'Deshacer', onAction: function () { M.restoreTrash('files', f.id).then(load); } }); });
        });
      });
      return h('li.attachment', open, more, download, del);
    }

    add.addEventListener('click', function () {
      pickFiles(null, true).then(function (files) {
        return files.reduce(function (p, file) {
          return p.then(function () {
            if (file.size > MAX_ATTACH) { c.toast('«' + file.name + '» pesa más de 10 MB: es mucho para guardar en el cuaderno.'); return; }
            return readAsDataURL(file).then(function (data) {
              return M.addFile({ owner: owner, name: file.name, type: file.type, size: file.size, data: data });
            }).catch(function () { c.toast('No se pudo guardar «' + file.name + '».'); });
          });
        }, Promise.resolve()).then(function () { if (files.length) load(); });
      });
    });

    load();
    return section;
  }

  MC.images = { pickFiles: pickFiles, importImage: importImage, uploadStickers: uploadStickers, attachments: attachments, dataToBlob: dataToBlob };
  MC.on('images:trashed', function (id) {
    c.toast('Se fue a la papelera.', { action: 'Deshacer', onAction: function () { M.restoreTrash('images', id); } });
    // Al cerrar el sobre, volver a dibujar la hoja: un img:<id> en papelera ya no tiene imagen.
    var stop = MC.on('dialog:closed', function () {
      if (document.querySelector('dialog[open]')) return;
      stop();
      if (MC.app && MC.app.refresh) MC.app.refresh();
    });
    if (!document.querySelector('dialog[open]')) { stop(); if (MC.app && MC.app.refresh) MC.app.refresh(); }
  });
})(window);
