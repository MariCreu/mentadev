// Demo de web de clínica: pinta los datos del enlace (#d=…) sobre la página de ejemplo.
// Todo lo que viene del enlace se escribe como texto (textContent/atributos), nunca como HTML.
import { leerEnlace, esFragmentoDemo } from './enlace.js';
import { ahoraEnMadrid, estadoHorario, hhmm } from './horario.js';
import { IDIOMAS, COMUNES, CONTENIDO } from './contenido.js';

const CLAVE_IDIOMA = 'demo-idioma';
const MUNICIPIO_POR_DEFECTO = 'Alicante';

const datos = leerEnlace(location.hash);
const tipo = datos ? datos.tipo : 'generica';
const C = CONTENIDO[tipo];
const validos = (datos ? datos.tratamientos : []).filter((i) => i < C.tratamientos.length);
const elegidos = validos.length ? validos : C.defecto;
const municipio = datos ? datos.municipio : MUNICIPIO_POR_DEFECTO;

const $ = (sel, raiz = document) => raiz.querySelector(sel);
const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];
const rellenar = (texto, huecos) => texto.replace(/\{(\w+)\}/g, (m, k) => (k in huecos ? huecos[k] : m));
const hora = (min) => hhmm(min).replace(/^0(?=\d:)/, '');
const el = (etiqueta, props = {}, ...hijos) => {
  const n = document.createElement(etiqueta);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'texto') n.textContent = v;
    else if (k === 'clase') n.className = v;
    else if (v !== false && v != null) n.setAttribute(k, v === true ? '' : v);
  }
  n.append(...hijos.filter(Boolean));
  return n;
};

// ---------- Idioma ----------
const idiomaInicial = () => {
  try {
    const g = sessionStorage.getItem(CLAVE_IDIOMA);
    if (IDIOMAS.includes(g)) return g;
  } catch { /* sin almacenamiento: seguimos con el del navegador */ }
  const nav = String(navigator.language || '').toLowerCase().slice(0, 2);
  return IDIOMAS.includes(nav) ? nav : 'en';
};
let idioma = idiomaInicial();
const T = () => COMUNES[idioma];
const nombre = () => (datos ? datos.nombre : T().clinicaPorDefecto);
const huecosBase = () => ({ nombre: nombre(), municipio, canales: datos?.whatsapp && internacional ? T().canalesConWhatsapp : T().canalesSinWhatsapp });

// ---------- Teléfono ----------
const digitos = datos && datos.telefono ? datos.telefono.replace(/\D/g, '') : '';
const internacional = (() => {
  if (!digitos) return '';
  if (datos.telefono.trim().startsWith('+')) return digitos;
  if (digitos.startsWith('00')) return digitos.slice(2);
  if (digitos.length === 9) return '34' + digitos;
  return digitos;
})();

function pintarTelefono() {
  if (!internacional) return;
  for (const a of $$('[data-llamar]')) {
    a.href = 'tel:+' + internacional;
    a.hidden = false;
  }
  $('[data-telefono]').textContent = datos.telefono;
  $('[data-telefono-bloque]').hidden = false;
}
function pintarWhatsapp() {
  const a = $('[data-whatsapp]');
  if (!internacional || !datos.whatsapp) return;
  a.href = `https://wa.me/${internacional}?text=${encodeURIComponent(T().whatsappMensaje)}`;
  a.hidden = false;
}

// ---------- Horario ----------
const DIAS_SEMANA = [1, 2, 3, 4, 5, 6, 0]; // de lunes a domingo
function pintarHorario() {
  const hoy = ahoraEnMadrid(new Date()).dia;
  const filas = DIAS_SEMANA.map((d) => {
    const tramos = C.horario[d] || [];
    const celda = tramos.length
      ? el('td', {}, ...tramos.map(([a, b]) => el('span', { texto: `${hora(a)} – ${hora(b)}` })))
      : el('td', { texto: T().cerrado });
    return el('tr', { clase: d === hoy ? 'hoy' : '' }, el('th', { scope: 'row', texto: T().dias[d] }), celda);
  });
  $('[data-horario]').replaceChildren(...filas);
}

function pintarEstado() {
  const ahora = ahoraEnMadrid(new Date());
  const e = estadoHorario(C.horario, ahora);
  const caja = $('[data-estado]');
  let texto = '';
  if (e.abierto) texto = rellenar(T().abiertoAhora, { h: hora(e.hasta) });
  else if (e.abre) {
    const cuando = e.abre.dia === ahora.dia ? T().hoy
      : e.abre.dia === (ahora.dia + 1) % 7 ? T().manana
      : T().diasFrase[e.abre.dia];
    texto = rellenar(T().cerradoAhora, { cuando, h: hora(e.abre.minutos) });
  }
  caja.classList.toggle('abierto', e.abierto);
  $('[data-estado-texto]').textContent = texto;
  caja.hidden = !texto;
}

