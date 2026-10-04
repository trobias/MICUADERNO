/* Recordatorios locales: papelitos, no presión. Ver SPEC §14 y DECISIONS D11.
   Nunca incluyen lo que escribió la persona (ni títulos de actividades): se ven en la pantalla bloqueada. */
(function (root) {
  'use strict';
  var MC = root.MC;
  var h = MC.h, D = MC.dates, M = MC.model, c = MC.c;

  var ICON = 'assets/icons/notification-icon.png';
  var BADGE = 'assets/icons/notification-badge.png';
  var supported = 'Notification' in root;

  var MESSAGES = {
    morning: { title: '☀ Buenos días', body: 'Tu cuaderno tiene una página nueva esperando. ¿Cómo empezaste hoy?' },
    evening: { title: '☾ Antes de terminar el día…', body: '¿Cómo terminó tu día? Guardá una pequeña línea.' },
    routines: { title: 'Un pequeño recordatorio', body: 'Hoy hay cosas de tus rutinas en tu cuaderno. Podés hacerlas cuando quieras.' },
    comeback: { title: 'Tu cuaderno sigue acá', body: 'Cuando quieras, podés volver.' },
    test: { title: 'MI CUADERNO', body: 'Así se van a ver tus recordatorios. Suaves, como un papelito.' }
  };

  function permission() { return supported ? Notification.permission : 'unsupported'; }

  function show(kind) {
    var s = M.settings().notify;
    if (!supported || permission() !== 'granted' || s.mode === 'silencioso') return Promise.resolve(false);
    var msg = MESSAGES[kind];
    var opts = { body: msg.body, icon: ICON, badge: BADGE, tag: 'mc-' + kind, silent: s.mode !== 'normal', data: { url: './' + MC.routes.today() }, lang: 'es-AR' };
    var viaSW = navigator.serviceWorker && navigator.serviceWorker.controller
      ? navigator.serviceWorker.ready.then(function (reg) { return reg.showNotification(msg.title, opts); })
      : Promise.reject();
    return viaSW.catch(function () {
      var n = new Notification(msg.title, opts);
      n.onclick = function () { window.focus(); location.hash = MC.routes.today(); n.close(); };
    }).then(function () { return true; });
  }

  function minutes(hhmm) { var p = hhmm.split(':'); return (+p[0]) * 60 + (+p[1]); }

  /** Revisa, una vez por minuto, si toca algún papelito de hoy. */
  function check() {
    var s = M.settings();
    if (!s.notify.enabled || permission() !== 'granted' || s.notify.mode === 'silencioso') return;
    var today = D.today();
    var now = new Date();
    var nowMin = now.getHours() * 60 + now.getMinutes();
    M.getMeta('notifyLog', {}).then(function (log) {
      log = log || {};
      var jobs = [];
      function due(kind, time) { return log[kind] !== today && nowMin >= minutes(time) && nowMin < minutes(time) + 120; }
      if (s.notify.morning.on && due('morning', s.notify.morning.time)) {
        jobs.push(M.getDay(today).then(function (d) { if (!M.feelingsOf(d.morning).length) return show('morning').then(function () { log.morning = today; }); log.morning = today; }));
      }
      if (s.notify.evening.on && due('evening', s.notify.evening.time)) {
        jobs.push(M.getDay(today).then(function (d) { if (!M.feelingsOf(d.evening).length) return show('evening').then(function () { log.evening = today; }); log.evening = today; }));
      }
      if (s.notify.routines && due('routines', s.notify.morning.time)) {
        jobs.push(M.itemsForDay(today).then(function (items) {
          var pending = items.filter(function (i) { return i.routineId && i.status === 'pending'; });
          log.routines = today;
          if (pending.length) return show('routines');
        }));
      }
      if (jobs.length) Promise.all(jobs).then(function () { return M.setMeta('notifyLog', log); });
    });
  }

  function registerPeriodic() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready.then(function (reg) {
      if (!reg.periodicSync) return;
      return navigator.permissions.query({ name: 'periodic-background-sync' }).then(function (st) {
        if (st.state === 'granted') return reg.periodicSync.register('mc-reminders', { minInterval: 60 * 60 * 1000 });
      });
    }).catch(function () { /* no disponible: está bien */ });
  }

  function enable() {
    if (!supported) return Promise.resolve(false);
    return Notification.requestPermission().then(function (p) {
      var ok = p === 'granted';
      var n = Object.assign({}, M.settings().notify, { enabled: ok });
      return M.saveSettings({ notify: n, notifyAsked: true }).then(function () {
        if (ok) registerPeriodic();
        return ok;
      });
    });
  }

  /** Papelito que ofrece recordatorios, después de algunos días de uso. Nunca al abrir por primera vez. */
  function offerSlip() {
    var s = M.settings();
    if (!supported || s.notifyAsked || s.notify.enabled || permission() !== 'default') return null;
    var slip = h('div.slip.slip--butter.notify-slip', { hidden: true },
      h('p', '¿Querés que te deje un pequeño recordatorio para volver a tu cuaderno? ♡'),
      h('p.t-soft', 'A la mañana y a la noche. Lo cambiás o lo apagás cuando quieras en Ajustes.'),
      h('div.slip__actions',
        h('button.label-btn', { type: 'button', on: { click: function () {
          enable().then(function (ok) { slip.remove(); c.toast(ok ? 'Listo. Van a ser pocos y suaves.' : 'El navegador no dio permiso. Podés probar después desde Ajustes.'); });
        } } }, MC.icon('bell'), 'Sí, dale'),
        h('button.text-btn', { type: 'button', on: { click: function () { M.saveSettings({ notifyAsked: true }); slip.remove(); } } }, 'No, gracias')));
    M.getMeta('openedDays', 0).then(function (n) { if (n >= 3) slip.hidden = false; });
    return slip;
  }

  function settingsSection() {
    var s = MC.clone(M.settings().notify);
    var wrap = h('div.notify-settings');
    function saveN(msg) { return M.saveSettings({ notify: s }).then(function () { if (msg) c.toast(msg); }); }

    function paint() {
      MC.clear(wrap);
      var perm = permission();
      if (!supported) {
        wrap.appendChild(h('p.section__hint', 'Este navegador no permite recordatorios. Si instalás el cuaderno como app desde su dirección web, puede que sí.'));
        return;
      }
      if (perm === 'denied') {
        wrap.appendChild(h('p.section__hint', 'El navegador tiene los recordatorios bloqueados para el cuaderno. Si los querés, habilitalos desde la configuración del sitio en el navegador.'));
      }
      var on = h('input', { type: 'checkbox', id: 'nt-on', checked: s.enabled && perm === 'granted', disabled: perm === 'denied' });
      on.addEventListener('change', function () {
        if (on.checked && perm !== 'granted') {
          enable().then(function (ok) { s = MC.clone(M.settings().notify); paint(); if (!ok) c.toast('El navegador no dio permiso.'); });
          return;
        }
        s.enabled = on.checked; saveN(); paint();
      });
      wrap.appendChild(h('ul.check-list', h('li', h('label.check', { for: 'nt-on' }, on, h('span', 'Quiero recordatorios suaves')))));
      if (!(s.enabled && perm === 'granted')) {
        wrap.appendChild(h('p.section__hint', 'Solo aparecen si los activás. Nunca muestran lo que escribiste.'));
        return;
      }
      function timeRow(key, label) {
        var cb = h('input', { type: 'checkbox', id: 'nt-' + key, checked: s[key].on });
        var t = h('input.input.input--time', { type: 'time', value: s[key].time, 'aria-label': 'Hora de ' + label.toLowerCase() });
        cb.addEventListener('change', function () { s[key].on = cb.checked; saveN(); });
        t.addEventListener('change', function () { if (/^\d{2}:\d{2}$/.test(t.value)) { s[key].time = t.value; saveN('Hora guardada.'); } });
        return h('li.time-row', h('label.check', { for: 'nt-' + key }, cb, h('span', label)), t);
      }
      function simple(key, label, hint) {
        var cb = h('input', { type: 'checkbox', id: 'nt-' + key, checked: s[key] });
        cb.addEventListener('change', function () { s[key] = cb.checked; saveN(); });
        return h('li', h('label.check', { for: 'nt-' + key }, cb, h('span', label, hint ? h('span.check__hint', hint) : null)));
      }
      wrap.appendChild(h('ul.check-list',
        timeRow('morning', 'Inicio del día'),
        timeRow('evening', 'Cierre del día'),
        simple('routines', 'Recordarme mis rutinas', 'Junto con el de la mañana, sin decir cuáles.'),
        simple('comeback', 'Si pasan varios días sin abrir', '“Tu cuaderno sigue acá.” Solo con el cuaderno instalado.')));
      var modes = h('div.choice-row', { role: 'radiogroup', 'aria-label': 'Modo' });
      [['normal', 'Normal'], ['tranquilo', 'Tranquilo (sin sonido)'], ['silencioso', 'Silencioso (pausa)']].forEach(function (m) {
        var b = h('button.choice', { type: 'button', role: 'radio', 'aria-checked': String(s.mode === m[0]) }, m[1]);
        b.addEventListener('click', function () { s.mode = m[0]; saveN(); MC.$$('.choice', modes).forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); }); });
        modes.appendChild(b);
      });
      wrap.appendChild(h('div.field', h('span', 'Modo'), modes));
      wrap.appendChild(h('button.text-btn', { type: 'button', on: { click: function () { show('test'); } } }, MC.icon('bell'), 'Probar cómo se ve'));
      wrap.appendChild(h('p.section__hint', 'Sin servidor no hay “push” remoto: los recordatorios salen mientras el cuaderno está abierto o en segundo plano, y en algunos navegadores también con el cuaderno instalado y cerrado.'));
    }
    paint();
    return c.section('Recordatorios', wrap, { id: 'st-notify' });
  }

  function start() {
    if (!supported) return;
    check();
    setInterval(check, 60000);
    if (M.settings().notify.enabled) registerPeriodic();
  }

  MC.notify = { start: start, check: check, show: show, enable: enable, offerSlip: offerSlip, settingsSection: settingsSection, MESSAGES: MESSAGES };
})(window);
