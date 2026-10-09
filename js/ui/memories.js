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
      var closed = false, notice = null, pointerSave = false;
      function announce() {
        if (!notice) return;
        var current = notice; notice = null;
        var art = current.receipt ? h('span.memory-receipt', { 'aria-hidden': 'true', html: '<svg viewBox="0 0 40 40" focusable="false"><g class="memory-receipt__paper"><rect x="11" y="6" width="18" height="27" rx="1"/><path d="M15 12h10M15 17h7"/></g><path class="memory-receipt__pocket" d="M4 22l16 5 16-5v14H4z"/><path class="memory-receipt__check" d="m16 31 3 3 6-6"/></svg>' }) : null;
        c.toast(current.text, { decoration: art, action: 'Ver', onAction: function () { location.hash = MC.routes.year((opts.date || MC.dates.today()).slice(0, 4)); } });
        var active = document.activeElement;
        if (art && current.pointer && MC.motion.allows('move') && !MC.motion.systemReduced() && !document.hidden && !(active && /^(INPUT|TEXTAREA)$/.test(active.tagName))) {
          var paper = art.querySelector('.memory-receipt__paper');
          if (paper.animate) paper.animate([{ opacity: .4, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }],
            { duration: MC.motion.duration('ui'), easing: getComputedStyle(document.documentElement).getPropertyValue('--ease-out').trim() });
        }
      }
      function save(details) {
        return M.setMemory(type, id, kind, details).then(function () {
          notice = { text: details === null ? 'Ya no aparece entre tus recuerdos.' : special ? 'Queda señalado: al marcarlo, aparece en Mi año.' : 'Quedó guardado en Mi año.', receipt: details !== null && !special, pointer: pointerSave };
          if (closed) announce();
        }).catch(function () { error.hidden = false; error.textContent = 'Todavía no se pudo guardar. Podés volver a intentarlo.'; if (closed) c.toast(error.textContent); return false; });
      }
      var actions = [{ label: 'Guardar en Mi año', kind: 'primary', onClick: function () { return save({ category: select.value, note: note.value }); } }];
      if (old) actions.unshift({ label: 'Quitar de Mi año', kind: 'text', onClick: function () { return save(null); } });
      var dlg = c.dialog({ title: special ? 'Esto es especial para mí' : kind === 'recuerdo' ? 'Quiero recordarlo' : kind === 'terminado' ? 'Una creación terminada' : 'Mi pequeña victoria', className: 'memory-editor', onClose: function () { closed = true; announce(); },
        content: [h('p.t-text', opts.title || ''),
          h('p.section__hint', special ? (type === 'routine' ? 'Se aplica a esta repetición. ' : '') + 'Aparece cuando marques Lo hice o Hice un poquito. Primera vez guarda solo el primer registro.' : 'Vos elegís qué merece un lugar acá. No hace falta alcanzar ninguna meta.'),
          kind === 'recuerdo' || kind === 'terminado' ? null : h('div.field', h('label', { for: selectId }, 'Qué significa para mí'), select),
          h('div.field', h('label', { for: noteId }, 'Una frase para guardar (opcional)'), note), error], actions: actions });
      dlg.el.addEventListener('click', function (e) { if (e.target.closest('.sheet__actions button')) pointerSave = e.detail > 0; }, true);
    });
  }

  function item(type, id, kind, label, opts) {
    return { label: label, icon: kind === 'recuerdo' ? 'pin' : 'star', onSelect: function () { editor(type, id, kind, opts); } };
  }
  MC.memories = { editor: editor, item: item, allowed: allowed };
})(window);
