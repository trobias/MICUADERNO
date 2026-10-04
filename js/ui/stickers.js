/* Biblioteca de stickers propios (troquelados: forma pastel + contorno de tinta + borde blanco de corte)
   y glifos de ánimo. Geometría limpia, sin trazos temblorosos. */
(function (root) {
  'use strict';
  var MC = root.MC || (root.MC = {});

  // Colores del arte: nombres de los tokens fijos `--st-*` (css/tokens.css). El SVG se pinta con clases
  // (`sf-*` relleno, `ss-*` trazo), nunca con hex ni estilos inline.
  var C = {
    ink: 'ink', paper: 'paper', butter: 'butter', blush: 'blush', rose: 'rose',
    peach: 'peach', sage: 'sage', sageDeep: 'sage-deep', lavender: 'lavender', cloud: 'cloud', wax: 'wax'
  };

  // Cada sticker: shapes (con corte blanco), details (solo trazo, sin corte).
  // Forma: [tag, attrs]; attrs puede traer fill, stroke, sw (grosor), t (transform).
  function petals(n, make) { var out = []; for (var i = 0; i < n; i++) out.push(make(i * (360 / n))); return out; }

  var ART = {
    mariposa: {
      label: 'mariposa', group: 'naturaleza',
      shapes: [
        ['path', { d: 'M38 38C30 21 14 13 8.5 21.5 3.5 30 14 40.5 38 42z', fill: C.blush }],
        ['path', { d: 'M42 38C50 21 66 13 71.5 21.5 76.5 30 66 40.5 42 42z', fill: C.blush }],
        ['path', { d: 'M38 43.5C26 44 15.5 52 19.5 60 23.5 67.5 34 61 39 48.5z', fill: C.lavender }],
        ['path', { d: 'M42 43.5C54 44 64.5 52 60.5 60 56.5 67.5 46 61 41 48.5z', fill: C.lavender }],
        ['rect', { x: 37.2, y: 31, width: 5.6, height: 30, rx: 2.8, fill: C.ink }]
      ],
      details: [
        ['path', { d: 'M38.8 32.5C37 25.5 33.5 21.5 29.5 20.5M41.2 32.5C43 25.5 46.5 21.5 50.5 20.5' }],
        ['circle', { cx: 20, cy: 27, r: 3.2, fill: C.rose, stroke: 'none' }],
        ['circle', { cx: 60, cy: 27, r: 3.2, fill: C.rose, stroke: 'none' }]
      ]
    },
    margarita: {
      label: 'margarita', group: 'naturaleza',
      shapes: petals(8, function (a) { return ['ellipse', { cx: 40, cy: 22, rx: 7, ry: 13, fill: C.paper, t: 'rotate(' + a + ' 40 40)' }]; })
        .concat([['circle', { cx: 40, cy: 40, r: 9.5, fill: C.butter }]]),
      details: [['path', { d: 'M36 38.5h.01M43 37.5h.01M40 43h.01', sw: 2.4 }]]
    },
    tulipan: {
      label: 'tulipán', group: 'naturaleza',
      shapes: [
        ['path', { d: 'M40 44V71', fill: 'none', stroke: C.sageDeep, sw: 3.2 }],
        ['path', { d: 'M40 63C30 60 23.5 51.5 25.5 44.5 34 46.5 39 54 40 63z', fill: C.sage }],
        ['path', { d: 'M27 20C27 36 31.5 46.5 40 46.5S53 36 53 20L46.5 29 40 18.5 33.5 29z', fill: C.rose }]
      ],
      details: [['path', { d: 'M40 30V44' }]]
    },
    hoja: {
      label: 'hoja', group: 'naturaleza',
      shapes: [['path', { d: 'M16 64C16 35 37 15 65 15 65 44 45 64 16 64z', fill: C.sage }]],
      details: [['path', { d: 'M19 61C31 47 43 35 58 22M34 46l-1-10M44 37l9-.5' }]]
    },
    sol: {
      label: 'sol', group: 'naturaleza',
      shapes: petals(8, function (a) { return ['rect', { x: 36.5, y: 6.5, width: 7, height: 13, rx: 3.5, fill: C.peach, t: 'rotate(' + a + ' 40 40)' }]; })
        .concat([['circle', { cx: 40, cy: 40, r: 15.5, fill: C.butter }]]),
      details: [['path', { d: 'M34 42c3 3.5 9 3.5 12 0' }]]
    },
    luna: {
      label: 'luna', group: 'naturaleza',
      shapes: [
        ['path', { d: 'M50 12A28 28 0 1 0 68 54 22 22 0 1 1 50 12z', fill: C.butter }],
        ['path', { d: 'M62 18l1.8 4.2 4.2 1.8-4.2 1.8L62 30l-1.8-4.2-4.2-1.8 4.2-1.8z', fill: C.lavender }]
      ],
      details: []
    },
    nube: {
      label: 'nube', group: 'naturaleza',
      shapes: [['path', { d: 'M21 57C10 57 8.5 42.5 19 40.5 19.5 27.5 36 23 42.5 34 48.5 25.5 63.5 29.5 61.5 42 72 42.5 72 57 61 57z', fill: C.cloud }]],
      details: []
    },
    ramita: {
      label: 'ramita', group: 'naturaleza',
      shapes: [
        ['path', { d: 'M18 66C30 50 44 34 63 15', fill: 'none', stroke: C.sageDeep, sw: 3 }],
        ['ellipse', { cx: 30, cy: 44, rx: 5.5, ry: 10, fill: C.sage, t: 'rotate(-55 30 44)' }],
        ['ellipse', { cx: 42, cy: 52, rx: 5.5, ry: 10, fill: C.sage, t: 'rotate(35 42 52)' }],
        ['ellipse', { cx: 44, cy: 28, rx: 5, ry: 9, fill: C.sage, t: 'rotate(-50 44 28)' }],
        ['ellipse', { cx: 55, cy: 36, rx: 5, ry: 9, fill: C.sage, t: 'rotate(40 55 36)' }]
      ],
      details: []
    },
    taza: {
      label: 'taza', group: 'cositas',
      shapes: [
        ['ellipse', { cx: 38, cy: 66, rx: 24, ry: 4.5, fill: C.lavender }],
        ['path', { d: 'M54 38c10 0 10 15 0 15', fill: 'none', stroke: C.ink, sw: 4 }],
        ['path', { d: 'M20 33H56V49C56 59 48 65.5 38 65.5S20 59 20 49z', fill: C.blush }]
      ],
      details: [['path', { d: 'M32 25c-3.5-5 3-7 0-12M42 25c-3.5-5 3-7 0-12' }], ['path', { d: 'M31 45c2 2.5 5 2.5 7 0 2 2.5 5 2.5 7 0', stroke: C.rose }]]
    },
    libro: {
      label: 'libro', group: 'cositas',
      shapes: [
        ['path', { d: 'M9 28V65C21.5 61 32 61 40 67 48 61 58.5 61 71 65V28z', fill: C.sage }],
        ['path', { d: 'M40 26C32 19.5 20.5 19.5 12.5 23.5V60C20.5 56 32 56 40 62z', fill: C.paper }],
        ['path', { d: 'M40 26C48 19.5 59.5 19.5 67.5 23.5V60C59.5 56 48 56 40 62z', fill: C.paper }]
      ],
      details: [['path', { d: 'M18 32c6-2 11-2 16 0M18 39c6-2 11-2 16 0M46 32c5-2 10-2 16 0M46 39c5-2 10-2 16 0M46 46c5-2 10-2 16 0', stroke: C.rose, sw: 1.3 }]]
    },
    auriculares: {
      label: 'auriculares', group: 'cositas',
      shapes: [
        ['path', { d: 'M18 50V40C18 21 62 21 62 40V50', fill: 'none', stroke: C.ink, sw: 4.5 }],
        ['rect', { x: 11, y: 43, width: 14, height: 22, rx: 6, fill: C.lavender }],
        ['rect', { x: 55, y: 43, width: 14, height: 22, rx: 6, fill: C.lavender }]
      ],
      details: [['path', { d: 'M42 42v9c-1.6-1.1-4.4-.4-4.4 1.6s2.8 2.1 4.4.9M42 42l5 1.6', sw: 1.5 }]]
    },
    sobre: {
      label: 'sobre', group: 'cositas',
      shapes: [['rect', { x: 11, y: 21, width: 58, height: 40, rx: 3.5, fill: C.peach }], ['circle', { cx: 40, cy: 44, r: 6, fill: C.rose }]],
      details: [['path', { d: 'M12 23l28 21 28-21M12 60l19-15M68 60 49 45' }]]
    },
    vela: {
      label: 'vela', group: 'cositas',
      shapes: [
        ['ellipse', { cx: 40, cy: 68, rx: 18, ry: 4, fill: C.lavender }],
        ['rect', { x: 30, y: 34, width: 20, height: 34, rx: 3.5, fill: C.wax }],
        ['path', { d: 'M40 12C46.5 20.5 46.5 29.5 40 29.5S33.5 20.5 40 12z', fill: C.peach }]
      ],
      details: [['path', { d: 'M40 29.5V34M34 42v8', sw: 1.4 }]]
    },
    corazon: {
      label: 'corazón', group: 'cositas',
      shapes: [['path', { d: 'M40 66C22 54 12 44 12 32 12 22 20 16 28 16 34 16 38 20 40 24 42 20 46 16 52 16 60 16 68 22 68 32 68 44 58 54 40 66z', fill: C.rose }]],
      details: [['path', { d: 'M22 30c0-4 3-7 7-7', stroke: C.paper, sw: 2 }]]
    },
    estrella: {
      label: 'estrella', group: 'simbolos',
      shapes: [['path', { d: 'M40 12l8.3 16.9 18.6 2.7-13.5 13.1 3.2 18.6L40 54.5l-16.6 8.8 3.2-18.6-13.5-13.1 18.6-2.7z', fill: C.butter }]],
      details: []
    },
    brillito: {
      label: 'brillito', group: 'simbolos',
      shapes: [
        ['path', { d: 'M38 10C40 30 47 37 68 39 47 41 40 48 38 70 36 48 29 41 8 39 29 37 36 30 38 10z', fill: C.lavender }],
        ['path', { d: 'M62 56c.8 5 2.2 6.4 7 7.2-4.8.8-6.2 2.2-7 7.2-.8-5-2.2-6.4-7-7.2 4.8-.8 6.2-2.2 7-7.2z', fill: C.butter }]
      ],
      details: []
    },
    mono: {
      label: 'moño', group: 'simbolos',
      shapes: [
        ['path', { d: 'M38 44 27 67l6-2 4 6 5-25z', fill: C.rose }],
        ['path', { d: 'M42 44l11 23-6-2-4 6-5-25z', fill: C.rose }],
        ['path', { d: 'M40 40C30 25 13 25 13 38S30 51 40 40z', fill: C.blush }],
        ['path', { d: 'M40 40C50 25 67 25 67 38S50 51 40 40z', fill: C.blush }],
        ['circle', { cx: 40, cy: 40, r: 6, fill: C.rose }]
      ],
      details: []
    },
    flecha: {
      label: 'flecha', group: 'simbolos',
      shapes: [
        ['path', { d: 'M14 58C27 33 44 27 63 31', fill: 'none', stroke: C.ink, sw: 3.4 }],
        ['path', { d: 'M54 21l11 10-12 8', fill: 'none', stroke: C.ink, sw: 3.4 }]
      ],
      details: []
    },
    'washi-rosa': washi(C.blush, 'dots', 'cinta rosa'),
    'washi-salvia': washi(C.sage, 'lines', 'cinta salvia'),
    'washi-lavanda': washi(C.lavender, 'dots', 'cinta lavanda'),
    'washi-manteca': washi(C.butter, 'lines', 'cinta manteca')
  };

  function washi(color, pattern, label) {
    var jag = 'M6 29l2 3.5-2 3.5 2 3.5-2 3.5 2 3.5-2 3.5 2 3H74l-2-3 2-3.5-2-3.5 2-3.5-2-3.5 2-3.5-2-3.5 2-3z';
    var det = pattern === 'dots'
      ? [['path', { d: 'M16 36h.01M28 44h.01M40 36h.01M52 44h.01M64 36h.01', stroke: C.paper, sw: 3 }]]
      : [['path', { d: 'M14 52l10-20M30 52l10-20M46 52l10-20M62 52l8-16', stroke: C.paper, sw: 2, opacity: 0.8 }]];
    return { label: label, group: 'cintas', washi: true,
      shapes: [['path', { d: jag, fill: color, opacity: 0.9, noOutline: true }]], details: det };
  }

  var GROUPS = [
    ['naturaleza', 'Naturaleza'], ['cositas', 'Cositas'], ['simbolos', 'Símbolos'], ['cintas', 'Cintas']
  ];

  function attrs(obj, pass) {
    var out = '';
    Object.keys(obj).forEach(function (k) {
      if (k === 'fill' || k === 'stroke' || k === 'sw' || k === 't' || k === 'noOutline' || k === 'opacity') return;
      out += ' ' + k + '="' + obj[k] + '"';
    });
    if (obj.t) out += ' transform="' + obj.t + '"';
    var cls = [];
    if (pass === 'cut') {
      var sw = obj.stroke && obj.fill === 'none' ? (obj.sw || 3) + 7 : 7;
      if (obj.fill === 'none') out += ' fill="none"'; else cls.push('sf-cut');
      cls.push('ss-cut');
      out += ' stroke-width="' + sw + '"';
    } else {
      if (obj.fill && obj.fill !== 'none') cls.push('sf-' + obj.fill); else out += ' fill="none"';
      if (obj.noOutline || obj.stroke === 'none') out += ' stroke="none"';
      else { cls.push('ss-' + (obj.stroke || C.ink)); out += ' stroke-width="' + (obj.sw || 1.6) + '"'; }
      if (obj.opacity != null) out += ' opacity="' + obj.opacity + '"';
    }
    if (cls.length) out += ' class="' + cls.join(' ') + '"';
    return out;
  }

  function el(shape, pass) { return '<' + shape[0] + attrs(shape[1], pass) + '/>'; }

  /** Markup SVG de un sticker (string). */
  function markup(name) {
    var art = ART[name] || ART.corazon;
    var cut = art.shapes.map(function (s) { return el(s, 'cut'); }).join('');
    var body = art.shapes.map(function (s) { return el(s, 'body'); }).join('');
    var det = art.details.map(function (s) {
      var a = Object.assign({ fill: 'none' }, s[1]);
      return '<' + s[0] + attrs(a, 'body') + '/>';
    }).join('');
    return '<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' +
      '<g stroke-linejoin="round" stroke-linecap="round">' + cut + '</g>' +
      '<g stroke-linejoin="round" stroke-linecap="round">' + body + det + '</g></svg>';
  }

  /* ---------- Glifos de ánimo (24×24) ---------- */
  var MOOD_GLYPHS = {
    1: '<path d="M6.5 13.5C3.6 13.5 3 9.4 5.8 8.7 5.9 4.9 10.6 3.6 12.6 6.6 14.4 3.9 19 4.9 18.6 8.7 21.4 8.9 21.4 13.5 18.5 13.5z"/><path d="M8 16.5l-1.2 3M12.3 16.5l-1.2 3M16.6 16.5l-1.2 3"/>',
    2: '<path d="M6 17C2.6 17 2 11.9 5.4 11.1 5.5 6.4 11.2 4.8 13.6 8.5 15.8 5.2 21.4 6.4 20.9 11.1 24.2 11.4 24 17 20.5 17z" transform="translate(-1 -0.5)"/>',
    3: '<circle cx="15.5" cy="8.5" r="3.6"/><path d="M15.5 2.4v1.2M21.6 8.5h-1.2M19.8 4.2l-.9.9M11.2 4.2l.9.9"/><path d="M5 19.5C2.4 19.5 2 15.6 4.6 15 4.8 11.6 9 10.6 10.7 13.3 12.3 11 16.4 11.8 16 15.2 18.5 15.4 18.4 19.5 15.8 19.5z"/>',
    4: '<circle cx="12" cy="6.6" r="2.9"/><circle cx="16.6" cy="9.9" r="2.9"/><circle cx="14.9" cy="15.2" r="2.9"/><circle cx="9.1" cy="15.2" r="2.9"/><circle cx="7.4" cy="9.9" r="2.9"/><circle class="fill" cx="12" cy="11.2" r="2"/>',
    5: '<circle cx="12" cy="12" r="4.6"/><path d="M12 2.6v2.3M12 19.1v2.3M2.6 12h2.3M19.1 12h2.3M5.4 5.4l1.6 1.6M17 17l1.6 1.6M5.4 18.6 7 17M17 7l1.6-1.6"/>'
  };
  var MOOD_HEX = { 1: '#584488', 2: '#954A7E', 3: '#C15C67', 4: '#D67F46', 5: '#CAAE31' }; // color-ok: los parches de ánimo se van con las emociones escritas (A4)

  /** Parche bordado completo (50×50) como string SVG. */
  function patchMarkup(mood) {
    return '<svg viewBox="0 0 50 50" aria-hidden="true" focusable="false">' +
      '<circle class="patch-ring" cx="25" cy="25" r="22.5"/>' +
      '<g class="patch-glyph" transform="translate(8 8) scale(1.4167)">' + MOOD_GLYPHS[mood] + '</g></svg>';
  }

  /** Mini parche relleno con el hilo, glifo en papel (calendario/semana). */
  function miniPatchMarkup(mood) {
    return '<svg class="mini-patch" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<circle cx="12" cy="12" r="11" fill="' + MOOD_HEX[mood] + '" stroke="' + MOOD_HEX[mood] + '"/>' +
      '<g class="patch-glyph" stroke="#FFF9ED" transform="translate(4.8 4.8) scale(0.6)">' + // color-ok (A4)
      MOOD_GLYPHS[mood].replace('class="fill"', 'fill="#FFF9ED"') + '</g></svg>'; // color-ok (A4)
  }

  /** Glifo de ánimo solo en tinta (impresión): toma el color de `color` (currentColor). */
  function inkGlyphMarkup(mood, cls) {
    return '<svg class="' + (cls || 'ink-glyph') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
      MOOD_GLYPHS[mood].replace('class="fill"', 'fill="currentColor"') + '</g></svg>';
  }

  /* ---------- Puntadas de estado (24×24) ----------
     Un solo dibujo para los 5 estados: la casilla que se toca (components.js), la semana y la impresión. */
  var STITCH = {
    x1: 'M6.5 6.5 17.5 17.5',
    x2: 'M17.5 6.5 6.5 17.5',
    later: 'M5.5 12h11M13 8.2l3.8 3.8-3.8 3.8',
    knot: { cx: 12, cy: 12, r: 2.8 }
  };
  var STATUS_STITCHES = { pending: [], done: ['x1', 'x2'], partial: ['x1'], postponed: ['later'], skipped: ['knot'] };

  /** Una puntada como string SVG; `attrs` agrega atributos (clase, pathLength…). */
  function stitchMarkup(name, attrs) {
    var extra = attrs ? ' ' + attrs : '';
    if (name === 'knot') return '<circle' + extra + ' cx="' + STITCH.knot.cx + '" cy="' + STITCH.knot.cy + '" r="' + STITCH.knot.r + '"/>';
    return '<path' + extra + ' d="' + STITCH[name] + '"/>';
  }

  /** Marca quieta del estado de una actividad (semana, impresión). Los colores van por CSS (.st-mark). */
  function statusMarkup(status) {
    var st = STATUS_STITCHES[status] ? status : 'pending';
    return '<svg class="st-mark" data-status="' + st + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<rect class="st-mark__box" x="3.5" y="3.5" width="17" height="17" rx="2.5"/>' +
      '<g class="st-mark__thread">' + STATUS_STITCHES[st].map(function (n) { return stitchMarkup(n); }).join('') + '</g></svg>';
  }

  MC.stickers = {
    ART: ART, GROUPS: GROUPS, COLORS: C, markup: markup, names: Object.keys(ART),
    MOOD_GLYPHS: MOOD_GLYPHS, MOOD_HEX: MOOD_HEX, patchMarkup: patchMarkup, miniPatchMarkup: miniPatchMarkup, inkGlyphMarkup: inkGlyphMarkup,
    STITCH: STITCH, stitchMarkup: stitchMarkup, statusMarkup: statusMarkup
  };
})(typeof window !== 'undefined' ? window : globalThis);
