// Fase 2 del rediseño: guías, legales y 404 con el sistema de la home (taller.css + paginas.css).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const leer = (archivo) => readFileSync(new URL(`../${archivo}`, import.meta.url), 'utf8');
const PAGINAS = {
  'diseno-web-alicante.html': { canonical: 'https://mentadev.com/diseno-web-alicante', ld: ['Service', 'FAQPage', 'BreadcrumbList'] },
  'automatizacion-de-procesos.html': { canonical: 'https://mentadev.com/automatizacion-de-procesos', ld: ['Service', 'FAQPage', 'BreadcrumbList'] },
  'cuanto-cuesta-una-web.html': { canonical: 'https://mentadev.com/cuanto-cuesta-una-web', ld: ['Article', 'FAQPage', 'BreadcrumbList'] },
  'aviso-legal.html': { canonical: 'https://mentadev.com/aviso-legal', ld: [] },
  'privacidad.html': { canonical: 'https://mentadev.com/privacidad', ld: [] },
  'cookies.html': { canonical: 'https://mentadev.com/cookies', ld: [] },
  '404.html': { canonical: null, ld: [] },
};
const tiposLd = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .flatMap(([, json]) => { const d = JSON.parse(json); return (d['@graph'] ?? [d]).map((n) => n['@type']); });

for (const [archivo, esperado] of Object.entries(PAGINAS)) {
  test(`${archivo}: usa el sistema de la home`, () => {
    const html = leer(archivo);
    assert.match(html, /<link rel="stylesheet" href="\/taller\.css">/);
    assert.match(html, /<link rel="stylesheet" href="\/paginas\.css">/);
    assert.doesNotMatch(html, /styles\.css/);
    assert.match(html, /<header id="top" class="md-head">/);
    assert.match(html, /<a href="\/#servicios">Servicios<\/a>/);
    assert.match(html, /class="md-foot-guides"/);
    assert.match(html, /<script src="\/site\.js" defer><\/script>/);
    assert.match(html, /static\.cloudflareinsights\.com\/beacon\.min\.js/);
  });
  test(`${archivo}: sin marcas de plantilla en el contenido`, () => {
    const main = leer(archivo).match(/<main[\s\S]*<\/main>/)[0];
    assert.doesNotMatch(main, /md-eyebrow/, 'etiquetas sobre los títulos');
    assert.doesNotMatch(main, /M5 12h14M13 6l6 6-6 6/, 'flechas en los botones');
    assert.doesNotMatch(main, /\sstyle="/, 'estilos en línea');
  });
  test(`${archivo}: conserva su SEO`, () => {
    const html = leer(archivo);
    assert.match(html, /<title>[^<]*MentaDev[^<]*<\/title>/);
    // La 404 no se indexa y por eso no lleva descripción.
    if (archivo === '404.html') assert.match(html, /<meta name="robots" content="noindex">/);
    else assert.match(html, /<meta name="description" content="[^"]{40,}">/);
    if (esperado.canonical) assert.ok(html.includes(`<link rel="canonical" href="${esperado.canonical}">`));
    for (const tipo of esperado.ld) assert.ok(tiposLd(html).includes(tipo), `JSON-LD ${tipo}`);
  });
}

test('404: ofrece volver a la home y las guías', () => {
  const main = leer('404.html').match(/<main[\s\S]*<\/main>/)[0];
  assert.match(main, /href="\/"/);
  for (const guia of ['/diseno-web-alicante', '/automatizacion-de-procesos', '/cuanto-cuesta-una-web']) assert.ok(main.includes(`href="${guia}"`));
});
