// Escenas 03–05 · Servicios: la web de ejemplo se convierte en tienda y en app.
// - Demos siempre activas (carrito y huecos del panel), con o sin GSAP.
// - Escritorio con altura suficiente y sin "reducir movimiento": escena fijada que
//   cambia de paso con el scroll (web → tienda → app). En el resto, bloques apilados.
import { sectorPorId, formatearPrecio } from './sectores.js';
import { sectorState } from './sector-state.js';
import { reduce, gsapListo } from './movimiento.js';
import { pintarSitio } from './hero-build.js';

const seccion = document.querySelector('.esc-servicios');
const pin = seccion?.querySelector('.serv-pin');
const pasos = seccion ? [...seccion.querySelectorAll('.serv-step')] : [];
const indice = seccion ? [...seccion.querySelectorAll('.serv-index li')] : [];
const live = seccion?.querySelector('.serv-live');
const MODOS = ['web', 'tienda', 'app'];

const anunciar = (texto) => { if (live) live.textContent = texto; };

// --- Datos del sector -------------------------------------------------------
let sector = sectorPorId(sectorState.get());
let carrito = { n: 0, total: 0 };
const pintarCarrito = () => {
  seccion.querySelector('.cart-count').textContent = String(carrito.n);
  seccion.querySelector('.cart-total').textContent = formatearPrecio(carrito.total).replace('Gratis', '0,00 €');
};

function pintar(s) {
  sector = s;
  const web = seccion.querySelector('.mock-web .demo-site');
  if (web) pintarSitio(web, s);
  seccion.querySelectorAll('.mock-shop [data-f="nombre"]').forEach((el) => { el.textContent = s.web.nombre; });
  seccion.querySelector('.mock-shop').style.setProperty('--acento', s.acento);
  seccion.querySelectorAll('.shop-grid li').forEach((li, i) => {
    const p = s.productos[i];
    li.querySelector('.shop-name').textContent = p.nombre;
    li.querySelector('.shop-price').textContent = formatearPrecio(p.precio);
    li.querySelector('.shop-add .sr-only').textContent = ` ${p.nombre}`;
  });
  carrito = { n: 0, total: 0 };
  pintarCarrito();
  seccion.querySelector('.shop-msg').textContent = '';
  seccion.querySelector('[data-f="panel-titulo"]').textContent = s.panel.titulo;
  seccion.querySelector('[data-f="panel-unidad"]').textContent = s.panel.unidad;
  seccion.querySelectorAll('.app-list li').forEach((li, i) => {
    const c = s.panel.citas[i];
    li.innerHTML = `<time>${c.hora}</time> ${c.texto}`;
  });
  seccion.querySelectorAll('.app-slot').forEach((b) => { b.setAttribute('aria-pressed', 'false'); b.querySelector('span').textContent = 'Libre'; });
  seccion.querySelector('.app-libres').textContent = String(s.panel.libres);
}

// --- Demos ----------------------------------------------------------------
function demos() {
  seccion.querySelectorAll('.shop-add').forEach((b) => b.addEventListener('click', () => {
    const p = sector.productos[Number(b.dataset.i)];
    carrito.n += 1;
    carrito.total += p.precio;
    pintarCarrito();
    const cuenta = seccion.querySelector('.cart-count');
    cuenta.classList.remove('bump');
    void cuenta.offsetWidth; // reinicia la animación
    cuenta.classList.add('bump');
    anunciar(`Añadido: ${p.nombre}. Carrito: ${carrito.n} ${carrito.n === 1 ? 'producto' : 'productos'}, total ${formatearPrecio(carrito.total)}.`);
  }));
  seccion.querySelector('.shop-pay')?.addEventListener('click', () => {
    const msg = 'Pago de prueba: en tu tienda real, aquí se paga con tarjeta o Bizum.';
    seccion.querySelector('.shop-msg').textContent = msg;
    anunciar(msg);
  });
  seccion.querySelectorAll('.app-slot').forEach((b) => b.addEventListener('click', () => {
    const reservado = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', String(reservado));
    b.querySelector('span').textContent = reservado ? 'Reservado' : 'Libre';
    const libres = seccion.querySelector('.app-libres');
    const n = Math.max(0, Number(libres.textContent) + (reservado ? -1 : 1));
    libres.textContent = String(n);
    anunciar(`${b.querySelector('time').textContent}: ${reservado ? 'reservado' : 'libre otra vez'}. Quedan ${n} ${sector.panel.unidad} libres.`);
  }));
}

