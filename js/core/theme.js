/* Motor de temas (A9, D30): de pocos colores (tela, tela 2 para degradado, hojas, tinta y 4 acentos) deriva
   todos los tokens del cuaderno, con contraste AA asegurado. Puro: sin DOM (aplicar es de js/ui/theme.js).
   De fábrica no hay tema (`settings.theme === null`): la tela lisa de la tapa elegida (DESIGN §1).
   No siguen al tema: el arte de los stickers (--st-*), la impresión (--print-*), el elástico, el bastidor
   y los hilos de las emociones (--emotion-*). Ver SPEC §7.7 y DESIGN §3.4b. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { var MC = root.MC || (root.MC = {}); MC.theme = api; }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var HEX6 = /^#[0-9a-fA-F]{6}$/;
  var WHITE = '#FFFFFF', BLACK = '#000000'; // color-ok: extremos para mezclar y medir contraste

  /* ---------- color ---------- */
  function rgb(hex) { var n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function hex(c) { return '#' + c.map(function (v) { var s = Math.round(Math.max(0, Math.min(255, v))).toString(16); return s.length < 2 ? '0' + s : s; }).join('').toUpperCase(); }
  /** Mezcla `a` hacia `b` (t = 0 → a, 1 → b). */
  function mix(a, b, t) { var x = rgb(a), y = rgb(b); return hex([0, 1, 2].map(function (i) { return x[i] + (y[i] - x[i]) * t; })); }
  function luminance(h) {
    return rgb(h).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); })
      .reduce(function (acc, v, i) { return acc + v * [0.2126, 0.7152, 0.0722][i]; }, 0);
  }
  function contrast(a, b) { var x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function isDark(h) { return luminance(h) < 0.2; }
  /** Acerca `fg` a negro o blanco (lo que más contraste dé contra `bg`) hasta llegar a `ratio`. */
  function ensure(fg, bg, ratio) {
    if (contrast(fg, bg) >= ratio) return fg;
    var target = contrast(BLACK, bg) >= contrast(WHITE, bg) ? BLACK : WHITE;
    for (var t = 0.05; t <= 1.0001; t += 0.05) { var c = mix(fg, target, t); if (contrast(c, bg) >= ratio) return c; }
    return target;
  }
  /** Tinta legible sobre un color: la tinta del tema si alcanza, si no, blanco papel o tinta oscura. */
  function inkOn(bg, ink, paper) {
    var opts = [ink, paper, '#2F2725', '#FFF9ED']; // color-ok: tintas de respaldo (oscura y papel)
    for (var i = 0; i < opts.length; i++) if (contrast(opts[i], bg) >= 4.5) return opts[i];
    return contrast(BLACK, bg) > contrast(WHITE, bg) ? BLACK : WHITE;
  }

  /* ---------- presets (por familia; ninguno es el de fábrica) ---------- */
  var PRESETS = [
    { id: 'cosmos', family: 'Pastel', label: 'Cosmos pastel', cloth: '#D6E6E5', cloth2: '#F2CFD7', paper: '#FFFBF2', ink: '#45403F', accents: ['#FEE088', '#F2CFD7', '#D1D171', '#D6E6E5'], angle: 135 }, // color-ok: preset elegible (no de fábrica)
    { id: 'algodon', family: 'Pastel', label: 'Algodón', cloth: '#E9C9D6', paper: '#FFF9F4', ink: '#4A3E44', accents: ['#F7E3A1', '#E9B3C6', '#BFD8C2', '#CFC4E8'] }, // color-ok: preset elegible (no de fábrica)
    { id: 'menta', family: 'Pastel', label: 'Menta', cloth: '#A9CDBF', paper: '#FBFBF3', ink: '#33433E', accents: ['#F5DE8C', '#F0B8B5', '#9CC8A9', '#B9C8E6'] }, // color-ok: preset elegible (no de fábrica)
    { id: 'terracota', family: 'Quebrados', label: 'Terracota', cloth: '#B86F52', paper: '#FBF3E8', ink: '#47352E', accents: ['#E7C077', '#D99A8A', '#A9B48A', '#B9A4C0'] }, // color-ok: preset elegible (no de fábrica)
    { id: 'oliva', family: 'Quebrados', label: 'Oliva', cloth: '#7D7F54', paper: '#F8F4E6', ink: '#3E3B2C', accents: ['#E2C66E', '#D7A08E', '#A8BB86', '#B4A9C7'] }, // color-ok: preset elegible (no de fábrica)
    { id: 'ciruela', family: 'Quebrados', label: 'Ciruela', cloth: '#7B4F68', paper: '#FBF4F1', ink: '#43333C', accents: ['#E9CD7D', '#DB9DAF', '#AFC2A0', '#B7A6D3'] }, // color-ok: preset elegible (no de fábrica)
    { id: 'lino', family: 'Neutros', label: 'Lino', cloth: '#BFB4A2', paper: '#FCFAF5', ink: '#3F3A35', accents: ['#E5D08F', '#D8AFA5', '#B6C2A6', '#C1B8CF'] }, // color-ok: preset elegible (no de fábrica)
    { id: 'grafito', family: 'Neutros', label: 'Grafito', cloth: '#5B5D63', paper: '#F7F6F3', ink: '#2F3034', accents: ['#E6CF7E', '#D6A0AB', '#A9BFA4', '#B3AED0'] }, // color-ok: preset elegible (no de fábrica)
    { id: 'neon', family: 'Neón', label: 'Neón suave', cloth: '#2D2A4A', cloth2: '#3D2A55', paper: '#FFFDF7', ink: '#2A2733', accents: ['#F9E64F', '#FF6FB5', '#5CF2B0', '#6FC8FF'], angle: 160, finish: 'brillante' }, // color-ok: preset elegible (no de fábrica)
    { id: 'noche', family: 'Noche', label: 'Noche', cloth: '#2B2838', paper: '#2E2A33', ink: '#EDE6DD', accents: ['#E2C46A', '#D990A4', '#9DBB8C', '#A898D0'] } // color-ok: preset elegible (no de fábrica)
  ];
  var FINISHES = ['mate', 'satinado', 'brillante'];

  function byId(id) { return PRESETS.filter(function (p) { return p.id === id; })[0] || null; }

  /** Un preset como tema guardable (`settings.theme`). */
  function fromPreset(id) {
    var p = byId(id);
    if (!p) return null;
    return { preset: p.id, cloth: p.cloth, cloth2: p.cloth2 || null, paper: p.paper, ink: p.ink, angle: p.angle || 135, accents: p.accents.slice(), finish: p.finish || 'mate' };
  }

  /**
   * Todos los tokens desde un tema. Devuelve { vars: { '--token': valor }, dark, fixes: [texto], gradient }.
   * `fixes` dice con palabras qué se corrigió para que se lea (el motor nunca deja un texto ilegible).
   */
  function derive(theme) {
    if (!theme || !HEX6.test(theme.cloth || '')) return null;
    var fixes = [];
    var cloth = theme.cloth.toUpperCase();
    var paper = HEX6.test(theme.paper || '') ? theme.paper.toUpperCase() : '#FFF9ED'; // color-ok: papel de fábrica si falta
    var dark = isDark(paper);
    var ink0 = HEX6.test(theme.ink || '') ? theme.ink.toUpperCase() : (dark ? '#EDE6DD' : '#493D3B'); // color-ok: tintas de fábrica
    var ink = ensure(ink0, paper, 7);
    if (ink !== ink0) fixes.push('Ajusté la tinta para que se lea bien sobre las hojas.');
    var acc = (theme.accents || []).filter(function (c) { return HEX6.test(c); }).map(function (c) { return c.toUpperCase(); });
    var def = ['#F6D978', '#D98FA1', '#B9CBA7', '#C9B8DE']; // color-ok: acentos de fábrica si faltan
    while (acc.length < 4) acc.push(def[acc.length]);
    var toward = dark ? WHITE : BLACK;
    var away = dark ? BLACK : WHITE;
    var inkSoft = ensure(mix(ink, paper, 0.38), paper, 4.5);
    var clothInk = inkOn(cloth, '#FFF9ED', ink); // color-ok: sobre la tela, papel o tinta, la que se lea
    var vars = {
      '--paper': paper,
      '--paper-shade': mix(paper, toward, dark ? 0.06 : 0.04),
      '--paper-edge': mix(paper, toward, dark ? 0.14 : 0.1),
      '--rule': mix(paper, acc[3], dark ? 0.28 : 0.22),
      '--rule-strong': mix(paper, acc[3], dark ? 0.42 : 0.36),
      '--ink': ink,
      '--ink-soft': inkSoft,
      '--ink-faint': mix(ink, paper, 0.6),
      '--placeholder': inkSoft,
      '--margin': mix(acc[1], paper, 0.35),
      '--butter': acc[0],
      '--rose': acc[1],
      '--blush': mix(acc[1], paper, 0.4),
      '--peach': mix(acc[0], acc[1], 0.5),
      '--sage': acc[2],
      '--lavender': acc[3],
      '--butter-deep': mix(acc[0], toward === BLACK ? BLACK : WHITE, 0.3),
      '--rose-deep': mix(acc[1], BLACK, 0.12),
      '--cloth': cloth,
      '--cloth-deep': mix(cloth, BLACK, 0.12),
      '--cloth-light': mix(cloth, WHITE, 0.14),
      '--cloth-ink': clothInk,
      '--focus': ink,
      '--field': mix(paper, dark ? WHITE : WHITE, dark ? 0.07 : 0.3),
      '--on-accent': [ink, '#2F2725'].filter(function (c) { return [acc[0], acc[3], mix(acc[0], acc[1], 0.5)].every(function (a) { return contrast(c, a) >= 4.5; }); })[0] || '#2F2725' // color-ok: tinta oscura de respaldo sobre acentos
    };
    // Los hilos de estado siguen siendo los mismos, pero en hojas oscuras se aclaran para leerse.
    if (dark) {
      ['--thread-done', '--thread-partial', '--thread-later'].forEach(function (k, i) {
        vars[k] = ensure(['#5F8150', '#BF6E3F', '#6E5CA0'][i], paper, 3); // color-ok: hilos de fábrica aclarados en hojas oscuras
      });
      vars['--thread-done-text'] = ensure('#4E6B41', paper, 4.5); // color-ok: idem, texto
      vars['--thread-partial-text'] = ensure('#9E552B', paper, 4.5); // color-ok: idem, texto
      vars['--error-ink'] = ensure('#9C4F66', paper, 4.5); // color-ok: idem, error
    }
    var gradient = HEX6.test(theme.cloth2 || '') ? 'linear-gradient(' + (Number.isFinite(+theme.angle) ? +theme.angle : 135) + 'deg, ' + cloth + ', ' + theme.cloth2.toUpperCase() + ')' : null;
    vars['--cloth-image'] = gradient || 'none';
    vars['--cloth-layers'] = 'var(--cloth-sheen), var(--tex-cloth), var(--cloth-image)';
    var finish = FINISHES.indexOf(theme.finish) !== -1 ? theme.finish : 'mate';
    // Acabado: un brillo suave sobre la tela (solo si la persona lo elige; mate = nada).
    vars['--cloth-sheen'] = finish === 'mate' ? 'none'
      : 'linear-gradient(' + (finish === 'brillante' ? '160deg, rgb(255 255 255 / 0.28), rgb(255 255 255 / 0) 45%, rgb(255 255 255 / 0.12) 70%, rgb(255 255 255 / 0))' : '160deg, rgb(255 255 255 / 0.14), rgb(255 255 255 / 0) 55%)');
    return { vars: vars, dark: dark, fixes: fixes, gradient: !!gradient, finish: finish, away: away };
  }

  /** Contraste de los pares que importan (para el aviso de Ajustes y los tests). */
  function report(theme) {
    var d = derive(theme);
    if (!d) return null;
    var v = d.vars;
    return {
      ink: contrast(v['--ink'], v['--paper']),
      inkSoft: contrast(v['--ink-soft'], v['--paper']),
      clothInk: contrast(v['--cloth-ink'], v['--cloth']),
      fixes: d.fixes
    };
  }

  return {
    PRESETS: PRESETS, FINISHES: FINISHES, byId: byId, fromPreset: fromPreset, derive: derive, report: report,
    mix: mix, contrast: contrast, luminance: luminance, ensure: ensure
  };
});
