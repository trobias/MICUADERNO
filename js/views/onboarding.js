/* Primera apertura: tres hojas cortas, todo salteable. Ver SPEC §6.1. */
(function (root) {
  'use strict';
  var MC = root.MC;
  var h = MC.h, M = MC.model, c = MC.c;

  var TRACK = [
    ['morning', 'Cómo arranco el día'],
    ['evening', 'Cómo termina el día'],
    ['activities', 'Cosas para hacer'],
    ['reflection', 'Reflexiones y cosas lindas'],
    ['energy', 'Mi energía'],
    ['sleep', 'Las horas que dormí']
  ];
  var COVER_NAMES = { salvia: 'Salvia', rosa: 'Rosa viejo', lavanda: 'Lavanda', manteca: 'Manteca' };

  function render(main) {
    var s = MC.clone(M.settings());
    var step = 0;
    var page = h('section.page.page--margin.onboard-page');
    main.appendChild(h('div.spread.spread--single', page));

    function dots() {
      return h('ol.onboard__steps', { 'aria-label': 'Pasos' }, [0, 1, 2].map(function (i) {
        return h('li.onboard__dot', { class: i < step ? 'is-done' : null, 'aria-current': i === step ? 'step' : null },
          h('span.sr-only', 'Paso ' + (i + 1) + ' de 3' + (i < step ? ', listo' : '')));
      }));
    }

    function nav(nextLabel, onNext, skippable) {
      var next = h('button.label-btn', { type: 'button' }, nextLabel);
      next.addEventListener('click', onNext);
      var row = h('div.onboard__actions', next);
      if (step > 0) row.insertBefore(h('button.text-btn', { type: 'button', on: { click: function () { step--; paint(); } } }, MC.icon('arrow-left'), 'Volver'), next);
      if (skippable) row.appendChild(h('button.text-btn', { type: 'button', on: { click: function () { step++; paint(); } } }, 'Saltar'));
      return row;
    }

    function paint() {
      MC.clear(page);
      var wrap = h('div.onboard');
      wrap.appendChild(dots());
      if (step === 0) {
        var input = h('input.input', { id: 'ob-name', type: 'text', value: s.name, maxlength: 40, autocomplete: 'given-name', placeholder: 'tu nombre o un apodo' });
        var go = function () { s.name = input.value.trim(); step = 1; paint(); };
        input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); go(); } });
        wrap.appendChild(h('h1', '¿Cómo querés que te llame?'));
        wrap.appendChild(h('div.field', h('label', { for: 'ob-name' }, 'Es opcional. Lo podés cambiar cuando quieras.'), input));
        wrap.appendChild(nav('Seguir', go, true));
        wrap.appendChild(h('p.onboard__privacy', MC.icon('lock'), 'Tus páginas viven en este dispositivo. No hay cuenta ni nube: nadie más las ve.'));
        page.appendChild(wrap);
        setTimeout(function () { input.focus(); }, 30);
        return;
      }
      if (step === 1) {
        wrap.appendChild(h('h1', '¿Qué querés registrar?'));
        wrap.appendChild(h('p.section__hint', 'Elegí lo que te sirva. Lo demás no aparece, y podés cambiarlo después.'));
        var list = h('ul.check-list');
        TRACK.forEach(function (t) {
          var id = 'ob-' + t[0];
          var cb = h('input', { type: 'checkbox', id: id, checked: s.track[t[0]] });
          cb.addEventListener('change', function () { s.track[t[0]] = cb.checked; });
          list.appendChild(h('li', h('label.check', { for: id }, cb, h('span', t[1]))));
        });
        wrap.appendChild(list);
        wrap.appendChild(nav('Seguir', function () { step = 2; paint(); }));
        page.appendChild(wrap);
        return;
      }
      wrap.appendChild(h('h1', 'Elegí una tapa'));
      var choices = h('div.cover-choices', { role: 'group', 'aria-label': 'Tapas' });
      M.COVERS.forEach(function (cv) {
        var b = h('button.cover-choice', { type: 'button', 'aria-pressed': String(s.cover === cv), dataset: { cover: cv } },
          h('span.cover-choice__swatch', { 'aria-hidden': 'true' }), h('span', COVER_NAMES[cv]));
        b.addEventListener('click', function () {
          s.cover = cv;
          document.body.dataset.cover = cv;
          MC.$$('.cover-choice', choices).forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.cover === cv)); });
        });
        choices.appendChild(b);
      });
      wrap.appendChild(choices);
      wrap.appendChild(nav('Abrir mi cuaderno', function () {
        s.onboarded = true;
        M.saveSettings(s).then(function () { MC.app.leaveOnboarding(MC.routes.today()); });
      }));
      page.appendChild(wrap);
    }

    paint();
    return { destroy: function () {} };
  }

  MC.views = MC.views || {};
  MC.views.onboarding = { render: render, COVER_NAMES: COVER_NAMES, TRACK: TRACK };
})(window);
