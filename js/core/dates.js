/* Fechas del cuaderno: siempre claves locales 'AAAA-MM-DD'.
   La aritmética usa números de día UTC para esquivar cambios de horario. */
(function (root) {
  'use strict';
  var MC = root.MC || (root.MC = {});

  var DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  var DAYS_INITIAL = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  var MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
    'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function parse(key) {
    var m = KEY_RE.exec(key);
    if (!m) return null;
    return { y: +m[1], m: +m[2], d: +m[3] };
  }

  function daysInMonth(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }

  function isValid(key) {
    var p = typeof key === 'string' && parse(key);
    return !!p && p.m >= 1 && p.m <= 12 && p.d >= 1 && p.d <= daysInMonth(p.y, p.m);
  }

  function make(y, m, d) { return y + '-' + pad(m) + '-' + pad(d); }

  function fromDate(date) { return make(date.getFullYear(), date.getMonth() + 1, date.getDate()); }

  function dayNumber(key) { var p = parse(key); return Math.round(Date.UTC(p.y, p.m - 1, p.d) / 864e5); }

  function fromDayNumber(n) {
    var dt = new Date(n * 864e5);
    return make(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
  }

  function addDays(key, n) { return fromDayNumber(dayNumber(key) + n); }

  function diffDays(a, b) { return dayNumber(b) - dayNumber(a); }

  function weekday(key) { var p = parse(key); return new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay(); }

  /** Lunes de la semana de `key` (semana lunes–domingo, como en Argentina). */
  function startOfWeek(key) { return addDays(key, -((weekday(key) + 6) % 7)); }

  function monthKey(key) { return key.slice(0, 7); }

  function addMonths(mKey, n) {
    var y = +mKey.slice(0, 4), m = +mKey.slice(5, 7) - 1 + n;
    y += Math.floor(m / 12);
    m = ((m % 12) + 12) % 12;
    return y + '-' + pad(m + 1);
  }

  function range(from, to) {
    var out = [], a = dayNumber(from), b = dayNumber(to);
    for (var i = a; i <= b; i++) out.push(fromDayNumber(i));
    return out;
  }

  /** Días de la grilla del mes (lunes a domingo, con relleno de meses vecinos). */
  function monthGrid(mKey) {
    var first = mKey + '-01';
    var p = parse(first);
    var last = make(p.y, p.m, daysInMonth(p.y, p.m));
    var start = startOfWeek(first);
    var end = addDays(startOfWeek(last), 6);
    return range(start, end);
  }

  function today() { return fromDate(new Date()); }

  function longLabel(key) {
    var p = parse(key);
    return DAYS[weekday(key)] + ' ' + p.d + ' de ' + MONTHS[p.m - 1];
  }

  function shortLabel(key) {
    var p = parse(key);
    return p.d + ' ' + MONTHS_SHORT[p.m - 1];
  }

  function monthLabel(mKey) {
    return MONTHS[+mKey.slice(5, 7) - 1] + ' ' + mKey.slice(0, 4);
  }

  function relativeLabel(key, base) {
    var d = diffDays(base || today(), key);
    if (d === 0) return 'hoy';
    if (d === -1) return 'ayer';
    if (d === 1) return 'mañana';
    return null;
  }

  function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  MC.dates = {
    DAYS: DAYS, DAYS_SHORT: DAYS_SHORT, DAYS_INITIAL: DAYS_INITIAL, MONTHS: MONTHS, MONTHS_SHORT: MONTHS_SHORT,
    pad: pad, parse: parse, make: make, isValid: isValid, fromDate: fromDate, today: today,
    daysInMonth: daysInMonth, dayNumber: dayNumber, fromDayNumber: fromDayNumber,
    addDays: addDays, diffDays: diffDays, weekday: weekday, startOfWeek: startOfWeek,
    monthKey: monthKey, addMonths: addMonths, range: range, monthGrid: monthGrid,
    longLabel: longLabel, shortLabel: shortLabel, monthLabel: monthLabel,
    relativeLabel: relativeLabel, capitalize: capitalize
  };
})(typeof window !== 'undefined' ? window : globalThis);
