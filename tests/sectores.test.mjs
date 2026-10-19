import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SECTORES, SECTOR_POR_DEFECTO, sectorPorId, formatearPrecio } from '../js/sectores.js';

test('hay 6 sectores con ids fijos y en orden', () => {
  assert.deepEqual(SECTORES.map((s) => s.id), ['restaurante', 'clinica', 'estetica', 'tienda', 'academia', 'otro']);
  assert.equal(sectorPorId(SECTOR_POR_DEFECTO).etiqueta, 'Restaurante');
  assert.equal(sectorPorId('nada'), undefined);
});

test('cada sector tiene todos sus datos completos', () => {
  for (const s of SECTORES) {
    assert.ok(s.etiqueta && s.articulo && /^#[0-9A-F]{6}$/i.test(s.acento), s.id);
    assert.ok(s.web.nombre && s.web.titular && s.web.boton, s.id);
    assert.equal(s.productos.length, 3, s.id);
    for (const p of s.productos) assert.ok(p.nombre && Number.isInteger(p.precio) && p.precio >= 0, s.id);
    assert.equal(s.panel.citas.length, 4, s.id);
    assert.ok(s.panel.titulo && s.panel.unidad && Number.isInteger(s.panel.libres), s.id);
    assert.equal(s.flujos.length, 4, s.id);
    for (const f of s.flujos) assert.ok(f.icono && f.desde && f.hasta, s.id);
    assert.ok(s.calculadora.horas >= 1 && s.calculadora.horas <= 40 && s.calculadora.tarifa >= 5 && s.calculadora.tarifa <= 100, s.id);
  }
});

test('los textos no usan tecnicismos prohibidos ni nombres de clientes reales', () => {
  const texto = JSON.stringify(SECTORES).toLowerCase();
  for (const palabra of ['api', 'apis', 'n8n', 'zapier', 'make', 'ia', 'luna y papel', 'infanapp']) {
    assert.ok(!new RegExp(`(^|[^a-záéíóúñ])${palabra}([^a-záéíóúñ]|$)`).test(texto), palabra);
  }
});

test('el acento de cada sector tiene contraste AA con texto blanco', () => {
  const lum = (hex) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  for (const s of SECTORES) assert.ok((1.05) / (lum(s.acento) + 0.05) >= 4.5, `${s.id} ${s.acento}`);
});

test('formatearPrecio muestra euros en español y "Gratis" para 0', () => {
  assert.equal(formatearPrecio(0), 'Gratis');
  assert.match(formatearPrecio(1450), /^14,50\s€$/);
});
