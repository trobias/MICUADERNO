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
        h('p.t-text', (day ? 'Este día sigue' : 'Esta página sigue') + ' en tu cuaderno, en el calendario y en tus copias. ' +
          (opts.share ? 'Estas casillas deciden qué te vuelve a mostrar el cuaderno; las de abajo, qué ven quienes miran tu cuaderno.' : 'Esto solo decide qué te vuelve a mostrar el cuaderno.')),
        list,
        opts.share ? shareBlock(opts) : null,
        opts.empty ? h('p.section__hint', 'Se guarda junto con lo primero que anotes este día.') : null
      ],
      actions: [{ label: 'Listo', kind: 'primary' }],
      onClose: opts.onClose
    });
  }

  /**
   * “Qué ven quienes miran tu cuaderno” (D53): solo con cuenta y en el cuaderno propio. Lo destildado no le llega a
   * nadie más (va aparte, privado, en la nube). opts.share: { store, parts: [{ label, fields?, block? }], hide, onChange }.
   */
  function shareBlock(opts) {
    var day = opts.kind === 'day';
    var sh = opts.share;
    var cur = MC.sections.sanitizeHide(sh.hide, sh.store) || { all: false, fields: [], blocks: [] };
    var boxes = [];
    function emit() {
      var next = { all: !mainBox.checked, fields: [], blocks: [] };
      boxes.forEach(function (x) {
        if (x.box.checked) return;
        (x.part.fields || []).forEach(function (f) { next.fields.push(f); });
        if (x.part.block) next.blocks.push(x.part.block);
      });
      boxes.forEach(function (x) { x.box.disabled = !mainBox.checked; });
      sh.onChange(MC.sections.sanitizeHide(next, sh.store));
    }
    var mainId = MC.uid('qv');
    var mainBox = h('input', { type: 'checkbox', id: mainId, checked: !cur.all });
    mainBox.addEventListener('change', emit);
    var list = h('ul.check-list.share-parts');
    sh.parts.forEach(function (p) {
      var id = MC.uid('qv');
      var hidden = p.block ? cur.blocks.indexOf(p.block) !== -1 : (p.fields || []).every(function (f) { return cur.fields.indexOf(f) !== -1; });
      var box = h('input', { type: 'checkbox', id: id, checked: !hidden, disabled: cur.all });
      box.addEventListener('change', emit);
      boxes.push({ box: box, part: p });
      list.appendChild(h('li', h('label.check', { for: id }, box, h('span', p.label))));
    });
    return h('div.share-block',
      h('h3.share-block__title', 'Qué ven quienes miran tu cuaderno'),
      h('p.section__hint', 'Siempre dentro de lo que les compartiste en Mi cuenta. Lo que destildes no les llega: queda solo para vos.'),
      h('label.check.share-block__all', { for: mainId }, mainBox, h('span', day ? 'Mostrar este día' : 'Mostrar esta hoja')),
      list);
  }
  /** Con cuenta, en el cuaderno propio: ¿se ofrece “Qué ven”? */
  function canShare() { return !!(MC.cloud && MC.cloud.mode === 'owner'); }

  /**
   * Acceso a la privacidad con su estado en palabras (nunca solo por color): “Privacidad” o “Con privacidad”.
   * `compact`: solo el candado a la vista (las palabras quedan para el lector de pantalla y el tooltip).
   */
  function privacyButton(privacy, onClick, compact, hide) {
    var text = h(compact ? 'span.sr-only' : 'span');
    var b = h('button.text-btn.privacy-btn', { type: 'button', 'aria-haspopup': 'dialog' }, MC.icon('lock'), text);
    b.paint = function (p, hide) {
      text.textContent = M.sanitizePrivacy(p) || hide ? 'Con privacidad' : 'Privacidad';
      if (compact) b.title = text.textContent;
    };
    b.paint(privacy, hide);
    b.addEventListener('click', onClick);
    return b;
  }

  /** Las partes de un día que se pueden ocultar (D53). */
  var DAY_PARTS = [
    { label: 'Cómo arrancó', fields: ['morning'] }, { label: 'Cómo terminó', fields: ['evening'] },
    { label: 'El cuerpo (energía y sueño)', fields: ['energy', 'sleep'] }, { label: 'Algo que quiero cuidar', fields: ['intention'] },
    { label: 'Durante el día', fields: ['notes'] }, { label: 'Las reflexiones del cierre', fields: ['reflection'] },
    { label: 'Los stickers de la página', fields: ['stickers'] }
  ];
  /** Las de una hoja: cada bloque, el papel y los stickers. */
  function pageParts(page) {
    var KIND = { text: 'renglones', list: 'lista', checks: 'casillas', columns: 'columnas' };
    return (page.blocks || []).map(function (b, i) { return { label: b.title ? '«' + b.title + '»' : 'Bloque ' + (i + 1) + ' (' + (KIND[b.type] || b.type) + ')', block: b.id }; })
      .concat([{ label: 'El papel', fields: ['paper'] }, { label: 'Los stickers y dibujos', fields: ['stickers'] }]);
  }

  MC.privacy = { dialog: privacyDialog, button: privacyButton, canShare: canShare, DAY_PARTS: DAY_PARTS, pageParts: pageParts };
})(window);
