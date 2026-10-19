import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';

const B = { nombre: 'Ana', email: 'ana@example.com', elapsed: 5000 };
const envio = async (data, origin = 'http://l') => {
  const sent = [];
  const env = { CONTACT_TO: 'destino@example.com', EMAIL: { send: async (m) => sent.push(m) }, ASSETS: { fetch: () => new Response('asset') } };
  const res = await worker.fetch(new Request('http://l/api/contacto', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(data) }), env);
  return { status: res.status, sent };
};

test('sector válido aparece en el email', async () => {
  const { status, sent } = await envio({ ...B, servicio: 'Web o landing', mensaje: 'Hola', sector: 'clinica' });
  assert.equal(status, 200);
  assert.match(sent[0].text, /Servicio: Web o landing\nSector: Clínica/);
});

test('sector desconocido o ausente se ignora', async () => {
  for (const sector of ['banco', undefined, 42]) {
    const { status, sent } = await envio({ ...B, servicio: 'Web o landing', mensaje: 'Hola', sector });
    assert.equal(status, 200);
    assert.doesNotMatch(sent[0].text, /Sector:/);
  }
});

test('se mantienen las reglas actuales', async () => {
  assert.equal((await envio({ ...B, servicio: 'Revisión gratis de mi web', web: 'minegocio.es' })).status, 200);
  assert.equal((await envio({ ...B, servicio: 'Revisión gratis de mi web' })).status, 400);
  assert.equal((await envio({ ...B, servicio: 'Tienda online' })).status, 400);
  assert.equal((await envio({ ...B, servicio: 'Tienda online', mensaje: 'x', website: 'spam' })).sent.length, 0);
  assert.equal((await envio({ ...B, servicio: 'Tienda online', mensaje: 'x' }, 'https://evil.com')).status, 403);
});
