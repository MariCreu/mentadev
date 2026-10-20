// Escena 07 · Vitrina de proyectos reales.
// - Escritorio con movimiento: la sección se fija y los paneles avanzan en horizontal con el scroll;
//   cada captura se revela al llegar su panel.
// - Resto (móvil, tablet, "reducir movimiento", sin GSAP): carrusel nativo con scroll-snap,
//   botones Anterior/Siguiente y flechas del teclado.
import { reduce, gsapListo } from './movimiento.js';

const seccion = document.querySelector('.esc-vitrina');
const pista = seccion?.querySelector('.vitrina-track');
const [anterior, siguiente] = seccion ? [...seccion.querySelectorAll('.vitrina-nav button')] : [];

const paso = () => {
  const panel = pista.querySelector('.vitrina-panel');
  const gap = parseFloat(getComputedStyle(pista).columnGap) || 24;
  return panel.getBoundingClientRect().width + gap;
};
const mover = (dir) => pista.scrollBy({ left: dir * paso(), behavior: reduce.matches ? 'auto' : 'smooth' });
const actualizarBotones = () => {
  if (!anterior) return;
  const max = pista.scrollWidth - pista.clientWidth - 2;
  anterior.setAttribute('aria-disabled', String(pista.scrollLeft <= 2));
  siguiente.setAttribute('aria-disabled', String(pista.scrollLeft >= max));
};

function carrusel() {
  anterior?.addEventListener('click', () => { if (anterior.getAttribute('aria-disabled') !== 'true') mover(-1); });
  siguiente?.addEventListener('click', () => { if (siguiente.getAttribute('aria-disabled') !== 'true') mover(1); });
  pista.addEventListener('keydown', (e) => {
    if (e.target !== pista || seccion.classList.contains('is-pinned')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); mover(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); mover(-1); }
  });
  pista.addEventListener('scroll', actualizarBotones, { passive: true });
  window.addEventListener('resize', actualizarBotones);
  actualizarBotones();
}

function escenaHorizontal({ gsap }) {
  seccion.classList.add('is-pinned');
  pista.scrollLeft = 0;
  // Hasta que el borde derecho del último panel quede alineado con el margen de la página
  // (scrollWidth incluye desbordes internos y daría una distancia mayor de la real).
  const distancia = () => {
    const ultimo = pista.querySelector('.vitrina-panel:last-child');
    const margen = parseFloat(getComputedStyle(pista).paddingLeft) || 0;
    return Math.max(0, ultimo.offsetLeft + ultimo.offsetWidth + margen - document.documentElement.clientWidth);
  };
  const avance = gsap.to(pista, {
    x: () => -distancia(),
    ease: 'none',
    scrollTrigger: { trigger: seccion, start: 'top top', end: () => `+=${distancia()}`, pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 },
  });
  // [RF 3] Con teclado: el foco en un panel lleva el scroll hasta el punto en que ese panel está a la vista.
  const alEnfocar = (e) => {
    const panel = e.target.closest('.vitrina-panel');
    const st = avance.scrollTrigger;
    // Solo con teclado: un clic en un enlace también enfoca, y no debe frenar su navegación.
    if (!panel || !st || !e.target.matches(":focus-visible")) return;
    const margen = parseFloat(getComputedStyle(pista).paddingLeft) || 0;
    const fraccion = Math.min(1, Math.max(0, (panel.offsetLeft - margen) / (distancia() || 1)));
    requestAnimationFrame(() => window.scrollTo(0, Math.round(st.start + fraccion * (st.end - st.start))));
  };
  seccion.addEventListener('focusin', alEnfocar);
  const revelados = [...pista.querySelectorAll('.vitrina-panel')].map((panel) => {
    const fig = panel.querySelector('.vitrina-fig');
    const texto = panel.querySelector('.vitrina-text');
    const tl = gsap.timeline({ scrollTrigger: { trigger: panel, containerAnimation: avance, start: 'left 85%', end: 'left 35%', scrub: true } });
    if (fig) tl.fromTo(fig, { clipPath: 'inset(0 0 100% 0 round 20px)' }, { clipPath: 'inset(0 0 0% 0 round 20px)', ease: 'power2.out' }, 0);
    tl.fromTo(texto, { x: 60 }, { x: 0, ease: 'power2.out' }, 0);
    return tl;
  });
  return () => { // [RF 2] de vuelta al carrusel nativo
    seccion.removeEventListener('focusin', alEnfocar);
    revelados.forEach((tl) => { tl.scrollTrigger?.kill(); tl.kill(); });
    seccion.classList.remove('is-pinned');
    gsap.set(pista, { clearProps: 'transform' });
    pista.querySelectorAll('.vitrina-fig, .vitrina-text').forEach((el) => gsap.set(el, { clearProps: 'clipPath,transform' }));
    actualizarBotones();
  };
}

if (seccion && pista) {
  carrusel();
  const g = gsapListo();
  if (g && !reduce.matches) {
    g.gsap.matchMedia().add('(min-width: 1024px) and (min-height: 680px) and (prefers-reduced-motion: no-preference)', () => escenaHorizontal(g));
  }
  // Las imágenes cargan tarde (lazy): al terminar, recalcular las distancias.
  pista.querySelectorAll('img').forEach((img) => img.addEventListener('load', () => window.ScrollTrigger?.refresh(), { once: true }));
}
