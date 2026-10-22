// El teléfono de la clínica: viene de Google Places, se guarda con el mismo plazo que el resto
// de sus datos y aparece en la ficha de llamada.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { toRecords } from '../prospecting/discovery.mjs';
import { CRM } from '../prospecting/crm.mjs';
import { report } from '../prospecting/report.mjs';

const fuente = { id: 'google-places', url: 'https://cloud.google.com/maps-platform/terms', permissionRef: 'p', reviewedBy: 'o', expiresAt: '2030-01-01T00:00:00Z', enabled: true, maxAgeDays: 30 };
const lugar = (telefono) => ({
  id: 'p1', displayName: { text: 'Clínica Dental Sol' }, businessStatus: 'OPERATIONAL', nationalPhoneNumber: telefono,
  addressComponents: [{ longText: '03501', types: ['postal_code'] }, { longText: 'Benidorm', types: ['locality'] }],
});

test('el lote lleva el teléfono de la clínica, y vacío si Google no lo tiene', () => {
  assert.equal(toRecords([lugar('966 12 34 56')], { sector: 'health_clinic', observedAt: '2026-10-22T10:00:00Z' }).records[0].phone, '966 12 34 56');
  assert.equal(toRecords([lugar(undefined)], { sector: 'health_clinic', observedAt: '2026-10-22T10:00:00Z' }).records[0].phone, null);
});

test('el CRM guarda el teléfono, lo actualiza al repetir la búsqueda y lo muestra en la ficha', (t) => {
  let now = '2026-10-22T10:00:00.000Z';
  const crm = new CRM(':memory:', () => now);
  t.after(() => crm.close());
  crm.registerSource(fuente);
  const lote = (tel) => toRecords([lugar(tel)], { sector: 'health_clinic', observedAt: now }).records;
  const [id] = crm.importBatch('google-places', lote('966 12 34 56'));
  assert.equal(crm.lead(id).phone, '966 12 34 56');
  crm.importBatch('google-places', lote('966 99 88 77'));
  assert.equal(crm.lead(id).phone, '966 99 88 77');
  assert.throws(() => crm.importBatch('google-places', [{ ...lote('x')[0], phone: 'llámame ya <script>' }]), /teléfono/i);
  const signals = { website: false };
  crm.saveAnalysis(id, { url: null, signals }, { score: 10, problems: ['sinweb'] });
  assert.match(report(crm.lead(id), crm.latestAnalysis(id)), /Teléfono: 966 99 88 77/);
});

test('al anonimizar una excluida se borra también su teléfono, y no vuelve al reimportarla', (t) => {
  let now = '2026-10-01T10:00:00.000Z';
  const crm = new CRM(':memory:', () => now);
  t.after(() => crm.close());
  crm.registerSource(fuente);
  const [id] = crm.importBatch('google-places', toRecords([lugar('966 12 34 56')], { sector: 'health_clinic', observedAt: now }).records);
  crm.setStatus(id, 'suppressed', 'operador');
  now = '2026-11-05T10:00:00.000Z';
  crm.purge();
  assert.equal(crm.lead(id).phone, null);
  crm.importBatch('google-places', toRecords([lugar('966 12 34 56')], { sector: 'health_clinic', observedAt: now }).records);
  assert.equal(crm.lead(id).phone, null);
});

test('una base de la versión 2 gana la columna del teléfono sin perder datos', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'md-crm-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, 'crm.sqlite');
  const v2 = new DatabaseSync(path);
  v2.exec(`CREATE TABLE sources (id TEXT PRIMARY KEY, url TEXT NOT NULL, permission_ref TEXT NOT NULL, reviewed_by TEXT NOT NULL, expires_at TEXT NOT NULL, enabled INTEGER NOT NULL CHECK(enabled IN (0,1)), max_age_days INTEGER);
    CREATE TABLE leads (id INTEGER PRIMARY KEY, identity TEXT NOT NULL UNIQUE, name TEXT NOT NULL, municipality TEXT NOT NULL, province TEXT NOT NULL, sector TEXT NOT NULL, website TEXT, status TEXT NOT NULL DEFAULT 'new', created_at TEXT NOT NULL);
    INSERT INTO leads(identity,name,municipality,province,sector,website,created_at) VALUES ('["sol","benidorm"]','Sol','Benidorm','03','health_clinic',NULL,'2026-10-21T00:00:00.000Z');
    PRAGMA user_version = 2;`);
  v2.close();
  const crm = new CRM(path);
  assert.equal(crm.db.prepare('PRAGMA user_version').get().user_version, 3);
  assert.equal(crm.lead(1).name, 'Sol');
  assert.equal(crm.lead(1).phone, null);
  crm.close();
});
