// Pruebas de permisos (RLS) de supabase/migrations contra un Postgres local descartable.
// Levanta un cluster temporal, aplica tests/cloud/supabase-shim.sql + las migraciones y actúa como cada
// persona (rol `authenticated` con su JWT), igual que hace PostgREST en Supabase.
// Requiere los binarios de Postgres (PGBIN, por defecto /usr/lib/postgresql/16/bin); si faltan, se saltea.
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '../..');
const PGBIN = process.env.PGBIN || '/usr/lib/postgresql/16/bin';
const have = fs.existsSync(path.join(PGBIN, 'initdb'));
const asRoot = process.getuid && process.getuid() === 0;
const PORT = String(Number(process.env.PG_TEST_PORT || 54329));

let dir;
function cmd(bin, args, input) {
  const full = path.join(PGBIN, bin);
  const r = asRoot
    ? spawnSync('runuser', ['-u', 'postgres', '--', full, ...args], { input, encoding: 'utf8' })
    : spawnSync(full, args, { input, encoding: 'utf8' });
  return r;
}
function psql(sql) {
  const r = cmd('psql', ['-h', dir, '-p', PORT, '-U', 'postgres', '-d', 'postgres', '-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1'], sql);
  return { ok: r.status === 0, out: (r.stdout || '').trim(), err: (r.stderr || '').trim() };
}
function sql(text) {
  const r = psql(text);
  if (!r.ok) throw new Error(r.err);
  return r.out;
}
/** Como una persona con sesión (uid) o sin sesión (null → anon). */
function as(uid, text) {
  const role = uid ? 'authenticated' : 'anon';
  const claims = uid ? JSON.stringify({ sub: uid, role }) : '{}';
  return psql(`begin;\nset local role ${role};\nset local request.jwt.claims = '${claims}';\n${text}\ncommit;`);
}

const NICOLE = '11111111-1111-4111-8111-111111111111';
const PSI = '22222222-2222-4222-8222-222222222222';
const OTRA = '33333333-3333-4333-8333-333333333333';