// ---------- Contenido ----------
function pintarContenido() {
  const t = T();
  const textos = C.textos[idioma];
  const h = huecosBase();
  document.documentElement.lang = idioma;
  document.title = rellenar(t.titulo, h);
  for (const n of $$('[data-t]')) n.textContent = rellenar(t[n.dataset.t], h);
  for (const n of $$('[data-t-aria]')) n.setAttribute('aria-label', t[n.dataset.tAria]);
  for (const n of $$('[data-nombre]')) n.textContent = nombre();
  for (const n of $$('[data-c]')) n.textContent = rellenar(textos[n.dataset.c], h);
  for (const img of $$('img[data-foto]')) {
    const f = C.fotos[img.dataset.foto];
    if (img.getAttribute('src') !== f.src) {
      img.removeAttribute('width');
      img.removeAttribute('height');
      img.src = f.src;
    }
    img.alt = f.alt[idioma];
  }
  $('[data-tratamientos]').replaceChildren(...elegidos.map((i) => {
    const x = C.tratamientos[i][idioma];
    return el('li', {}, el('h3', { texto: x.t }), el('p', { texto: x.d }));
  }));
  $('[data-primera-visita]').replaceChildren(...textos.primeraVisita.map((paso, i) =>
    el('li', {}, el('span', { clase: 'paso-n', 'aria-hidden': 'true', texto: String(i + 1) }), el('p', { texto: rellenar(paso, h) }))));
  for (const b of $$('[data-idioma]')) b.setAttribute('aria-pressed', String(b.dataset.idioma === idioma));
  const wa = $('[data-whatsapp]');
  if (!wa.hidden) wa.href = `https://wa.me/${internacional}?text=${encodeURIComponent(t.whatsappMensaje)}`;
  pintarHorario();
  pintarEstado();
}

// Selector de idioma: se construye con IDIOMAS para que añadir uno no obligue a tocar este archivo.
function montarSelector() {
  const grupo = $('.idioma');
  grupo.replaceChildren(...IDIOMAS.map((cod) =>
    el('button', { type: 'button', lang: cod, 'data-idioma': cod, 'aria-pressed': 'false', texto: cod.toUpperCase() })));
  grupo.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-idioma]');
    if (!b || b.dataset.idioma === idioma) return;
    idioma = b.dataset.idioma;
    try { sessionStorage.setItem(CLAVE_IDIOMA, idioma); } catch { /* no pasa nada si no se guarda */ }
    pintarContenido();
  });
}

// Fecha de hoy en Madrid, «AAAA-MM-DD».
const fechaMadrid = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' })
  .format(new Date());

// ---------- Barra fija del móvil: no repite botones que ya se ven ----------
function montarBarraMovil() {
  const barra = $('.barra-movil');
  if (!('IntersectionObserver' in window)) return;
  const vistos = new Set();
  const io = new IntersectionObserver((entradas) => {
    for (const e of entradas) e.isIntersecting ? vistos.add(e.target) : vistos.delete(e.target);
    barra.classList.toggle('oculta', vistos.size > 0);
  });
  io.observe($('.portada .acciones'));
  io.observe($('#contacto'));
}

// ---------- Anclajes internos: desplazan sin tocar el #d=… de la URL ----------
// Si cambiaran el fragmento, se perderían los datos de la clínica al recargar o copiar el enlace.
function montarAnclajes() {
  const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)');
  document.addEventListener('click', (ev) => {
    if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    const a = ev.target.closest('a[href^="#"]');
    if (!a) return;
    const destino = document.getElementById(a.getAttribute('href').slice(1));
    if (!destino) return;
    ev.preventDefault();
    destino.scrollIntoView({ behavior: sinMovimiento.matches ? 'auto' : 'smooth', block: 'start' });
    if (!destino.hasAttribute('tabindex')) destino.setAttribute('tabindex', '-1');
    destino.focus({ preventScroll: true });
  });
}

// ---------- Cada minuto: estado del horario y, si ha cambiado el día, el día de hoy en la tabla ----------
let fechaPintada = fechaMadrid();
function cadaMinuto() {
  pintarEstado();
  const hoy = fechaMadrid();
  if (hoy === fechaPintada) return;
  fechaPintada = hoy;
  pintarHorario();
}

// ---------- Arranque ----------
document.documentElement.style.setProperty('--acento', C.acento);
$('meta[name="theme-color"]').setAttribute('content', C.acento);
montarSelector();
pintarTelefono();
pintarWhatsapp();
pintarContenido();
montarBarraMovil();
montarAnclajes();
setInterval(cadaMinuto, 60 * 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) cadaMinuto(); });
// Solo un enlace de demo nuevo (#d=…) cambia la clínica; los anclajes internos no llegan aquí (ver montarAnclajes).
window.addEventListener('hashchange', () => { if (esFragmentoDemo(location.hash)) location.reload(); });
