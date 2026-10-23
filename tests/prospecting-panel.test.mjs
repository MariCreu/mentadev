// Panel local de prospección (prospecting/panel.mjs): solo en este ordenador y sin acciones a ciegas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearPanel } from '../prospecting/panel.mjs';
import { CRM } from '../prospecting/crm.mjs';
import { ficha } from '../prospecting/report.mjs';

const ahora = '2026-10-22T10:00:00.000Z';
function preparar(t, opciones = {}) {
  const crm = new CRM(':memory:', () => ahora);
  crm.registerSource({ id: 'google-places', url: 'https://cloud.google.com/maps-platform/terms', permissionRef: 'p', reviewedBy: 'o', expiresAt: '2030-01-01T00:00:00Z', enabled: true, maxAgeDays: 30 });
  const base = { municipality: 'Benidorm', province: '03', sector: 'health_clinic', observedAt: ahora };
  const [sinWeb, conWeb, otra] = crm.importBatch('google-places', [
    { ...base, name: 'Sonrisa Sin Web', website: null, phone: '966 00 00 01', sourceRecordId: 'a' },
    { ...base, name: 'Dental Lenta', website: 'http://lenta.example/', phone: '966 00 00 02', sourceRecordId: 'b' },
    { ...base, name: 'Dental Bien', website: 'https://bien.example/', phone: null, sourceRecordId: 'c' },
  ]);
  crm.saveAnalysis(sinWeb, { url: null, signals: { website: false } }, { score: 10, problems: ['sinweb'] });
  crm.saveAnalysis(conWeb, { url: 'http://lenta.example/', signals: { reachable: true, https: false } }, { score: 4, problems: ['inseguro', 'cita'] });
  const servidor = crearPanel({ crm, clave: null, ...opciones });
  t.after(() => new Promise((ok) => servidor.close(() => { crm.close(); ok(); })));
  return new Promise((ok) => servidor.listen(0, '127.0.0.1', () => ok({ crm, ids: { sinWeb, conWeb, otra }, url: `http://127.0.0.1:${servidor.address().port}` })));
}
const enviar = (url, cuerpo, cabeceras = { 'x-panel': '1' }) => fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...cabeceras }, body: JSON.stringify(cuerpo) });

test('la página y sus archivos se sirven; los de fuera de la carpeta, no', async (t) => {
  const { url } = await preparar(t);
  const html = await (await fetch(url + '/')).text();
  assert.match(html, /<title>Prospección · MentaDev<\/title>/);
  assert.equal((await fetch(url + '/panel.js')).status, 200);
  assert.equal((await fetch(url + '/fuentes/poppins-latin-400-normal.woff2')).status, 200);
  assert.equal((await fetch(url + '/fuentes/..%2F..%2Fprivate-data%2F.env')).status, 404);
  assert.equal((await fetch(url + '/../private-data/.env')).status, 404);
});

test('rechaza peticiones que no vienen de este ordenador (cabecera Host ajena)', async (t) => {
  const { url } = await preparar(t);
  const http = await import('node:http');
  const estado = await new Promise((ok) => http.get(url + '/api/clinicas', { headers: { host: 'evil.example' } }, (r) => { r.resume(); ok(r.statusCode); }));
  assert.equal(estado, 403);
});

test('lista por vistas, de mejor a peor candidata, con teléfono y puntuación', async (t) => {
  const { url, ids } = await preparar(t);
  const { clinicas, cuentas } = await (await fetch(url + '/api/clinicas?vista=porllamar')).json();
  assert.deepEqual(clinicas.map((c) => c.id), [ids.sinWeb, ids.conWeb, ids.otra]);
  assert.equal(clinicas[0].phone, '966 00 00 01');
  assert.equal(clinicas[0].score, 10);
  assert.equal(clinicas[2].score, null);
  assert.deepEqual(cuentas, { porllamar: 3, interesadas: 0, descartadas: 0, nollamar: 0, seguimiento: 0, pendientes: 1 });
});

