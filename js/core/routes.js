/* Rutas del cuaderno: el único lugar donde se arman y se leen las direcciones (#/…).
   Las vistas nunca escriben '#/dia/' a mano: usan MC.routes.day(fecha), etc. Ver SPEC §5. */
(function (root) {
  'use strict';
  var MC = root.MC || (root.MC = {});
  var D = MC.dates;

  var MONTH_RE = /^\d{4}-\d{2}$/;
  var YEAR_RE = /^\d{4}$/;

  function enc(s) { return encodeURIComponent(String(s)); }

  /* ---------- armar ---------- */
  var build = {
    calendar: function () { return '#/calendario'; },
    /** opts.routine: mostrar marcados los días de esa rutina (los que tocan y los que ya se hicieron). */
    month: function (m, opts) { return '#/calendario/mes/' + m + (opts && opts.routine ? '/rutina/' + enc(opts.routine) : ''); },
    week: function (date) { return '#/calendario/semana/' + date; },
    today: function () { return '#/hoy'; },
    day: function (date) { return '#/dia/' + date; },
    routines: function () { return '#/rutinas'; },
    /** El cuadro de rutinas, con esa rutina a la vista y resaltada. */
    routine: function (id) { return '#/rutinas/' + enc(id); },
    pages: function () { return '#/paginas'; },
    page: function (id) { return '#/pagina/' + enc(id); },
    year: function (y) { return y ? '#/anio/' + y : '#/anio'; },
    settings: function (section) { return '#/ajustes' + (section ? '/' + enc(section) : ''); },
    print: function () { return '#/imprimir'; },
    welcome: function () { return '#/bienvenida'; }
  };

  /* ---------- leer ---------- */
  /**
   * hash → { kind: 'base'|'panel'|'onboarding', name, opt, params } o null si no es una ruta conocida.
   * ctx (opcional): { today: 'AAAA-MM-DD', calMonth: 'AAAA-MM' } — el mes que se estaba mirando,
   * para que “#/calendario” vuelva a donde estaba la persona.
   */
  function parse(hash, ctx) {
    ctx = ctx || {};
    var today = ctx.today || D.today();
    var parts;
    try {
      parts = String(hash || '').replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
    } catch (e) {
      return null; // %XX mal formado
    }
    var p0 = parts[0] || 'calendario';
    switch (p0) {
      case 'calendario':
        if (parts[1] === 'semana' && D.isValid(parts[2])) return { kind: 'base', name: 'calendar', opt: null, params: { mode: 'semana', date: parts[2] } };
        if (parts[1] === 'mes' && MONTH_RE.test(parts[2] || '')) {
          var params = { mode: 'mes', month: parts[2] };
          if (parts[3] === 'rutina' && parts[4]) params.routine = parts[4];
          return { kind: 'base', name: 'calendar', opt: null, params: params };
        }
        return { kind: 'base', name: 'calendar', opt: null, params: { mode: 'mes', month: MONTH_RE.test(ctx.calMonth || '') ? ctx.calMonth : D.monthKey(today) } };
      case 'hoy': return { kind: 'panel', name: 'today', opt: 'hoy', params: { date: today, isToday: true } };
      case 'dia': return D.isValid(parts[1]) ? { kind: 'panel', name: 'today', opt: parts[1] === today ? 'hoy' : null, params: { date: parts[1] } } : null;
      case 'rutinas': return { kind: 'panel', name: 'routines', opt: 'rutinas', params: parts[1] ? { focus: parts[1] } : {} };
      case 'paginas': return { kind: 'panel', name: 'pages', opt: 'paginas', params: {} };
      case 'pagina': return parts[1] ? { kind: 'panel', name: 'page', opt: 'paginas', params: { id: parts[1] } } : null;
      case 'anio': return { kind: 'panel', name: 'year', opt: 'anio', params: { year: YEAR_RE.test(parts[1] || '') ? parts[1] : today.slice(0, 4) } };
      case 'ajustes': return { kind: 'panel', name: 'settings', opt: 'ajustes', params: { section: parts[1] || null } };
      case 'imprimir': return { kind: 'panel', name: 'print', opt: 'ajustes', params: {} };
      case 'bienvenida': return { kind: 'onboarding', name: 'onboarding', opt: null, params: {} };
      default: return null;
    }
  }

  MC.routes = Object.assign({ parse: parse }, build);
})(typeof window !== 'undefined' ? window : globalThis);
