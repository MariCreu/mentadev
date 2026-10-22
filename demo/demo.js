// Demo de web de clínica: pinta los datos del enlace (#d=…) sobre la página de ejemplo.
// Todo lo que viene del enlace se escribe como texto (textContent/atributos), nunca como HTML.
import { leerEnlace } from './enlace.js';
import { ahoraEnMadrid, estadoHorario, hhmm } from './horario.js';
import { IDIOMAS, COMUNES, CONTENIDO } from './contenido.js';

const CLAVE_IDIOMA = 'demo-idioma';
const MUNICIPIO_POR_DEFECTO = 'Alicante';
const MEDIODIA = 14 * 60; // antes: franja de mañana; un tramo que acaba después de las 15:00 da tarde
const TARDE = 15 * 60;

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
const icono = (id) => {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'ico');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(ns, 'use');
  use.setAttribute('href', '#' + id);
  svg.append(use);
  return svg;
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
const huecosBase = () => ({ nombre: nombre(), municipio });

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
  document.title = `${nombre()} · Web de ejemplo`;
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
    el('li', {}, el('span', { clase: 'paso-n', 'aria-hidden': 'true', texto: String(i + 1) }), el('p', { texto: paso }))));
  for (const b of $$('[data-idioma]')) b.setAttribute('aria-pressed', String(b.dataset.idioma === idioma));
  const wa = $('[data-whatsapp]');
  if (!wa.hidden) wa.href = `https://wa.me/${internacional}?text=${encodeURIComponent(t.whatsappMensaje)}`;
  pintarHorario();
  pintarEstado();
  pintarCita(false);
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

// ---------- Cita en 3 pasos ----------
const cita = { paso: 1, motivo: null, dia: null, franja: null, nombre: '', telefono: '', enviada: false, error: false };

function proximosDias() {
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date()).split('-').map(Number);
  const dias = [];
  for (let i = 1; i <= 14 && dias.length < 6; i++) {
    const f = new Date(Date.UTC(y, m - 1, d + i, 12));
    const sem = f.getUTCDay();
    const tramos = C.horario[sem] || [];
    if (!tramos.length) continue;
    const franjas = [];
    if (tramos.some(([a]) => a < MEDIODIA)) franjas.push('m');
    if (tramos.some(([, b]) => b > TARDE)) franjas.push('t');
    dias.push({ clave: f.toISOString().slice(0, 10), sem, num: f.getUTCDate(), franjas });
  }
  return dias;
}

const motivos = () => [
  ...elegidos.map((i) => ({ valor: 't' + i, texto: C.tratamientos[i][idioma].t })),
  { valor: 'primera', texto: T().motivoPrimeraVisita },
  { valor: 'otro', texto: T().motivoOtro },
];
const textoFranja = (f) => (f === 'm' ? T().franjaManana : T().franjaTarde);
const mayuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1);
// «Revisión y limpieza» se lee mejor dentro de la frase como «revisión y limpieza» (sin tocar siglas como ECG).
const enFrase = (s) => (/^\p{Lu}\p{Ll}/u.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);

function radio(nombreGrupo, valor, marcado, ...contenido) {
  return el('label', { clase: 'opcion' },
    el('input', { type: 'radio', name: nombreGrupo, value: valor, checked: marcado }),
    el('span', {}, ...contenido));
}

function grupoFranjas(dia) {
  if (!dia) return null;
  return el('fieldset', { clase: 'grupo', 'data-franjas': true },
    el('legend', { clase: 'cita-sub', texto: T().franjaEtiqueta }),
    el('div', { clase: 'opciones' }, ...dia.franjas.map((f) => radio('franja', f, cita.franja === f, mayuscula(textoFranja(f))))));
}

function puedeSeguir() {
  if (cita.paso === 1) return !!cita.motivo;
  if (cita.paso === 2) return !!cita.dia && !!cita.franja;
  return true;
}