// --- Escena fijada (escritorio) -----------------------------------------------
let modoActual = 'web';
function activar(modo, animar) {
  if (modo === modoActual && seccion.dataset.mode === modo) return;
  const anterior = pasos.find((p) => p.dataset.step === modoActual);
  const nuevo = pasos.find((p) => p.dataset.step === modo);
  modoActual = modo;
  seccion.dataset.mode = modo;
  indice.forEach((li, i) => { if (MODOS[i] === modo) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); });
  pasos.forEach((p) => p.classList.toggle('is-active', p === nuevo));
  const g = gsapListo();
  if (!animar || !g || !nuevo) return;
  const { gsap } = g;
  if (anterior && anterior !== nuevo) gsap.fromTo(anterior, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.25, clearProps: 'all' });
  const copia = nuevo.querySelector('.serv-copy');
  gsap.fromTo(copia.children, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: 'power3.out', clearProps: 'transform,opacity' });
  if (modo === 'web') gsap.fromTo(nuevo.querySelectorAll('.demo-block, .serv-measure'), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.07, ease: 'back.out(1.6)', clearProps: 'transform,opacity' });
  if (modo === 'tienda') gsap.fromTo(nuevo.querySelectorAll('.shop-grid li'), { y: 36, rotation: (i) => [-5, 3, -2][i], opacity: 0 }, { y: 0, rotation: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: 'back.out(1.5)', clearProps: 'transform,opacity' });
  if (modo === 'app') {
    gsap.fromTo(nuevo.querySelector('.mock-app'), { scaleY: 0.85, opacity: 0, transformOrigin: '50% 0%' }, { scaleY: 1, opacity: 1, duration: 0.45, ease: 'power3.out', clearProps: 'transform,opacity' });
    gsap.fromTo(nuevo.querySelectorAll('.app-list li, .app-slot'), { x: -18, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, stagger: 0.05, delay: 0.15, ease: 'power2.out', clearProps: 'transform,opacity' });
  }
}

function escenaFijada(g) {
  const { ScrollTrigger } = g;
  seccion.classList.add('is-pinned');
  pasos.forEach((p) => p.classList.toggle('is-active', p.dataset.step === 'web'));
  modoActual = 'web';
  seccion.dataset.mode = 'web';
  // Los pasos no activos solo se ocultan a la vista: siguen siendo alcanzables con el teclado.
  const st = ScrollTrigger.create({
    trigger: seccion,
    start: 'top top',
    end: '+=300%',
    pin,
    anticipatePin: 1,
    onUpdate(self) {
      const modo = MODOS[Math.min(2, Math.floor(self.progress * 3))];
      if (modo !== modoActual) activar(modo, true);
    },
  });
  // [RF 3] el foco nunca se queda en un paso invisible: se desplaza a su tramo.
  const alEnfocar = (e) => {
    const paso = e.target.closest?.('.serv-step');
    if (!paso || paso.dataset.step === modoActual) return;
    const i = MODOS.indexOf(paso.dataset.step);
    window.scrollTo({ top: st.start + (st.end - st.start) * ((i + 0.5) / 3), behavior: 'auto' });
    activar(paso.dataset.step, false);
  };
  pin.addEventListener('focusin', alEnfocar);
  return () => { // [RF 2] al salir de escritorio todo vuelve a su estado apilado
    pin.removeEventListener('focusin', alEnfocar);
    seccion.classList.remove('is-pinned');
    pasos.forEach((p) => p.classList.add('is-active'));
    seccion.dataset.mode = 'web';
    modoActual = 'web';
  };
}

function entradasMovil(g) {
  const { gsap } = g;
  const ts = pasos.map((p) => gsap.from(p.querySelectorAll('.demo-block, .shop-grid li, .app-list li, .app-slot'), {
    y: 24, opacity: 0, duration: 0.5, stagger: 0.06, ease: 'back.out(1.4)', clearProps: 'transform,opacity',
    scrollTrigger: { trigger: p.querySelector('.serv-visual'), start: 'top 85%', once: true },
  }));
  return () => ts.forEach((t) => { t.scrollTrigger?.kill(); t.kill(); });
}

if (seccion) {
  pintar(sector);
  demos();
  // Fuera de la escena fijada se ven los tres pasos.
  pasos.forEach((p) => p.classList.add('is-active'));
  document.addEventListener('md:sector', ({ detail }) => pintar(sectorPorId(detail.id)));
  const g = gsapListo();
  if (g && !reduce.matches) {
    const mm = g.gsap.matchMedia();
    mm.add('(min-width: 1024px) and (min-height: 680px) and (prefers-reduced-motion: no-preference)', () => escenaFijada(g));
    mm.add('(max-width: 1023px) and (prefers-reduced-motion: no-preference)', () => entradasMovil(g));
  }
}
