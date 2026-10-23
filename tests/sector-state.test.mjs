import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSectorState, debeRestaurar } from '../js/sector-state.js';

const memoria = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
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

const ORIGEN = 'https://mentadev.com';
test('al recargar no se recupera el sector guardado', () => {
  assert.equal(debeRestaurar({ tipo: 'reload', referrer: ORIGEN + '/cuanto-cuesta-una-web', origen: ORIGEN }), false);
});

test('al entrar desde fuera o sin referrer, la home empieza en el sector por defecto', () => {
  assert.equal(debeRestaurar({ tipo: 'navigate', referrer: '', origen: ORIGEN }), false);
  assert.equal(debeRestaurar({ tipo: 'navigate', referrer: 'https://www.google.com/', origen: ORIGEN }), false);
  assert.equal(debeRestaurar({ tipo: 'navigate', referrer: 'no es una url', origen: ORIGEN }), false);
  assert.equal(debeRestaurar(), false);
});

test('se recupera al volver desde otra página de la web, con enlace o con «Atrás»', () => {
  assert.equal(debeRestaurar({ tipo: 'navigate', referrer: ORIGEN + '/privacidad', origen: ORIGEN }), true);
  assert.equal(debeRestaurar({ tipo: 'back_forward', referrer: '', origen: ORIGEN }), true);
});

test('sin restaurar empieza en el inicial y olvida lo guardado', () => {
  const storage = memoria();
  createSectorState({ storage, target: new EventTarget() }).set('restaurante');
  const st = createSectorState({ storage, target: new EventTarget(), restaurar: false });
  assert.equal(st.get(), 'clinica');
  assert.equal(st.elegido(), false);
  assert.equal(storage.getItem('md-sector'), null);
  // Tras recargar, lo elegido de nuevo vuelve a recordarse.
  st.set('academia');
  assert.equal(createSectorState({ storage, target: new EventTarget() }).get(), 'academia');
});

test('sin restaurar y con sessionStorage bloqueado no falla', () => {
  assert.equal(createSectorState({ storage: rota, target: new EventTarget(), restaurar: false }).get(), 'clinica');
});
