import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularAhorro, textoAmortizacion, PRICE_FROM } from '../js/calculadora.js';

test('valores por defecto: 5 h a 20 € → ~11 h/mes y 2.600 €/año, unos 3 meses', () => {
  const r = calcularAhorro(5, 20);
  assert.equal(Math.round(r.horasMes), 11);
  assert.equal(Math.round(r.eurosAno), 2600);
  assert.equal(r.caso, 'meses');
  assert.equal(r.meses, 3);
  assert.equal(textoAmortizacion(r), `Una automatización desde ${PRICE_FROM} € + IVA se amortizaría en unos 3 meses.`);
});

test('mucho tiempo → menos de un mes', () => {
  const r = calcularAhorro(40, 100);
  assert.equal(r.caso, 'menos-de-un-mes');
  assert.equal(textoAmortizacion(r), `Una automatización desde ${PRICE_FROM} € + IVA se amortizaría en menos de un mes.`);
});

test('poco tiempo → no compensa (más de 24 meses)', () => {
  const r = calcularAhorro(1, 5);
  assert.equal(r.caso, 'no-compensa');
  assert.equal(textoAmortizacion(r), 'Con tan poco tiempo quizá no compense automatizar. En el diagnóstico te lo diremos con sinceridad.');
});
