// Rellamadas: llamar a otra hora. Vistas, retención, migración y guion.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CRM } from '../prospecting/crm.mjs';
import { ficha, hoyMadrid } from '../prospecting/report.mjs';

// Martes 27 de octubre de 2026, 10:00 en Madrid (09:00 UTC).
const MARTES = '2026-10-27T09:00:00.000Z';
let reloj = MARTES;
function preparar(ruta = ':memory:') {
  reloj = MARTES;
  const crm = new CRM(ruta, () => reloj);
  crm.registerSource({ id: 'g', url: 'https://example.com/', permissionRef: 'p', reviewedBy: 'o', expiresAt: '2030-01-01T00:00:00Z', enabled: true, maxAgeDays: 30 });
  const base = { municipality: 'Benidorm', province: '03', sector: 'health_clinic', observedAt: MARTES, website: null };
  const ids = crm.importBatch('g', ['a', 'b', 'c'].map((k, i) => ({ ...base, name: `Clínica ${k}`, phone: `966 00 00 0${i}`, sourceRecordId: k })));
  return { crm, ids };
}
const nombres = (v) => v.map((x) => x.name);

test('hoyMadrid usa la fecha de Madrid, no la UTC', () => {
  assert.equal(hoyMadrid('2026-10-27T22:30:00Z'), '2026-10-27');
  assert.equal(hoyMadrid('2026-10-27T23:30:00Z'), '2026-10-28'); // 00:30 en Madrid (CET)
});

test('programar valida el formato, sustituye la anterior y no vale para excluidas', () => {
  const { crm, ids: [a, b] } = preparar();
  for (const mal of [null, '', '2026-10-28', '2026-10-28 10:00', '2026-02-30T10:00', '2026-10-28T25:00', '2026-10-28T10:60', 'mañana']) {
    assert.throws(() => crm.programarRellamada(a, mal), /no válidas/, String(mal));
  }
  assert.throws(() => crm.programarRellamada(999, '2026-10-28T10:00'), /no existe/);
  crm.programarRellamada(a, '2026-10-28T10:00');
  crm.programarRellamada(a, '2026-10-29T09:30');
  assert.equal(crm.rellamada(a).cuando, '2026-10-29T09:30');
  assert.equal(crm.rellamada(a).toca, false);
  assert.equal(crm.rellamada(b), null);
  crm.setStatus(b, 'suppressed', 'test');
  assert.throws(() => crm.programarRellamada(b, '2026-10-28T10:00'), /excluida/);
  crm.close();
});

test('una rellamada futura saca la clínica de «por llamar»; la de hoy o vencida va a «hoy», por hora', () => {
  const { crm, ids: [a, b, c] } = preparar();
  assert.deepEqual(crm.vista('hoy'), []);
  crm.programarRellamada(a, '2026-10-28T10:00');
  assert.deepEqual(nombres(crm.vista('porllamar')), ['Clínica b', 'Clínica c']);
  assert.deepEqual(crm.vista('hoy'), []);
  assert.equal(crm.cuentas().porllamar, 2);
  assert.equal(crm.cuentas().hoy, 0);
  assert.equal(crm.vista('todas').length, 3);
  // Con fecha de hoy ya toca: sale en «hoy» y también sigue en «por llamar».
  crm.programarRellamada(b, '2026-10-27T16:00');
  crm.programarRellamada(c, '2026-10-27T09:00');
  assert.deepEqual(nombres(crm.vista('hoy')), ['Clínica c', 'Clínica b']);
  assert.equal(crm.vista('hoy')[0].cuando, '2026-10-27T09:00');
  assert.equal(crm.cuentas().hoy, 2);
  assert.deepEqual(nombres(crm.vista('porllamar')), ['Clínica b', 'Clínica c']);
  // Al día siguiente la de mañana pasa a «hoy» y las vencidas siguen, por hora.
  reloj = '2026-10-28T08:00:00.000Z';
  assert.deepEqual(nombres(crm.vista('hoy')), ['Clínica c', 'Clínica b', 'Clínica a']);
  assert.equal(crm.rellamada(a).toca, true);
  crm.close();
});

