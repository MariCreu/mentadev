import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSectorState } from '../js/sector-state.js';

const memoria = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) }; };
const rota = { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('bloqueado'); } };

test('empieza en el inicial y emite al cambiar', () => {
  const target = new EventTarget();
  const eventos = [];
  target.addEventListener('md:sector', (e) => eventos.push(e.detail));
  const st = createSectorState({ storage: memoria(), target, inicial: 'restaurante' });
  assert.equal(st.get(), 'restaurante');
  assert.equal(st.elegido(), false);
  assert.equal(st.set('clinica'), true);
  assert.equal(st.get(), 'clinica');
  assert.equal(st.elegido(), true);
  assert.deepEqual(eventos, [{ id: 'clinica', source: 'usuario' }]);
});

test('rechaza ids desconocidos sin emitir', () => {
  const target = new EventTarget();
  let n = 0;
  target.addEventListener('md:sector', () => n++);
  const st = createSectorState({ storage: memoria(), target, inicial: 'restaurante' });
  assert.equal(st.set('banco'), false);
  assert.equal(st.get(), 'restaurante');
  assert.equal(n, 0);
});

test('recuerda la elección entre instancias', () => {
  const storage = memoria();
  createSectorState({ storage, target: new EventTarget(), inicial: 'restaurante' }).set('academia');
  const st2 = createSectorState({ storage, target: new EventTarget(), inicial: 'restaurante' });
  assert.equal(st2.get(), 'academia');
  assert.equal(st2.elegido(), true);
});

test('[RF 4] funciona aunque sessionStorage esté bloqueado', () => {
  const st = createSectorState({ storage: rota, target: new EventTarget(), inicial: 'restaurante' });
  assert.equal(st.get(), 'restaurante');
  assert.equal(st.set('tienda'), true);
  assert.equal(st.get(), 'tienda');
});

test('el origen "auto" (autorrecorrido) no cuenta como elección del usuario', () => {
  const st = createSectorState({ storage: memoria(), target: new EventTarget(), inicial: 'restaurante' });
  st.set('clinica', 'auto');
  assert.equal(st.elegido(), false);
});
