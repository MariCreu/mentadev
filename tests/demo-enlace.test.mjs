import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearEnlace, leerEnlace } from '../demo/enlace.js';

const base = { nombre: 'Clínica Sol', telefono: '965 85 18 01', municipio: 'Benidorm', tipo: 'dental', tratamientos: [0, 2], whatsapp: true };
const b64url = (s) => Buffer.from(s, 'utf8').toString('base64url');

test('ida y vuelta con acentos y símbolos', () => {
  const datos = { nombre: 'Consulta del Dr. Soler & «Hijos» <b>', telefono: '965 85 18 01', municipio: 'Benidorm', tipo: 'medica', tratamientos: [0, 2], whatsapp: false };
  assert.deepEqual(leerEnlace(new URL(crearEnlace(datos)).hash), datos);
});

test('recorta el nombre a 80', () => {
  const d = leerEnlace(new URL(crearEnlace({ ...base, nombre: 'a'.repeat(200) })).hash);
  assert.equal(d.nombre.length, 80);
});

test('enlace roto devuelve null', () => {
  const ok = new URL(crearEnlace(base)).hash;
  for (const h of ['', '#d=', '#d=%%%', ok.slice(0, -10), '#d=' + b64url('[1,2]')]) assert.equal(leerEnlace(h), null, h);
});

test('tipo desconocido pasa a generica y whatsapp sin teléfono es false', () => {
  const d = leerEnlace(new URL(crearEnlace({ ...base, tipo: 'raro', telefono: null })).hash);
  assert.equal(d.tipo, 'generica');
  assert.equal(d.telefono, null);
  assert.equal(d.whatsapp, false);
});

test('tratamientos fuera de rango o repetidos se descartan', () => {
  const d = leerEnlace(new URL(crearEnlace({ ...base, tratamientos: [0, 0, 99, -1, 1.5, 3] })).hash);
  assert.deepEqual(d.tratamientos, [0, 3]);
});

test('crearEnlace lanza con nombre vacío', () => {
  assert.throws(() => crearEnlace({ ...base, nombre: '' }));
});
