/* Recuerdos y victorias: una sola hojita contextual, siempre por referencia (D59). */
(function (root) {
  'use strict';
  var MC = root.MC, M = MC.model, h = MC.h, c = MC.c;
  function allowed() { return !MC.access || MC.access.level(['anio']) === 'editar'; }

  function editor(type, id, kind, opts) {
    opts = opts || {};
    if (!allowed()) return;
    return M.getMarks().then(function (marks) {
      var old = marks.find(function (m) { return m.id === M.markId(type, id, kind); });
      var special = kind === 'especial';
      var keys = special ? ['personal', 'first', 'meeting', 'choice', 'return'] : Object.keys(M.MEMORY_CATEGORIES);
      var selectId = MC.uid('memory-kind'), noteId = MC.uid('memory-note');
      var select = h('select', { id: selectId }, keys.map(function (key) {
        return h('option', { value: key }, M.MEMORY_CATEGORIES[key]);
      }));
      select.value = old && old.category || 'personal';
      var note = h('textarea.write', { id: noteId, rows: 2, maxlength: 200, value: old && old.note || '', placeholder: 'Si querés, con tus propias palabras…' });
      note.addEventListener('input', function () { MC.emit('typing'); });
      var error = h('p.section__hint', { role: 'alert', hidden: true });
      function save(details) {
        return M.setMemory(type, id, kind, details).then(function () {
          c.toast(details === null ? 'Ya no aparece entre tus recuerdos.' : special ? 'Queda señalado: al marcarlo, aparece en Mi año.' : 'Quedó guardado en Mi año.', {
            action: 'Ver', onAction: function () { location.hash = MC.routes.year((opts.date || MC.dates.today()).slice(0, 4)); }
          });
        }).catch(function () { error.hidden = false; error.textContent = 'Todavía no se pudo guardar. Podés volver a intentarlo.'; return false; });
      }
      var actions = [{ label: 'Guardar en Mi año', kind: 'primary', onClick: function () { return save({ category: select.value, note: note.value }); } }];
      if (old) actions.unshift({ label: 'Quitar de Mi año', kind: 'text', onClick: function () { return save(null); } });
      c.dialog({ title: special ? 'Esto es especial para mí' : kind === 'recuerdo' ? 'Quiero recordarlo' : kind === 'terminado' ? 'Una creación terminada' : 'Mi pequeña victoria', className: 'memory-editor',
        content: [h('p.t-text', opts.title || ''),
          h('p.section__hint', special ? (type === 'routine' ? 'Se aplica a esta repetición. ' : '') + 'Aparece cuando marques Lo hice o Hice un poquito. Primera vez guarda solo el primer registro.' : 'Vos elegís qué merece un lugar acá. No hace falta alcanzar ninguna meta.'),
          kind === 'recuerdo' || kind === 'terminado' ? null : h('div.field', h('label', { for: selectId }, 'Qué significa para mí'), select),
          h('div.field', h('label', { for: noteId }, 'Una frase para guardar (opcional)'), note), error], actions: actions });
    });
  }

  function item(type, id, kind, label, opts) {
    return { label: label, icon: kind === 'recuerdo' ? 'pin' : 'star', onSelect: function () { editor(type, id, kind, opts); } };
  }
  MC.memories = { editor: editor, item: item, allowed: allowed };
})(window);
