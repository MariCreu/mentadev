// Seguimiento del email enviado: marcar enviado, resultado, vista, días laborables y retención.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CRM, diasLaborablesDesde } from '../prospecting/crm.mjs';
import { ficha } from '../prospecting/report.mjs';

// Viernes 23 de octubre de 2026.
const VIERNES = '2026-10-23T10:00:00.000Z';
let reloj = VIERNES;
function preparar(ruta = ':memory:') {
  reloj = VIERNES;
  const crm = new CRM(ruta, () => reloj);
  crm.registerSource({ id: 'g', url: 'https://example.com/', permissionRef: 'p', reviewedBy: 'o', expiresAt: '2030-01-01T00:00:00Z', enabled: true, maxAgeDays: 30 });
  const base = { municipality: 'Benidorm', province: '03', sector: 'health_clinic', observedAt: VIERNES, website: null };
  const [a, b] = crm.importBatch('g', [{ ...base, name: 'Sonrisa', phone: '966 00 00 01', sourceRecordId: 'a' }, { ...base, name: 'Otra', phone: '966 00 00 02', sourceRecordId: 'b' }]);
  return { crm, a, b };
}
const si = (crm, id) => crm.registrarSi(id, { email: 'info@x.es', quien: 'Marta' });

test('diasLaborablesDesde cuenta lunes a viernes después del día de envío', () => {
  assert.equal(diasLaborablesDesde('2026-10-23T10:00:00Z', '2026-10-23T18:00:00Z'), 0);
  assert.equal(diasLaborablesDesde('2026-10-23T10:00:00Z', '2026-10-25T10:00:00Z'), 0); // fin de semana
  assert.equal(diasLaborablesDesde('2026-10-23T10:00:00Z', '2026-10-26T10:00:00Z'), 1);
  assert.equal(diasLaborablesDesde('2026-10-23T10:00:00Z', '2026-10-27T10:00:00Z'), 2);
  assert.equal(diasLaborablesDesde('2026-10-23T10:00:00Z', '2026-10-28T08:00:00Z'), 3); // viernes -> toca el miércoles
  assert.equal(diasLaborablesDesde('2026-10-24T10:00:00Z', '2026-10-27T10:00:00Z'), 2); // enviado en sábado
  assert.equal(diasLaborablesDesde('2026-10-20T10:00:00Z', '2026-10-23T10:00:00Z'), 3); // martes -> viernes
});

test('marcarEnviado exige el sí previo y se puede repetir', () => {
  const { crm, a, b } = preparar();
  assert.throws(() => crm.marcarEnviado(a), /sí por teléfono/);
  si(crm, a);
  crm.marcarEnviado(a);
  assert.equal(crm.seguimiento(a).enviado, VIERNES);
  crm.registrarResultado(a, 'contestado');
  reloj = '2026-10-26T10:00:00.000Z';
  crm.marcarEnviado(a);
  const s = crm.seguimiento(a);
  assert.equal(s.enviado, reloj);
  assert.equal(s.resultado, null);
  assert.equal(s.toca, false);
  assert.equal(s.desde, '2026-10-29');
  assert.equal(crm.seguimiento(b), null);
  crm.close();
});

test('registrarResultado: exige envío; no_interesa descarta; quiere y contestado mantienen el estado', () => {
  const { crm, a, b } = preparar();
  si(crm, a); si(crm, b);
  assert.throws(() => crm.registrarResultado(a, 'quiere'), /marca el email como enviado/);
  crm.marcarEnviado(a); crm.marcarEnviado(b);
  assert.throws(() => crm.registrarResultado(a, 'otro'), /no válido/);
  crm.registrarResultado(a, 'quiere');
  assert.equal(crm.lead(a).status, 'qualified');
  crm.registrarResultado(b, 'no_interesa');
  assert.equal(crm.lead(b).status, 'rejected');
  assert.equal(crm.db.prepare("SELECT COUNT(*) n FROM activities WHERE lead_id=? AND status='rejected'").get(b).n, 1);
  crm.close();
});

test('la vista seguimiento: solo vencidas, sin respuesta, más antigua primero', () => {
  const { crm, a, b } = preparar();
  si(crm, a); si(crm, b);
  crm.marcarEnviado(b);
  reloj = '2026-10-26T09:00:00.000Z';
  crm.marcarEnviado(a);
  reloj = '2026-10-28T12:00:00.000Z';
  assert.deepEqual(crm.vista('seguimiento').map((r) => r.id), [b]); // a lleva 2 días laborables
  assert.equal(crm.vista('seguimiento')[0].enviado, VIERNES);
  assert.equal(crm.cuentas().seguimiento, 1);
  reloj = '2026-10-29T12:00:00.000Z';
  assert.deepEqual(crm.vista('seguimiento').map((r) => r.id), [b, a]);
  crm.registrarResultado(b, 'contestado');
  assert.deepEqual(crm.vista('seguimiento').map((r) => r.id), [a]);
  crm.registrarResultado(a, 'no_interesa');
  assert.equal(crm.cuentas().seguimiento, 0);
  crm.close();
});

test('la ficha lleva el guion de seguimiento mientras no haya resultado', () => {
  const { crm, a } = preparar();
  si(crm, a);
  const an = { blocked: false, score: 10, problems: ['sinweb'], analyzed_at: VIERNES };
  assert.equal(ficha(crm.lead(a), an, crm.seguimiento(a)).seguimiento, undefined);
  crm.marcarEnviado(a);
  reloj = '2026-10-28T10:00:00.000Z';
  const f = ficha(crm.lead(a), an, crm.seguimiento(a), { nombre: 'Clínica Sol' });
  assert.equal(f.seguimiento.toca, true);
  assert.match(f.seguimiento.guion[0], /El 23\/10 os mandamos por email la web de ejemplo de Clínica Sol\./);
  assert.equal(f.seguimiento.guion.length, 4);
  crm.registrarResultado(a, 'contestado');
  assert.equal(ficha(crm.lead(a), an, crm.seguimiento(a)).seguimiento, undefined);
  crm.close();
});

test('excluir una clínica borra su seguimiento; la purga también', () => {
  const { crm, a, b } = preparar();
  si(crm, a); si(crm, b);
  crm.marcarEnviado(a); crm.marcarEnviado(b);
  crm.setStatus(a, 'suppressed', 'panel');
  assert.equal(crm.seguimiento(a), null);
  assert.throws(() => crm.marcarEnviado(a), /excluida/);
  // Anonimización: la excluida sigue con su huella, sin seguimiento ni datos.
  crm.db.exec("INSERT INTO seguimientos(lead_id,enviado) VALUES(" + a + ",'2026-10-23T10:00:00.000Z')");
  reloj = '2026-12-31T10:00:00.000Z';
  crm.purge();
  assert.equal(crm.db.prepare('SELECT COUNT(*) n FROM seguimientos').get().n, 0);
  crm.close();
});

test('migración desde la versión 5 conserva los datos', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'md-crm-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const ruta = join(dir, 'crm.sqlite');
  const { crm, a } = preparar(ruta);
  si(crm, a);
  crm.db.exec('DROP TABLE seguimientos; PRAGMA user_version = 5');
  crm.close();
  const nuevo = new CRM(ruta, () => VIERNES);
  assert.equal(nuevo.db.prepare('PRAGMA user_version').get().user_version, 7);
  assert.equal(nuevo.list().length, 2);
  assert.equal(nuevo.consentimiento(a).email, 'info@x.es');
  nuevo.marcarEnviado(a);
  assert.equal(nuevo.seguimiento(a).enviado, VIERNES);
  nuevo.close();
});
