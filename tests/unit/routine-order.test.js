'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./_load');
const MC = load();
test('orden de repeticiones: copia v12 aditiva, saneado y retorno en v13', () => {
  const data = { meta: { settings: {} }, routines: [{ id: 'Nicole', title: 'Caminar', rule: { type: 'daily' }, startDate: '2026-10-08', order: 2, updatedAt: '2026-10-08T10:00:00Z' }] };
  const old = MC.backup.validate({ app: 'mi-cuaderno', kind: 'backup', schemaVersion: 12, data });
  assert.equal(old.ok, true);
  assert.equal(old.payload.routines[0].order, 2);
  assert.equal(old.payload.routines[0].updatedAt, data.routines[0].updatedAt);
  assert.equal(MC.model.normalizeRoutine({ ...data.routines[0], order: -1 }).order, null);
  assert.equal(MC.model.normalizeRoutine({ ...data.routines[0], order: Infinity }).order, null);
  assert.equal(MC.model.normalizeRoutine({ ...data.routines[0], order: undefined }).order, null);
  assert.equal(MC.backup.SCHEMA_VERSION, 13);
});
