/* Aplicar el tema propio (A9, D30): pone los tokens derivados por MC.theme en <body> (así ganan sobre la
   tela de la tapa, [data-cover]) y los saca al volver a la tela de fábrica. El alto contraste del sistema
   y los colores forzados ganan: con ellos el tema no se aplica. La impresión usa sus propios tokens. */
(function (root) {
  'use strict';
  var MC = root.MC;
  var applied = [];
  var current = null;

  function systemWins() {
    var mm = root.matchMedia;
    return !!(mm && (mm('(prefers-contrast: more)').matches || mm('(forced-colors: active)').matches));
  }

  function clear() {
    var st = document.body.style;
    applied.forEach(function (k) { st.removeProperty(k); });
    applied = [];
    delete document.body.dataset.theme;
    delete document.body.dataset.themeDark;
  }

  /** `theme`: el de settings (o null). Devuelve lo derivado (o null si quedó la tela de fábrica). */
  function apply(theme) {
    current = theme || null;
    if (!document.body) return null;
    clear();
    var d = current && !systemWins() ? MC.theme.derive(current) : null;
    if (d) {
      Object.keys(d.vars).forEach(function (k) { document.body.style.setProperty(k, d.vars[k]); applied.push(k); });
      document.body.dataset.theme = current.preset || 'propio';
      if (d.dark) document.body.dataset.themeDark = 'true';
    }
    document.documentElement.style.colorScheme = d && d.dark ? 'dark' : '';
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', getComputedStyle(document.body).getPropertyValue('--cloth').trim() || '#6F8A6A'); // color-ok: respaldo del theme-color
    return d;
  }

  // Si la persona prende el alto contraste del sistema con el cuaderno abierto, se respeta al momento.
  ['(prefers-contrast: more)', '(forced-colors: active)'].forEach(function (q) {
    var m = root.matchMedia && root.matchMedia(q);
    if (m && m.addEventListener) m.addEventListener('change', function () { apply(current); });
  });

  MC.themeUI = { apply: apply, systemWins: systemWins };
})(window);
