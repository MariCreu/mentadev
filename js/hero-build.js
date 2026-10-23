// Escena 01 · Hero: "Elige tu negocio" y su web de ejemplo en ordenador y móvil, con la agenda del negocio.
// - Elegir una hora y pulsar el botón (en el ordenador o en el móvil) añade la reserva a la agenda.
// - Si el visitante no toca la maqueta, hace una reserva de muestra ella sola (una vez por sector).
// - Sin GSAP o con "reducir movimiento" no hay reserva automática: la agenda ya trae la reserva hecha.
import { sectorPorId, formatearPrecio } from './sectores.js';
import { sectorState } from './sector-state.js';
import { reduce, gsapListo, grupoDeOpciones } from './movimiento.js';

const escena = document.getElementById('demo');
const picker = document.querySelector('.hero-picker');
const live = document.querySelector('.demo-live');
const mark = document.querySelector('.hero-mark');

// Pinta textos y color de un sector en una web de ejemplo (sin animación).
// La usa la escena de servicios para su maqueta.
export function pintarSitio(contenedor, sector) {
  contenedor.dataset.sector = sector.id;
  contenedor.style.setProperty('--acento', sector.acento);
  for (const campo of ['nombre', 'titular', 'boton']) {
    contenedor.querySelectorAll(`[data-f="${campo}"]`).forEach((el) => { el.textContent = sector.web[campo]; });
  }
  if (contenedor.getAttribute('role') === 'img') contenedor.setAttribute('aria-label', `Web de ejemplo para ${sector.articulo}`);
}

// --- Estado de la maqueta ---------------------------------------------------
const minutos = (h) => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };
const textoBoton = (s) => s.reserva.boton ?? s.web.boton;
const conMovimiento = () => Boolean(gsapListo()) && !reduce.matches;
const anunciar = (texto) => { if (live) live.textContent = texto; };
const $$ = (sel) => (escena ? [...escena.querySelectorAll(sel)] : []);

let sector = sectorPorId(sectorState.get());
let reservadas = new Set();
let elegida = null;

function pintarHoras() {
  $$('.hv-hora').forEach((b) => {
    const h = b.dataset.hora;
    const ocupada = reservadas.has(h);
    b.disabled = ocupada;
    b.classList.toggle('is-ocupada', ocupada);
    b.setAttribute('aria-pressed', String(h === elegida));
    if (ocupada) b.setAttribute('aria-label', `${h}, reservada`); else b.removeAttribute('aria-label');
  });
  const todas = sector.reserva.horas.every((h) => reservadas.has(h));
  $$('[data-f="reservar"]').forEach((b) => { b.textContent = todas ? 'Volver a empezar' : textoBoton(sector); });
}

function pintarAgenda() {
  const { panel, reserva } = sector;
  const filas = panel.citas.map((c) => ({ ...c, tipo: '' }));
  if (!reservadas.has(reserva.horas[0])) filas.push({ hora: reserva.horas[0], texto: 'Libre', tipo: 'is-libre' });
  for (const h of reservadas) filas.push({ hora: h, texto: reserva.nueva, tipo: 'is-nueva' });
  filas.sort((a, b) => minutos(a.hora) - minutos(b.hora));
  escena.querySelector('.hv-ag-list').innerHTML = filas.map((f) => (
    `<li class="${f.tipo}" data-hora="${f.hora}"><time>${f.hora}</time><span>${f.texto}${f.tipo === 'is-nueva' ? '<small>Desde la web</small>' : ''}</span></li>`
  )).join('');
  const n = Math.max(0, panel.libres - reservadas.size);
  const unidad = n === 1 ? panel.unidad.replace(/s$/, '') : panel.unidad;
  escena.querySelector('[data-f="libres"]').textContent = n === 0
    ? `No quedan ${panel.unidad} libres`
    : `${n === 1 ? 'Queda' : 'Quedan'} ${n} ${unidad} ${n === 1 ? 'libre' : 'libres'}`;
}

const ponerAviso = (texto) => $$('[data-f="ok"]').forEach((p) => { p.textContent = texto; });