test('la ficha trae teléfono, problemas, 3 mejoras y guion', async (t) => {
  const { url, ids } = await preparar(t);
  const { clinica, ficha: f } = await (await fetch(`${url}/api/clinicas/${ids.conWeb}`)).json();
  assert.equal(clinica.phone, '966 00 00 02');
  assert.equal(f.estado, 'revisada');
  assert.deepEqual(f.problemas, ['Sin conexión segura', 'Sin cita online']);
  assert.equal(f.mejoras.length, 2);
  assert.ok(f.guion.length >= 4);
  assert.equal((await fetch(`${url}/api/clinicas/999`)).status, 404);
});

test('marcar estados: exige la cabecera del panel y confirmar el "no llamar"', async (t) => {
  const { url, ids, crm } = await preparar(t);
  assert.equal((await enviar(`${url}/api/clinicas/${ids.conWeb}/estado`, { estado: 'qualified' }, {})).status, 403);
  assert.equal((await enviar(`${url}/api/clinicas/${ids.conWeb}/estado`, { estado: 'qualified' })).status, 200);
  assert.equal(crm.lead(ids.conWeb).status, 'qualified');
  assert.equal((await enviar(`${url}/api/clinicas/${ids.sinWeb}/estado`, { estado: 'suppressed' })).status, 400);
  assert.equal(crm.lead(ids.sinWeb).status, 'new');
  assert.equal((await enviar(`${url}/api/clinicas/${ids.sinWeb}/estado`, { estado: 'suppressed', confirmar: true })).status, 200);
  assert.equal(crm.lead(ids.sinWeb).status, 'suppressed');
  assert.equal((await enviar(`${url}/api/clinicas/${ids.sinWeb}/estado`, { estado: 'new' })).status, 400);
  const { cuentas } = await (await fetch(url + '/api/clinicas?vista=todas')).json();
  assert.deepEqual(cuentas, { porllamar: 1, interesadas: 1, descartadas: 0, nollamar: 1, seguimiento: 0, pendientes: 1 });
});

test('buscar sin clave de Google da un error claro; con la búsqueda vacía, también', async (t) => {
  const { url } = await preparar(t);
  const sinClave = await enviar(`${url}/api/buscar`, { consulta: 'clínica dental Altea', sector: 'health_clinic' });
  assert.equal(sinClave.status, 400);
  assert.match((await sinClave.json()).error, /GOOGLE_MAPS_API_KEY/);
  assert.equal((await enviar(`${url}/api/buscar`, { consulta: '  ', sector: 'health_clinic' })).status, 400);
});

test('buscar importa lo que da Google y revisa las webs nuevas, con progreso', async (t) => {
  const places = { places: [{ id: 'g1', displayName: { text: 'Clínica Nueva' }, businessStatus: 'OPERATIONAL', nationalPhoneNumber: '965 11 22 33', addressComponents: [{ longText: '03590', types: ['postal_code'] }, { longText: 'Altea', types: ['locality'] }] }] };
  const fetchImpl = async (u) => new Response(JSON.stringify(String(u).includes('places.googleapis.com') ? places : {}));
  const { url, crm } = await preparar(t, { clave: 'k', fetchImpl, pausa: 0 });
  assert.equal((await enviar(`${url}/api/buscar`, { consulta: 'clínica Altea', sector: 'health_clinic' })).status, 202);
  let trabajo;
  for (let i = 0; i < 50; i++) { trabajo = await (await fetch(url + '/api/trabajo')).json(); if (!trabajo.activo) break; await new Promise((ok) => setTimeout(ok, 20)); }
  assert.equal(trabajo.error, null);
  assert.match(trabajo.mensaje, /1 encontrada/);
  const nueva = crm.list().find((l) => l.name === 'Clínica Nueva');
  assert.equal(nueva.phone, '965 11 22 33');
  assert.equal(crm.latestAnalysis(nueva.id).score, 10);
});

