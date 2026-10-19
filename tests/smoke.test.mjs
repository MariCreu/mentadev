import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('GSAP y las fuentes están en el repo', () => {
  const gsap = readFileSync(new URL('../assets/vendor/gsap/gsap.min.js', import.meta.url), 'utf8');
  assert.match(gsap, /GreenSock|gsap/i);
  const font = readFileSync(new URL('../assets/fonts/bricolage-grotesque-latin-wght-normal.woff2', import.meta.url));
  assert.equal(font.subarray(0, 4).toString('latin1'), 'wOF2');
});
