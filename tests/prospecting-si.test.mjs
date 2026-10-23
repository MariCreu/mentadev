// "Han dicho que sí": consentimiento apuntado, borrador del email y comprobación manual de la web.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CRM } from '../prospecting/crm.mjs';
import { ficha, borradorEmail } from '../prospecting/report.mjs';
import { crearPanel } from '../prospecting/panel.mjs';

const ahora = '2026-10-22T10:00:00.000Z';
function crm(t) {
  const c = new CRM(':memory:', () => ahora);
  t.after(() => c.close());
  c.registerSource({ id: 'google-places', url: 'https://cloud.google.com/maps-platform/terms', permissionRef: 'p', reviewedBy: 'o', expiresAt: '2030-01-01T00:00:00Z', enabled: true, maxAgeDays: 30 });
  const base = { municipality: 'Benidorm', province: '03', sector: 'health_clinic', observedAt: ahora, phone: '965 00 00 00' };
  const [conWeb, sinWeb] = c.importBatch('google-places', [
    { ...base, name: 'Dental Lenta', website: 'http://lenta.example/', sourceRecordId: 'a' },
    { ...base, name: 'Sonrisa', website: null, sourceRecordId: 'b' },
  ]);
  c.saveAnalysis(conWeb, { url: 'http://lenta.example/', signals: { reachable: true, https: false } }, { score: 5, problems: ['inseguro', 'movil', 'cita'] });
  c.saveAnalysis(sinWeb, { url: null, signals: { website: false } }, { score: 10, problems: ['sinweb'] });
  return { c, conWeb, sinWeb };
}

test('apuntar el sí: guarda email, quién y cuándo, y la clínica pasa a interesada', (t) => {
  const { c, conWeb } = crm(t);
  c.registrarSi(conWeb, { email: 'info@lenta.example', quien: 'Recepción (Marta)', atencion: 'Dr. Pérez' });
  assert.equal(c.lead(conWeb).status, 'qualified');
  const s = c.consentimiento(conWeb);
  assert.deepEqual({ email: s.email, quien: s.quien, atencion: s.atencion, canal: s.canal, fecha: s.fecha }, { email: 'info@lenta.example', quien: 'Recepción (Marta)', atencion: 'Dr. Pérez', canal: 'llamada', fecha: ahora });
  assert.throws(() => c.registrarSi(conWeb, { email: 'no-es-un-email', quien: 'Recepción' }), /email/i);
  assert.throws(() => c.registrarSi(conWeb, { email: 'a@b.es', quien: '' }), /quién/i);
});

test('si luego piden no llamar más, se borra su email', (t) => {
  const { c, conWeb } = crm(t);
  c.registrarSi(conWeb, { email: 'info@lenta.example', quien: 'Recepción' });
  c.setStatus(conWeb, 'suppressed', 'panel');
  assert.equal(c.consentimiento(conWeb), undefined);
  assert.throws(() => c.registrarSi(conWeb, { email: 'info@lenta.example', quien: 'Recepción' }), /excluida/);
});

test('el borrador del email: revisión con 3 mejoras, origen del email y forma de darse de baja', (t) => {
  const { c, conWeb } = crm(t);
  c.registrarSi(conWeb, { email: 'info@lenta.example', quien: 'Recepción', atencion: 'Dr. Pérez' });
  const b = borradorEmail(c.lead(conWeb), c.latestAnalysis(conWeb), c.consentimiento(conWeb));
  assert.equal(b.para, 'info@lenta.example');
  assert.match(b.asunto, /Dental Lenta/);
  assert.match(b.cuerpo, /^Hola, Dr\. Pérez:/);
  assert.match(b.cuerpo, /1\. .*\n.*\n\n2\. /);
  assert.match(b.cuerpo, /por teléfono el 22\/10\/2026/);
  assert.match(b.cuerpo, /«baja»/);
  assert.match(b.cuerpo, /249 € \+ IVA/);
});

test('sin web, el borrador es una propuesta de web con precio, plazo y lo que incluye', (t) => {
  const { c, sinWeb } = crm(t);
  c.registrarSi(sinWeb, { email: 'hola@sonrisa.example', quien: 'Recepción' });
  const b = borradorEmail(c.lead(sinWeb), c.latestAnalysis(sinWeb), c.consentimiento(sinWeb));
  assert.match(b.asunto, /lista en 7 días/);
  assert.match(b.cuerpo, /^Hola:/);
  assert.match(b.cuerpo, /249 € \+ IVA/);
  assert.match(b.cuerpo, /7 días laborables/);
  assert.match(b.cuerpo, /primer plazo/);
  assert.doesNotMatch(b.cuerpo, /revisión de vuestra web/);
});

test('guion para recepción: presentación, oferta y pedir el email, sin pedir que te pasen', (t) => {
  const { c, conWeb, sinWeb } = crm(t);
  const f = ficha(c.lead(conWeb), c.latestAnalysis(conWeb));
  assert.deepEqual(f.pasos.map((p) => p.titulo), ['Presentación', 'Qué les ofreces', 'Si dicen que sí', 'Si dudan o dicen que no', 'Si te pasan con el responsable']);
  assert.match(f.pasos[1].frases.join(' '), /3 cosas concretas/);
  assert.match(f.pasos[1].frases.join(' '), /¿Os las mandamos gratis por email/);
  assert.match(f.pasos[2].frases.join(' '), /Han dicho que sí/);
  const s = ficha(c.lead(sinWeb), c.latestAnalysis(sinWeb));
  assert.match(s.pasos[1].frases.join(' '), /no tenéis web propia/);
  assert.match(s.pasos[1].frases.join(' '), /web de ejemplo con el nombre de vuestra clínica/);
  assert.match(s.pasos[1].frases.join(' '), /¿Os mandamos el enlace por email, gratis/);
  assert.ok(s.antes.some((a) => /qué tratamientos hacen: los marcarás en su web de ejemplo/.test(a)));
  assert.ok(s.antes.some((a) => /Busca/.test(a)), 'sin comprobar: buscar su web antes de llamar');
  // Ya comprobado a mano: no se vuelve a pedir que la busques.
  c.setWebsite(sinWeb, null);
  const comprobada = ficha(c.lead(sinWeb), c.latestAnalysis(sinWeb));
  assert.ok(!comprobada.antes.some((a) => /Busca/.test(a)));
  assert.ok(comprobada.antes.some((a) => /Ya has comprobado/.test(a)));
});

