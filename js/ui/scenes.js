/* Escenas ocasionales (D33, A10): frecuentes pero nunca mientras se escribe, una a la vez, ≤ 8 s, en el margen
   y nunca sobre el texto. Primera entre 12 y 25 s; después cada 1–2,5 min (Completas) o 3–5 min (Suaves).
   Solo transform, opacity y stroke-dashoffset. Ver DESIGN §13. */
(function (root) {
  'use strict';
  var MC = root.MC;
  var h = MC.h;

  var layer = null;
  var timer = null;
  var running = null;       // { anims: [], el }
  var lastTyping = 0;
  var lastScene = null;
  var dialogs = 0;
  var decorating = false;
  var started = false;

  function rand(a, b) { return a + Math.random() * (b - a); }

  function enabled() {
    var s = MC.model.settings();
    return s.scenes && MC.motion.allows('scenes') && MC.motion.level() !== 'reducidas';
  }

  function canPlay() {
    if (!enabled() || document.hidden || running || dialogs > 0 || decorating) return false;
    if (typeof document.hasFocus === 'function' && !document.hasFocus()) return false;
    var a = document.activeElement;
    if (a && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && /text|search|number|date|time/.test(a.type)))) return false;
    if (Date.now() - lastTyping < 12000) return false;
    if (document.querySelector('.cover, .onboard, .print-page')) return false;
    return true;
  }

  /** Cuánto esperar (ms): la primera, 12–25 s; después 1–2,5 min en Completas y 3–5 min en Suaves (D33). */
  function delay(first, level, r) {
    if (first) return (12 + r * 13) * 1000;
    return level === 'completas' ? (60 + r * 90) * 1000 : (180 + r * 120) * 1000;
  }

  function schedule(first) {
    clearTimeout(timer);
    if (!enabled()) return;
    timer = setTimeout(tick, delay(first, MC.motion.level(), Math.random()));
  }

  function tick() {
    if (!canPlay()) { clearTimeout(timer); timer = setTimeout(tick, rand(15, 30) * 1000); return; }
    play(pick());
  }

  function pick() {
    var hr = new Date().getHours();
    // Por hora del día: de mañana luz y hojas; de tarde viento y lluvia; de noche té, lámpara y bordado.
    var pool = hr >= 5 && hr < 12 ? ['mariposa', 'hojas', 'nubes', 'flor', 'bordado', 'esquina']
      : hr >= 12 && hr < 19 ? ['mariposa', 'nubes', 'flor', 'esquina', 'lluvia', 'bordado']
        : ['te', 'lampara', 'mariposa', 'bordado', 'esquina', 'lluvia'];
    pool = pool.filter(function (s) { return s !== lastScene; });
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function currentLayer() {
    var panel = document.getElementById('panel');
    return panel && panel.open ? document.getElementById('panel-scene-layer') : document.getElementById('scene-layer');
  }

  function pageRect() {
    var panel = document.getElementById('panel');
    var pages = MC.$$(panel && panel.open ? '#panel .page' : '#main .page');
    var p = pages[pages.length - 1];
    return p ? p.getBoundingClientRect() : null;
  }

  function stop() {
    if (!running) return;
    running.anims.forEach(function (a) { try { a.cancel(); } catch (e) { /* noop */ } });
    if (running.el) running.el.remove();
    running = null;
  }

  function finish(name) {
    if (running && running.el) running.el.remove();
    running = null;
    lastScene = name;
    schedule(false);
  }

  var SCENES = {
    mariposa: function (r) {
      var el = h('div.scene.scene-butterfly', { html: MC.stickers.markup('mariposa') });
      el.style.width = '46px'; el.style.height = '46px';
      layer.appendChild(el);
      var restX = r.right - 58, restY = Math.max(8, r.top + 18);
      var startX = window.innerWidth + 40, startY = restY + rand(60, 140);
      var wings = el.querySelector('svg').animate(
        [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0.55)' }, { transform: 'scaleX(1)' }],
        { duration: 260, iterations: 14, easing: 'ease-in-out' });
      var path = el.animate([
        { transform: 'translate(' + startX + 'px,' + startY + 'px) rotate(-14deg)', opacity: 0 },
        { transform: 'translate(' + (restX + 90) + 'px,' + (restY + 40) + 'px) rotate(-8deg)', opacity: 1, offset: 0.3 },
        { transform: 'translate(' + restX + 'px,' + restY + 'px) rotate(10deg)', opacity: 1, offset: 0.48 },
        { transform: 'translate(' + restX + 'px,' + restY + 'px) rotate(10deg)', opacity: 1, offset: 0.78 },
        { transform: 'translate(' + (restX + 30) + 'px,' + (restY - 120) + 'px) rotate(-6deg)', opacity: 0 }
      ], { duration: 7600, easing: 'cubic-bezier(0.45, 0, 0.35, 1)', fill: 'both' });
      return { el: el, anims: [wings, path], done: path };
    },
    te: function (r) {
      var x = r.left + 22, y = r.bottom - 96;
      var el = h('div.scene.scene-tea', { html: MC.stickers.markup('taza') + '<svg class="steam" viewBox="0 0 60 60"><g fill="none" class="scene-steam" stroke-width="2" stroke-linecap="round"><path pathLength="1" d="M20 58c-6-8 6-12 0-22s4-14 0-22"/><path pathLength="1" d="M31 58c-6-8 6-12 0-22s4-14 0-22"/><path pathLength="1" d="M42 58c-6-8 6-12 0-22s4-14 0-22"/></g></svg>' });
      el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      layer.appendChild(el);
      var fade = el.animate([{ opacity: 0 }, { opacity: 1, offset: 0.12 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], { duration: 7000, fill: 'both' });
      var steam = MC.$$('.steam path', el).map(function (p, i) {
        return p.animate([{ strokeDasharray: '0.3 1', strokeDashoffset: 0.3, opacity: 0, transform: 'translateY(6px)' },
          { strokeDasharray: '0.3 1', strokeDashoffset: -0.7, opacity: 0.9, offset: 0.5 },
          { strokeDasharray: '0.3 1', strokeDashoffset: -1, opacity: 0, transform: 'translateY(-10px)' }],
          { duration: 2600, delay: 600 + i * 450, iterations: 2, easing: 'ease-out', fill: 'both' });
      });
      return { el: el, anims: [fade].concat(steam), done: fade };
    },
    hojas: function (r) {
      var el = h('div.scene.scene-leaves', { html: '<svg viewBox="0 0 220 140"><g class="scene-leaf" opacity=".07"><path d="M10 130C60 90 110 60 210 10" class="scene-leaf__stem" stroke-width="3" fill="none"/><ellipse cx="60" cy="98" rx="10" ry="22" transform="rotate(-55 60 98)"/><ellipse cx="88" cy="96" rx="10" ry="22" transform="rotate(30 88 96)"/><ellipse cx="110" cy="66" rx="9" ry="20" transform="rotate(-50 110 66)"/><ellipse cx="140" cy="64" rx="9" ry="20" transform="rotate(35 140 64)"/><ellipse cx="164" cy="38" rx="8" ry="18" transform="rotate(-45 164 38)"/></g></svg>' });
      var x = r.right - 250, y = r.top + 70;
      el.style.width = '220px';
      layer.appendChild(el);
      var a = el.animate([
        { transform: 'translate(' + x + 'px,' + y + 'px) rotate(0deg)', opacity: 0 },
        { transform: 'translate(' + (x - 20) + 'px,' + (y + 6) + 'px) rotate(-2deg)', opacity: 1, offset: 0.3 },
        { transform: 'translate(' + (x - 50) + 'px,' + (y + 12) + 'px) rotate(1deg)', opacity: 1, offset: 0.75 },
        { transform: 'translate(' + (x - 70) + 'px,' + (y + 14) + 'px) rotate(0deg)', opacity: 0 }
      ], { duration: 8000, easing: 'ease-in-out', fill: 'both' });
      return { el: el, anims: [a], done: a };
    },
    nubes: function (r) {
      var el = h('div.scene.scene-clouds', { html: '<span class="cloud c1">' + MC.stickers.markup('nube') + '</span><span class="cloud c2">' + MC.stickers.markup('nube') + '</span>' });
      layer.appendChild(el);
      var top = Math.max(4, r.top - 34);
      var clouds = MC.$$('.cloud', el);
      var anims = clouds.map(function (cl, i) {
        var y = top + i * 10;
        var from = r.left - 80 + i * 160, to = from + 180;
        return cl.animate([
          { transform: 'translate(' + from + 'px,' + y + 'px)', opacity: 0 },
          { opacity: 0.9, offset: 0.2 }, { opacity: 0.9, offset: 0.8 },
          { transform: 'translate(' + to + 'px,' + y + 'px)', opacity: 0 }
        ], { duration: 8000 + i * 600, easing: 'linear', fill: 'both' });
      });
      return { el: el, anims: anims, done: anims[1] };
    },
    lampara: function (r) {
      var el = h('div.scene.scene-lamp');
      el.style.width = Math.min(420, r.width) + 'px';
      el.style.height = '320px';
      el.style.transform = 'translate(' + r.left + 'px,' + r.top + 'px)';
      layer.appendChild(el);
      var a = el.animate([{ opacity: 0 }, { opacity: 1, offset: 0.4 }, { opacity: 0.8, offset: 0.6 }, { opacity: 0 }], { duration: 6000, easing: 'ease-in-out', fill: 'both' });
      return { el: el, anims: [a], done: a };
    }
  };

  /** Lo visible de la hoja (si es más alta que la ventana, su parte de abajo es el borde de la ventana). */
  function visibleBottom(r) { return Math.min(r.bottom, window.innerHeight); }

  /* Escenas nuevas (A10): papel, bordado y paso del tiempo, todas en el margen. */
  SCENES.flor = function (r) {
    // Una margarita asoma en la esquina de abajo y se mece con el viento.
    var el = h('div.scene.scene-flower', { html: MC.stickers.markup('margarita') });
    // En el borde de afuera de la primera hoja (sobre la tela si hay lugar), nunca sobre lo escrito.
    var panel = document.getElementById('panel');
    var first = MC.$$(panel && panel.open ? '#panel .page' : '#main .page')[0];
    var fr = first ? first.getBoundingClientRect() : r;
    var x = fr.left > 70 ? fr.left - 52 : fr.left + 2, y = visibleBottom(fr) - 74;
    el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    layer.appendChild(el);
    var inner = el.firstElementChild || el;
    var fade = el.animate([{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], { duration: 6500, fill: 'both' });
    var sway = inner.animate([{ transform: 'rotate(-6deg)' }, { transform: 'rotate(7deg)' }, { transform: 'rotate(-6deg)' }], { duration: 2100, iterations: 3, easing: 'ease-in-out' });
    return { el: el, anims: [fade, sway], done: fade };
  };
  SCENES.esquina = function (r) {
    // La esquina de abajo de la hoja se levanta un poquito con la brisa y vuelve.
    var size = 46;
    var el = h('div.scene.scene-corner', { html: '<svg viewBox="0 0 46 46"><path class="scene-corner__fold" d="M46 0 L46 46 L0 46 Z"/><path class="scene-corner__back" d="M46 0 L0 46 L46 46 Z" opacity=".0"/></svg>' });
    var x = r.right - size, y = visibleBottom(r) - size;
    el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    layer.appendChild(el);
    var fold = el.querySelector('.scene-corner__fold');
    var a = fold.animate([
      { transform: 'scale(0.2)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.3 },
      { transform: 'scale(0.7)', opacity: 1, offset: 0.55 },
      { transform: 'scale(1)', opacity: 1, offset: 0.75 },
      { transform: 'scale(0.2)', opacity: 0 }
    ], { duration: 4200, easing: 'cubic-bezier(0.45, 0, 0.35, 1)', fill: 'both' });
    return { el: el, anims: [a], done: a };
  };
  SCENES.bordado = function (r) {
    // Una aguja borda una fila de puntadas en el margen izquierdo y se va: el cuaderno se cose solo un ratito.
    var len = Math.min(160, Math.max(80, visibleBottom(r) - r.top - 120));
    var x = r.left + 10, y = Math.max(r.top, 0) + 90;
    var el = h('div.scene.scene-stitch', { html: '<svg viewBox="0 0 16 ' + len + '" width="16" height="' + len + '"><path class="scene-stitch__line" pathLength="1" d="M8 2 V' + (len - 2) + '"/></svg>' });
    el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    layer.appendChild(el);
    var line = el.querySelector('path');
    // Las puntadas aparecen de arriba hacia abajo (la línea crece; el punteado queda quieto).
    var sew = line.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: 3200, easing: 'ease-out', fill: 'both' });
    var fade = el.animate([{ opacity: 0 }, { opacity: 1, offset: 0.08 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: 6200, fill: 'both' });
    return { el: el, anims: [sew, fade], done: fade };
  };
  SCENES.lluvia = function (r) {
    // Unas gotas resbalan por la tela, al costado de la hoja (como lluvia en la ventana).
    var el = h('div.scene.scene-rain');
    var side = r.right + 14 < window.innerWidth - 20 ? r.right + 14 : Math.max(4, r.left - 30);
    layer.appendChild(el);
    var anims = [];
    for (var i = 0; i < 5; i++) {
      var d = h('span.scene-rain__drop');
      el.appendChild(d);
      var x0 = side + (i % 3) * 7, y0 = Math.max(0, r.top) + 30 + i * 40;
      anims.push(d.animate([
        { transform: 'translate(' + x0 + 'px,' + y0 + 'px)', opacity: 0 },
        { opacity: 0.7, offset: 0.2 },
        { transform: 'translate(' + (x0 + 2) + 'px,' + (y0 + 160) + 'px)', opacity: 0 }
      ], { duration: 2600, delay: i * 700, easing: 'cubic-bezier(0.5, 0, 1, 1)', fill: 'both' }));
    }
    return { el: el, anims: anims, done: anims[anims.length - 1] };
  };

  function play(name) {
    layer = currentLayer();
    var r = pageRect();
    if (!r || !SCENES[name] || !layer.animate) { schedule(false); return; }
    running = SCENES[name](r);
    running.done.onfinish = function () { finish(name); };
  }

  function start() {
    if (started) return;
    started = true;
    layer = document.getElementById('scene-layer');
    MC.on('typing', function () { lastTyping = Date.now(); stop(); });
    document.addEventListener('keydown', function (e) { if (e.key.length === 1) { lastTyping = Date.now(); stop(); } }, true);
    document.addEventListener('focusin', function (e) { if (/TEXTAREA|INPUT/.test(e.target.tagName)) stop(); });
    MC.on('dialog:opened', function () { dialogs++; stop(); });
    MC.on('dialog:closed', function () { dialogs = Math.max(0, dialogs - 1); });
    MC.on('decorating', function (on) { decorating = on; if (on) stop(); });
    MC.on('route', function () { stop(); schedule(true); });
    MC.on('panel', function () { stop(); schedule(true); });
    MC.on('settings', function () { stop(); schedule(true); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) { stop(); clearTimeout(timer); } else schedule(true); });
    schedule(true);
  }

  MC.scenes = {
    start: start, play: function (n) { stop(); play(n || pick()); }, stop: stop, canPlay: canPlay, NAMES: Object.keys(SCENES), delay: delay,
    /** Para diagnosticar (y para las pruebas): qué está frenando las escenas. */
    state: function () { return { decorating: decorating, dialogs: dialogs, running: !!running }; }
  };
})(window);
