// Demo de web de clínica: pinta los datos del enlace (#d=…) sobre la página de ejemplo.
// Todo lo que viene del enlace se escribe como texto (textContent/atributos), nunca como HTML.
import { leerEnlace, esFragmentoDemo } from './enlace.js';
import { ahoraEnMadrid, estadoHorario, hhmm } from './horario.js';
import { IDIOMAS, COMUNES, CONTENIDO } from './contenido.js';

const CLAVE_IDIOMA = 'demo-idioma';
const MUNICIPIO_POR_DEFECTO = 'Alicante';
// Tema del resto de la página (la portada es oscura en los dos). Solo para comparar las dos variantes:
// ?tema=claro|oscuro. Al elegir uno, se quita esto y el bloque del otro en demo.css.
const TEMAS = ['oscuro', 'claro'];
const TEMA_POR_DEFECTO = 'oscuro';

const datos = leerEnlace(location.hash);
const tipo = datos ? datos.tipo : 'generica';
const C = CONTENIDO[tipo];
const validos = (datos ? datos.tratamientos : []).filter((i) => i < C.tratamientos.length);
const elegidos = validos.length ? validos : C.defecto;
const municipio = datos ? datos.municipio : MUNICIPIO_POR_DEFECTO;
// Fotos que van pasando al elegir un tratamiento (el primero, la de ambiente).
const GALERIA = ['ambiente', 'detalle', 'clinica', 'portada'];

const $ = (sel, raiz = document) => raiz.querySelector(sel);
const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];
const rellenar = (texto, huecos) => texto.replace(/\{(\w+)\}/g, (m, k) => (k in huecos ? huecos[k] : m));
const hora = (min) => hhmm(min).replace(/^0(?=\d:)/, '');
const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)');
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

// ---------- Tema ----------
const temaPedido = new URLSearchParams(location.search).get('tema');
document.documentElement.dataset.tema = TEMAS.includes(temaPedido) ? temaPedido : TEMA_POR_DEFECTO;
document.documentElement.classList.add('js');

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

// ---------- Teléfono ----------
const digitos = datos && datos.telefono ? datos.telefono.replace(/\D/g, '') : '';
const internacional = (() => {
  if (!digitos) return '';
  if (datos.telefono.trim().startsWith('+')) return digitos;
  if (digitos.startsWith('00')) return digitos.slice(2);
  if (digitos.length === 9) return '34' + digitos;
  return digitos;
})();
const conWhatsapp = !!(internacional && datos.whatsapp);
const huecosBase = () => ({ nombre: nombre(), municipio, canales: conWhatsapp ? T().canalesConWhatsapp : T().canalesSinWhatsapp });

function pintarTelefono() {
  if (!internacional) {
    // Sin teléfono, «Contacto» pasa a ser el botón principal.
    for (const a of $$('[data-contacto]')) a.classList.replace('btn-cristal', 'btn-menta');
    return;
  }
  for (const a of $$('[data-llamar]')) {
    a.href = 'tel:+' + internacional;
    a.hidden = false;
  }
  $('[data-telefono]').textContent = datos.telefono;
  $('[data-telefono-bloque]').hidden = false;
}
function pintarWhatsapp() {
  if (!conWhatsapp) return;
  for (const a of $$('[data-whatsapp]')) a.hidden = false;
  // Con WhatsApp, los dos botones son «Llamar» y «WhatsApp»; «Contacto» sigue en el menú.
  for (const a of $$('[data-contacto]')) a.hidden = true;
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
  const t = T();
  const ahora = ahoraEnMadrid(new Date());
  const e = estadoHorario(C.horario, ahora);
  let largo = '';
  let corto = '';
  let titulo = '';
  let cuandoHora = '';
  if (e.abierto) {
    largo = rellenar(t.abiertoAhora, { h: hora(e.hasta) });
    corto = t.abiertoCorto;
    titulo = t.abiertoCorto;
    cuandoHora = rellenar(t.hastaLas, { h: hora(e.hasta) });
  } else if (e.abre) {
    const cuando = e.abre.dia === ahora.dia ? t.hoy
      : e.abre.dia === (ahora.dia + 1) % 7 ? t.manana
      : t.diasFrase[e.abre.dia];
    largo = rellenar(t.cerradoAhora, { cuando, h: hora(e.abre.minutos) });
    corto = largo;
    titulo = t.cerradoCorto;
    cuandoHora = rellenar(t.abreCuando, { cuando, h: hora(e.abre.minutos) });
  }
  for (const caja of $$('[data-estado]')) {
    caja.classList.toggle('abierto', e.abierto);
    caja.hidden = !largo;
  }
  $('[data-estado-texto]').textContent = largo;
  $('[data-estado-corto]').textContent = corto;
  const tarjeta = $('[data-tarjeta]');
  tarjeta.classList.toggle('abierto', e.abierto);
  tarjeta.hidden = !titulo;
  $('[data-tarjeta-titulo]').textContent = titulo;
  $('[data-tarjeta-hora]').textContent = cuandoHora;
  $('[data-tarjeta-texto]').textContent = !internacional ? t.tarjetaSinTelefono : conWhatsapp ? t.tarjetaConWhatsapp : t.tarjetaSinWhatsapp;
}

