import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeHtml, analyzeSite, robotsBlocks, score } from '../prospecting/analyzer.mjs';
import { report } from '../prospecting/report.mjs';
import { CRM } from '../prospecting/crm.mjs';

const BUENA = `<!doctype html><html><head><title>Clínica Ejemplo · Alicante</title>
<meta name="viewport" content="width=device-width"><meta name="description" content="Clínica dental en Alicante">
<meta name="generator" content="WordPress 6.6"></head><body><a href="https://wa.me/34600000000">WhatsApp</a>
<a href="/cita">Pedir cita online</a><form></form><a href="/aviso-legal">Aviso legal</a><footer>© 2026 Clínica Ejemplo</footer></body></html>`;
const VIEJA = `<html><head><title>Clinica</title></head><body><p>Llámenos</p><footer>Copyright 2012-2018</footer></body></html>`;

test('una web completa no suma problemas', () => {
  const signals = analyzeHtml(BUENA, { url: 'https://example.com/', ms: 400 });
  assert.equal(signals.generator, 'WordPress 6.6');
  assert.equal(signals.copyrightYear, 2026);
  assert.deepEqual(score(signals, 2026), { score: 0, problems: [] });
});

test('una web antigua puntúa alto y ordena los problemas por peso', () => {
  const signals = analyzeHtml(VIEJA, { url: 'http://example.com/', ms: 5000 });
  assert.equal(signals.copyrightYear, 2018);
  const result = score(signals, 2026);
  assert.deepEqual(result.problems.slice(0, 3), ['inseguro', 'movil', 'cita']);
  assert.ok(result.problems.includes('antigua') && result.problems.includes('lenta') && result.problems.includes('google'));
  assert.equal(result.score, 10);
  assert.deepEqual(score({ reachable: false }), { score: 9, problems: ['caida'] });
});

test('PageSpeed manda sobre el tiempo de respuesta cuando lo hay', () => {
  const base = analyzeHtml(BUENA, { url: 'https://example.com/', ms: 9000, pageSpeed: 80 });
  assert.ok(!score(base, 2026).problems.includes('lenta'));
  assert.ok(score({ ...base, pageSpeed: 30 }, 2026).problems.includes('lenta'));
});

test('robots.txt solo bloquea si prohíbe la web entera', () => {
  assert.equal(robotsBlocks('User-agent: *\nDisallow: /'), true);
  assert.equal(robotsBlocks('User-agent: *\nDisallow: /admin\n'), false);
  assert.equal(robotsBlocks('User-agent: Googlebot\nDisallow: /\n\nUser-agent: *\nAllow: /'), false);
  assert.equal(robotsBlocks('User-agent: Googlebot\nUser-agent: MentaDevRevision\nDisallow: /'), true);
});

function fakeFetch(pages) {
  const calls = [];
  const impl = async (url, options) => {
    calls.push({ url: String(url), agent: options?.headers?.['User-Agent'] });
    const page = pages[new URL(url).pathname];
    if (page instanceof Error) throw page;
    if (!page) return new Response('', { status: 404 });
    return Object.defineProperty(new Response(page), 'url', { value: String(url) });
  };
  return { impl, calls };
}

test('la revisión pide solo robots.txt y la portada, identificándose', async () => {
  const { impl, calls } = fakeFetch({ '/': BUENA });
  const result = await analyzeSite('https://example.com/', { fetchImpl: impl });
  assert.equal(result.signals.https, true);
  assert.deepEqual(calls.map(c => new URL(c.url).pathname), ['/robots.txt', '/']);
  assert.ok(calls.every(c => /MentaDev/.test(c.agent)));
  assert.deepEqual(await analyzeSite('https://example.com/', { fetchImpl: fakeFetch({ '/robots.txt': 'User-agent: *\nDisallow: /' }).impl }), { url: 'https://example.com/', blocked: true });
  assert.equal((await analyzeSite('https://example.com/', { fetchImpl: fakeFetch({ '/': new Error('caída') }).impl })).signals.reachable, false);
  assert.equal((await analyzeSite('https://example.com/', { fetchImpl: fakeFetch({}).impl })).signals.reachable, false);
  const denied = async url => new URL(url).pathname === '/' ? new Response('', { status: 403 }) : new Response('', { status: 404 });
  assert.equal((await analyzeSite('https://example.com/', { fetchImpl: denied })).blocked, true);
});

test('el CRM guarda revisiones, ordena por puntuación y genera la ficha de llamada', t => {
  const now = '2026-10-21T10:00:00.000Z';
  const crm = new CRM(':memory:', () => now);
  t.after(() => crm.close());
  crm.registerSource({ id: 'manual', url: 'https://example.com/dataset', permissionRef: 'Permiso de prueba', reviewedBy: 'operador', expiresAt: '2026-11-01T00:00:00Z', enabled: true });
  const base = { municipality: 'Benidorm', province: '03', sector: 'aesthetic_clinic', observedAt: now };
  const [vieja, buena, excluida] = crm.importBatch('manual', [
    { ...base, name: 'Centro Viejo', website: 'http://viejo.example/', sourceRecordId: '1' },
    { ...base, name: 'Centro Nuevo', website: 'https://nuevo.example/', sourceRecordId: '2' },
    { ...base, name: 'Centro Excluido', website: 'https://fuera.example/', sourceRecordId: '3' },
  ]);
  const save = (id, html, url) => { const result = { url, signals: analyzeHtml(html, { url, ms: 500 }) }; crm.saveAnalysis(id, result, score(result.signals, 2026)); };
  save(vieja, VIEJA, 'http://viejo.example/');
  save(buena, BUENA, 'https://nuevo.example/');
  crm.setStatus(excluida, 'suppressed', 'operador');
  assert.throws(() => save(excluida, VIEJA, 'https://fuera.example/'));
  assert.throws(() => crm.saveAnalysis(buena, { url: 'https://nuevo.example/', signals: { email: 'x@example.com' } }, { score: 1, problems: [] }));
  assert.deepEqual(crm.ranking().map(row => [row.id, row.score]), [[vieja, 10], [buena, 0]]);

  const ficha = report(crm.lead(vieja), crm.latestAnalysis(vieja));
  assert.match(ficha, /10\/10/);
  assert.match(ficha, /1\. Activar la conexión segura/);
  assert.match(ficha, /web del centro de estética/);
  assert.match(ficha, new RegExp(`status ${vieja} suppressed`));
  assert.doesNotMatch(ficha, /\bIA\b|https?:\/\/(?!viejo)/);
  assert.match(report(crm.lead(buena), crm.latestAnalysis(buena)), /no es buena candidata/);
});
