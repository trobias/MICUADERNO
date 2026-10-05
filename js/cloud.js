/* Cuentas de la nube (etapa B, D37–D38). No hace nada en file:// ni en un servidor sin cuentas: solo se activa
   cuando el index.html trae <meta name="mc-cloud"> (lo agrega tools/copy-notebook.mjs al publicar en Vercel).
   Con cuentas, cada persona tiene SU base local (IndexedDB `mi-cuaderno@<id>`) y sus preferencias de UI,
   así dos personas que comparten un dispositivo nunca se mezclan. Quien no tiene cuaderno propio abre el de
   quien le dio permiso (modo invitada, js/sync.js), sin copia local. Se carga antes que store.js. */
(function (root) {
  'use strict';
  var MC = root.MC || (root.MC = {});
  var doc = root.document;
  var on = !!(doc && doc.querySelector('meta[name="mc-cloud"]')) && /^https?:$/.test(root.location.protocol);
  var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  function cookie(name) {
    var m = doc && doc.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }
  function setCookie(name, value) {
    doc.cookie = name + '=' + encodeURIComponent(value) + '; path=/; max-age=34560000; samesite=lax' + (root.location.protocol === 'https:' ? '; secure' : '');
  }

  var person = on ? cookie('mc_person') : null;
  if (person && !UUID.test(person)) person = null;
  // Qué cuaderno se abre: el propio (view = person) o el de quien compartió (view = su id).
  var view = on ? cookie('mc_view') : null;
  if (view && !UUID.test(view)) view = null;

  MC.cloud = {
    on: on,
    person: person,
    view: view,
    /** 'owner' (su propio cuaderno), 'guest' (el de otra persona) o null (sin cuentas). */
    mode: !on || !person ? null : view === person ? 'owner' : view ? 'guest' : null,
    /** Sufijo de la base y de las preferencias para la persona con sesión ('' sin cuentas). */
    suffix: person ? '@' + person : '',
    leaving: false,
    accountUrl: '/cuenta'
  };

  if (!on) return;
  if (MC.ui) MC.ui.prefix = person + '.';

  function go(url) {
    MC.cloud.leaving = true;
    root.location.replace(url);
  }
  // Sin persona (cerró sesión o nunca entró): al ingreso. Sin conexión, el ingreso no carga: se muestra igual.
  if (!person) { go('/entrar'); return; }
  // Sin saber qué cuaderno abrir (sesión de antes de D38, o recién le compartieron): se pregunta una vez y se
  // recarga; si no hay ninguno para abrir, Mi cuenta lo explica.
  if (!MC.cloud.mode) {
    MC.cloud.leaving = true;
    root.fetch('/api/me', { credentials: 'same-origin', cache: 'no-store' }).then(function (res) {
      if (res.status === 401) return { gone: true };
      return res.ok ? res.json() : null;
    }).then(function (me) {
      if (me && me.gone) { go('/entrar'); return; }
      if (!me) { go(MC.cloud.accountUrl); return; }
      var next = me.hasNotebook ? person : (me.shares && me.shares[0] && me.shares[0].owner);
      if (next) { setCookie('mc_view', next); go('/'); } else go(MC.cloud.accountUrl);
    }).catch(function () { go(MC.cloud.accountUrl); });
    return;
  }

  // Con conexión, se confirma que la sesión siga viva y que el cuaderno que se abre siga permitido;
  // si cambió (le dieron o sacaron permisos), se ajusta y se recarga. Sin conexión, se abre lo que había.
  if (root.fetch && root.navigator.onLine !== false) {
    root.fetch('/api/me', { credentials: 'same-origin', cache: 'no-store' }).then(function (res) {
      if (res.status === 401) go('/entrar');
      return res.ok ? res.json() : null;
    }).then(function (me) {
      if (!me) return;
      if (me.id !== person) { // la cookie y la sesión no coinciden: se cierra la sesión y se vuelve a entrar
        root.fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).then(function () { go('/entrar'); }, function () { go('/entrar'); });
        return;
      }
      var shares = me.shares || [];
      var share = null;
      for (var i = 0; i < shares.length; i++) if (shares[i].owner === view) share = shares[i];
      var allowed = view === person ? me.hasNotebook : !!share;
      if (!allowed) {
        var next = me.hasNotebook ? person : (shares[0] && shares[0].owner);
        if (next) { setCookie('mc_view', next); go('/'); } else go(MC.cloud.accountUrl);
        return;
      }
      MC.cloud.me = me;
      MC.cloud.share = share;
      MC.emit && MC.emit('cloud:me', me);
    }).catch(function () { /* sin red: seguimos con lo que hay */ });
  }
})(typeof window !== 'undefined' ? window : globalThis);