// ---------- Titular: la parte entre *asteriscos* va en cursiva (nodos de texto y <em>, nunca HTML) ----------
function pintarTitular(nodo, texto) {
  nodo.replaceChildren(...texto.split('*').map((trozo, i) => (i % 2 ? el('em', { texto: trozo }) : document.createTextNode(trozo))));
}

// ---------- Tratamientos: pestañas que cambian la foto y el texto ----------
let tratActual = 0;
let escenaMontada = false;
function pintarTratamientos() {
  const escena = $('.trat-escena');
  const t = T();
  const fotos = GALERIA.map((k) => C.fotos[k]);
  const tabs = elegidos.map((i, k) => el('button', {
    type: 'button', role: 'tab', clase: 'trat-tab', id: `trat-tab-${k}`, 'aria-controls': 'trat-panel',
    'aria-selected': String(k === tratActual), tabindex: k === tratActual ? '0' : '-1', texto: C.tratamientos[i][idioma].t,
  }));
  const lista = el('div', { clase: 'trat-tabs', role: 'tablist', 'aria-label': t.tratamientosAyuda }, ...tabs);
  const imgs = fotos.map((f, k) => el('img', { src: f.src, alt: '', width: '1500', height: '1000', loading: 'lazy', decoding: 'async', 'data-galeria': String(k) }));
  const figura = el('figure', { clase: 'trat-foto foto' }, ...imgs, el('figcaption', { clase: 'etiqueta', texto: t.fotoEjemplo }));
  const texto = el('div', { clase: 'trat-texto', 'aria-live': 'polite' }, el('h3'), el('p'));
  const panel = el('div', { clase: 'trat-panel', id: 'trat-panel', role: 'tabpanel' }, figura, texto);
  escena.replaceChildren(lista, panel);
  mostrarTratamiento(tratActual, false);

  lista.addEventListener('click', (ev) => {
    const b = ev.target.closest('[role="tab"]');
    if (b) mostrarTratamiento(tabs.indexOf(b), true);
  });
  lista.addEventListener('pointerover', (ev) => {
    const b = ev.target.closest('[role="tab"]');
    if (b && ev.pointerType === 'mouse' && matchMedia('(min-width: 1024px)').matches) mostrarTratamiento(tabs.indexOf(b), true);
  });
  lista.addEventListener('keydown', (ev) => {
    const teclas = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let n = null;
    if (ev.key in teclas) n = (tratActual + teclas[ev.key] + tabs.length) % tabs.length;
    else if (ev.key === 'Home') n = 0;
    else if (ev.key === 'End') n = tabs.length - 1;
    if (n === null) return;
    ev.preventDefault();
    mostrarTratamiento(n, true);
    tabs[n].focus();
  });
  escenaMontada = true;
}

