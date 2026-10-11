// Datos sintéticos de Nicole: reproduce la mezcla de sueltas/repetidas, sin copiar registros personales.
module.exports = function weeklyFixture() {
  const start = '2026-09-28';
  const dates = Array.from({ length: 7 }, (_, n) => '2026-' + (n < 3 ? '09-' + (28 + n) : '10-0' + (n - 2)));
  const routines = [
    ['work', 'Trabajar', { type: 'weekdays', days: [1, 2, 3, 4, 5] }],
    ['walk', 'Caminar', { type: 'weeklyTarget', count: 3 }],
    ['design', 'Practica Diseño', { type: 'weekdays', days: [1, 2, 3, 4, 5] }],
    ['friend', 'Salir con una amiga', { type: 'weeklyTarget', count: 1 }],
    ['bike', 'Bici', { type: 'weeklyTarget', count: 1 }]
  ].map(([id, title, rule]) => ({ id, title, rule, startDate: start }));
  const activities = [
    ['work', 0, 'partial', false], ['work', 1, 'done', false], ['work', 2, 'skipped', false],
    ['work', 3, 'done', true], ['work', 4, 'skipped', true],
    ['design', 0, 'partial', false], ['design', 1, 'partial', false], ['design', 2, 'skipped', false],
    ['design', 3, 'skipped', true], ['design', 4, 'skipped', true],
    ['walk', 1, 'done', false], ['walk', 2, 'done', false], ['walk', 4, 'done', true], ['walk', 5, 'done', true]
  ].map(([key, n, status, linked], i) => ({ id: 'fixture-' + i, title: routines.find(r => r.id === key).title,
    date: dates[n], status, routineId: linked ? key : null }));
  return { start, dates, routines, activities };
};
