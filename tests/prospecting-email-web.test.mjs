// Email de contacto que la clínica publica en su portada (signals.emailWeb): se elige uno solo, sin peticiones extra.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeHtml } from '../prospecting/analyzer.mjs';

const email = (html, url = 'https://www.clinica.es/') => analyzeHtml(html, { url, ms: 100 }).emailWeb;

test('lee el mailto y quita lo que va tras la interrogación', () => {
  assert.equal(email('<a href="mailto:Info@Clinica.es?subject=Cita&body=Hola">Escríbenos</a>'), 'info@clinica.es');
});

test('prefiere el email del dominio de la web (www.clinica.es -> clinica.es)', () => {
  const html = '<a href="mailto:gestor@gmail.com">a</a><p>Escríbenos a recepcion@clinica.es</p>';
  assert.equal(email(html), 'recepcion@clinica.es');
  assert.equal(email('<a href="mailto:primero@otro.com">a</a><a href="mailto:segundo@otro.org">b</a><p>texto@tercero.net</p>'), 'primero@otro.com');
  assert.equal(email('<p>texto@tercero.net</p>'), 'texto@tercero.net');
});

test('lee el texto visible y las ofuscaciones sencillas', () => {
  assert.equal(email('<p>Email: cita [at] clinica.es</p>'), 'cita@clinica.es');
  assert.equal(email('<p>cita(arroba)clinica.es</p>'), 'cita@clinica.es');
  assert.equal(email('<script>var a="oculto@clinica.es"</script><p>hola</p>'), undefined);
});

test('descarta basura: imágenes, ejemplos, sentry, wixpress, demasiado largos', () => {
  const html = `<img src="logo@2x.png"><p>nombre@example.com u003einfo@clinica.es tu@domain.com
    abc123@sentry.wixpress.com ${'x'.repeat(70)}@clinica.es</p><a href="mailto:foto@clinica.png">x</a>`;
  assert.equal(email(html), undefined);
});

test('sin email, la señal no existe', () => {
  const signals = analyzeHtml('<html><body><p>Sin contacto</p></body></html>', { url: 'https://clinica.es/', ms: 1 });
  assert.equal('emailWeb' in signals, false);
});