// Pinta las tres superficies. Con `hecha`, la primera hora ya aparece reservada (estado final).
function pintarHero(s, { hecha = false } = {}) {
  sector = s;
  elegida = null;
  reservadas = new Set(hecha ? [s.reserva.horas[0]] : []);
  escena.dataset.sector = s.id;
  escena.style.setProperty('--acento', s.acento);
  $$('[data-f="nombre"]').forEach((el) => { el.textContent = s.web.nombre; });
  $$('[data-f="titular"]').forEach((el) => { el.textContent = s.web.titular; });
  $$('[data-f="elige"]').forEach((el) => { el.textContent = s.reserva.elige; });
  escena.querySelector('[data-f="panel-titulo"]').textContent = s.panel.titulo;
  $$('.hv-serv li').forEach((li, i) => {
    const p = s.productos[i];
    li.innerHTML = `<span>${p.nombre}</span><b>${formatearPrecio(p.precio)}</b>`;
  });
  $$('.hv-horas').forEach((g) => {
    g.innerHTML = s.reserva.horas.map((h) => `<button type="button" class="hv-hora" aria-pressed="false" data-hora="${h}">${h}</button>`).join('');
  });
  $$('.hv-go').forEach((b) => { b.disabled = false; }); // sin JS van desactivados
  pintarHoras();
  pintarAgenda();
  ponerAviso(hecha ? `${s.reserva.hecha} a las ${s.reserva.horas[0]}` : '');
}

function elegir(h) {
  elegida = elegida === h ? null : h;
  ponerAviso('');
  pintarHoras();
}

function reservar({ auto = false } = {}) {
  if (sector.reserva.horas.every((h) => reservadas.has(h))) {
    pintarHero(sector);
    anunciar('Ejemplo reiniciado: vuelven a estar libres todas las horas.');
    return;
  }
  if (!elegida) {
    anunciar('Elige una hora para reservar.');
    if (conMovimiento()) {
      $$('.hv-horas, .hv-go').forEach((el) => { el.classList.remove('is-aviso'); void el.offsetWidth; el.classList.add('is-aviso'); });
      setTimeout(() => $$('.is-aviso').forEach((el) => el.classList.remove('is-aviso')), 700);
    }
    return;
  }
  const h = elegida;
  reservadas.add(h);
  elegida = null;
  pintarHoras();
  pintarAgenda();
  ponerAviso(`${sector.reserva.hecha} a las ${h}`);
  // La reserva automática no se anuncia: nadie la ha pedido.
  if (!auto) anunciar(`${sector.reserva.hecha} a las ${h}. Ya aparece en la agenda: ${sector.panel.titulo.toLowerCase()}.`);
  const g = gsapListo();
  if (!g || reduce.matches) return;
  const fila = escena.querySelector(`.hv-ag-list li[data-hora="${h}"]`);
  g.gsap.timeline()
    .fromTo(fila, { opacity: 0, x: -14, clipPath: 'inset(0 100% 0 0 round .6em)' }, { opacity: 1, x: 0, clipPath: 'inset(0 0% 0 0 round .6em)', duration: 0.55, ease: 'power3.out', clearProps: 'opacity,transform,clipPath' })
    .fromTo(escena.querySelector('.hv-agenda'), { y: 0 }, { y: -6, duration: 0.14, yoyo: true, repeat: 1, ease: 'power1.out', clearProps: 'transform' }, 0)
    .fromTo($$('.hv-ok'), { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: 0.3, clearProps: 'opacity,transform' }, 0.1);
}

// Eventos delegados: sirven aunque las horas se repinten al cambiar de sector.
escena?.addEventListener('click', (e) => {
  const hora = e.target.closest('.hv-hora');
  if (hora && !hora.disabled) { elegir(hora.dataset.hora); return; }
  if (e.target.closest('.hv-go')) reservar();
});

// --- Reserva automática -----------------------------------------------------
let tocado = false;       // el visitante ya ha usado la maqueta: no se vuelve a hacer sola
let autoHecha = false;    // ya se ha hecho en el sector actual
let enVista = false;
let pendiente = false;
let temporizador = null;
let autoTl = null;

