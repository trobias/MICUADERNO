/* Búsqueda plegada de Mis hojas, inspirada en beui.dev/components/blocks/morphing-search. */
(function (root) {
  'use strict';
  var MC = root.MC, h = MC.h, M = MC.model, c = MC.c;
  c.notebookSearch = function () {
    var id = MC.uid('buscar'), alive = true, seq = 0, entries = null, timer = null;
    var input = h('input.input', { id: id, type: 'search', maxlength: 160, placeholder: 'Una palabra, emoción o actividad…', 'aria-label': 'Buscar en mi cuaderno', dataset: { browse: '1' } });
    var list = h('ol.notebook-search__results'), status = h('p.t-meta', { role: 'status' });
    var type = h('select.select', { 'aria-label': 'Tipo de resultado', dataset: { browse: '1' } },
      [['', 'Todo'], ['day', 'Días'], ['page', 'Hojas'], ['activity', 'Actividades'], ['routine', 'Repeticiones'], ['week', 'Semanas'], ['memory', 'Recuerdos']].map(function (t) { return h('option', { value: t[0] }, t[1]); }));
    var from = h('input.input', { type: 'date', 'aria-label': 'Buscar desde', dataset: { browse: '1' } });
    var to = h('input.input', { type: 'date', 'aria-label': 'Buscar hasta', dataset: { browse: '1' } });
    var details = h('details.notebook-search', h('summary', MC.icon('search'), 'Buscar en mi cuaderno'),
      h('label.sr-only', { for: id }, 'Buscar en mi cuaderno'), input,
      h('details.notebook-search__filters', h('summary', 'Filtrar resultados'), h('div.notebook-search__fields', type, from, to)), status, list);
    function paint() {
      if (!alive) return; MC.clear(list);
      if (!input.value.trim()) { status.textContent = 'Buscá por palabras o por fecha (AAAA-MM-DD).'; return; }
      if (from.value && to.value && from.value > to.value) { status.textContent = 'La fecha inicial tiene que quedar antes de la final.'; return; }
      if (!entries) { status.textContent = 'Preparando el índice del cuaderno…'; return; }
      var matches = MC.search.query(entries, input.value, { type: type.value, from: from.value, to: to.value, limit: 61 });
      status.textContent = matches.length > 60 ? 'Más de 60 resultados. Podés afinar la búsqueda.' : matches.length === 1 ? '1 resultado' : matches.length + ' resultados';
      matches.slice(0, 60).forEach(function (m) {
        var link = h('a', { href: m.href }, m.title); var text = m.text.replace(/\s+/g, ' ');
        list.appendChild(h('li', link, h('p.t-meta', MC.dates.shortLabel(m.date)), h('p', text.slice(0, 160) + (text.length > 160 ? '…' : ''))));
      });
    }
    function load() {
      var current = ++seq; entries = null; paint();
      M.everything().then(function (raw) {
        if (!alive || current !== seq) return;
        entries = MC.search.build(raw, { guest: MC.access.guest(), allowed: MC.sections.ids().filter(function (s) { return !!MC.access.level([s]); }) }); paint();
      }, function () { if (alive && current === seq) status.textContent = 'No se pudo preparar la búsqueda. Cerrala y volvé a abrirla para reintentar.'; });
    }
    details.addEventListener('toggle', function () { if (details.open) load(); else { clearTimeout(timer); seq++; entries = null; MC.clear(list); } });
    input.addEventListener('input', paint); [type, from, to].forEach(function (el) { el.addEventListener('change', paint); });
    var off = MC.on('store:changed', function () { if (alive && details.open) { clearTimeout(timer); timer = setTimeout(load, 200); } });
    details.destroy = function () { alive = false; clearTimeout(timer); off(); seq++; entries = null; };
    return details;
  };
})(window);