test('ficha() da la estructura que usan el panel y el texto de la terminal', () => {
  const lead = { id: 1, name: 'X', municipality: 'Altea', sector: 'health_clinic', website: null, phone: null };
  assert.equal(ficha(lead, null).estado, 'sin-revisar');
  assert.equal(ficha(lead, { blocked: true }).estado, 'bloqueada');
  const f = ficha(lead, { blocked: false, score: 10, problems: ['sinweb'], analyzed_at: ahora });
  assert.equal(f.sinWeb, true);
  assert.ok(f.guion.some((l) => /no tiene web propia/.test(l)));
});

test('el detalle trae el catálogo de la demo y aún no hay demo guardada', async (t) => {
  const { url, ids } = await preparar(t);
  const d = await (await fetch(`${url}/api/clinicas/${ids.sinWeb}`)).json();
  assert.equal(d.catalogo.tipos.length, 5);
  assert.equal(d.demo, null);
  assert.equal(d.demoPorDefecto.nombre, 'Sonrisa Sin Web');
  assert.ok(d.catalogo.tratamientos.dental.every((x) => typeof x === 'string'));
  assert.ok(Array.isArray(d.catalogo.defecto.medica));
});

test('preparar la demo devuelve el enlace', async (t) => {
  const { url, ids } = await preparar(t);
  const r = await enviar(`${url}/api/clinicas/${ids.sinWeb}/demo`, { nombre: 'Consulta del Dr. Soler', tipo: 'medica', tratamientos: [0, 1], whatsapp: false });
  assert.equal(r.status, 200);
  const { demo } = await r.json();
  assert.ok(demo.enlace.startsWith('https://mentadev.com/demo/#d='));
  assert.equal(demo.nombre, 'Consulta del Dr. Soler');
});

test('la demo: sin x-panel se rechaza, los índices inválidos se descartan y la clínica inexistente es 404', async (t) => {
  const { url, ids } = await preparar(t);
  const cuerpo = { nombre: 'X', tipo: 'dental', tratamientos: [0, 99], whatsapp: false };
  assert.equal((await enviar(`${url}/api/clinicas/${ids.sinWeb}/demo`, cuerpo, {})).status, 403);
  const { demo } = await (await enviar(`${url}/api/clinicas/${ids.sinWeb}/demo`, cuerpo)).json();
  assert.deepEqual(demo.tratamientos, [0]);
  assert.equal((await enviar(`${url}/api/clinicas/999/demo`, cuerpo)).status, 404);
});

test('la demo de una clínica excluida da 400', async (t) => {
  const { url, ids } = await preparar(t);
  await enviar(`${url}/api/clinicas/${ids.sinWeb}/estado`, { estado: 'suppressed', confirmar: true });
  assert.equal((await enviar(`${url}/api/clinicas/${ids.sinWeb}/demo`, { nombre: 'X', tipo: 'dental', tratamientos: [], whatsapp: false })).status, 400);
});

test('con la demo preparada y el sí apuntado, el email lleva el enlace', async (t) => {
  const { url, ids } = await preparar(t);
  const { demo } = await (await enviar(`${url}/api/clinicas/${ids.sinWeb}/demo`, { nombre: 'Consulta del Dr. Soler', tipo: 'medica', tratamientos: [0], whatsapp: false })).json();
  assert.equal((await enviar(`${url}/api/clinicas/${ids.sinWeb}/si`, { email: 'hola@soler.example', quien: 'Recepción' })).status, 200);
  const d = await (await fetch(`${url}/api/clinicas/${ids.sinWeb}`)).json();
  assert.ok(d.email.cuerpo.split('\n').includes(demo.enlace));
  assert.match(d.email.asunto, /^Consulta del Dr\. Soler:/);
});

