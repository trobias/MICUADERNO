/* Visor local inspirado en beui.dev/components/motion/image-viewer. */
(function (root) {
  'use strict';
  var MC = root.MC, h = MC.h, c = MC.c;
  /** Collage progresivo: como máximo 24 imágenes nuevas por toque, carga diferida. */
  c.photoAlbum = function (entries) {
    var photos = entries.filter(function (m) { return m.image; });
    if (!photos.length) return null;
    var drawn = 0, list = h('div.photo-collage');
    var more = h('button.text-btn', { type: 'button', dataset: { browse: '1' } }, 'Ver más fotos');
    var details = h('details.photo-album', h('summary', 'Ver fotos como álbum · ' + photos.length), list, more);
    function append() {
      var end = Math.min(drawn + 24, photos.length);
      for (; drawn < end; drawn++) (function (m, i) {
        var b = h('button.photo-collage__open', { type: 'button', 'aria-label': 'Ampliar ' + m.image.name, dataset: { browse: '1' } },
          h('img', { src: m.image.src, alt: m.image.name, width: m.image.w, height: m.image.h, loading: 'lazy', decoding: 'async' }));
        b.addEventListener('click', function () { c.imageViewer(photos.map(function (p) { return p.image; }), i); });
        list.appendChild(h('figure.photo-collage__item', b, h('figcaption', MC.dates.shortLabel(m.date), h('a', { href: m.page ? MC.routes.page(m.page) : MC.routes.day(m.date) }, m.text))));
      })(photos[drawn], drawn);
      more.hidden = drawn === photos.length;
    }
    details.addEventListener('toggle', function () { if (details.open && !drawn) append(); });
    more.addEventListener('click', append); return details;
  };
  c.imageViewer = function (images, initial) {
    images = (images || []).filter(function (im) { return im && /^data:image\/(png|jpeg|webp|gif|avif);base64,/.test(im.src); });
    if (!images.length) return null;
    var index = MC.clamp(initial || 0, 0, images.length - 1), zoom = 1, x = 0, y = 0, pointers = {}, start = null, pinch = null;
    var photo = h('img.image-viewer__photo', { draggable: false, decoding: 'async' });
    var stage = h('div.image-viewer__stage', { tabindex: '0', 'aria-label': 'Foto ampliada. Flechas para recorrer; más y menos para acercar.' }, photo);
    var count = h('p.t-meta', { role: 'status' });
    function button(icon, label, fn) { var b = h('button.icon-btn', { type: 'button', 'aria-label': label }, MC.icon(icon)); b.addEventListener('click', fn); return b; }
    var previous = button('arrow-left', 'Foto anterior', function () { show(index - 1); });
    var next = button('arrow-right', 'Foto siguiente', function () { show(index + 1); });
    var less = button('minus', 'Alejar foto', function () { setZoom(zoom - .5); });
    var more = button('plus', 'Acercar foto', function () { setZoom(zoom + .5); });
    var reset = h('button.text-btn', { type: 'button' }, 'Ver completa'); reset.addEventListener('click', function () { setZoom(1); });
    var thumbs = h('div.image-viewer__thumbs', { 'aria-label': 'Elegir una foto' });
    images.forEach(function (im, i) {
      var b = h('button.image-viewer__thumb', { type: 'button', 'aria-label': 'Ver foto ' + (i + 1) + ': ' + (im.name || 'Imagen') }, h('img', { src: im.src, alt: '', loading: 'lazy' }));
      b.addEventListener('click', function () { show(i); }); thumbs.appendChild(b);
    });
    var off = function () {};
    var dlg = c.dialog({ title: 'Fotos de mi cuaderno', bottom: false, className: 'image-viewer', content: [stage,
      h('div.image-viewer__tools', previous, count, next, less, more, reset), thumbs], onClose: function () { off(); pointers = {}; } });
    off = MC.on('route', function () { dlg.close(); });
    function paintZoom() { photo.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + zoom + ')'; less.disabled = zoom <= 1; more.disabled = zoom >= 4; }
    function setZoom(value) { zoom = MC.clamp(value, 1, 4); if (zoom === 1) x = y = 0; paintZoom(); }
    function show(i) {
      if (i < 0 || i >= images.length) return;
      index = i; zoom = 1; x = y = 0; photo.src = images[i].src; photo.alt = images[i].name || 'Imagen del cuaderno';
      count.textContent = (i + 1) + ' de ' + images.length + ' · ' + photo.alt;
      previous.disabled = i === 0; next.disabled = i === images.length - 1;
      MC.$$('button', thumbs).forEach(function (b, j) { b.setAttribute('aria-current', j === i ? 'true' : 'false'); }); paintZoom();
    }
    photo.addEventListener('error', function () { count.textContent = 'No se pudo mostrar esta foto. Podés volver a su hoja.'; });
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
      if (e.key === '+' || e.key === '=') { e.preventDefault(); setZoom(zoom + .5); }
      if (e.key === '-') { e.preventDefault(); setZoom(zoom - .5); }
    });
    stage.addEventListener('pointerdown', function (e) {
      pointers[e.pointerId] = [e.clientX, e.clientY]; stage.setPointerCapture(e.pointerId); var pts = Object.values(pointers);
      if (pts.length === 2) { pinch = { distance: Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]), zoom: zoom }; start = null; }
      else start = { px: e.clientX, py: e.clientY, x: x, y: y };
    });
    stage.addEventListener('pointermove', function (e) {
      if (!pointers[e.pointerId]) return;
      pointers[e.pointerId] = [e.clientX, e.clientY]; var pts = Object.values(pointers);
      if (pts.length === 2 && pinch && pinch.distance > 0) { setZoom(pinch.zoom * Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]) / pinch.distance); return; }
      if (start && zoom > 1) {
        x = MC.clamp(start.x + e.clientX - start.px, -stage.clientWidth * (zoom - 1) / 2, stage.clientWidth * (zoom - 1) / 2);
        y = MC.clamp(start.y + e.clientY - start.py, -stage.clientHeight * (zoom - 1) / 2, stage.clientHeight * (zoom - 1) / 2); paintZoom();
      }
    });
    function release(e) {
      if (start && zoom === 1 && e.type !== 'pointercancel' && Math.abs(e.clientX - start.px) > 50 && Math.abs(e.clientY - start.py) < 40) show(index + (e.clientX < start.px ? 1 : -1));
      delete pointers[e.pointerId]; start = null; pinch = null;
    }
    stage.addEventListener('pointerup', release); stage.addEventListener('pointercancel', release);
    show(index); return dlg;
  };
})(window);