test('cualquier cambio de estado, el sí, excluir y quitar borran la rellamada', () => {
  const { crm, ids: [a, b, c] } = preparar();
  for (const id of [a, b, c]) crm.programarRellamada(id, '2026-10-28T10:00');
  crm.setStatus(a, 'rejected', 'test');
  assert.equal(crm.rellamada(a), null);
  crm.registrarSi(b, { email: 'info@x.es', quien: 'Marta' });
  assert.equal(crm.rellamada(b), null);
  crm.quitarRellamada(c);
  assert.equal(crm.rellamada(c), null);
  crm.programarRellamada(c, '2026-10-28T10:00');
  crm.setStatus(c, 'suppressed', 'test');
  assert.equal(crm.db.prepare('SELECT count(*) AS n FROM rellamadas').get().n, 0);
  crm.close();
});

test('purge borra la rellamada de una clínica excluida al anonimizarla', () => {
  const { crm, ids: [a] } = preparar();
  crm.programarRellamada(a, '2026-10-28T10:00');
  crm.db.prepare("UPDATE leads SET status='suppressed' WHERE id=?").run(a); // excluida sin pasar por setStatus
  reloj = '2026-12-31T09:00:00.000Z';
  crm.purge();
  assert.equal(crm.db.prepare('SELECT count(*) AS n FROM rellamadas').get().n, 0);
  crm.close();
});

test('migración desde la versión 6 en disco conserva los datos', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'md-crm-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const ruta = join(dir, 'crm.sqlite');
  const { crm, ids: [a] } = preparar(ruta);
  crm.registrarSi(a, { email: 'info@x.es', quien: 'Marta' });
  crm.db.exec('DROP TABLE rellamadas; PRAGMA user_version = 6');
  crm.close();
  const nuevo = new CRM(ruta, () => MARTES);
  assert.equal(nuevo.db.prepare('PRAGMA user_version').get().user_version, 7);
  assert.equal(nuevo.list().length, 3);
  assert.equal(nuevo.consentimiento(a).email, 'info@x.es');
  nuevo.programarRellamada(a, '2026-10-28T10:00');
  assert.equal(nuevo.rellamada(a).cuando, '2026-10-28T10:00');
  nuevo.close();
});

test('la ficha lleva la rellamada y la presentación cambia cuando toca', () => {
  const lead = { name: 'Sonrisa', municipality: 'Benidorm', sector: 'health_clinic', phone: '966000001', website: null };
  const analisis = { score: 10, problems: ['sinweb'], signals: { website: false }, analyzed_at: MARTES };
  const normal = ficha(lead, analisis);
  assert.equal('rellamada' in normal, false);
  assert.match(normal.pasos[0].frases[0], /un estudio de la Marina Baixa/);
  const futura = ficha(lead, analisis, null, null, { cuando: '2026-10-28T10:00', toca: false });
  assert.equal(futura.rellamada.cuando, '2026-10-28T10:00');
  assert.deepEqual(futura.pasos, normal.pasos);
  const hoy = ficha(lead, analisis, null, null, { cuando: '2026-10-27T10:00', toca: true });
  assert.equal(hoy.pasos[0].frases[0], 'Hola, buenos días. Soy [tu nombre], de MentaDev. Me dijisteis que os llamara hoy a esta hora. ¿Os pillo bien ahora?');
  assert.ok(hoy.guion.includes(hoy.pasos[0].frases[0]));
  assert.equal(hoy.pasos.length, normal.pasos.length);
  const masTarde = normal.preguntas.find((p) => p.pregunta.startsWith('Ahora no puedo'));
  assert.match(masTarde.respuesta, /\(Apúntalo en el panel con «Volver a llamar»\.\)/);
});
