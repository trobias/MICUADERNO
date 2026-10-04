/* MI CUADERNO — namespace y utilidades mínimas.
   Scripts clásicos (sin módulos) para que la app abra con doble clic en file://. */
(function (root) {
  'use strict';
  var MC = root.MC || (root.MC = {});

  /** Crea un id legible con prefijo: act_…, rut_…, pag_…, stk_… */
  MC.uid = function (prefix) {
    var core;
    if (root.crypto && typeof root.crypto.randomUUID === 'function') {
      core = root.crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    } else {
      core = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    }
    return (prefix ? prefix + '_' : '') + core;
  };

  MC.nowISO = function () { return new Date().toISOString(); };

  MC.debounce = function (fn, ms) {
    var t = null;
    function debounced() {
      var args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { t = null; fn.apply(self, args); }, ms);
    }
    debounced.flush = function () { if (t) { clearTimeout(t); t = null; fn(); } };
    debounced.cancel = function () { clearTimeout(t); t = null; };
    return debounced;
  };

  MC.clamp = function (n, min, max) { return Math.min(max, Math.max(min, n)); };

  MC.clone = function (obj) { return obj == null ? obj : JSON.parse(JSON.stringify(obj)); };

  /** Hash chico y estable (para elegir rotaciones/variantes deterministas). */
  MC.hash = function (str) {
    var h = 2166136261;
    str = String(str);
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };

  /* ---------- DOM ---------- */

  var SVG_NS = 'http://www.w3.org/2000/svg';

  /**
   * h('div.clase#id', {attr: v, on: {click: fn}, dataset: {...}, style: {...}}, ...hijos)
   * Hijos: strings, nodos, arrays, null/false (se ignoran).
   */
  MC.h = function (tag, props) {
    var children = Array.prototype.slice.call(arguments, 2);
    if (props == null || typeof props !== 'object' || props.nodeType || Array.isArray(props)) {
      if (props != null && props !== false) children.unshift(props);
      props = {};
    }
    var parts = String(tag).split(/(?=[.#])/);
    var name = parts[0] || 'div';
    var isSvg = props.svg || name === 'svg' || name === 'use' || name === 'path' || name === 'g';
    var el = isSvg ? document.createElementNS(SVG_NS, name) : document.createElement(name);
    for (var i = 1; i < parts.length; i++) {
      var p = parts[i];
      if (p[0] === '.') el.classList.add(p.slice(1));
      else if (p[0] === '#') el.id = p.slice(1);
    }
    Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v == null || v === false || k === 'svg') return;
      if (k === 'on') {
        Object.keys(v).forEach(function (ev) { el.addEventListener(ev, v[ev]); });
      } else if (k === 'dataset') {
        Object.keys(v).forEach(function (d) { if (v[d] != null) el.dataset[d] = v[d]; });
      } else if (k === 'style' && typeof v === 'object') {
        Object.keys(v).forEach(function (s) {
          if (s.indexOf('--') === 0) el.style.setProperty(s, v[s]); else el.style[s] = v[s];
        });
      } else if (k === 'class' || k === 'className') {
        String(v).split(/\s+/).filter(Boolean).forEach(function (c) { el.classList.add(c); });
      } else if (k === 'html') {
        el.innerHTML = v; // solo para SVG/markup propio, nunca para texto de la persona
      } else if (k === 'text') {
        el.textContent = v;
      } else if (k === 'value' && !isSvg) {
        el.value = v;
      } else if (k in el && !isSvg && typeof v !== 'string' && k !== 'list') {
        el[k] = v;
      } else if (v === true) {
        el.setAttribute(k, '');
      } else {
        el.setAttribute(k, v);
      }
    });
    appendAll(el, children);
    return el;
  };

  function appendAll(el, children) {
    children.forEach(function (c) {
      if (c == null || c === false || c === true) return;
      if (Array.isArray(c)) { appendAll(el, c); return; }
      el.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
    });
  }

  MC.$ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  MC.$$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  MC.clear = function (el) { while (el && el.firstChild) el.removeChild(el.firstChild); return el; };

  /** Textarea que crece con el contenido (sin animar altura). */
  MC.autosize = function (ta) {
    function fit() {
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    }
    ta.addEventListener('input', fit);
    requestAnimationFrame(fit);
    return fit;
  };

  /* ---------- eventos internos ---------- */
  var listeners = {};
  MC.on = function (name, fn) { (listeners[name] = listeners[name] || []).push(fn); return function () { MC.off(name, fn); }; };
  MC.off = function (name, fn) { listeners[name] = (listeners[name] || []).filter(function (f) { return f !== fn; }); };
  MC.emit = function (name, detail) { (listeners[name] || []).slice().forEach(function (fn) { try { fn(detail); } catch (e) { console.error(e); } }); };

  /* ---------- preferencias livianas de UI (localStorage) ---------- */
  MC.ui = {
    prefix: '', // con cuentas (js/cloud.js): '<id de la persona>.' para no mezclar preferencias en un dispositivo compartido
    get: function (key, fallback) {
      try { var v = root.localStorage.getItem('mc.ui.' + MC.ui.prefix + key); return v == null ? fallback : JSON.parse(v); }
      catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { root.localStorage.setItem('mc.ui.' + MC.ui.prefix + key, JSON.stringify(value)); } catch (e) { /* modo privado: no pasa nada */ }
    }
  };

  /** Descarga un Blob/string como archivo local. */
  MC.download = function (filename, data, type) {
    var blob = data instanceof Blob ? data : new Blob([data], { type: type || 'application/octet-stream' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1500);
  };
})(typeof window !== 'undefined' ? window : globalThis);