function pintarCita(enfocar) {
  const t = T();
  const form = $('[data-cita]');
  const cuerpo = $('[data-cita-cuerpo]');
  const progreso = $('.cita-progreso');
  progreso.hidden = cita.enviada;
  $('[data-cita-paso]').textContent = rellenar(t.paso, { n: cita.paso });
  $$('.cita-barra i').forEach((b, i) => b.classList.toggle('on', i < cita.paso));
  let titulo;
  const partes = [];

  if (cita.enviada) {
    const dia = proximosDias().find((d) => d.clave === cita.dia);
    const motivo = motivos().find((x) => x.valor === cita.motivo);
    titulo = el('h3', { clase: 'cita-pregunta', tabindex: '-1', texto: t.resumenTitulo });
    partes.push(el('div', { clase: 'resumen' },
      el('span', { clase: 'resumen-ok', 'aria-hidden': 'true' }, icono('i-ok')),
      titulo,
      el('p', { clase: 'resumen-caja', texto: rellenar(t.resumen, {
        nombre: cita.nombre,
        motivo: motivo ? enFrase(motivo.texto) : '',
        dia: dia ? `${t.diasFrase[dia.sem]} ${dia.num}` : '',
        franja: textoFranja(cita.franja),
        telefono: cita.telefono,
      }) }),
      el('p', { clase: 'resumen-aviso', texto: t.resumenAviso }),
      el('p', { clase: 'resumen-demo', texto: t.resumenDemo }),
      el('button', { type: 'button', clase: 'btn btn-linea', 'data-reiniciar': true, texto: t.otraCita })));
  } else if (cita.paso === 1) {
    titulo = el('legend', { clase: 'cita-pregunta', tabindex: '-1', texto: t.paso1 });
    partes.push(el('fieldset', { clase: 'grupo' }, titulo,
      el('div', { clase: 'opciones' }, ...motivos().map((x) => radio('motivo', x.valor, cita.motivo === x.valor, x.texto)))));
  } else if (cita.paso === 2) {
    const dias = proximosDias();
    const elegido = dias.find((d) => d.clave === cita.dia);
    titulo = el('legend', { clase: 'cita-pregunta', tabindex: '-1', texto: t.paso2 });
    partes.push(el('fieldset', { clase: 'grupo' }, titulo,
      el('div', { clase: 'opciones dias' }, ...dias.map((d) => radio('dia', d.clave, cita.dia === d.clave,
        el('span', { clase: 'dia-sem', texto: t.diasCortos[d.sem] }),
        el('span', { clase: 'dia-num', texto: String(d.num) }))))));
    partes.push(grupoFranjas(elegido));
  } else {
    titulo = el('legend', { clase: 'cita-pregunta', tabindex: '-1', texto: t.paso3 });
    partes.push(el('fieldset', { clase: 'grupo' }, titulo,
      el('label', { clase: 'campo' }, el('span', { texto: t.campoNombre }),
        el('input', { type: 'text', name: 'nombre', autocomplete: 'name', required: true, maxlength: '80', value: cita.nombre })),
      el('label', { clase: 'campo' }, el('span', { texto: t.campoTelefono }),
        el('input', { type: 'tel', name: 'telefono', autocomplete: 'tel', inputmode: 'tel', required: true, maxlength: '25', value: cita.telefono }))));
    if (cita.error) partes.push(el('p', { clase: 'cita-error', role: 'alert', texto: t.faltanDatos }));
  }

  if (!cita.enviada) {
    partes.push(el('div', { clase: 'cita-nav' },
      cita.paso > 1 ? el('button', { type: 'button', clase: 'btn btn-texto', 'data-atras': true, texto: t.atras }) : null,
      el('button', { type: 'submit', clase: 'btn btn-cita', disabled: !puedeSeguir() }, cita.paso === 3 ? t.enviar : t.siguiente)));
  }
  const paso = el('div', { clase: enfocar ? 'cita-paso-entra' : '' }, ...partes);
  cuerpo.replaceChildren(paso);
  form.setAttribute('aria-label', t.citaTitulo);
  if (enfocar) {
    titulo.focus({ preventScroll: true });
    // Si el paso nuevo es más corto y su principio queda bajo la cabecera, lo traemos a la vista.
    if (form.getBoundingClientRect().top < $('.cab').offsetHeight) form.scrollIntoView({ block: 'start' });
  }
}

function actualizarBoton() {
  const b = $('[data-cita] button[type="submit"]');
  if (b) b.disabled = !puedeSeguir();
}

function montarCita() {
  const form = $('[data-cita]');
  form.addEventListener('change', (ev) => {
    const { name, value } = ev.target;
    if (name === 'motivo') cita.motivo = value;
    if (name === 'franja') cita.franja = value;
    if (name === 'dia') {
      cita.dia = value;
      const d = proximosDias().find((x) => x.clave === value);
      if (!d.franjas.includes(cita.franja)) cita.franja = d.franjas.length === 1 ? d.franjas[0] : null;
      const nuevo = grupoFranjas(d);
      const viejo = $('[data-franjas]', form);
      if (viejo) viejo.replaceWith(nuevo); else form.querySelector('.dias').closest('.grupo').after(nuevo);
    }
    actualizarBoton();
  });
  form.addEventListener('input', (ev) => {
    if (ev.target.name === 'nombre') cita.nombre = ev.target.value;
    if (ev.target.name === 'telefono') cita.telefono = ev.target.value;
  });
  form.addEventListener('click', (ev) => {
    if (ev.target.closest('[data-atras]')) {
      cita.paso -= 1;
      cita.error = false;
      pintarCita(true);
    } else if (ev.target.closest('[data-reiniciar]')) {
      Object.assign(cita, { paso: 1, motivo: null, dia: null, franja: null, nombre: '', telefono: '', enviada: false, error: false });
      pintarCita(true);
    }
  });
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (!puedeSeguir()) return;
    if (cita.paso < 3) {
      cita.paso += 1;
    } else {
      cita.nombre = cita.nombre.trim();
      cita.telefono = cita.telefono.trim();
      if (!cita.nombre || cita.telefono.replace(/\D/g, '').length < 6) {
        cita.error = true;
        pintarCita(false);
        $(cita.nombre ? '[name="telefono"]' : '[name="nombre"]', form).focus();
        return;
      }
      cita.error = false;
      cita.enviada = true;
    }
    pintarCita(true);
  });
}

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
  io.observe($('#cita'));
}

// ---------- Arranque ----------
document.documentElement.style.setProperty('--acento', C.acento);
$('meta[name="theme-color"]').setAttribute('content', C.acento);
montarSelector();
montarCita();
pintarTelefono();
pintarWhatsapp();
pintarContenido();
montarBarraMovil();
setInterval(pintarEstado, 60 * 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { pintarEstado(); pintarHorario(); } });
window.addEventListener('hashchange', () => location.reload());
