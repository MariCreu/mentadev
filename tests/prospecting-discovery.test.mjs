import { test } from 'node:test';
import assert from 'node:assert/strict';
import { searchPlaces, toRecords } from '../prospecting/discovery.mjs';
import { score } from '../prospecting/analyzer.mjs';
import { report } from '../prospecting/report.mjs';
import { CRM } from '../prospecting/crm.mjs';

const place = (id, name, postal, locality, extra = {}) => ({
  id, displayName: { text: name }, businessStatus: 'OPERATIONAL',
  addressComponents: [{ longText: postal, types: ['postal_code'] }, { longText: locality, types: ['locality', 'political'] }],
  ...extra,
});
const PLACES = [
  place('p1', 'Clínica Dental Sol', '03501', 'Benidorm', { websiteUri: 'https://dentalsol.example/' }),
  place('p2', 'Fisioterapia Mar', '03503', 'Benidorm'),
  place('p3', 'Clínica de Valencia', '46001', 'València', { websiteUri: 'https://valencia.example/' }),
  place('p4', 'Clínica Cerrada', '03502', 'Benidorm', { businessStatus: 'CLOSED_PERMANENTLY' }),
  place('p1', 'Clínica Dental Sol', '03501', 'Benidorm', { websiteUri: 'https://dentalsol.example/' }),
];

test('pide a Places solo los campos admitidos y recorre páginas', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, headers: options.headers, body: JSON.parse(options.body) });
    const pages = [{ places: PLACES.slice(0, 2), nextPageToken: 't2' }, { places: PLACES.slice(2) }];
    return new Response(JSON.stringify(pages[calls.length - 1]));
  };
  const places = await searchPlaces('clínica dental Benidorm', { key: 'k', fetchImpl });
  assert.equal(places.length, 5);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].body.pageToken, 't2');
  assert.equal(calls[0].headers['X-Goog-Api-Key'], 'k');
  // El teléfono de la clínica sí (para llamar); reseñas, fotos y valoraciones, nunca.
  assert.match(calls[0].headers['X-Goog-FieldMask'], /places\.nationalPhoneNumber/);
  assert.doesNotMatch(calls[0].headers['X-Goog-FieldMask'], /review|photo|rating|internationalPhone/i);
  await assert.rejects(searchPlaces('x', { key: null }), /GOOGLE_MAPS_API_KEY/);
  await assert.rejects(searchPlaces('x', { key: 'k', fetchImpl: async () => new Response(JSON.stringify({ error: { message: 'API key not valid' } }), { status: 400 }) }), /400: API key not valid/);
});

test('convierte resultados en un lote: solo Alicante, abiertas, sin repetir', () => {
  const { records, skipped } = toRecords(PLACES, { sector: 'health_clinic', observedAt: '2026-10-21T10:00:00Z' });
  assert.deepEqual(records.map(r => [r.sourceRecordId, r.municipality, r.website]), [['p1', 'Benidorm', 'https://dentalsol.example/'], ['p2', 'Benidorm', null]]);
  assert.deepEqual(skipped.map(s => s.reason), ['fuera de la provincia de Alicante', 'cerrada']);
});

test('clínicas sin web: se importan, puntúan 10 y el guion lo dice', t => {
  const now = '2026-10-21T10:00:00.000Z';
  const crm = new CRM(':memory:', () => now);
  t.after(() => crm.close());
  crm.registerSource({ id: 'google-places', url: 'https://cloud.google.com/maps-platform/terms', permissionRef: 'Condiciones de Google Maps Platform', reviewedBy: 'operador', expiresAt: '2027-01-01T00:00:00Z', enabled: true, maxAgeDays: 30 });
  const [, sinWeb] = crm.importBatch('google-places', toRecords(PLACES, { sector: 'health_clinic', observedAt: now }).records);
  const result = { url: null, signals: { website: false } };
  crm.saveAnalysis(sinWeb, result, score(result.signals));
  assert.deepEqual({ ...crm.ranking()[0] }, { id: sinWeb, name: 'Fisioterapia Mar', municipality: 'Benidorm', status: 'new', score: 10, analyzed_at: now });
  const ficha = report(crm.lead(sinWeb), crm.latestAnalysis(sinWeb));
  assert.match(ficha, /sin web/);
  assert.match(ficha, /no tiene web propia/);
  assert.doesNotMatch(ficha, /quien lleva la web/, 'a una clínica sin web no se le pregunta por quien lleva la web');
  assert.throws(() => crm.registerSource({ id: 'x', url: 'https://example.com/', permissionRef: 'p', reviewedBy: 'o', expiresAt: '2027-01-01T00:00:00Z', enabled: true, maxAgeDays: 0 }));
});

test('purge borra lo caducado de fuentes con plazo y conserva las excluidas', t => {
  let now = '2026-10-01T10:00:00.000Z';
  const crm = new CRM(':memory:', () => now);
  t.after(() => crm.close());
  const source = { url: 'https://example.com/', permissionRef: 'p', reviewedBy: 'o', expiresAt: '2027-01-01T00:00:00Z', enabled: true };
  crm.registerSource({ ...source, id: 'google-places', maxAgeDays: 30 });
  crm.registerSource({ ...source, id: 'manual' });
  const base = { municipality: 'Benidorm', province: '03', sector: 'health_clinic', website: null, observedAt: now };
  const [caduca, excluida, renovada] = crm.importBatch('google-places', [
    { ...base, name: 'Caduca', sourceRecordId: 'a' }, { ...base, name: 'Excluida', sourceRecordId: 'b' }, { ...base, name: 'Renovada', sourceRecordId: 'c' },
  ]);
  const [doble] = crm.importBatch('manual', [{ ...base, name: 'Caduca', sourceRecordId: 'm1' }]);
  assert.equal(doble, caduca);
  crm.setStatus(excluida, 'suppressed', 'operador');
  now = '2026-10-25T10:00:00.000Z';
  crm.importBatch('google-places', [{ ...base, name: 'Renovada', sourceRecordId: 'c', observedAt: now }]);
  assert.deepEqual(crm.purge(), { observations: 0, leads: 0, anonymized: 0 });
  now = '2026-11-05T10:00:00.000Z';
  assert.deepEqual(crm.purge(), { observations: 2, leads: 0, anonymized: 1 });
  assert.deepEqual(crm.list().map(l => l.id), [caduca, excluida, renovada]);
  crm.db.prepare("DELETE FROM observations WHERE source_id='manual'").run();
  assert.deepEqual(crm.purge(), { observations: 0, leads: 1, anonymized: 0 });
  assert.deepEqual(crm.list().map(l => l.id), [excluida, renovada]);
});
