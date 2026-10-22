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

test('sin servicios externos', () => {
  const html = leer('demo/index.html');
  const externos = [...html.matchAll(/<(?:link|script|img|source)\b[^>]*\s(?:src|href|srcset)="([^"]*)"/g)]
    .map(([, url]) => url)
    .filter((url) => /^(https?:)?\/\//.test(url) && url !== 'https://static.cloudflareinsights.com/beacon.min.js');
  assert.deepEqual(externos, []);
  assert.doesNotMatch(leer('demo/demo.css'), /url\(\s*["']?(https?:)?\/\//);
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
