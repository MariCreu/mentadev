// Datos de la clínica de la demo: viajan en el fragmento de la URL (#d=…), sin servidor.
// Módulo puro: funciona igual en el navegador y en Node.
export const TIPOS = ['dental', 'fisio', 'medica', 'estetica', 'generica'];

const TEL = /^\+?\d[\d\s().-]{5,24}$/;
const limpiar = (s, max) => String(s).replace(/[\u0000-\u001f\u007f-\u009f]/g, '').trim().slice(0, max).trim();

export function validar(d) {
  if (!d || typeof d !== 'object') throw new Error('Datos no válidos');
  if (typeof d.nombre !== 'string' || typeof d.municipio !== 'string') throw new Error('Datos no válidos');
  const nombre = limpiar(d.nombre, 80);
  const municipio = limpiar(d.municipio, 60);
  if (!nombre) throw new Error('Falta el nombre');
  if (!municipio) throw new Error('Falta el municipio');
  let telefono = null;
  if (d.telefono != null && d.telefono !== '') {
    telefono = typeof d.telefono === 'string' ? d.telefono.trim() : '';
    if (!TEL.test(telefono)) throw new Error('Teléfono no válido');
  }
  const tratamientos = [];
  for (const n of Array.isArray(d.tratamientos) ? d.tratamientos : []) {
    if (Number.isInteger(n) && n >= 0 && n <= 29 && !tratamientos.includes(n) && tratamientos.length < 12) tratamientos.push(n);
  }
  return {
    nombre, telefono, municipio,
    tipo: TIPOS.includes(d.tipo) ? d.tipo : 'generica',
    tratamientos,
    whatsapp: d.whatsapp === true && telefono !== null,
  };
}

const aBase64url = (texto) => {
  let bin = '';
  for (const b of new TextEncoder().encode(texto)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const deBase64url = (s) => {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

export function crearEnlace(datos, base = 'https://mentadev.com/demo/') {
  const d = validar(datos);
  const json = JSON.stringify({ v: 1, n: d.nombre, t: d.telefono, m: d.municipio, k: d.tipo, tr: d.tratamientos, w: d.whatsapp });
  return base + '#d=' + aBase64url(json);
}

export function leerEnlace(hash) {
  try {
    const m = /^#?d=([A-Za-z0-9_-]+)$/.exec(String(hash || ''));
    if (!m) return null;
    const o = JSON.parse(deBase64url(m[1]));
    if (!o || typeof o !== 'object' || o.v !== 1) return null;
    return validar({ nombre: o.n, telefono: o.t, municipio: o.m, tipo: o.k, tratamientos: o.tr, whatsapp: o.w });
  } catch {
    return null;
  }
}

// ¿Este fragmento trae datos de una clínica? Solo entonces la página debe recargarse al cambiar el `#`:
// los anclajes internos (#cita, #contacto…) nunca deben sustituir ni borrar el `#d=…`.
export const esFragmentoDemo = (hash) => /^#?d=/.test(String(hash || ''));
