import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { TIPOS } from '../demo/enlace.js';
import { IDIOMAS, COMUNES, CONTENIDO } from '../demo/contenido.js';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const claves = (o) => Object.keys(o).sort();
const lleno = (s) => typeof s === 'string' && s.trim().length > 0;

test('cada tipo existe y tiene es y en con las mismas claves', () => {
  assert.deepEqual(IDIOMAS, ['es', 'en']);
  assert.deepEqual(claves(CONTENIDO), [...TIPOS].sort());
  for (const tipo of TIPOS) {
    const c = CONTENIDO[tipo];
    assert.ok(lleno(c.nombre.es) && lleno(c.nombre.en), tipo);
    assert.deepEqual(claves(c.textos.es), claves(c.textos.en), tipo);
    for (const idioma of IDIOMAS) {
      const t = c.textos[idioma];
      for (const k of ['titular', 'entradilla', 'sobre']) assert.ok(lleno(t[k]), `${tipo} ${idioma} ${k}`);
      assert.ok(Array.isArray(t.primeraVisita) && t.primeraVisita.length >= 3 && t.primeraVisita.every(lleno), `${tipo} ${idioma} primeraVisita`);
    }
    assert.equal(c.textos.es.primeraVisita.length, c.textos.en.primeraVisita.length, tipo);
    for (const [i, tr] of c.tratamientos.entries()) {
      assert.deepEqual(claves(tr), ['en', 'es'], `${tipo} ${i}`);
      for (const idioma of IDIOMAS) assert.ok(lleno(tr[idioma].t) && lleno(tr[idioma].d), `${tipo} ${i} ${idioma}`);
    }
  }
});

test('los nombres de tipo son los fijados', () => {
  assert.deepEqual(TIPOS.map((t) => CONTENIDO[t].nombre.es), ['Dental', 'Fisioterapia', 'Médica', 'Estética', 'Clínica']);
  assert.deepEqual(TIPOS.map((t) => CONTENIDO[t].nombre.en), ['Dental', 'Physiotherapy', 'Medical', 'Aesthetics', 'Clinic']);
});

test('hay entre 8 y 12 tratamientos (y nunca más de 30, el máximo de validar)', () => {
  for (const tipo of TIPOS) {
    const n = CONTENIDO[tipo].tratamientos.length;
    assert.ok(n >= 8 && n <= 12 && n <= 30, `${tipo}: ${n}`);
  }
});

test('defecto son índices válidos', () => {
  for (const tipo of TIPOS) {
    const { defecto, tratamientos } = CONTENIDO[tipo];
    assert.ok(defecto.length >= 4 && defecto.length <= 6, tipo);
    assert.equal(new Set(defecto).size, defecto.length, tipo);
    for (const i of defecto) assert.ok(Number.isInteger(i) && i >= 0 && i < tratamientos.length, `${tipo} ${i}`);
  }
});

test('horario: 7 días, tramos ordenados dentro de 0–1440', () => {
  for (const tipo of TIPOS) {
    const h = CONTENIDO[tipo].horario;
    assert.equal(h.length, 7, tipo);
    for (const dia of h) {
      let fin = -1;
      for (const [a, b] of dia) {
        assert.ok(Number.isInteger(a) && Number.isInteger(b) && a > fin && a < b && a >= 0 && b <= 1440, `${tipo} ${a}-${b}`);
        fin = b;
      }
    }
  }
});

test('horarios fijados por tipo', () => {
  const m = (h) => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };
  const t = (...r) => r.map((x) => x.split('-').map(m));
  const semana = (lv, s = []) => [[], lv, lv, lv, lv, lv, s];
  assert.deepEqual(CONTENIDO.dental.horario, semana(t('9:00-14:00', '16:00-20:00')));
  assert.deepEqual(CONTENIDO.fisio.horario, semana(t('8:00-14:00', '15:30-21:00'), t('9:00-13:00')));
  assert.deepEqual(CONTENIDO.medica.horario, semana(t('9:00-14:00', '16:30-19:30')));
  assert.deepEqual(CONTENIDO.estetica.horario, semana(t('10:00-14:00', '16:00-20:30'), t('10:00-14:00')));
  assert.deepEqual(CONTENIDO.generica.horario, semana(t('9:00-14:00', '16:00-20:00')));
});

