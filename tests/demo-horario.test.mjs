import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estadoHorario, ahoraEnMadrid, hhmm } from '../demo/horario.js';

const lv = [[540, 840], [960, 1200]];
const H = [[], lv, lv, lv, lv, lv, []];

test('lunes 10:00 abierto hasta las 14:00', () => {
  const e = estadoHorario(H, { dia: 1, minutos: 600 });
  assert.equal(e.abierto, true);
  assert.equal(e.hasta, 840);
});
test('lunes 14:00 exacto: cerrado, abre a las 16:00', () => {
  const e = estadoHorario(H, { dia: 1, minutos: 840 });
  assert.equal(e.abierto, false);
  assert.deepEqual(e.abre, { dia: 1, minutos: 960 });
});
test('lunes 20:00 abre mañana', () => {
  assert.deepEqual(estadoHorario(H, { dia: 1, minutos: 1200 }).abre, { dia: 2, minutos: 540 });
});
test('sábado 11:00 abre el lunes', () => {
  assert.deepEqual(estadoHorario(H, { dia: 6, minutos: 660 }).abre, { dia: 1, minutos: 540 });
});
test('horario vacío', () => {
  assert.deepEqual(estadoHorario([[], [], [], [], [], [], []], { dia: 3, minutos: 600 }), { abierto: false, hasta: null, abre: null });
});
test('ahoraEnMadrid respeta el cambio de hora', () => {
  assert.deepEqual(ahoraEnMadrid(new Date('2026-10-25T08:30:00Z')), { dia: 0, minutos: 570 });
  assert.deepEqual(ahoraEnMadrid(new Date('2026-07-06T08:30:00Z')), { dia: 1, minutos: 630 });
});
test('hhmm', () => { assert.equal(hhmm(540), '09:00'); });
