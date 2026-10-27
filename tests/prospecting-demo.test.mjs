// Demo de cada clínica en el CRM (tabla demos): guardar, leer, borrar al excluir y migrar.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { CRM } from '../prospecting/crm.mjs';
import { leerEnlace } from '../demo/enlace.js';

const ahora = '2026-10-22T10:00:00.000Z';
function preparar() {
  const reloj = { t: ahora };
  const crm = new CRM(':memory:', () => reloj.t);
  crm.registerSource({ id: 'google-places', url: 'https://cloud.google.com/maps-platform/terms', permissionRef: 'p', reviewedBy: 'o', expiresAt: '2030-01-01T00:00:00Z', enabled: true, maxAgeDays: 30 });
  const base = { municipality: 'Benidorm', province: '03', sector: 'health_clinic', observedAt: ahora };
  const [sinWeb, movil] = crm.importBatch('google-places', [
    { ...base, name: 'Sonrisa Sin Web', website: null, phone: '966 00 00 01', sourceRecordId: 'a' },
    { ...base, name: 'Dental Móvil', website: null, phone: '612 34 56 78', sourceRecordId: 'b' },
  ]);
  return { crm, reloj, sinWeb, movil };
}
const datos = { nombre: 'Consulta del Dr. Soler', tipo: 'medica', tratamientos: [0, 2], whatsapp: false };

test('guardar y leer', () => {
  const { crm, sinWeb } = preparar();
  crm.guardarDemo(sinWeb, datos);
  const d = crm.demo(sinWeb);
  assert.equal(d.nombre, datos.nombre);
  assert.equal(d.tipo, 'medica');
  assert.deepEqual(d.tratamientos, [0, 2]);
  assert.equal(d.whatsapp, false);
  const e = leerEnlace(new URL(d.enlace).hash);
  assert.equal(e.telefono, '966 00 00 01');
  assert.equal(e.municipio, 'Benidorm');
  crm.close();
});

test('el nombre guardado de la clínica no cambia', () => {
  const { crm, sinWeb } = preparar();
  crm.guardarDemo(sinWeb, datos);
  assert.equal(crm.lead(sinWeb).name, 'Sonrisa Sin Web');
  crm.close();
});

test('no se guarda en una excluida y marcar no volver a llamar borra la demo', () => {
  const { crm, sinWeb } = preparar();
  crm.guardarDemo(sinWeb, datos);
  crm.setStatus(sinWeb, 'suppressed', 'o');
  assert.equal(crm.demo(sinWeb), null);
  assert.throws(() => crm.guardarDemo(sinWeb, datos), /excluida/);
  crm.close();
});

test('purge que borra la clínica borra su demo', () => {
  const { crm, reloj, sinWeb } = preparar();
  crm.guardarDemo(sinWeb, datos);
  reloj.t = '2026-11-22T10:00:00.000Z';
  crm.purge();
  assert.equal(crm.demo(sinWeb), null);
  crm.close();
});

test('purge que anonimiza una excluida no deja su demo', () => {
  const { crm, reloj, sinWeb } = preparar();
  crm.guardarDemo(sinWeb, datos);
  crm.db.prepare("UPDATE leads SET status='suppressed' WHERE id=?").run(sinWeb); // salta setStatus a propósito
  reloj.t = '2026-11-22T10:00:00.000Z';
  crm.purge();
  assert.equal(crm.db.prepare('SELECT COUNT(*) n FROM demos').get().n, 0);
  crm.close();
});

test('por defecto: WhatsApp solo con móvil', () => {
  const { crm, sinWeb, movil } = preparar();
  const fijo = crm.demoPorDefecto(sinWeb);
  assert.equal(fijo.whatsapp, false);
  assert.equal(fijo.nombre, 'Sonrisa Sin Web');
  assert.equal(fijo.tipo, 'generica');
  assert.ok(fijo.tratamientos.length > 0);
  assert.equal(crm.demoPorDefecto(movil).whatsapp, true);
  crm.close();
});

test('migración desde la versión 4', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'md-crm-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const ruta = join(dir, 'crm.sqlite');
  const viejo = new CRM(ruta, () => ahora);
  viejo.db.exec('DROP TABLE demos; PRAGMA user_version = 4');
  viejo.registerSource({ id: 'manual', url: 'https://example.com/', permissionRef: 'p', reviewedBy: 'o', expiresAt: '2030-01-01T00:00:00Z', enabled: true });
  viejo.importBatch('manual', [{ name: 'Antigua', municipality: 'Benidorm', province: '03', sector: 'health_clinic', website: null, phone: '966 00 00 01', sourceRecordId: 'm', observedAt: ahora }]);
  viejo.close();
  const crm = new CRM(ruta, () => ahora);
  assert.equal(crm.db.prepare('PRAGMA user_version').get().user_version, 7);
  assert.equal(crm.db.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE name='demos'").get().n, 1);
  assert.equal(crm.list().length, 1);
  crm.close();
});

test('guardarDemo exige al menos un tratamiento', () => {
  const { crm, sinWeb } = preparar();
  assert.throws(() => crm.guardarDemo(sinWeb, { ...datos, tratamientos: [] }), /Marca al menos un tratamiento/);
  assert.throws(() => crm.guardarDemo(sinWeb, { ...datos, tratamientos: ['x', -1, 99] }), /Marca al menos un tratamiento/);
  assert.equal(crm.demo(sinWeb), null);
});
