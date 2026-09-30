/* La tapa: tela, etiqueta, mariposa bordada, elástico. Se abre con un toque. */
(function (root) {
  'use strict';
  var MC = root.MC;
  var h = MC.h;

  // Mariposa bordada: alas con puntada satín (tramado) y contorno de hilo crema.
  var BUTTERFLY =
    '<svg class="cover__butterfly" viewBox="0 0 92 78" aria-hidden="true" focusable="false">' +
    '<defs>' +
    '<pattern id="satin-a" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="3" height="3" fill="#F4B9C6"/><path d="M0 .6h3" stroke="#D98FA1" stroke-width=".8"/></pattern>' +
    '<pattern id="satin-b" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><rect width="3" height="3" fill="#C9B8DE"/><path d="M0 .6h3" stroke="#A895C4" stroke-width=".8"/></pattern>' +
    '</defs>' +
    '<g stroke="#FFF9ED" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">' +
    '<path d="M44 36C35 17 16 8 9 18 3 27 16 39 44 40z" fill="url(#satin-a)"/>' +
    '<path d="M48 36C57 17 76 8 83 18 89 27 76 39 48 40z" fill="url(#satin-a)"/>' +
    '<path d="M44 42C31 43 19 52 24 61 28 69 40 62 45 48z" fill="url(#satin-b)"/>' +
    '<path d="M48 42C61 43 73 52 68 61 64 69 52 62 47 48z" fill="url(#satin-b)"/>' +
    '<path d="M46 30v34" stroke-width="4"/>' +
    '<path d="M45 30C43 22 39 17 35 16M47 30C49 22 53 17 57 16" fill="none" stroke-dasharray="2.5 2"/>' +
    '</g></svg>';

  function show(opts) {
    var s = MC.model.settings();
    var year = MC.dates.today().slice(0, 4);
    var opens = MC.ui.get('coverOpens', 0);
    var full = opens < 3 && MC.motion.allows('cover3d');
    var overlay = h('div.cover', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Tapa de MI CUADERNO' });
    var board = h('button.cover__board', { type: 'button', 'aria-label': 'Abrir mi cuaderno' },
      h('span.cover__elastic', { 'aria-hidden': 'true' }),
      h('span.cover__inner',
        h('span', { html: BUTTERFLY }),
        h('span.cover__label',
          h('span.cover__title', 'MI CUADERNO'),
          h('span.cover__tag', 'un lugarcito para mí ♡'),
          h('span.cover__meta', (s.name ? s.name + ' · ' : '') + year)),
        h('span.cover__hint', opts.firstTime ? 'Tocá la tapa para abrirlo' : 'Tocá para abrir')));
    overlay.appendChild(board);
    document.body.appendChild(overlay);
    document.getElementById('app').setAttribute('inert', '');
    board.focus({ preventScroll: true });

    var opened = false;
    function open() {
      if (opened) return;
      opened = true;
      MC.ui.set('coverOpens', opens + 1);
      var finish = function () {
        overlay.remove();
        document.getElementById('app').removeAttribute('inert');
        opts.onOpen();
        var pending = MC.pendingFocus && document.querySelector(MC.pendingFocus);
        MC.pendingFocus = null;
        if (pending) { pending.focus(); pending.scrollIntoView({ block: 'center' }); return; }
        var heading = document.getElementById('main').querySelector('h1');
        if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
      };
      if (!board.animate || !MC.motion.allows('fade')) { finish(); return; }
      if (full) {
        overlay.classList.add('cover--opening');
        var dur = MC.motion.duration('cover');
        setTimeout(function () {
          board.animate([
            { transform: 'rotateY(0deg)', opacity: 1 },
            { transform: 'rotateY(-104deg)', opacity: 0.9, offset: 0.85 },
            { transform: 'rotateY(-110deg)', opacity: 0 }
          ], { duration: dur, easing: 'cubic-bezier(0.77, 0, 0.175, 1)', fill: 'forwards' }).onfinish = finish;
        }, 180);
      } else {
        board.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(' + (MC.motion.allows('move') ? 1.02 : 1) + ')' }],
          { duration: 250, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'forwards' }).onfinish = finish;
      }
    }
    board.addEventListener('click', open);
    overlay.addEventListener('keydown', function (e) { if (e.key === 'Escape') open(); });
  }

  MC.views = MC.views || {};
  MC.views.cover = { show: show, BUTTERFLY: BUTTERFLY };
})(window);
