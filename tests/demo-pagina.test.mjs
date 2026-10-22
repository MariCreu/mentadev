// Página de la demo de clínica (demo/): sin indexar, con analítica, sin servicios externos y avisada sin JS.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const leer = (archivo) => readFileSync(new URL(`../${archivo}`, import.meta.url), 'utf8');

test('noindex en la página, en _headers y en robots.txt', () => {
  assert.match(leer('demo/index.html'), /<meta name="robots" content="noindex">/);
  assert.match(leer('_headers'), /^\/demo\/\*\r?\n(?:[ \t]+.*\r?\n)*?[ \t]+X-Robots-Tag: noindex/m);
  assert.match(leer('robots.txt'), /^Disallow: \/demo\/$/m);
  assert.doesNotMatch(leer('sitemap.xml'), /\/demo/);
});

test('lleva la analítica', () => {
  assert.match(leer('demo/index.html'), /86ba551e367d48e094c48d4ac87cbf4f/);
});

// Todas las URL de todos los atributos que cargan o enlazan algo, en todas las etiquetas
// (también el segundo o tercer atributo de una misma etiqueta y cada candidato de srcset).
const ATRIBUTO_URL = /\s(?:src|href|srcset|poster|data|action|formaction)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi;
const urlsDe = (html) => [...html.matchAll(/<[a-z][^>]*>/gi)]
  .flatMap(([etiqueta]) => [...etiqueta.matchAll(ATRIBUTO_URL)].map((m) => m[1] ?? m[2] ?? m[3]))
  .flatMap((v) => v.split(',').map((x) => x.trim().split(/\s+/)[0]));
// Lo único externo permitido: el beacon de la analítica y el enlace del pie a MentaDev.
const PERMITIDOS = ['https://static.cloudflareinsights.com/beacon.min.js', 'https://mentadev.com/'];
const externos = (html) => urlsDe(html).filter((url) => /^(https?:)?\/\//i.test(url) && !PERMITIDOS.includes(url));

test('sin servicios externos', () => {
  const html = leer('demo/index.html');
  assert.ok(urlsDe(html).length > 10, 'no se han encontrado atributos');
  assert.deepEqual(externos(html), []);
  assert.doesNotMatch(leer('demo/demo.css'), /url\(\s*["']?(https?:)?\/\//);
  assert.doesNotMatch(leer('demo/demo.css'), /@import/);
});

test('sin servicios externos: detecta cualquier atributo externo, no solo el primero', () => {
  assert.deepEqual(externos('<img src="/a.webp" srcset="/a.webp 1x, https://cdn.example.com/a.webp 2x">'), ['https://cdn.example.com/a.webp']);
  assert.deepEqual(externos('<link rel="preload" as="font" crossorigin href=//fonts.example.com/x.woff2>'), ['//fonts.example.com/x.woff2']);
  assert.deepEqual(externos("<script type='module' src='https://cdn.example.com/x.js'></script>"), ['https://cdn.example.com/x.js']);
  assert.deepEqual(externos('<a href="#cita"></a><a href="tel:+34965851801"></a><a href="https://mentadev.com/"></a>'), []);
});

test('los anclajes internos no borran los datos del enlace', async () => {
  const { esFragmentoDemo } = await import('../demo/enlace.js');
  assert.equal(esFragmentoDemo('#d=eyJ2IjoxfQ'), true);
  assert.equal(esFragmentoDemo('#d=roto'), true);
  for (const h of ['', '#', '#cita', '#inicio', '#contacto', '#tratamientos', '#data']) assert.equal(esFragmentoDemo(h), false, h);
  const js = leer('demo/demo.js');
  // La recarga por hashchange solo ocurre con un fragmento de demo, y los clics en anclajes se interceptan.
  const recarga = js.match(/addEventListener\(\s*'hashchange'[^\n]*/)[0];
  assert.match(recarga, /esFragmentoDemo\(location\.hash\)\)\s*location\.reload\(\)/);
  assert.match(js, /a\[href\^="#"\]/);
  assert.match(js, /preventDefault\(\)/);
});

test('sin JS se ve completa y avisada', () => {
  const html = leer('demo/index.html');
  for (const texto of ['Vuestra clínica', 'Foto de ejemplo', 'Web de ejemplo preparada por MentaDev', 'Calle Ejemplo, 1']) {
    assert.ok(html.includes(texto), `falta «${texto}»`);
  }
});

test('demo.js no usa innerHTML ni insertAdjacentHTML', () => {
  assert.doesNotMatch(leer('demo/demo.js'), /innerHTML|outerHTML|insertAdjacentHTML|document\.write/);
});
