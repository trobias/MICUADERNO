/* Recurrencia de rutinas. Puro: sin DOM ni almacenamiento. Ver SPEC §11. */
(function (root) {
  'use strict';
  var MC = root.MC || (root.MC = {});
  var D = MC.dates;

  var TYPES = ['daily', 'weekdays', 'interval', 'monthlyDay', 'monthlyNth', 'yearly', 'once'];
  var NTH_LABEL = { 1: 'Primer', 2: 'Segundo', 3: 'Tercer', 4: 'Cuarto', '-1': 'Último' };
  var WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // lunes primero

  /** ¿La regla cae en la fecha `key`? No mira `archived`, `startDate` ni `endDate`. */
  function matchesRule(rule, key, startDate) {
    if (!rule || !D.isValid(key)) return false;
    var p = D.parse(key);
    switch (rule.type) {
      case 'daily':
        return true;
      case 'weekdays':
        return Array.isArray(rule.days) && rule.days.indexOf(D.weekday(key)) !== -1;
      case 'interval': {
        var every = Math.max(1, rule.every | 0);
        var anchor = D.isValid(startDate) ? startDate : key;
        var diff = D.diffDays(anchor, key);
        return diff >= 0 && diff % every === 0;
      }
      case 'monthlyDay': {
        var want = MC.clamp(rule.day | 0 || 1, 1, 31);
        return p.d === Math.min(want, D.daysInMonth(p.y, p.m));
      }
      case 'monthlyNth': {
        if (D.weekday(key) !== rule.weekday) return false;
        if (rule.nth === -1) return p.d + 7 > D.daysInMonth(p.y, p.m);
        return Math.ceil(p.d / 7) === rule.nth;
      }
      case 'yearly': {
        // Una vez por año (cumpleaños, aniversarios). El 29/02 cae el 28/02 en los años comunes.
        var month = MC.clamp(rule.month | 0 || 1, 1, 12);
        var day = MC.clamp(rule.day | 0 || 1, 1, 31);
        return p.m === month && p.d === Math.min(day, D.daysInMonth(p.y, month));
      }
      case 'once':
        return rule.date === key;
      default:
        return false;
    }
  }

  /** ¿La rutina aparece en `key`? Considera pausa y vigencia. */
  function occursOn(routine, key) {
    if (!routine || routine.archived) return false;
    if (routine.startDate && key < routine.startDate) return false;
    if (routine.endDate && key > routine.endDate) return false;
    return matchesRule(routine.rule, key, routine.startDate);
  }

  function nextOccurrence(routine, fromKey, maxDays) {
    var limit = maxDays || 400;
    for (var i = 0; i <= limit; i++) {
      var k = D.addDays(fromKey, i);
      if (routine.endDate && k > routine.endDate) return null;
      if (occursOn(routine, k)) return k;
    }
    return null;
  }

  function weekdaysLabel(days) {
    var sorted = WEEKDAY_ORDER.filter(function (d) { return days.indexOf(d) !== -1; });
    if (sorted.length === 7) return 'Todos los días';
    if (sorted.length === 5 && sorted.indexOf(0) === -1 && sorted.indexOf(6) === -1) return 'De lunes a viernes';
    if (sorted.length === 2 && sorted[0] === 6 && sorted[1] === 0) return 'Fines de semana';
    if (sorted.length === 1) return 'Todos los ' + D.DAYS[sorted[0]] + (sorted[0] === 6 || sorted[0] === 0 ? 's' : '');
    return sorted.map(function (d) { return D.DAYS_SHORT[d]; }).join(' · ');
  }

  /** Descripción humana: “Lun · Mié · Vie”, “Cada 3 días”, “Primer sábado del mes”. */
  function describe(routine) {
    var r = routine.rule || {};
    var base;
    switch (r.type) {
      case 'daily': base = 'Todos los días'; break;
      case 'weekdays': base = weekdaysLabel(r.days || []); break;
      case 'interval': base = (r.every | 0) <= 1 ? 'Todos los días' : 'Cada ' + (r.every | 0) + ' días'; break;
      case 'monthlyDay': base = 'Todos los ' + (r.day | 0) + ' del mes'; break;
      case 'monthlyNth': base = (NTH_LABEL[String(r.nth)] || '') + ' ' + D.DAYS[r.weekday] + ' del mes'; break;
      case 'yearly': base = 'Todos los años, el ' + (r.day | 0) + ' de ' + D.MONTHS[MC.clamp(r.month | 0 || 1, 1, 12) - 1]; break;
      case 'once': base = r.date ? 'Una vez, el ' + D.shortLabel(r.date) : 'Una vez'; break;
      default: base = 'Sin repetición';
    }
    if (r.type !== 'once' && routine.endDate) base += ' · hasta el ' + D.shortLabel(routine.endDate);
    return base;
  }

  /** Normaliza una regla que viene de un formulario o de un backup. Devuelve null si es inválida. */
  function sanitizeRule(rule) {
    if (!rule || TYPES.indexOf(rule.type) === -1) return null;
    var out = { type: rule.type };
    if (rule.type === 'weekdays') {
      out.days = (Array.isArray(rule.days) ? rule.days : [])
        .map(Number).filter(function (d) { return d >= 0 && d <= 6; })
        .filter(function (d, i, a) { return a.indexOf(d) === i; });
      if (!out.days.length) return null;
    } else if (rule.type === 'interval') {
      out.every = MC.clamp(parseInt(rule.every, 10) || 1, 1, 365);
    } else if (rule.type === 'monthlyDay') {
      out.day = MC.clamp(parseInt(rule.day, 10) || 1, 1, 31);
    } else if (rule.type === 'monthlyNth') {
      var nth = parseInt(rule.nth, 10);
      out.nth = [1, 2, 3, 4, -1].indexOf(nth) !== -1 ? nth : 1;
      out.weekday = MC.clamp(parseInt(rule.weekday, 10) || 0, 0, 6);
    } else if (rule.type === 'yearly') {
      out.month = MC.clamp(parseInt(rule.month, 10) || 1, 1, 12);
      out.day = MC.clamp(parseInt(rule.day, 10) || 1, 1, 31);
    } else if (rule.type === 'once') {
      if (!D.isValid(rule.date)) return null;
      out.date = rule.date;
    }
    return out;
  }

  MC.recurrence = {
    TYPES: TYPES, matchesRule: matchesRule, occursOn: occursOn, nextOccurrence: nextOccurrence,
    describe: describe, sanitizeRule: sanitizeRule
  };
})(typeof window !== 'undefined' ? window : globalThis);
