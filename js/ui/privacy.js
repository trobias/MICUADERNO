/* Privacidad de un día o de una hoja (PV1). La usan la página del día y la hoja suelta. Ver DATA_MODEL §Privacidad. */
(function (root) {
  'use strict';
  var MC = root.MC;
  var h = MC.h, M = MC.model, c = MC.c;

  /* ---------- Privacidad de un día o de una página (PV1) ---------- */
  /**
   * Tres casillas que se guardan al tocarlas. La usan la hoja suelta (su menú) y la página del día (su encabezado).
   * opts: { kind: 'day' | 'page', privacy, empty, onChange(privacy | null) }
   */
  function privacyDialog(opts) {
    var day = opts.kind === 'day';
    var it = day ? 'lo' : 'la';
    var current = M.sanitizePrivacy(opts.privacy) || { noMemory: false, noInsights: false, noReviews: false };
    var OPTIONS = [
      { key: 'noMemory', label: 'No traer' + it + ' como recuerdo', hint: (day ? 'No aparece en “Lo que guardé” ni en' : 'No aparece en') + ' los recuerdos que el cuaderno te acerque.' },
      { key: 'noInsights', label: 'No usar' + it + ' en “Lo que fui notando”', hint: day ? 'Sus ánimos y lo que hiciste no entran en esas cuentas.' : 'Lo que escribiste acá no entra en esas cuentas.' },
      { key: 'noReviews', label: 'No incluir' + it + ' en los repasos', hint: 'Queda afuera de ' + (day ? '“Lo que guardé” y de ' : '') + 'los repasos de la semana o del mes.' }
    ];
    var list = h('ul.check-list');
    OPTIONS.forEach(function (o) {
      var id = MC.uid('pv');
      var cb = h('input', { type: 'checkbox', id: id, checked: current[o.key] });
      cb.addEventListener('change', function () { current[o.key] = cb.checked; opts.onChange(M.sanitizePrivacy(current)); });
      list.appendChild(h('li', h('label.check', { for: id }, cb, h('span', o.label, h('span.check__hint', o.hint)))));
    });
    c.dialog({
      title: day ? 'Privacidad de este día' : 'Privacidad de esta página',
      content: [
        h('p.t-text', (day ? 'Este día sigue' : 'Esta página sigue') + ' en tu cuaderno, en el calendario y en tus copias. Esto solo decide qué te vuelve a mostrar el cuaderno.'),
        list,
        opts.empty ? h('p.section__hint', 'Se guarda junto con lo primero que anotes este día.') : null
      ],
      actions: [{ label: 'Listo', kind: 'primary' }],
      onClose: opts.onClose
    });
  }

  /**
   * Acceso a la privacidad con su estado en palabras (nunca solo por color): “Privacidad” o “Con privacidad”.
   * `compact`: solo el candado a la vista (las palabras quedan para el lector de pantalla y el tooltip).
   */
  function privacyButton(privacy, onClick, compact) {
    var text = h(compact ? 'span.sr-only' : 'span');
    var b = h('button.text-btn.privacy-btn', { type: 'button', 'aria-haspopup': 'dialog' }, MC.icon('lock'), text);
    b.paint = function (p) {
      text.textContent = M.sanitizePrivacy(p) ? 'Con privacidad' : 'Privacidad';
      if (compact) b.title = text.textContent;
    };
    b.paint(privacy);
    b.addEventListener('click', onClick);
    return b;
  }

  MC.privacy = { dialog: privacyDialog, button: privacyButton };
})(window);
