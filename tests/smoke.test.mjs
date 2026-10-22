import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('GSAP y las fuentes están en el repo', () => {
  const gsap = readFileSync(new URL('../assets/vendor/gsap/gsap.min.js', import.meta.url), 'utf8');
  assert.match(gsap, /GreenSock|gsap/i);
  const font = readFileSync(new URL('../assets/fonts/bricolage-grotesque-latin-wght-normal.woff2', import.meta.url));
  assert.equal(font.subarray(0, 4).toString('latin1'), 'wOF2');
});

test('sin JS, la home enseña el sector por defecto (Clínica) y Restaurante va segundo', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  for (const picker of ['hero-picker', 'noche-picker']) {
    const bloque = html.match(new RegExp(`<div class="${picker}"[\\s\\S]*?</div>`))[0];
    assert.deepEqual([...bloque.matchAll(/data-sector="([a-z]+)"/g)].map((m) => m[1]).slice(0, 2), ['clinica', 'restaurante'], picker);
    assert.match(bloque, /aria-checked="true" tabindex="0" data-sector="clinica"/, picker);
  }
  const sinSelectores = html.replace(/data-sector="restaurante">Restaurante</g, '');
  assert.doesNotMatch(sinSelectores, /restaurante/i, 'quedan textos de restaurante fuera de los selectores');
  assert.match(html, /<div class="demo-site" data-sector="clinica"/);
  const css = readFileSync(new URL('../taller.css', import.meta.url), 'utf8');
  assert.doesNotMatch(html + css, /#A4471F|#8A5A12/i, 'quedan los marrones');
});