test('la vista previa de la demo se sirve en /demo/ y solo de las carpetas permitidas', async (t) => {
  const { url } = await preparar(t);
  const html = await fetch(url + '/demo/');
  assert.equal(html.status, 200);
  assert.match(html.headers.get('content-type'), /text\/html/);
  assert.match(await html.text(), /<html/);
  for (const archivo of ['enlace.js', 'demo.js', 'horario.js', 'contenido.js']) {
    const r = await fetch(`${url}/demo/${archivo}`);
    assert.equal(r.status, 200, archivo);
    assert.match(r.headers.get('content-type'), /text\/javascript/, archivo);
  }
  assert.match((await fetch(url + '/demo/demo.css')).headers.get('content-type'), /text\/css/);
  const foto = await fetch(url + '/demo/fotos/medica-portada.webp');
  assert.equal(foto.status, 200);
  assert.equal(foto.headers.get('content-type'), 'image/webp');
  const fuente = await fetch(url + '/assets/fonts/poppins-latin-400-normal.woff2');
  assert.equal(fuente.status, 200);
  assert.equal(fuente.headers.get('content-type'), 'font/woff2');
  assert.equal((await fetch(url + '/assets/fonts/unknown')).status, 404);
  assert.equal((await fetch(url + '/demo/../prospecting/crm.mjs')).status, 404);
  assert.equal((await fetch(url + '/demo/..%2Fprospecting%2Fcrm.mjs')).status, 404);
  assert.equal((await fetch(url + '/demo/fotos/..%2F..%2Fprospecting%2Fcrm.mjs')).status, 404);
  assert.equal((await fetch(url + '/demo/fotos/CREDITOS.txt')).status, 404);
});

test('guardar la demo sin ningún tratamiento da 400', async (t) => {
  const { url, ids } = await preparar(t);
  const r = await enviar(`${url}/api/clinicas/${ids.sinWeb}/demo`, { nombre: 'X', tipo: 'medica', tratamientos: [], whatsapp: false });
  assert.equal(r.status, 400);
  assert.match((await r.json()).error, /Marca al menos un tratamiento/);
});

test('el detalle incluye el email que publica su web, para confirmarlo en la llamada', async (t) => {
  const { url, crm, ids } = await preparar(t);
  crm.saveAnalysis(ids.conWeb, { url: 'http://lenta.example/', signals: { reachable: true, https: false, emailWeb: 'info@lenta.example' } }, { score: 4, problems: ['inseguro', 'cita'] });
  const { ficha: f } = await (await fetch(`${url}/api/clinicas/${ids.conWeb}`)).json();
  assert.equal(f.emailWeb, 'info@lenta.example');
  const otra = await (await fetch(`${url}/api/clinicas/${ids.sinWeb}`)).json();
  assert.equal('emailWeb' in otra.ficha, false);
});

test('seguimiento: enviado y resultado piden x-panel y el sí previo', async (t) => {
  const { url, crm, ids } = await preparar(t);
  const ruta = `${url}/api/clinicas/${ids.sinWeb}`;
  assert.equal((await enviar(ruta + '/enviado', {}, {})).status, 403);
  assert.equal((await enviar(ruta + '/resultado', { resultado: 'quiere' }, {})).status, 403);
  const sin = await enviar(ruta + '/enviado', {});
  assert.equal(sin.status, 400);
  assert.match((await sin.json()).error, /sí por teléfono/);
  assert.equal((await enviar(`${url}/api/clinicas/9999/enviado`, {})).status, 404);
  crm.registrarSi(ids.sinWeb, { email: 'info@sonrisa.es', quien: 'Marta' });
  assert.equal((await enviar(ruta + '/resultado', { resultado: 'quiere' })).status, 400);
  const ok = await enviar(ruta + '/enviado', {});
  assert.equal(ok.status, 200);
  const d = await ok.json();
  assert.equal(d.seguimiento.enviado, ahora);
  assert.equal(d.ficha.seguimiento.toca, false);
  assert.equal((await enviar(ruta + '/resultado', { resultado: 'x' })).status, 400);
  const fin = await (await enviar(ruta + '/resultado', { resultado: 'no_interesa' })).json();
  assert.equal(fin.seguimiento.resultado, 'no_interesa');
  assert.equal(fin.clinica.status, 'rejected');
  const lista = await (await fetch(url + '/api/clinicas?vista=seguimiento')).json();
  assert.deepEqual(lista.clinicas, []);
  assert.equal(lista.cuentas.seguimiento, 0);
});