test('acento legible con texto blanco', () => {
  const lum = (hex) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  for (const tipo of TIPOS) {
    const a = CONTENIDO[tipo].acento;
    assert.match(a, /^#[0-9A-F]{6}$/i, tipo);
    assert.ok(1.05 / (lum(a) + 0.05) >= 4.5, `${tipo} ${a}`);
  }
});

test('cada foto existe en disco, pesa ≤ 250 KB, es WebP y tiene alt en es y en', () => {
  for (const tipo of TIPOS) {
    const f = CONTENIDO[tipo].fotos;
    assert.deepEqual(claves(f), ['ambiente', 'clinica', 'contacto', 'portada'], tipo);
    for (const [k, foto] of Object.entries(f)) {
      assert.match(foto.src, /^\/demo\/fotos\/[a-z0-9-]+\.webp$/, `${tipo} ${k}`);
      const ruta = raiz + foto.src.slice(1);
      assert.ok(statSync(ruta).size <= 250 * 1024, `${foto.src} pesa demasiado`);
      const cab = readFileSync(ruta).subarray(0, 12);
      assert.ok(cab.toString('latin1', 0, 4) === 'RIFF' && cab.toString('latin1', 8, 12) === 'WEBP', `${foto.src} no es WebP`);
      assert.ok(lleno(foto.alt.es) && lleno(foto.alt.en), `${tipo} ${k} alt`);
    }
  }
});

test('CREDITOS.txt nombra cada archivo de demo/fotos/ y solo archivos que existen', () => {
  // Cada línea de crédito: «archivo.webp | autor | URL | licencia».
  const nombrados = readFileSync(raiz + 'demo/fotos/CREDITOS.txt', 'utf8').split(/\r?\n/)
    .map((l) => /^([a-z0-9-]+\.webp) \| [^|]+ \| https:\/\/\S+ \| .+$/.exec(l.trim())).filter(Boolean).map((m) => m[1]);
  const fotos = readdirSync(raiz + 'demo/fotos').filter((f) => f !== 'CREDITOS.txt').sort();
  assert.ok(fotos.length > 0);
  assert.deepEqual([...nombrados].sort(), fotos);
});

test('COMUNES.es y COMUNES.en tienen las mismas claves', () => {
  assert.deepEqual(claves(COMUNES), ['en', 'es']);
  assert.deepEqual(claves(COMUNES.es), claves(COMUNES.en));
  for (const idioma of IDIOMAS) {
    for (const [k, v] of Object.entries(COMUNES[idioma])) {
      if (Array.isArray(v)) assert.ok(v.every(lleno), `${idioma} ${k}`);
      else assert.ok(lleno(v), `${idioma} ${k}`);
    }
    assert.equal(COMUNES[idioma].dias.length, 7, idioma);
  }
});

test('COMUNES lleva los avisos de ejemplo tal cual', () => {
  const es = Object.values(COMUNES.es).flat();
  const en = Object.values(COMUNES.en).flat();
  for (const s of ['Foto de ejemplo', 'Ejemplo', 'Web de ejemplo preparada por MentaDev para {nombre}. Fotos, horario, dirección y textos son orientativos.', 'En vuestra web, esta solicitud os llegaría al momento por email.', 'Calle Ejemplo, 1 · {municipio}', 'Abierto ahora · cierra a las {h}', 'Cerrado · abre {cuando} a las {h}']) assert.ok(es.includes(s), s);
  for (const s of ['Example photo', 'Example', 'Sample website prepared by MentaDev for {nombre}. Photos, opening hours, address and texts are for illustration only.', 'On your website, this request would reach you by email instantly.', 'Calle Ejemplo, 1 · {municipio}']) assert.ok(en.includes(s), s);
});

test('sin precios, reseñas ni promesas de resultados', () => {
  const texto = JSON.stringify({ CONTENIDO, COMUNES }).toLowerCase();
  for (const p of ['€', 'eur', 'garantizad', 'guaranteed', 'reseña', 'review', 'estrellas', 'stars', 'años de experiencia', 'years of experience']) {
    assert.ok(!new RegExp(`(^|[^a-záéíóúñ])${p}`).test(texto), p);
  }
});
