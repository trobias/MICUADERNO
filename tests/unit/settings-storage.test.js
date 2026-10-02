'use strict';
// Tests unitarios para DA4: medición de almacenamiento, desglose y aviso de copia grande.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { load, ROOT } = require('./_load');

const MC = load();
// Carga settings.js en el contexto global
const settingsFile = path.join(ROOT, 'js', 'views', 'settings.js');
vm.runInThisContext(fs.readFileSync(settingsFile, 'utf8'), { filename: settingsFile });

const { measureStorage, formatSize, LARGE_THRESHOLD } = MC.views.settings;

test('Cuánto ocupa incluye imágenes en papelera y señala cuántos registros conserva', async () => {
  await MC.store.init({ memory: true });
  await MC.model.loadSettings();
  const image = await MC.model.saveImage({ name: 'Flor', src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' });
  await MC.model.deleteImage(image.id);
  const measured = await MC.views.settings.collectStorage();
  assert.equal(measured.counts.fotos, 1);
  assert.equal(measured.trashCount, 1);
});

test('retención: cuenta solo lo que vencería con un plazo más corto', () => {
  const at = '2026-10-02T00:00:00.000Z';
  const items = [
    { row: { deletedAt: '2026-09-01T00:00:00.000Z' } },
    { row: { deletedAt: '2026-09-30T00:00:00.000Z' } }
  ];
  assert.equal(MC.views.settings.countDueTrash(items, 7, at), 1);
  assert.equal(MC.views.settings.countDueTrash(items, 0, at), 0);
});

test('formatSize: formatea bytes, KB y MB con coma decimal en español', () => {
  assert.equal(formatSize(0), '0 B');
  assert.equal(formatSize(null), '0 B');
  assert.equal(formatSize(512), '512 B');
  assert.equal(formatSize(1024), '1 KB');
  assert.equal(formatSize(2560), '2,5 KB');
  assert.equal(formatSize(50 * 1024), '50 KB');
  assert.equal(formatSize(1.5 * 1024 * 1024), '1,5 MB');
  assert.equal(formatSize(126 * 1024 * 1024), '126 MB');
});

test('measureStorage con entrada vacía o nula devuelve ceros y no falla', () => {
  const r1 = measureStorage(null, null);
  assert.equal(r1.total, 0);
  assert.equal(r1.formattedTotal, '0 B');
  assert.equal(r1.breakdown.texto.bytes, 0);
  assert.equal(r1.breakdown.fotos.bytes, 0);
  assert.equal(r1.breakdown.audio.bytes, 0);
  assert.equal(r1.breakdown.dibujos.bytes, 0);
  assert.equal(r1.breakdown.otros.bytes, 0);
  assert.equal(r1.isLarge, false);
  assert.equal(r1.originUsage, null);
  assert.equal(r1.formattedOriginUsage, null);

  const r2 = measureStorage({}, null);
  assert.equal(r2.total, 0);
  assert.equal(r2.breakdown.texto.bytes, 0);
  assert.equal(r2.breakdown.audio.bytes, 0);
});

test('measureStorage: texto incluye días, actividades, rutinas, páginas y meta', () => {
  const all = {
    meta: { createdAt: '2026-10-01T10:00:00.000Z', settings: { name: 'Nicole' } },
    days: [
      { date: '2026-10-01', intention: 'cuidar el día', notes: 'Escribiendo en mi cuaderno', morning: { mood: 4 } }
    ],
    activities: [
      { id: 'act_1', title: 'Caminar 20 minutos', status: 'done', date: '2026-10-01' }
    ],
    routines: [
      { id: 'rut_1', title: 'Caminar', rule: { type: 'daily' } }
    ],
    pages: [
      { id: 'pag_1', title: 'Lugares que amo', body: 'El parque cerca de casa', date: '2026-10-01' }
    ],
    images: [],
    files: []
  };

  const r = measureStorage(all, null);
  assert.ok(r.breakdown.texto.bytes > 0, 'texto debe ser mayor a 0');
  assert.equal(r.breakdown.fotos.bytes, 0);
  assert.equal(r.breakdown.audio.bytes, 0);
  assert.equal(r.breakdown.dibujos.bytes, 0);
  assert.equal(r.breakdown.otros.bytes, 0);
  assert.equal(r.total, r.breakdown.texto.bytes);
  assert.equal(r.counts.dias, 1);
  assert.equal(r.counts.actividades, 1);
  assert.equal(r.counts.rutinas, 1);
  assert.equal(r.counts.paginas, 1);
});

test('measureStorage: desglosa fotos (upload) vs dibujos (drawing)', () => {
  const all = {
    images: [
      { id: 'img_foto', kind: 'upload', name: 'foto de mi taza', src: 'data:image/webp;base64,AAAA1234' },
      { id: 'img_dib', kind: 'drawing', name: 'mi dibujo', src: 'data:image/webp;base64,BBBB5678', drawing: { strokes: [] } }
    ]
  };

  const r = measureStorage(all, null);
  assert.ok(r.breakdown.fotos.bytes > 0, 'fotos bytes > 0');
  assert.equal(r.counts.fotos, 1);
  assert.ok(r.breakdown.dibujos.bytes > 0, 'dibujos bytes > 0');
  assert.equal(r.counts.dibujos, 1);
  assert.equal(r.breakdown.audio.bytes, 0);
  assert.equal(r.breakdown.otros.bytes, 0);
  assert.equal(r.total, r.breakdown.texto.bytes + r.breakdown.fotos.bytes + r.breakdown.dibujos.bytes);
});

test('measureStorage: detecta audio en files (type audio/* o extensión) y lo separa de otros', () => {
  const all = {
    files: [
      { id: 'fil_aud1', owner: 'day:2026-10-01', name: 'voz.m4a', type: 'audio/mp4', size: 12000, data: 'data:audio/mp4;base64,AAAA' },
      { id: 'fil_aud2', owner: 'day:2026-10-01', name: 'nota.mp3', type: 'application/octet-stream', size: 8000, data: 'data:audio/mp3;base64,BBBB' },
      { id: 'fil_doc', owner: 'day:2026-10-01', name: 'recital.pdf', type: 'application/pdf', size: 50000, data: 'data:application/pdf;base64,CCCC' }
    ]
  };

  const r = measureStorage(all, null);
  assert.ok(r.breakdown.audio.bytes > 0, 'audio bytes > 0');
  assert.equal(r.counts.audio, 2, 'debe contar 2 audios');
  assert.ok(r.breakdown.otros.bytes > 0, 'otros bytes > 0');
  assert.equal(r.counts.otros, 1, 'debe contar 1 archivo en otros');
  assert.equal(r.breakdown.fotos.bytes, 0);
  assert.equal(r.breakdown.dibujos.bytes, 0);
  assert.equal(r.total, r.breakdown.audio.bytes + r.breakdown.otros.bytes);
});

test('measureStorage: adjuntos no audio se categorizan en otros', () => {
  const all = {
    files: [
      { id: 'fil_1', owner: 'day:2026-10-01', name: 'recital.pdf', size: 50000, data: 'data:application/pdf;base64,JVBERi0xLjQK' }
    ]
  };

  const r = measureStorage(all, null);
  assert.ok(r.breakdown.otros.bytes > 0);
  assert.equal(r.counts.otros, 1);
  assert.equal(r.counts.audio, 0);
  assert.equal(r.breakdown.audio.bytes, 0);
  assert.equal(r.breakdown.fotos.bytes, 0);
  assert.equal(r.breakdown.dibujos.bytes, 0);
});

test('measureStorage: total es exactamente la suma de texto + fotos + audio + dibujos + otros', () => {
  const all = {
    meta: { settings: { name: 'Nicole' } },
    days: [{ date: '2026-10-01', notes: 'Prueba de Nicole' }],
    activities: [{ id: 'act_1', title: 'Leer', status: 'done', date: '2026-10-01' }],
    routines: [{ id: 'rut_1', title: 'Leer', rule: { type: 'daily' } }],
    pages: [{ id: 'pag_1', title: 'Nota', body: 'Contenido', date: '2026-10-01' }],
    images: [
      { id: 'i1', kind: 'upload', src: 'data:image/webp;base64,1111' },
      { id: 'i2', kind: 'drawing', src: 'data:image/webp;base64,2222' }
    ],
    files: [
      { id: 'f1', owner: 'day:2026-10-01', name: 'nota.m4a', type: 'audio/m4a', data: 'data:audio/mp4;base64,3333', size: 100 },
      { id: 'f2', owner: 'day:2026-10-01', name: 'doc.pdf', type: 'application/pdf', data: 'data:application/pdf;base64,4444', size: 200 }
    ]
  };

  const r = measureStorage(all, null);
  const sum = r.breakdown.texto.bytes + r.breakdown.fotos.bytes + r.breakdown.audio.bytes + r.breakdown.dibujos.bytes + r.breakdown.otros.bytes;
  assert.equal(r.total, sum);
  assert.equal(r.counts.fotos, 1);
  assert.equal(r.counts.audio, 1);
  assert.equal(r.counts.dibujos, 1);
  assert.equal(r.counts.otros, 1);
  assert.equal(r.counts.dias, 1);
});

test('measureStorage: preserva estimación del navegador y tolera fallback sin ella', () => {
  const all = { days: [{ date: '2026-10-01', notes: 'Nicole' }] };

  // Con estimación (origen completo)
  const rWithEst = measureStorage(all, { usage: 10 * 1024 * 1024, quota: 100 * 1024 * 1024 });
  assert.equal(rWithEst.originUsage, 10 * 1024 * 1024);
  assert.equal(rWithEst.originQuota, 100 * 1024 * 1024);
  assert.equal(rWithEst.formattedOriginUsage, '10 MB');
  // La estimación de origen no altera el total del cuaderno
  assert.ok(rWithEst.total < 1000);

  // Fallback sin estimación (ej. file:// o error)
  const rNoEst = measureStorage(all, null);
  assert.equal(rNoEst.originUsage, null);
  assert.equal(rNoEst.formattedOriginUsage, null);
  assert.ok(rNoEst.total > 0);
});

test('measureStorage: aviso de copia grande cuando supera el umbral', () => {
  // Cuaderno liviano
  const small = { days: [{ date: '2026-10-01', notes: 'pequeño' }] };
  const rSmall = measureStorage(small, null);
  assert.equal(rSmall.isLarge, false);

  // Cuaderno con datos que superan el umbral (o umbral personalizado)
  const rLarge = measureStorage(small, null, { largeThreshold: 20 });
  assert.equal(rLarge.isLarge, true);

  // Cuaderno con archivo de 6 MB supera LARGE_THRESHOLD por defecto
  const largeData = 'A'.repeat(6 * 1024 * 1024);
  const largeNotebook = {
    images: [{ id: 'img_big', kind: 'upload', src: 'data:image/jpeg;base64,' + largeData }]
  };
  const rBig = measureStorage(largeNotebook, null);
  assert.equal(rBig.isLarge, true);
  assert.ok(rBig.total >= LARGE_THRESHOLD);
});

test('measureStorage: aviso por fotos y adjuntos (MEDIA_LARGE_THRESHOLD) aunque el total no llegue al umbral', () => {
  const { MEDIA_LARGE_THRESHOLD } = MC.views.settings;
  assert.equal(MEDIA_LARGE_THRESHOLD, 4 * 1024 * 1024);
  assert.ok(MEDIA_LARGE_THRESHOLD < LARGE_THRESHOLD);
  const file = (n) => ({ id: 'f', owner: 'day:2026-10-01', name: 'entrada.pdf', type: 'application/pdf', data: 'data:application/pdf;base64,' + 'A'.repeat(n) });
  const under = measureStorage({ files: [file(MEDIA_LARGE_THRESHOLD - 1024)] }, null);
  assert.equal(under.isLarge, false);
  const over = measureStorage({ files: [file(MEDIA_LARGE_THRESHOLD)] }, null);
  assert.ok(over.total < LARGE_THRESHOLD);
  assert.equal(over.isLarge, true);
  assert.equal(measureStorage({ files: [file(MEDIA_LARGE_THRESHOLD)] }, null, { mediaThreshold: 8 * 1024 * 1024 }).isLarge, false);
});

test('measureStorage: un data URL se mide por su largo y da lo mismo que el JSON del registro', () => {
  const rec = { id: 'img_1', kind: 'upload', name: 'mi taza ☕', src: 'data:image/webp;base64,' + 'Q'.repeat(50000), w: 400, h: 300 };
  const r = measureStorage({ images: [rec] }, null);
  assert.equal(r.breakdown.fotos.bytes, Buffer.byteLength(JSON.stringify(rec), 'utf8'));
});