function mostrarTratamiento(k, animar) {
  if (k < 0) return;
  const cambia = k !== tratActual;
  tratActual = k;
  const tabs = $$('.trat-tab');
  tabs.forEach((b, n) => {
    b.setAttribute('aria-selected', String(n === k));
    b.tabIndex = n === k ? 0 : -1;
  });
  const panel = $('#trat-panel');
  panel.setAttribute('aria-labelledby', tabs[k].id);
  const g = k % GALERIA.length;
  for (const img of $$('[data-galeria]', panel)) {
    const activa = Number(img.dataset.galeria) === g;
    img.style.opacity = activa ? '1' : '0';
    img.alt = activa ? C.fotos[GALERIA[g]].alt[idioma] : '';
    if (activa) img.loading = 'eager';
  }
  // En el móvil, la fila de chips se desliza para que el elegido quede a la vista.
  if (cambia && !matchMedia('(min-width: 1024px)').matches) {
    const fila = tabs[k].parentElement;
    const izq = fila.scrollLeft + tabs[k].getBoundingClientRect().left - fila.getBoundingClientRect().left - parseFloat(getComputedStyle(fila).paddingLeft);
    fila.scrollTo({ left: izq, behavior: sinMovimiento.matches ? 'auto' : 'smooth' });
  }
  const x = C.tratamientos[elegidos[k]][idioma];
  const texto = $('.trat-texto', panel);
  const poner = () => {
    $('h3', texto).textContent = x.t;
    $('p', texto).textContent = x.d;
    texto.classList.remove('cambiando');
  };
  if (animar && cambia && !sinMovimiento.matches) {
    texto.classList.add('cambiando');
    clearTimeout(mostrarTratamiento.t);
    mostrarTratamiento.t = setTimeout(poner, 220);
  } else poner();
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
  pintarTitular($('[data-titular]'), rellenar(textos.titular, h));
  for (const img of $$('img[data-foto]')) {
    const f = C.fotos[img.dataset.foto];
    if (img.getAttribute('src') !== f.src) img.src = f.src;
    img.alt = f.alt[idioma];
  }
  for (const s of $$('source[data-foto-movil]')) {
    const f = C.fotos[s.dataset.fotoMovil];
    if (s.getAttribute('srcset') !== f.movil) s.srcset = f.movil;
  }
  if (escenaMontada || $('.trat-escena')) pintarTratamientos();
  $('[data-primera-visita]').replaceChildren(...textos.primeraVisita.map((paso, i) =>
    el('li', {}, el('span', { clase: 'paso-n', 'aria-hidden': 'true', texto: String(i + 1) }), el('p', { texto: rellenar(paso, h) }))));
  for (const b of $$('[data-idioma]')) b.setAttribute('aria-pressed', String(b.dataset.idioma === idioma));
  for (const a of $$('[data-whatsapp]')) if (conWhatsapp) a.href = `https://wa.me/${internacional}?text=${encodeURIComponent(t.whatsappMensaje)}`;
  pintarHorario();
  pintarEstado();
}

// Selector de idioma (en la cabecera y en el menú del móvil): se construye con IDIOMAS para que añadir
// uno no obligue a tocar este archivo.
function montarSelector() {
  for (const grupo of $$('.idioma')) {
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
}

// Fecha de hoy en Madrid, «AAAA-MM-DD».
const fechaMadrid = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' })
  .format(new Date());

// ---------- Cabecera: con cristal en cuanto la portada queda atrás; menú del móvil ----------
function montarCabecera() {
  const cab = $('.cab');
  const menu = $('.menu');
  const franja = $('.franja');
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => document.documentElement.style.setProperty('--franja-h', franja.offsetHeight + 'px')).observe(franja);
  }
  let pasada = false;
  const pintar = () => {
    cab.classList.toggle('solida', pasada && !menu.open);
    cab.classList.toggle('menu-abierto', menu.open);
  };
  if ('IntersectionObserver' in window) {
    const alto = () => cab.offsetHeight;
    new IntersectionObserver(([e]) => { pasada = !e.isIntersecting; pintar(); }, { rootMargin: `-${alto() + 40}px 0px 0px 0px` })
      .observe($('.portada-texto'));
  }
  menu.addEventListener('toggle', pintar);
  menu.addEventListener('click', (ev) => { if (ev.target.closest('a[href^="#"]')) menu.open = false; });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && menu.open) { menu.open = false; $('summary', menu).focus(); }
  });
}

// ---------- Secciones que aparecen al bajar (solo transform y opacity; sin JS o sin movimiento, todo visible) ----------
function montarApariciones() {
  const nodos = $$('[data-revelar]');
  if (sinMovimiento.matches || !('IntersectionObserver' in window)) { nodos.forEach((n) => n.classList.add('visto')); return; }
  const io = new IntersectionObserver((entradas) => {
    for (const e of entradas) if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -12% 0px' });
  nodos.forEach((n) => io.observe(n));
}

// ---------- Anclajes internos: desplazan sin tocar el #d=… de la URL ----------
// Si cambiaran el fragmento, se perderían los datos de la clínica al recargar o copiar el enlace.
function montarAnclajes() {
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
montarSelector();
pintarTelefono();
pintarWhatsapp();
pintarContenido();
montarCabecera();
montarApariciones();
montarAnclajes();
setInterval(cadaMinuto, 60 * 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) cadaMinuto(); });
// Solo un enlace de demo nuevo (#d=…) cambia la clínica; los anclajes internos no llegan aquí (ver montarAnclajes).
window.addEventListener('hashchange', () => { if (esFragmentoDemo(location.hash)) location.reload(); });
