// Escena 01 · Hero: "Elige tu negocio" y la web de ejemplo se diseña sola.
// - Al elegir (clic o flechas): sectorState.set(id) → toda la página cambia de sector.
// - Hasta que el visitante elige, la demo recorre los sectores sola (solo el hero).
// - Sin GSAP o con "reducir movimiento", los cambios son directos y no hay recorrido.
import { SECTORES, sectorPorId } from './sectores.js';
import { sectorState } from './sector-state.js';
import { reduce, gsapListo, grupoDeOpciones } from './movimiento.js';

const ventana = document.getElementById('demo');
const sitio = ventana?.querySelector('.demo-site');
const picker = document.querySelector('.hero-picker');
const live = document.querySelector('.demo-live');
const mark = document.querySelector('.hero-mark');

// Pinta textos y color de un sector en una web de ejemplo (sin animación).
// También lo usa la escena de servicios para su maqueta.
export function pintarSitio(contenedor, sector) {
  contenedor.dataset.sector = sector.id;
  contenedor.style.setProperty('--acento', sector.acento);
  for (const campo of ['nombre', 'titular', 'boton']) {
    contenedor.querySelectorAll(`[data-f="${campo}"]`).forEach((el) => { el.textContent = sector.web[campo]; });
  }
  if (contenedor.getAttribute('role') === 'img') contenedor.setAttribute('aria-label', `Web de ejemplo para ${sector.articulo}`);
}

let tlActual = null;
let destino = null; // sector al que va (o en el que está) la web de ejemplo
function montar(sector, { entrada = false } = {}) {
  if (!sitio) return;
  destino = sector.id;
  const g = gsapListo();
  if (!g || reduce.matches) { pintarSitio(sitio, sector); ventana.classList.add('is-built'); return; }
  if (tlActual) tlActual.progress(1).kill(); // [RF 1] nunca conviven dos montajes
  const { gsap } = g;
  const bloques = sitio.querySelectorAll('.demo-block');
  const notas = sitio.querySelectorAll('.demo-note');
  const tl = gsap.timeline({ onComplete: () => { if (tlActual === tl) tlActual = null; } });
  if (!entrada) tl.to(bloques, { yPercent: 18, opacity: 0, duration: 0.22, stagger: 0.035, ease: 'power2.in' });
  tl.add(() => { pintarSitio(sitio, sector); ventana.classList.add('is-built'); })
    .fromTo(bloques, { yPercent: -12, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.55, stagger: 0.07, ease: 'back.out(1.7)', clearProps: 'transform' })
    .fromTo(notas, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.35, stagger: 0.09, ease: 'power1.out', clearProps: 'clipPath' }, '-=0.35');
  tlActual = tl;
}

// --- Selector -----------------------------------------------------------
const grupo = picker && grupoDeOpciones(picker, (boton) => {
  pararRecorrido();
  const id = boton.dataset.sector;
  sectorState.set(id);
  enDemo = id;
  // Si el sector ya era el elegido, no hay evento: la demo puede estar enseñando otro (recorrido).
  if (destino !== id) {
    montar(sectorPorId(id));
    if (live) live.textContent = `Web de ejemplo para ${sectorPorId(id).etiqueta.toLowerCase()}`;
  }
});

document.addEventListener('md:sector', ({ detail }) => {
  grupo?.marcar(detail.id);
  picker?.querySelectorAll('.is-demo').forEach((b) => b.classList.remove('is-demo'));
  const sector = sectorPorId(detail.id);
  montar(sector);
  if (detail.source === 'usuario' && live) live.textContent = `Web de ejemplo para ${sector.etiqueta.toLowerCase()}`;
});

// --- Autorrecorrido (solo la demo del hero) ------------------------------
let temporizador = null;
let pausado = false;
let enDemo = sectorState.get();
function pararRecorrido() {
  clearInterval(temporizador);
  temporizador = null;
  picker?.querySelectorAll('.is-demo').forEach((b) => b.classList.remove('is-demo'));
}
function paso() {
  if (pausado || document.hidden) return;
  const i = SECTORES.findIndex((s) => s.id === enDemo);
  const siguiente = SECTORES[(i + 1) % SECTORES.length];
  enDemo = siguiente.id;
  picker?.querySelectorAll('[data-sector]').forEach((b) => b.classList.toggle('is-demo', b.dataset.sector === enDemo));
  montar(siguiente);
}
function iniciarRecorrido() {
  if (temporizador || sectorState.elegido() || reduce.matches || !gsapListo()) return;
  temporizador = setInterval(paso, 4000);
}
for (const zona of [ventana, picker].filter(Boolean)) {
  zona.addEventListener('pointerenter', () => { pausado = true; });
  zona.addEventListener('pointerleave', () => { pausado = false; });
  zona.addEventListener('focusin', () => { pausado = true; });
  zona.addEventListener('focusout', () => { pausado = false; });
}
reduce.addEventListener?.('change', () => { if (reduce.matches) pararRecorrido(); });
// La demo solo se mueve mientras el hero está a la vista.
if (ventana && 'IntersectionObserver' in window) {
  new IntersectionObserver(([e]) => { pausado = !e.isIntersecting; }).observe(ventana);
}

// --- Entrada --------------------------------------------------------------
function entrada() {
  const actual = sectorPorId(sectorState.get());
  grupo?.marcar(actual.id);
  const g = gsapListo();
  if (!g || reduce.matches) { if (sitio) pintarSitio(sitio, actual); ventana?.classList.add('is-built'); return; }
  const { gsap } = g;
  // El H1 es visible desde el inicio; se dibuja el subrayado y aparecen los tiradores de selección.
  if (mark) {
    const asas = mark.querySelector('.hero-handles');
    gsap.timeline({ delay: 0.15 })
      .fromTo(mark, { '--mark': 0 }, { '--mark': 1, duration: 0.7, ease: 'power3.inOut' })
      .fromTo(asas, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.25, ease: 'back.out(2)' }, '-=0.25')
      .to(asas, { opacity: 0, duration: 0.4, delay: 1.1 });
  }
  // Si el visitante ya ha elegido en este medio segundo, su montaje manda.
  gsap.delayedCall(0.45, () => { if (destino === null) montar(sectorPorId(sectorState.get()), { entrada: true }); });
  gsap.delayedCall(4.5, iniciarRecorrido);
}

if (window.gsap) entrada();
else window.addEventListener('load', entrada, { once: true });