test('comprobar la web a mano: encontrada (se revisa) o confirmada sin web; el guion se adapta', async (t) => {
  const { c, sinWeb, conWeb } = crm(t);
  const pagina = '<html><head><title>Sonrisa</title><meta name="viewport" content="width=device-width"></head><body>Pide cita online</body></html>';
  const fetchImpl = async (u) => (String(u).endsWith('/robots.txt') ? new Response('', { status: 404 }) : Object.defineProperty(new Response(pagina), 'url', { value: String(u) }));
  const servidor = crearPanel({ crm: c, clave: null, fetchImpl, pausa: 0 });
  await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
  t.after(() => new Promise((ok) => servidor.close(ok)));
  const url = `http://127.0.0.1:${servidor.address().port}`;
  const enviar = (ruta, cuerpo) => fetch(url + ruta, { method: 'POST', headers: { 'content-type': 'application/json', 'x-panel': '1' }, body: JSON.stringify(cuerpo) });

  const encontrada = await (await enviar(`/api/clinicas/${sinWeb}/web`, { web: 'https://sonrisa.example/' })).json();
  assert.equal(encontrada.clinica.website, 'https://sonrisa.example/');
  assert.equal(encontrada.clinica.web_verificada, ahora);
  assert.equal(encontrada.ficha.sinWeb, false);
  assert.doesNotMatch(encontrada.ficha.problemas.join(','), /No tiene web/);

  const confirmada = await (await enviar(`/api/clinicas/${conWeb}/web`, { web: null })).json();
  assert.equal(confirmada.clinica.website, null);
  assert.equal(confirmada.ficha.sinWeb, true);
  assert.match(confirmada.ficha.pasos[1].frases.join(' '), /no tenéis web propia/);

  assert.equal((await enviar(`/api/clinicas/${conWeb}/web`, { web: 'javascript:alert(1)' })).status, 400);

  const si = await enviar(`/api/clinicas/${conWeb}/si`, { email: 'info@lenta.example', quien: 'Recepción' });
  assert.equal(si.status, 200);
  const detalle = await (await fetch(`${url}/api/clinicas/${conWeb}`)).json();
  assert.equal(detalle.consentimiento.email, 'info@lenta.example');
  assert.match(detalle.email.cuerpo, /«baja»/);
});

const PARRAFO = 'Es solo un mini adelanto, hecho para que os hagáis una idea: las fotos, el horario y la dirección son de muestra. Vuestra web irá mucho más allá, con vuestras fotos, vuestro equipo, vuestros tratamientos bien explicados y todo lo que os haga falta.';
const demo = { nombre: 'Clínica Sonrisa', tipo: 'dental', tratamientos: [0], whatsapp: false, fecha: ahora, enlace: 'https://mentadev.com/demo/#d=abc123' };

test('sin web, con demo: el enlace va en su línea y el aviso de que es un ejemplo', (t) => {
  const { c, sinWeb } = crm(t);
  c.registrarSi(sinWeb, { email: 'hola@sonrisa.example', quien: 'Recepción' });
  const b = borradorEmail(c.lead(sinWeb), c.latestAnalysis(sinWeb), c.consentimiento(sinWeb), demo);
  assert.equal(b.asunto, 'Clínica Sonrisa: así os verían vuestros próximos pacientes');
  assert.ok(b.cuerpo.split('\n').includes(demo.enlace));
  assert.ok(b.cuerpo.includes(PARRAFO));
  assert.match(b.cuerpo, /un adelanto de lo que podría ser la web de Clínica Sonrisa/);
  assert.match(b.cuerpo, /Lo que os llevaríais/);
  assert.match(b.cuerpo, /«baja»/);
});

test('con web, con demo: se mantienen las 3 mejoras y se añade la web de ejemplo', (t) => {
  const { c, conWeb } = crm(t);
  c.registrarSi(conWeb, { email: 'info@lenta.example', quien: 'Recepción' });
  const b = borradorEmail(c.lead(conWeb), c.latestAnalysis(conWeb), c.consentimiento(conWeb), demo);
  assert.match(b.asunto, /Dental Lenta/);
  assert.match(b.cuerpo, /1\. .*\n.*\n\n2\. .*\n.*\n\n3\. /);
  assert.ok(b.cuerpo.split('\n').includes(demo.enlace));
  assert.ok(b.cuerpo.includes(PARRAFO));
  assert.ok(b.cuerpo.indexOf(demo.enlace) < b.cuerpo.indexOf('Son vuestras'));
});

test('sin demo el email no cambia', (t) => {
  const { c, sinWeb } = crm(t);
  c.registrarSi(sinWeb, { email: 'hola@sonrisa.example', quien: 'Recepción' });
  const b = borradorEmail(c.lead(sinWeb), c.latestAnalysis(sinWeb), c.consentimiento(sinWeb), null);
  assert.doesNotMatch(b.cuerpo, /de ejemplo/);
  assert.match(b.asunto, /vuestra web, lista en 7 días/);
});
