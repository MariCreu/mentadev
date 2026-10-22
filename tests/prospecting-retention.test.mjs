import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { CRM } from '../prospecting/crm.mjs';

const CLI = new URL('../prospecting/cli.mjs', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const source = { url: 'https://example.com/', permissionRef: 'p', reviewedBy: 'o', expiresAt: '2030-01-01T00:00:00Z', enabled: true };
const base = { municipality: 'Benidorm', province: '03', sector: 'health_clinic', website: 'https://clinica.example/' };
// En Windows la carpeta no se puede borrar con la base abierta: cada prueba cierra la suya antes de terminar.
function tmp(t) {
  const dir = mkdtempSync(join(tmpdir(), 'md-crm-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return join(dir, 'crm.sqlite');
}

// Esquema tal y como lo creaba la primera versión (PR #1), sin user_version.
const V1 = `
CREATE TABLE sources (id TEXT PRIMARY KEY, url TEXT NOT NULL, permission_ref TEXT NOT NULL, reviewed_by TEXT NOT NULL, expires_at TEXT NOT NULL, enabled INTEGER NOT NULL CHECK(enabled IN (0,1)));
CREATE TABLE leads (id INTEGER PRIMARY KEY, identity TEXT NOT NULL UNIQUE, name TEXT NOT NULL, municipality TEXT NOT NULL, province TEXT NOT NULL CHECK(province = '03'), sector TEXT NOT NULL CHECK(sector IN ('health_clinic','aesthetic_clinic')), website TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','qualified','rejected','suppressed')), created_at TEXT NOT NULL);
CREATE TABLE observations (lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE, source_id TEXT NOT NULL REFERENCES sources(id), source_record_id TEXT NOT NULL, observed_at TEXT NOT NULL, PRIMARY KEY(source_id, source_record_id));
CREATE TABLE activities (id INTEGER PRIMARY KEY, lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE, actor TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL);
INSERT INTO sources VALUES ('manual','https://example.com/','p','o','2030-01-01T00:00:00.000Z',1);
INSERT INTO leads(id,identity,name,municipality,province,sector,website,status,created_at) VALUES (1,'["antigua","benidorm"]','Antigua','Benidorm','03','health_clinic','https://antigua.example/','suppressed','2026-10-01T00:00:00.000Z');
INSERT INTO observations VALUES (1,'manual','m1','2026-10-01T00:00:00.000Z');
INSERT INTO activities(lead_id,actor,status,created_at) VALUES (1,'operador','suppressed','2026-10-02T00:00:00.000Z');`;

test('una base creada con la primera versión se actualiza sola y conserva sus datos', t => {
  const path = tmp(t);
  const old = new DatabaseSync(path);
  old.exec(V1);
  old.close();
  const crm = new CRM(path, () => '2026-10-21T10:00:00.000Z');
  assert.equal(crm.db.prepare('PRAGMA user_version').get().user_version, 4);
  assert.equal(crm.lead(1).status, 'suppressed');
  assert.ok('phone' in crm.lead(1), 'la columna del teléfono existe tras actualizar');
  assert.equal(crm.db.prepare('SELECT count(*) AS n FROM activities').get().n, 1);
  crm.registerSource({ ...source, id: 'google-places', maxAgeDays: 30 });
  const [id] = crm.importBatch('google-places', [{ ...base, name: 'Sin web', website: null, sourceRecordId: 'g1', observedAt: '2026-10-20T00:00:00Z' }]);
  assert.equal(crm.lead(id).website, null);
  assert.equal(crm.db.prepare('PRAGMA foreign_key_check').all().length, 0);
  crm.close();
});

test('abrir una base ya actualizada no cambia nada', t => {
  const path = tmp(t);
  new CRM(path).close();
  const crm = new CRM(path);
  assert.equal(crm.db.prepare('PRAGMA user_version').get().user_version, 4);
  assert.ok(crm.db.prepare("SELECT 1 FROM pragma_table_info('sources') WHERE name='max_age_days'").get());
  crm.close();
});

test('de una excluida con datos de Google caducados solo queda una huella, y sigue excluida al reimportarla', t => {
  let now = '2026-10-01T10:00:00.000Z';
  const crm = new CRM(':memory:', () => now);
  t.after(() => crm.close());
  crm.registerSource({ ...source, id: 'google-places', maxAgeDays: 30 });
  const [id] = crm.importBatch('google-places', [{ ...base, name: 'Clínica Privada Sol', sourceRecordId: 'g1', observedAt: now }]);
  crm.saveAnalysis(id, { url: 'https://clinica.example/', signals: { reachable: true, https: true } }, { score: 2, problems: ['cita'] });
  crm.setStatus(id, 'suppressed', 'operador');
  now = '2026-11-05T10:00:00.000Z';
  assert.equal(crm.purge().anonymized, 1);
  const lead = crm.lead(id);
  assert.equal(lead.status, 'suppressed');
  assert.ok(!JSON.stringify(lead).includes('Sol'), 'no debe quedar el nombre');
  assert.ok(!JSON.stringify(lead).includes('Benidorm'), 'no debe quedar el municipio');
  assert.equal(lead.website, null);
  assert.equal(crm.db.prepare('SELECT count(*) AS n FROM analyses WHERE lead_id=?').get(id).n, 0);
  // Vuelve a salir en una búsqueda (mismo lugar o la misma clínica con otro id): se reconoce y sigue excluida.
  assert.deepEqual(crm.importBatch('google-places', [{ ...base, name: 'Clínica Privada Sol', sourceRecordId: 'g1', observedAt: now }]), [id]);
  assert.deepEqual(crm.importBatch('google-places', [{ ...base, name: 'clinica privada sol', sourceRecordId: 'g2', observedAt: now }]), [id]);
  assert.equal(crm.lead(id).status, 'suppressed');
  assert.ok(!JSON.stringify(crm.lead(id)).includes('Sol'));
  assert.equal(crm.purge().anonymized, 0);
});

test('cada comando del CLI borra antes lo caducado', t => {
  const path = tmp(t);
  const hace60 = new Date(Date.now() - 60 * 86_400_000).toISOString();
  const crm = new CRM(path);
  crm.registerSource({ ...source, id: 'google-places', maxAgeDays: 30 });
  crm.importBatch('google-places', [{ ...base, name: 'Vieja', sourceRecordId: 'g1', observedAt: hace60 }]);
  crm.close();
  const salida = execFileSync(process.execPath, ['--no-warnings', CLI, path, 'list'], { encoding: 'utf8' });
  assert.ok(!salida.includes('Vieja'));
  const despues = new CRM(path);
  assert.equal(despues.list().length, 0);
  despues.close();
});
