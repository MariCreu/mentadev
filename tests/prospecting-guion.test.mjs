// Guion de llamada completo: pasos, qué es la revisión, preguntas con respuesta y frases de rescate.
// Precios y plazos: los mismos que publica la web (CLAUDE.md, "Precios").
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ficha, report } from '../prospecting/report.mjs';

const conWeb = { id: 7, name: 'CorDent', municipality: 'Benidorm', sector: 'health_clinic', website: 'http://www.cordent.es/', phone: '600 39 77 14' };
const revisada = { blocked: false, score: 8, problems: ['inseguro', 'movil', 'cita', 'contacto'], analyzed_at: '2026-10-22T10:00:00.000Z' };
const sinWebLead = { id: 8, name: 'Dentalium', municipality: 'Benidorm', sector: 'health_clinic', website: null, phone: '965 86 54 84' };
const sinWebAnalisis = { blocked: false, score: 10, problems: ['sinweb'], analyzed_at: '2026-10-22T10:00:00.000Z' };
const todoTexto = (f) => JSON.stringify(f);

test('el guion va por pasos, pensado para quien coja el teléfono', () => {
  const f = ficha(conWeb, revisada);
  assert.deepEqual(f.pasos.map((p) => p.titulo), ['Presentación', 'Qué les ofreces', 'Si dicen que sí', 'Si dudan o dicen que no', 'Si te pasan con el responsable']);
  assert.ok(f.pasos.every((p) => p.frases.length >= 1));
  assert.ok(f.guion.length >= 6, 'el guion plano (para copiar) sigue existiendo');
  // Se dice a la clínica: en vosotros, no en tercera persona ("Su dirección…").
  const porQue = f.pasos[4].frases.join(' ');
  assert.doesNotMatch(porQue, /\bSu\b|\bsu web\b/);
  assert.match(porQue, /vuestr/);
});

test('explica la revisión gratis con el compromiso de la web', () => {
  const f = ficha(conWeb, revisada);
  assert.match(f.revision, /gratis/i);
  assert.match(f.revision, /3 mejoras/);
  assert.match(f.revision, /48 h laborables/);
  assert.match(f.revision, /email/);
  assert.match(f.revision, /sin compromiso/);
});

test('cada problema encontrado se explica: qué significa y qué proponemos', () => {
  const f = ficha(conWeb, revisada);
  assert.equal(f.detalle.length, 4);
  for (const d of f.detalle) assert.ok(d.problema && d.significa && d.mejora, JSON.stringify(d));
  assert.match(f.detalle.find((d) => d.problema === 'Sin conexión segura').significa, /No seguro/);
});

test('trae preguntas frecuentes con respuesta, con los precios y plazos reales', () => {
  const f = ficha(conWeb, revisada);
  assert.ok(f.preguntas.length >= 10);
  const buscar = (re) => f.preguntas.find((p) => re.test(p.pregunta));
  assert.match(buscar(/cuánto cuesta/i).respuesta, /249 € \+ IVA/);
  assert.match(buscar(/número/i).respuesta, /Google/);
  assert.ok(buscar(/alguien/i), 'ya tenemos a alguien que nos lleva la web');
  assert.ok(buscar(/no me interesa/i));
  assert.ok(buscar(/venta/i));
  assert.match(buscar(/cuánto tarda/i).respuesta, /7 días laborables/);
  assert.match(buscar(/cuánto tarda/i).respuesta, /primer plazo/);
});

test('frases de rescate y lista de "antes de llamar" (Lista Robinson si es un móvil)', () => {
  const f = ficha(conWeb, revisada);
  assert.ok(f.apuros.length >= 3);
  assert.ok(f.antes.some((a) => /Lista Robinson/.test(a)), 'el teléfono es móvil');
  const fijo = ficha({ ...conWeb, phone: '965 85 18 01' }, revisada);
  assert.ok(!fijo.antes.some((a) => /Lista Robinson/.test(a)));
});

test('sin web: ofrece la web con su precio y plazo, y no habla de "revisar su web"', () => {
  const f = ficha(sinWebLead, sinWebAnalisis);
  const texto = f.pasos.flatMap((p) => p.frases).join(' ');
  assert.doesNotMatch(texto, /hemos revisado la web/i);
  assert.match(texto, /249 € \+ IVA/);
  assert.match(texto, /7 días laborables/);
  assert.ok(f.antes.some((a) => /busca/i.test(a)), 'comprobar que de verdad no tiene web');
});

test('sin tecnicismos ni promesas inventadas', () => {
  for (const f of [ficha(conWeb, revisada), ficha(sinWebLead, sinWebAnalisis)]) {
    const t = todoTexto(f);
    for (const palabra of ['SEO', 'CMS', 'API', 'HTML', 'IA', 'n8n', 'responsive']) assert.doesNotMatch(t, new RegExp(`\\b${palabra}\\b`), palabra);
    assert.doesNotMatch(t, /garantizamos más pacientes|duplicar|triplicar|\d+ ?% m[áa]s/i, 'promesas de resultados');
  }
});

test('la terminal muestra también las preguntas y las frases de rescate', () => {
  const texto = report(conWeb, revisada);
  assert.match(texto, /Si te preguntan/);
  assert.match(texto, /Si te quedas en blanco/);
  assert.match(texto, /Qué es la revisión/);
});

test('con la web de ejemplo: la oferta sin web la menciona y se avisa de preguntar los tratamientos', () => {
  const s = ficha(sinWebLead, sinWebAnalisis);
  assert.match(s.pasos[1].frases.join(' '), /web de ejemplo/);
  assert.match(s.revision, /web de ejemplo con vuestro nombre/);
  const c = ficha(conWeb, revisada);
  assert.match(c.pasos[1].frases.join(' '), /una idea de cómo podría verse una web nueva/);
  for (const f of [s, c]) assert.ok(f.antes.includes('Si sale en la conversación, pregunta qué tratamientos hacen: los marcarás en su web de ejemplo.'));
});