function pararAuto() {
  clearTimeout(temporizador);
  temporizador = null;
  pendiente = false;
  if (autoTl) { autoTl.kill(); autoTl = null; }
  $$('.hv-hora, .hv-go').forEach((b) => { b.style.transform = ''; });
}
function programarAuto(ms) {
  pararAuto();
  if (tocado || autoHecha || !conMovimiento()) return;
  temporizador = setTimeout(lanzarAuto, ms);
}
function lanzarAuto() {
  temporizador = null;
  if (tocado || autoHecha || !conMovimiento()) return;
  if (!enVista || document.hidden) { pendiente = true; return; }
  const { gsap } = gsapListo();
  const h = sector.reserva.horas.find((x) => !reservadas.has(x));
  if (!h) return;
  // Se hace en la superficie que se ve: el ordenador en pantallas anchas, el móvil en las estrechas.
  const pc = escena.querySelector('.hv-pc');
  const zona = pc && getComputedStyle(pc).display !== 'none' ? pc : escena.querySelector('.hv-phone');
  const hora = zona.querySelector(`.hv-hora[data-hora="${h}"]`);
  const go = zona.querySelector('.hv-go');
  autoHecha = true;
  autoTl = gsap.timeline({ onComplete: () => { autoTl = null; } })
    .to(hora, { scale: 0.9, duration: 0.12, ease: 'power2.in' })
    .add(() => { if (elegida !== h) elegir(h); })
    .to(hora, { scale: 1, duration: 0.35, ease: 'back.out(3)', clearProps: 'transform' })
    .to(go, { scale: 0.93, duration: 0.14, ease: 'power2.in' }, '+=0.75')
    .add(() => { if (elegida === h) reservar({ auto: true }); })
    .to(go, { scale: 1, duration: 0.4, ease: 'back.out(3)', clearProps: 'transform' });
}

if (escena) {
  const tocar = () => { if (!tocado) { tocado = true; pararAuto(); } };
  for (const ev of ['pointerdown', 'click', 'keydown', 'focusin']) escena.addEventListener(ev, tocar);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      enVista = e.isIntersecting;
      if (enVista && pendiente) programarAuto(1200);
    }, { threshold: 0.45 }).observe(escena);
  } else enVista = true;
  document.addEventListener('visibilitychange', () => { if (!document.hidden && pendiente) programarAuto(1200); });
  reduce.addEventListener?.('change', () => { if (reduce.matches) pararAuto(); });
}

// --- Selector de sector --------------------------------------------------------
const grupo = picker && grupoDeOpciones(picker, (boton) => {
  const id = boton.dataset.sector;
  sectorState.set(id);
  anunciar(`Web de ejemplo para ${sectorPorId(id).etiqueta.toLowerCase()}`);
});

function cambiarSector(s) {
  pararAuto();
  autoHecha = false;
  const mover = conMovimiento();
  pintarHero(s, { hecha: !mover });
  if (!mover) return;
  const { gsap } = gsapListo();
  gsap.fromTo($$('.hv-site, .hv-screen, .hv-ag-list'), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out', clearProps: 'opacity,transform' });
  programarAuto(2200);
}

document.addEventListener('md:sector', ({ detail }) => {
  grupo?.marcar(detail.id);
  if (escena) cambiarSector(sectorPorId(detail.id));
});

// --- Entrada --------------------------------------------------------------------
let iniciado = false;
function entrada() {
  if (iniciado) return;
  iniciado = true;
  grupo?.marcar(sector.id);
  if (!escena) return;
  // Si el respaldo del <head> ya enseñó la maqueta completa (JS tardío), no se deshace la reserva a la vista.
  const mover = conMovimiento() && !escena.classList.contains('is-built');
  pintarHero(sector, { hecha: !mover });
  escena.classList.add('is-built');
  if (!mover) { autoHecha = true; return; }
  const { gsap } = gsapListo();
  // El H1 es visible desde el inicio; se dibuja el subrayado y aparecen los tiradores de selección.
  if (mark) {
    const asas = mark.querySelector('.hero-handles');
    gsap.timeline({ delay: 0.15 })
      .fromTo(mark, { '--mark': 0 }, { '--mark': 1, duration: 0.7, ease: 'power3.inOut' })
      .fromTo(asas, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.25, ease: 'back.out(2)' }, '-=0.25')
      .to(asas, { opacity: 0, duration: 0.4, delay: 1.1 });
  }
  gsap.timeline({ delay: 0.3 })
    .fromTo(escena.querySelector('.hv-phone'), { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', clearProps: 'opacity,transform' })
    .fromTo(escena.querySelector('.hv-agenda'), { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', clearProps: 'opacity,transform' }, '-=0.45');
  programarAuto(3500);
}

if (window.gsap) entrada();
else window.addEventListener('load', entrada, { once: true });
