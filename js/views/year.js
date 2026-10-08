/* MI AÑO — bastidor de punto cruz, lo que fui notando y lo que guardé. Ver SPEC §7.6. */
(function (root) {
  'use strict';
  var MC = root.MC;
  var h = MC.h, D = MC.dates, M = MC.model, R = MC.routes, c = MC.c;

  function render(main, params) {
    var year = params.year;
    var today = D.today();
    var destroyed = false;
    var left = h('section.page.year-page');
    var right = h('section.page.page--margin.year-notes');
    main.appendChild(h('div.spread', left, h('div.spine', { 'aria-hidden': 'true' }), right));

    M.everything().then(function (raw) {
      if (destroyed) return;
      var all = M.activeOnly(raw);
      var memoryData = Object.assign({}, all, { days: raw.days, pages: raw.pages });
      var wins = MC.insights.victories(memoryData, year);
      // Misma cuenta que el calendario, sobre lo ya cargado. Sin rutinas: el año solo borda lo registrado.
      var sum = M.summarize(all.days, all.activities, { from: year + '-01-01', to: year + '-12-31' });
      var palette = M.emotionPalette(all.days.filter(function (d) { return d.date.slice(0, 4) === year; }), all.meta.settings);

      // Encabezado
      var y = +year;
      left.appendChild(h('header.cal-head',
        h('div.cal-head__title',
          h('a.icon-btn', { href: R.year(y - 1), 'aria-label': 'Año anterior' }, MC.icon('arrow-left')),
          h('h1.t-display', 'Mi año ', h('span.cal-head__year', year)),
          h('a.icon-btn', { href: R.year(y + 1), 'aria-label': 'Año siguiente' }, MC.icon('arrow-right'))),
        MC.cloud && MC.cloud.mode === 'owner' ? shareButton() : null));

      // Partes de Mi año (D53): la dueña elige cuáles no ve quien mira su cuaderno.
      function part(name, parent) { var el = h('div.year-part', { dataset: { yearPart: name } }); parent.appendChild(el); return el; }
      var pMapa = part('mapa', left);
      var filled = Object.keys(sum).filter(function (k) { return sum[k].feelings.length; }).length;
      pMapa.appendChild(h('p.year-intro.t-text', filled
        ? 'Cada punto cruz es un día con una emoción anotada. ' + (filled === 1 ? 'Ya hay uno bordado.' : 'Ya hay ' + filled + ' bordados.')
        : 'Un bastidor listo para bordar: cada día que anotes una emoción aparece un punto cruz.'));

      // Bastidor
      var hoop = h('div.hoop', { role: 'grid', 'aria-label': 'Emociones de cada día de ' + year, style: { '--cols': 12 } });
      var head = h('div.hoop__row.hoop__row--head', { role: 'row' }, h('span.hoop__corner', { role: 'columnheader', 'aria-label': 'Día' }));
      // Cada inicial de mes lleva a ese mes en el calendario.
      D.MONTHS_SHORT.forEach(function (m, i) {
        head.appendChild(h('span.hoop__month', { role: 'columnheader', 'aria-label': D.MONTHS[i] },
          h('a', { href: R.month(year + '-' + D.pad(i + 1)), 'aria-label': 'Ver ' + D.MONTHS[i] + ' en el calendario', title: D.capitalize(D.MONTHS[i]) }, m.charAt(0).toUpperCase())));
      });
      hoop.appendChild(head);
      var cells = [];
      // Días con alguna pequeña victoria: una puntadita dorada en la esquina (y dicho en el nombre del día).
      var winDays = {};
      wins.forEach(function (w) { winDays[w.date] = true; });
      for (var d = 1; d <= 31; d++) {
        var row = h('div.hoop__row', { role: 'row' }, h('span.hoop__daynum', { role: 'rowheader' }, d % 5 === 0 || d === 1 ? String(d) : ''));
        for (var m = 1; m <= 12; m++) {
          if (d > D.daysInMonth(y, m)) { row.appendChild(h('span.hoop__gap', { role: 'gridcell', 'aria-hidden': 'true' })); continue; }
          var key = D.make(y, m, d);
          var info = sum[key];
          var feelings = info ? info.feelings : [];
          var label = d + ' de ' + D.MONTHS[m - 1] + (feelings.length ? ': ' + feelings.join(', ') : info && (info.wrote || info.total) ? ': sin emoción registrada' : '') + (winDays[key] ? '; una pequeña victoria' : '');
          var cell = h('button.stitch-cell', {
            type: 'button', role: 'gridcell', tabindex: '-1', 'aria-label': label,
            dataset: { date: key, feeling: feelings.length ? feelings[0] : null, row: String(d), col: String(m) },
            style: { '--c': feelings.length ? palette.color(feelings[0]) : null },
            class: [key === today ? 'is-today' : null, winDays[key] ? 'is-win' : null, !feelings.length && info && (info.wrote || info.total) ? 'is-half' : null, key > today ? 'is-future' : null].filter(Boolean).join(' ')
          });
          cell.addEventListener('click', go);
          cell.addEventListener('keydown', onKey);
          cells.push(cell);
          row.appendChild(cell);
        }
        hoop.appendChild(row);
      }
      pMapa.appendChild(h('div.hoop-frame', hoop));
      var focusKey = today.slice(0, 4) === year ? today : year + '-01-01';
      cells.forEach(function (x) { if (x.dataset.date === focusKey) x.tabIndex = 0; });

      pMapa.appendChild(h('ul.mood-legend.year-legend', { 'aria-label': 'Referencias' },
        palette.labels.map(function (value) { return h('li', h('span.stitch-cell.stitch-cell--key', { dataset: { feeling: value }, style: { '--c': palette.color(value) }, 'aria-hidden': 'true' }), value); }),
        palette.otherCount ? h('li', 'Otras emociones, con su nombre') : null,
        h('li', h('span.stitch-cell.stitch-cell--key.is-half', { 'aria-hidden': 'true' }), 'algo anotado, sin emoción'),
        Object.keys(winDays).length ? h('li', h('span.stitch-cell.stitch-cell--key.is-win', { 'aria-hidden': 'true' }), 'una pequeña victoria') : null));

      // Mes a mes (A8, D31): un gráfico propio y la misma información en una tabla.
      part('grafico', left).appendChild(monthChart(MC.insights.byMonth(all, year), year));

      function go(e) { location.hash = R.day(e.currentTarget.dataset.date); }
      function onKey(e) {
        var el = e.currentTarget;
        var r0 = +el.dataset.row, c0 = +el.dataset.col;
        var dr = { ArrowUp: -1, ArrowDown: 1 }[e.key] || 0;
        var dc = { ArrowLeft: -1, ArrowRight: 1 }[e.key] || 0;
        if (!dr && !dc) return;
        e.preventDefault();
        var target = null, rr = r0 + dr, cc = c0 + dc;
        // Salta los huecos (30 de febrero, etc.) siguiendo en la misma dirección.
        while (!target && rr >= 1 && rr <= 31 && cc >= 1 && cc <= 12) {
          target = hoop.querySelector('[data-row="' + rr + '"][data-col="' + cc + '"]');
          rr += dr; cc += dc;
        }
        if (target) { el.tabIndex = -1; target.tabIndex = 0; target.focus(); }
      }

      // Hoja derecha: lo que fui notando (cuentas por período + observaciones), pequeñas victorias y lo que guardé
      var current = today.slice(0, 4) === year;
      var insights = MC.insights.compute(all, current ? today : year + '-12-31');
      right.appendChild(h('h2.t-display.notes-title', { dataset: { yearTitle: 'cuentas notando' } }, 'Lo que fui notando'));
      part('cuentas', right).appendChild(tallies(all, current ? today : year + '-12-31', current, palette));
      var pNot = part('notando', right);
      pNot.appendChild(h('ul.noticed', insights.map(insightItem)));
      pNot.appendChild(h('p.noticed__foot.t-meta', 'Son solo cuentas de lo que registraste, no conclusiones.'));

      // Pequeñas victorias: referencias (marks) a lo que la persona eligió; cada una lleva a su día.
      var pWins = part('victorias', right);
      pWins.appendChild(h('h2.t-display.notes-title', 'Pequeñas victorias'));
      if (!wins.length) {
        pWins.appendChild(h('p.section__hint', 'Metas alcanzadas, tu primer dibujo y momentos elegidos por vos. Podés guardar una victoria desde una actividad, una hoja o “Este día…”.'));
      } else {
        pWins.appendChild(h('p.section__hint', 'También cuentan los pequeños pasos y lo que tuvo significado para vos.'));
        pWins.appendChild(memoryAlbum(wins, true));
      }

      // Lo que guardé es un repaso y un recuerdo: no muestra días marcados para quedar afuera (PV1) ni lo borrado.
      var memories = MC.insights.moments(memoryData, year).filter(function (m) { return !m.victory; });
      var pMem = part('recuerdos', right);
      pMem.appendChild(h('h2.t-display.notes-title', 'Lo que guardé'));
      if (!memories.length) {
        pMem.appendChild(h('p.section__hint', 'Una frase, una foto o un día especial. Elegí “Quiero recordarlo” en una actividad u hoja, “Este día…” o escribí “Qué quiero guardar” al cerrar un día.'));
      } else {
        pMem.appendChild(memoryAlbum(memories, false));
      }
    });

    /** “Qué ven” de Mi año (D53): casillas por parte; lo destildado no lo ve quien mira el cuaderno. */
    function shareButton() {
      var b = h('button.text-btn', { type: 'button', 'aria-haspopup': 'dialog' }, MC.icon('lock'), 'Qué ven');
      b.addEventListener('click', function () {
        var LABELS = { mapa: 'El bastidor del año', cuentas: 'Las cuentas por semana, mes y año', grafico: 'El gráfico por mes', notando: 'Lo que fui notando', recuerdos: 'Lo que guardé (recuerdos)', victorias: 'Pequeñas victorias' };
        var hidden = M.settings().hideYear.slice();
        var list = h('ul.check-list');
        M.YEAR_PARTS.forEach(function (k) {
          var id = MC.uid('yr');
          var cb = h('input', { type: 'checkbox', id: id, checked: hidden.indexOf(k) === -1 });
          cb.addEventListener('change', function () {
            hidden = hidden.filter(function (x) { return x !== k; });
            if (!cb.checked) hidden.push(k);
            M.saveSettings({ hideYear: hidden });
          });
          list.appendChild(h('li', h('label.check', { for: id }, cb, h('span', LABELS[k]))));
        });
        c.dialog({ title: 'Qué ven de Mi año', content: [
          h('p.t-text', 'Quienes miran tu cuaderno ven en Mi año solo lo tildado (y siempre dentro de lo que les compartiste).'), list],
          actions: [{ label: 'Listo', kind: 'primary' }] });
      });
      return b;
    }

    return { destroy: function () { destroyed = true; } };
  }

  /** Papelitos por mes: una fuente por momento, con imagen solo si pertenece a esa fuente visible. */
  function memoryAlbum(entries, victory) {
    var box = h('div.year-album'), groups = {}, hidden = [], links = [];
    var list = h(victory ? 'ul.wins' : 'ul.memories', { id: MC.uid('album') });
    entries.forEach(function (m, i) {
      var key = m.date.slice(0, 7);
      if (!groups[key]) {
        var title = h('li.year-album__month', h('h3', D.capitalize(D.MONTHS[+m.date.slice(5, 7) - 1])));
        groups[key] = title; list.appendChild(title);
        if (i >= 6) { title.hidden = true; hidden.push(title); }
      }
      var href = m.week ? R.week(m.week) : m.page ? R.page(m.page) : R.day(m.date);
      var link = h(victory ? 'a.win__link' : 'a.memory__link', { href: href },
        m.image ? h('img.year-album__image', { src: m.image.src, alt: m.image.name, width: m.image.w, height: m.image.h, loading: 'lazy', decoding: 'async' }) : null,
        h(victory ? 'span.win__date' : 'span.memory__date', D.shortLabel(m.date)),
        h(victory ? 'span.win__text' : 'span.memory__text', m.text),
        m.detail && m.detail !== m.text ? h('span.year-album__detail', m.detail) : null,
        h('span.year-album__origin', m.origin || (m.week ? 'Meta semanal · los pequeños pasos cuentan' : 'Elegido por vos')));
      var row = h(victory ? 'li.win' : 'li.memory', { dataset: { memoryId: m.id } }, victory ? MC.icon('star') : null, link);
      links.push(link);
      if (i >= 6) { row.hidden = true; hidden.push(row); }
      list.appendChild(row);
    });
    box.appendChild(list);
    if (hidden.length) {
      var more = h('button.text-btn.year-album__more', { type: 'button', 'aria-controls': list.id, 'aria-expanded': 'false' }, 'Ver ' + (victory ? 'todas las victorias' : 'todos los recuerdos'));
      more.addEventListener('click', function () { hidden.forEach(function (n) { n.hidden = false; }); more.remove(); links[6].focus(); });
      box.appendChild(more);
    }
    return box;
  }

  /* ---------- cuentas por período (A8): semana, mes y año; solo números y palabras, sin valorar ---------- */
  function tallies(all, today, current, palette) {
    var ps = MC.insights.periods(all, today);
    var keys = current ? [['week', 'Esta semana'], ['month', 'Este mes'], ['year', 'Este año']] : [['year', 'Ese año']];
    var chosen = current ? (MC.ui.get('yearPeriod', 'week') || 'week') : 'year';
    if (!ps[chosen]) chosen = 'week';
    var box = h('div.tally');
    var panel = h('div.tally__panel', { id: MC.uid('tally'), 'aria-live': 'polite' });
    if (keys.length > 1) {
      var group = h('div.choice-row.tally__switch', { role: 'radiogroup', 'aria-label': 'Período' });
      keys.forEach(function (k) {
        var b = h('button.choice', { type: 'button', role: 'radio', 'aria-checked': String(k[0] === chosen), 'aria-controls': panel.id }, k[1]);
        b.addEventListener('click', function () {
          chosen = k[0];
          MC.ui.set('yearPeriod', chosen);
          MC.$$('.choice', group).forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
          paint();
        });
        group.appendChild(b);
      });
      box.appendChild(group);
    }
    box.appendChild(panel);
    function line(icon, text, extra) { return h('li.tally__item', icon ? MC.icon(icon) : h('span.tally__dot', { 'aria-hidden': 'true' }), h('p', text, extra || null)); }
    function quoted(list) { return list.map(function (w) { return '«' + w.word + '»'; }).join(', '); }
    function paint() {
      var p = ps[chosen];
      MC.clear(panel);
      var items = [];
      if (p.written) items.push(line('edit', 'Escribiste ' + (p.written === 1 ? 'un día' : p.written + ' días') + '.'));
      if (p.feelingDays) {
        items.push(line(null, 'Anotaste emociones ' + (p.feelingDays === 1 ? 'un día' : p.feelingDays + ' días') + '. Las palabras que más aparecieron:',
          h('span.tally__words', p.words.slice(0, 5).map(function (w) { return h('span.tally__word', c.feelingMark(w.word, palette), ' (' + w.n + ')'); }))));
      }
      if (p.done) items.push(line('star', (p.done === 1 ? 'Hiciste una cosa' : 'Hiciste ' + p.done + ' cosas') + ' de tus listas.'));
      if (p.moved) items.push(line('later', (p.moved === 1 ? 'Una cosa pasó' : p.moved + ' cosas pasaron') + ' a otro día.'));
      if (p.beforeAfter) items.push(line(null, 'Anotaste cómo te sentías antes y después de algo ' + (p.beforeAfter === 1 ? 'una vez' : p.beforeAfter + ' veces') +
        (p.before.length && p.after.length ? '. Antes, lo más anotado: ' + quoted(p.before) + '; después: ' + quoted(p.after) + '.' : '.')));
      if (p.sheets) items.push(line('paginas', (p.sheets === 1 ? 'Empezaste una hoja' : 'Empezaste ' + p.sheets + ' hojas') + '.'));
      if (!items.length) panel.appendChild(h('p.section__hint', 'Todavía no hay nada anotado en este período. Un período vacío también está bien.'));
      else panel.appendChild(h('ul.tally__list', items));
    }
    paint();
    return box;
  }

  /* ---------- mes a mes (A8): barras SVG propias + tabla con los mismos números ---------- */
  function monthChart(rows, year) {
    var max = Math.max(1, Math.max.apply(null, rows.map(function (r) { return Math.max(r.written, r.feelings, r.done); })));
    var W = 360, H = 150, top = 10, base = H - 22, bw = 7, gap = W / 12;
    var NS = 'http://www.w3.org/2000/svg';
    function el(name, attrs) { var n = document.createElementNS(NS, name); Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); }); return n; }
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'chart__svg', 'aria-hidden': 'true', focusable: 'false' });
    [0.5, 1].forEach(function (f) { svg.appendChild(el('line', { x1: 0, x2: W, y1: base - (base - top) * f, y2: base - (base - top) * f, class: 'chart__grid' })); });
    svg.appendChild(el('line', { x1: 0, x2: W, y1: base, y2: base, class: 'chart__axis' }));
    rows.forEach(function (r, i) {
      var x0 = i * gap + gap / 2 - bw * 1.5 - 1;
      [['written', 'chart__bar--written'], ['feelings', 'chart__bar--feelings'], ['done', 'chart__bar--done']].forEach(function (k, j) {
        var v = r[k[0]];
        if (!v) return;
        var hgt = Math.max(2, (base - top) * v / max);
        svg.appendChild(el('rect', { x: x0 + j * (bw + 1), y: base - hgt, width: bw, height: hgt, rx: 1.5, class: 'chart__bar ' + k[1] }));
      });
      var t = el('text', { x: i * gap + gap / 2, y: H - 6, class: 'chart__label', 'text-anchor': 'middle' });
      t.textContent = D.MONTHS_SHORT[i].charAt(0).toUpperCase();
      svg.appendChild(t);
    });
    var total = rows.reduce(function (a, r) { return { written: a.written + r.written, feelings: a.feelings + r.feelings, done: a.done + r.done }; }, { written: 0, feelings: 0, done: 0 });
    var table = h('table.chart__table', { id: MC.uid('tbl'), hidden: true },
      h('caption.sr-only', 'Mes a mes en ' + year),
      h('thead', h('tr', h('th', { scope: 'col' }, 'Mes'), h('th', { scope: 'col' }, 'Días escritos'), h('th', { scope: 'col' }, 'Días con emociones'), h('th', { scope: 'col' }, 'Cosas hechas'))),
      h('tbody', rows.map(function (r) {
        return h('tr', h('th', { scope: 'row' }, D.capitalize(r.name)), h('td', String(r.written)), h('td', String(r.feelings)), h('td', String(r.done)));
      })));
    var toggle = h('button.text-btn', { type: 'button', 'aria-expanded': 'false', 'aria-controls': table.id }, 'Ver los números');
    toggle.addEventListener('click', function () {
      var open = table.hidden;
      table.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Ocultar los números' : 'Ver los números';
    });
    var summary = 'En ' + year + ': ' + total.written + ' días escritos, ' + total.feelings + ' días con emociones y ' + total.done + ' cosas hechas.';
    return h('figure.chart', { 'aria-labelledby': 'chart-cap' },
      h('figcaption.chart__cap', { id: 'chart-cap' }, h('span.chart__title', 'Mes a mes'), h('span.sr-only', ' ' + summary)),
      svg,
      h('ul.chart__legend', { 'aria-hidden': 'true' },
        h('li', h('span.chart__key.chart__bar--written'), 'días escritos'),
        h('li', h('span.chart__key.chart__bar--feelings'), 'días con emociones'),
        h('li', h('span.chart__key.chart__bar--done'), 'cosas hechas')),
      h('p.chart__note.t-meta', 'Cuentas, no metas: un mes con menos no es peor.'),
      h('div.noticed__actions', toggle),
      table);
  }

  /** Una observación con el camino a los días de los que habla (ver MC.insights). */
  function insightItem(i) {
    var li = h('li', h('p', i.text));
    var go = function (href, text) { return h('div.noticed__actions', h('a.text-btn', { href: href }, text)); };
    if (i.routineId && i.month) { li.appendChild(go(R.month(i.month, { routine: i.routineId }), 'Ver en el calendario')); return li; }
    var days = i.day ? [i.day] : (i.days || []);
    if (days.length === 1) { li.appendChild(go(R.day(days[0]), 'Ir a ese día')); return li; }
    if (!days.length) return li;
    var thisYear = D.today().slice(0, 4);
    var list = h('p.noticed__days', { id: MC.uid('days'), hidden: true });
    days.forEach(function (k, n) {
      if (n) list.appendChild(document.createTextNode(' · '));
      list.appendChild(h('a', { href: R.day(k) }, D.shortLabel(k) + (k.slice(0, 4) === thisYear ? '' : ' ' + k.slice(0, 4))));
    });
    var btn = h('button.text-btn', { type: 'button', 'aria-expanded': 'false', 'aria-controls': list.id }, 'Ver los días');
    btn.addEventListener('click', function () {
      var open = list.hidden;
      list.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? 'Ocultar los días' : 'Ver los días';
    });
    li.appendChild(h('div.noticed__actions', btn));
    li.appendChild(list);
    return li;
  }

  MC.views = MC.views || {};
  MC.views.year = { render: render };
})(window);
