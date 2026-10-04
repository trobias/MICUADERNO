/* Cuentas de la nube (etapa B, D37). No hace nada en file:// ni en un servidor sin cuentas: solo se activa
   cuando el index.html trae <meta name="mc-cloud"> (lo agrega tools/copy-notebook.mjs al publicar en Vercel).
   Con cuentas, cada persona tiene SU base local (IndexedDB `mi-cuaderno@<id>`) y sus preferencias de UI,
   así dos personas que comparten un dispositivo nunca se mezclan. Se carga antes que store.js. */
(function (root) {
  'use strict';
  var MC = root.MC || (root.MC = {});
  var doc = root.document;
  var on = !!(doc && doc.querySelector('meta[name="mc-cloud"]')) && /^https?:$/.test(root.location.protocol);

  function cookie(name) {
    var m = doc && doc.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }

  var person = on ? cookie('mc_person') : null;
  if (person && !/^[0-9a-f-]{36}$/i.test(person)) person = null;

  MC.cloud = {
    on: on,
    person: person,
    /** Sufijo de la base y de las preferencias para la persona con sesión ('' sin cuentas). */
    suffix: person ? '@' + person : '',
    leaving: false,
    accountUrl: '/cuenta'
  };

  if (!on) return;
  if (MC.ui) MC.ui.prefix = person + '.';

  function leave() {
    MC.cloud.leaving = true;
    root.location.replace('/entrar');
  }
  // Sin persona (cerró sesión o nunca entró): al ingreso. Sin conexión, el ingreso no carga: se muestra igual.
  if (!person) { leave(); return; }

  // Con conexión, se confirma que la sesión siga viva; si terminó, al ingreso. Sin conexión, el cuaderno
  // abre con lo de este dispositivo (los datos son locales; la cuenta solo decide de quién son).
  if (root.fetch && root.navigator.onLine !== false) {
    root.fetch('/api/me', { credentials: 'same-origin', cache: 'no-store' }).then(function (res) {
      if (res.status === 401) leave();
      return res.ok ? res.json() : null;
    }).then(function (me) {
      if (me && me.id === person) { MC.cloud.me = me; MC.emit && MC.emit('cloud:me', me); }
      else if (me) { // la cookie y la sesión no coinciden: se cierra la sesión y se vuelve a entrar
        root.fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).then(leave, leave);
      }
    }).catch(function () { /* sin red: seguimos con lo local */ });
  }
})(typeof window !== 'undefined' ? window : globalThis);
