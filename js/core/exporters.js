/* Exportaciones legibles: TXT, CSV y XLSX (sin dependencias). */
(function (root) {
  'use strict';
  var MC = root.MC || (root.MC = {});
  var D = MC.dates;

  var MARK = { pending: '[ ]', done: '[x]', partial: '[/]', postponed: '[→]', skipped: '[·]' };

  function moodName(settings, n) { return n ? settings.moodLabels[n - 1] : ''; }

  function groupBy(list, key) {
    var out = {};
    list.forEach(function (x) { (out[x[key]] = out[x[key]] || []).push(x); });
    return out;
  }

  function allDates(all) {
    var set = {};
    all.days.forEach(function (d) { set[d.date] = true; });
    all.activities.forEach(function (a) { set[a.date] = true; });
    return Object.keys(set).sort();
  }

  /* ---------- TXT ---------- */
  var REFLECTION_LABELS = [
    ['good', 'Qué me hizo bien'], ['hard', 'Algo difícil'], ['lovely', 'Algo lindo'],
    ['keep', 'Qué quiero guardar'], ['free', 'Más']
  ];

  function toTXT(all) {
    var s = all.meta.settings;
    var byDay = {}; all.days.forEach(function (d) { byDay[d.date] = d; });
    var acts = groupBy(all.activities, 'date');
    var routineName = {}; all.routines.forEach(function (r) { routineName[r.id] = r.title; });
    var lines = [];
    lines.push('MI CUADERNO' + (s.name ? ' · ' + s.name : ''));
    lines.push('un lugarcito para mí ♡');
    lines.push('Exportado el ' + D.longLabel(D.today()) + ' de ' + D.today().slice(0, 4));
    lines.push('');
    lines.push('Marcas: [x] lo hice · [/] hice un poquito · [→] lo dejé para otro día · [·] hoy no salió · [ ] sin marcar');
    lines.push('');
    allDates(all).forEach(function (date) {
      var d = byDay[date];
      lines.push('────────────────────────────────────────');
      lines.push(D.capitalize(D.longLabel(date)) + ' de ' + date.slice(0, 4));
      lines.push('');
      if (d) {
        if (d.morning.mood) lines.push('Arranqué: ' + moodName(s, d.morning.mood));
        if (d.intention.trim()) lines.push('Algo que quería cuidar: ' + d.intention.trim());
      }
      (acts[date] || []).forEach(function (a) {
        lines.push('  ' + MARK[a.status] + ' ' + a.title + (a.routineId && routineName[a.routineId] ? '  (rutina)' : ''));
      });
      if (d) {
        if (d.notes.trim()) { lines.push(''); lines.push(d.notes.trim()); }
        if (d.energy) lines.push('Energía: ' + ['poquita', 'media', 'mucha'][d.energy - 1]);
        if (d.sleep != null) lines.push('Dormí: ' + String(d.sleep).replace('.', ',') + ' h');
        if (d.evening.mood) lines.push('Terminé: ' + moodName(s, d.evening.mood));
        REFLECTION_LABELS.forEach(function (r) {
          if (d.reflection[r[0]].trim()) lines.push(r[1] + ': ' + d.reflection[r[0]].trim());
        });
      }
      lines.push('');
    });
    if (all.pages.length) {
      lines.push('════════════════════════════════════════');
      lines.push('MIS PÁGINAS');
      lines.push('');
      all.pages.forEach(function (p) {
        lines.push('— ' + (p.title || 'Sin título') + ' —');
        if (p.kind === 'list') p.items.forEach(function (it) { if (it.text.trim()) lines.push('  • ' + it.text.trim()); });
        else if (p.body.trim()) lines.push(p.body.trim());
        lines.push('');
      });
    }
    if (all.routines.length) {
      lines.push('════════════════════════════════════════');
      lines.push('MIS RUTINAS');
      all.routines.forEach(function (r) {
        lines.push('  ' + r.title + ' — ' + MC.recurrence.describe(r) + (r.archived ? ' (en pausa)' : ''));
      });
    }
    return lines.join('\n') + '\n';
  }

  /* ---------- CSV ---------- */
  function csvCell(v) {
    if (v == null) return '';
    var s = String(v);
    // Evita que Excel interprete fórmulas (inyección CSV).
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return /[",\n\r;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function toCSV(rows) {
    return '﻿' + rows.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n') + '\r\n';
  }

  function daysTable(all) {
    var s = all.meta.settings;
    var byDay = {}; all.days.forEach(function (d) { byDay[d.date] = d; });
    var acts = groupBy(all.activities, 'date');
    var rows = [['fecha', 'animo_inicio', 'animo_final', 'energia', 'sueno_horas', 'intencion', 'notas',
      'me_hizo_bien', 'algo_dificil', 'algo_lindo', 'para_guardar', 'libre', 'actividades_hechas', 'actividades_total']];
    allDates(all).forEach(function (date) {
      var d = byDay[date] || MC.model.emptyDay(date);
      var list = acts[date] || [];
      rows.push([date, moodName(s, d.morning.mood), moodName(s, d.evening.mood),
        d.energy ? ['poquita', 'media', 'mucha'][d.energy - 1] : '', d.sleep == null ? '' : d.sleep,
        d.intention, d.notes, d.reflection.good, d.reflection.hard, d.reflection.lovely, d.reflection.keep, d.reflection.free,
        list.filter(function (a) { return a.status === 'done'; }).length, list.length]);
    });
    return rows;
  }

  function activitiesTable(all) {
    var routineName = {}; all.routines.forEach(function (r) { routineName[r.id] = r.title; });
    var rows = [['fecha', 'actividad', 'estado', 'rutina']];
    all.activities.forEach(function (a) {
      rows.push([a.date, a.title, MC.model.STATUS_LABEL[a.status], a.routineId ? (routineName[a.routineId] || '(rutina borrada)') : '']);
    });
    return rows;
  }

  function moodsTable(all) {
    var s = all.meta.settings;
    var rows = [['fecha', 'momento', 'animo', 'valor']];
    all.days.forEach(function (d) {
      if (d.morning.mood) rows.push([d.date, 'al empezar', moodName(s, d.morning.mood), d.morning.mood]);
      if (d.evening.mood) rows.push([d.date, 'al terminar', moodName(s, d.evening.mood), d.evening.mood]);
    });
    return rows;
  }

  function routinesTable(all) {
    var rows = [['rutina', 'frecuencia', 'momento', 'desde', 'hasta', 'estado', 'veces_hecha']];
    var done = {};
    all.activities.forEach(function (a) { if (a.routineId && a.status === 'done') done[a.routineId] = (done[a.routineId] || 0) + 1; });
    all.routines.forEach(function (r) {
      rows.push([r.title, MC.recurrence.describe(r), MC.model.MOMENT_LABEL[r.moment || ''], r.startDate, r.endDate || '',
        r.archived ? 'en pausa' : 'activa', done[r.id] || 0]);
    });
    return rows;
  }

  function reflectionsTable(all) {
    var rows = [['fecha', 'pregunta', 'respuesta']];
    all.days.forEach(function (d) {
      if (d.intention.trim()) rows.push([d.date, 'Algo que quiero cuidar hoy', d.intention.trim()]);
      REFLECTION_LABELS.forEach(function (r) {
        if (d.reflection[r[0]].trim()) rows.push([d.date, r[1], d.reflection[r[0]].trim()]);
      });
    });
    return rows;
  }

  function summaryTable(all) {
    var s = all.meta.settings;
    var dates = allDates(all);
    var counts = [0, 0, 0, 0, 0];
    all.days.forEach(function (d) { var m = d.evening.mood || d.morning.mood; if (m) counts[m - 1]++; });
    var rows = [['MI CUADERNO', s.name || ''], ['exportado', D.today()],
      ['desde', dates[0] || ''], ['hasta', dates[dates.length - 1] || ''],
      ['días con algo escrito', all.days.length], ['actividades', all.activities.length],
      ['rutinas', all.routines.length], ['páginas', all.pages.length], ['', ''], ['ánimo del día (final o inicial)', 'días']];
    s.moodLabels.forEach(function (l, i) { rows.push([l, counts[i]]); });
    return rows;
  }

  /* ---------- XLSX ---------- */
  function xmlEscape(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; })
      // Caracteres de control inválidos en XML
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  }

  function colName(i) {
    var s = '';
    i++;
    while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); }
    return s;
  }

  function sheetXML(rows) {
    var widths = [];
    rows.forEach(function (r) { r.forEach(function (v, i) { widths[i] = Math.max(widths[i] || 8, Math.min(60, String(v == null ? '' : v).length + 2)); }); });
    var cols = '<cols>' + widths.map(function (w, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>'; }).join('') + '</cols>';
    var body = rows.map(function (r, ri) {
      var cells = r.map(function (v, ci) {
        var ref = colName(ci) + (ri + 1);
        var style = ri === 0 ? ' s="1"' : ' s="2"';
        if (typeof v === 'number' && isFinite(v)) return '<c r="' + ref + '"' + style + '><v>' + v + '</v></c>';
        if (v == null || v === '') return '';
        return '<c r="' + ref + '" t="inlineStr"' + style + '><is><t xml:space="preserve">' + xmlEscape(v) + '</t></is></c>';
      }).join('');
      return '<row r="' + (ri + 1) + '">' + cells + '</row>';
    }).join('');
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
      cols + '<sheetData>' + body + '</sheetData></worksheet>';
  }

  /** sheets: [{ name, rows }] → Uint8Array (.xlsx) */
  function toXLSX(sheets) {
    var files = [];
    files.push({ name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      sheets.map(function (s, i) { return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join('') +
      '</Types>' });
    files.push({ name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '</Relationships>' });
    files.push({ name: 'xl/workbook.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
      sheets.map(function (s, i) { return '<sheet name="' + xmlEscape(s.name.slice(0, 31)) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join('') +
      '</sheets></workbook>' });
    files.push({ name: 'xl/_rels/workbook.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      sheets.map(function (s, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join('') +
      '<Relationship Id="rId' + (sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
      '</Relationships>' });
    files.push({ name: 'xl/styles.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
      '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
      '<fill><patternFill patternType="solid"><fgColor rgb="FFFBEFC4"/><bgColor indexed="64"/></patternFill></fill></fills>' +
      '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
      '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>' +
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs>' +
      '</styleSheet>' });
    sheets.forEach(function (s, i) { files.push({ name: 'xl/worksheets/sheet' + (i + 1) + '.xml', data: sheetXML(s.rows) }); });
    return MC.zip.makeZip(files);
  }

  function workbook(all) {
    return toXLSX([
      { name: 'Resumen', rows: summaryTable(all) },
      { name: 'Días', rows: daysTable(all) },
      { name: 'Estados', rows: moodsTable(all) },
      { name: 'Actividades', rows: activitiesTable(all) },
      { name: 'Rutinas', rows: routinesTable(all) },
      { name: 'Reflexiones', rows: reflectionsTable(all) }
    ]);
  }

  MC.exporters = {
    toTXT: toTXT, toCSV: toCSV, csvCell: csvCell, daysTable: daysTable, activitiesTable: activitiesTable,
    moodsTable: moodsTable, routinesTable: routinesTable, reflectionsTable: reflectionsTable, summaryTable: summaryTable,
    toXLSX: toXLSX, workbook: workbook, colName: colName
  };
})(typeof window !== 'undefined' ? window : globalThis);