test('RLS de cuentas y permisos', { skip: !have && 'sin Postgres local' }, async (t) => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-pg-'));
  if (asRoot) execFileSync('chown', ['postgres:postgres', dir]);
  const data = path.join(dir, 'data');
  let r = cmd('initdb', ['-D', data, '-U', 'postgres', '-A', 'trust', '--no-sync']);
  assert.strictEqual(r.status, 0, r.stderr);
  r = cmd('pg_ctl', ['-D', data, '-l', path.join(dir, 'log'), '-w', '-o', `-k ${dir} -p ${PORT} -c listen_addresses= -c fsync=off`, 'start']);
  assert.strictEqual(r.status, 0, r.stderr + r.stdout);
  t.after(() => { cmd('pg_ctl', ['-D', data, '-m', 'immediate', 'stop']); fs.rmSync(dir, { recursive: true, force: true }); });

  sql(fs.readFileSync(path.join(here, 'supabase-shim.sql'), 'utf8'));
  const migDir = path.join(root, 'supabase/migrations');
  for (const f of fs.readdirSync(migDir).sort()) sql(fs.readFileSync(path.join(migDir, f), 'utf8'));
  // Aplicarlas dos veces no rompe (idempotentes).
  for (const f of fs.readdirSync(migDir).sort()) sql(fs.readFileSync(path.join(migDir, f), 'utf8'));

  sql(`
    insert into auth.users (id) values ('${NICOLE}'), ('${PSI}'), ('${OTRA}');
    insert into public.profiles (id, username, display_name, pin_hash, is_admin) values
      ('${NICOLE}', 'nicole', 'Nicole', 'x', true),
      ('${PSI}', 'psicologa', 'Psicóloga', 'y', false),
      ('${OTRA}', 'otra', 'Otra persona', 'z', false);
    insert into public.notebook_parts (owner_id, store, record_id, section, data, private, updated_at) values
      ('${NICOLE}', 'days', '2026-10-04', 'emociones', '{"morning":{"feelings":["tranquila"]}}', false, now()),
      ('${NICOLE}', 'days', '2026-10-04', 'escritura', '{"notes":"hola"}', false, now()),
      ('${NICOLE}', 'days', '2026-10-03', 'escritura', '{"notes":"secreto"}', true, now()),
      ('${NICOLE}', 'activities', 'act_1', 'actividades', '{"title":"caminar"}', false, now());
    insert into public.notebook_grants (owner_id, grantee_id, section, level) values
      ('${NICOLE}', '${PSI}', 'emociones', 'ver'), ('${NICOLE}', '${PSI}', 'escritura', 'ver');
  `);

  await t.test('sin sesión no se ve nada', () => {
    for (const table of ['notebook_parts', 'profiles', 'notebook_grants', 'sections', 'keepalive']) {
      const q = as(null, `select count(*) from public.${table};`);
      assert.ok(!q.ok && /permission denied/.test(q.err), table + ': ' + q.err);
    }
  });

  await t.test('la dueña ve todo su cuaderno, incluso lo “solo para mí”', () => {
    assert.strictEqual(as(NICOLE, `select count(*) from public.notebook_parts;`).out, '4');
  });

  await t.test('con permiso de ver: solo esas secciones y nunca lo privado', () => {
    const q = as(PSI, `select section || ':' || record_id from public.notebook_parts order by 1;`);
    assert.ok(q.ok, q.err);
    assert.deepStrictEqual(q.out.split('\n'), ['emociones:2026-10-04', 'escritura:2026-10-04']);
  });

  await t.test('con permiso de ver no se puede escribir', () => {
    const q = as(PSI, `insert into public.notebook_parts (owner_id, store, record_id, section, data, updated_at)
      values ('${NICOLE}', 'days', '2026-10-05', 'emociones', '{}', now());`);
    assert.ok(!q.ok && /row-level security/.test(q.err), q.err);
    const u = as(PSI, `update public.notebook_parts set data = '{}' where owner_id = '${NICOLE}' returning 1;`);
    assert.ok(u.ok, u.err);
    assert.strictEqual(u.out, '');
  });

  await t.test('con permiso de editar: escribe en esa sección, no en otra, nada privado y no borra', () => {
    sql(`update public.notebook_grants set level = 'editar' where grantee_id = '${PSI}' and section = 'emociones';`);
    let q = as(PSI, `insert into public.notebook_parts (owner_id, store, record_id, section, data, updated_at)
      values ('${NICOLE}', 'days', '2026-10-05', 'emociones', '{}', now());`);
    assert.ok(q.ok, q.err);
    q = as(PSI, `insert into public.notebook_parts (owner_id, store, record_id, section, data, updated_at)
      values ('${NICOLE}', 'days', '2026-10-06', 'escritura', '{}', now());`);
    assert.ok(!q.ok, 'no debería escribir escritura');
    q = as(PSI, `insert into public.notebook_parts (owner_id, store, record_id, section, data, private, updated_at)
      values ('${NICOLE}', 'days', '2026-10-07', 'emociones', '{}', true, now());`);
    assert.ok(!q.ok, 'no debería escribir algo privado');
    q = as(PSI, `update public.notebook_parts set private = true where owner_id = '${NICOLE}' and section = 'emociones';`);
    assert.ok(!q.ok, 'no debería volver privado algo ajeno');
    q = as(PSI, `delete from public.notebook_parts where owner_id = '${NICOLE}' returning 1;`);
    assert.ok(q.ok, q.err);
    assert.strictEqual(q.out, '');
  });

  await t.test('sin permiso: nada', () => {
    assert.strictEqual(as(OTRA, `select count(*) from public.notebook_parts;`).out, '0');
    assert.strictEqual(as(OTRA, `select count(*) from public.profiles;`).out, '1');
  });

  await t.test('perfiles: el PIN nunca se lee; quien recibió permiso ve el nombre de quien lo dio', () => {
    const q = as(PSI, `select pin_hash from public.profiles;`);
    assert.ok(!q.ok && /permission denied/.test(q.err), q.err);
    assert.strictEqual(as(PSI, `select string_agg(username, ',' order by username) from public.profiles;`).out, 'nicole,psicologa');
    assert.strictEqual(as(NICOLE, `select count(*) from public.profiles;`).out, '3');
    const w = as(PSI, `update public.profiles set is_admin = true where id = '${PSI}';`);
    assert.ok(!w.ok && /permission denied/.test(w.err), w.err);
  });

  await t.test('permisos: solo quien es dueña los da o los saca', () => {
    let q = as(PSI, `insert into public.notebook_grants (owner_id, grantee_id, section, level) values ('${NICOLE}', '${OTRA}', 'hojas', 'ver');`);
    assert.ok(!q.ok, 'no puede dar permisos sobre un cuaderno ajeno');
    q = as(PSI, `delete from public.notebook_grants returning 1;`);
    assert.strictEqual(q.out, '');
    q = as(NICOLE, `insert into public.notebook_grants (owner_id, grantee_id, section, level) values ('${NICOLE}', '${NICOLE}', 'hojas', 'ver');`);
    assert.ok(!q.ok && /grants_not_self/.test(q.err), q.err);
    q = as(NICOLE, `insert into public.notebook_grants (owner_id, grantee_id, section, level) values ('${NICOLE}', '${OTRA}', 'hojas', 'ver');`);
    assert.ok(q.ok, q.err);
  });

  await t.test('una persona deshabilitada pierde sus permisos', () => {
    sql(`update public.profiles set disabled_at = now() where id = '${PSI}';`);
    assert.strictEqual(as(PSI, `select count(*) from public.notebook_parts;`).out, '0');
    sql(`update public.profiles set disabled_at = null where id = '${PSI}';`);
  });

  await t.test('B5: solo la administradora inicial tiene cuaderno propio; updated_by registra quién escribió', () => {
    // En Supabase la migración B5 corre con la administradora ya creada: se reaplica acá igual.
    sql(fs.readFileSync(path.join(root, 'supabase/migrations/20261005090000_cuadernos_compartidos.sql'), 'utf8'));
    assert.strictEqual(as(NICOLE, `select string_agg(username || ':' || has_notebook, ',' order by username) from public.profiles;`).out,
      'nicole:true,otra:false,psicologa:false');
    sql(`update public.notebook_grants set level = 'editar' where grantee_id = '${PSI}' and section = 'emociones';`);
    const q = as(PSI, `insert into public.notebook_parts (owner_id, store, record_id, section, data, updated_at, updated_by)
      values ('${NICOLE}', 'days', '2026-10-09', 'emociones', '{}', now(), '${PSI}')
      on conflict (owner_id, store, record_id, section) do update set data = excluded.data, updated_at = excluded.updated_at, updated_by = excluded.updated_by;`);
    assert.ok(q.ok, q.err);
    assert.strictEqual(as(NICOLE, `select updated_by from public.notebook_parts where record_id = '2026-10-09';`).out, PSI);
  });

  await t.test('tablas del servidor cerradas para el navegador', () => {
    for (const table of ['login_throttle', 'push_log', 'keepalive']) {
      const q = as(NICOLE, `select count(*) from public.${table};`);
      assert.ok(!q.ok && /permission denied/.test(q.err), table);
    }
    const a = as(PSI, `select count(*) from public.audit_events;`);
    assert.strictEqual(a.out, '0');
  });

  await t.test('avisos push: cada quien los suyos', () => {
    let q = as(PSI, `insert into public.push_subscriptions (endpoint, user_id, p256dh, auth) values ('https://push.example/a', '${NICOLE}', 'k', 'a');`);
    assert.ok(!q.ok, 'no puede suscribir a otra persona');
    q = as(PSI, `insert into public.push_subscriptions (endpoint, user_id, p256dh, auth) values ('https://push.example/b', '${PSI}', 'k', 'a');`);
    assert.ok(q.ok, q.err);
    assert.strictEqual(as(NICOLE, `select count(*) from public.push_subscriptions;`).out, '0');
  });

  await t.test('NB1: el bucket de fotos es privado y el navegador no lo ve', () => {
    assert.strictEqual(sql(`select public::text || ',' || coalesce(file_size_limit, 0) from storage.buckets where id = 'cuaderno';`).trim(), 'false,3200000');
    const q = as(NICOLE, `select count(*) from storage.buckets;`);
    assert.ok(!q.ok && /permission denied/.test(q.err), 'sin permisos para el navegador');
  });

  await t.test('D50: borrar una cuenta (su usuario de Auth) se lleva su perfil, su cuaderno, sus permisos y sus avisos', () => {
    const X = '44444444-4444-4444-8444-444444444444';
    sql(`
      insert into auth.users (id) values ('${X}');
      insert into public.profiles (id, username, display_name, pin_hash, is_admin, has_notebook, created_by) values ('${X}', 'nicole.prueba', 'Prueba de Nicole', 'sin-pin', false, true, '${NICOLE}');
      insert into public.notebook_parts (owner_id, store, record_id, section, data, private, updated_at) values ('${X}', 'days', '2026-10-05', 'escritura', '{"notes":"x"}', false, now());
      insert into public.notebook_grants (owner_id, grantee_id, section, level) values ('${X}', '${PSI}', 'escritura', 'ver'), ('${NICOLE}', '${X}', 'emociones', 'ver');
      insert into public.push_subscriptions (endpoint, user_id, p256dh, auth) values ('https://push.example/x', '${X}', 'p', 'a');
      insert into public.audit_events (actor_id, action, target_id) values ('${NICOLE}', 'persona.alta', '${X}');
      delete from auth.users where id = '${X}';
    `);
    for (const [table, col] of [['profiles', 'id'], ['notebook_parts', 'owner_id'], ['push_subscriptions', 'user_id']]) {
      assert.strictEqual(sql(`select count(*) from public.${table} where ${col} = '${X}';`), '0', table);
    }
    assert.strictEqual(sql(`select count(*) from public.notebook_grants where owner_id = '${X}' or grantee_id = '${X}';`), '0');
    assert.strictEqual(sql(`select count(*) from public.audit_events where action = 'persona.alta' and target_id is null;`), '1', 'el registro queda, sin la persona');
    assert.strictEqual(sql(`select count(*) from public.notebook_parts where owner_id = '${NICOLE}';`) !== '0', true, 'lo de Nicole sigue');
  });
});
