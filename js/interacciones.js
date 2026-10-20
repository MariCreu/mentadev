// Microinteracciones de la home: botones magnéticos, cabecera compacta con progreso de lectura,
// cursor acompañante en las demos y los gestos de la ficha, los 7 días y la revisión.
// Con "reducir movimiento" o sin GSAP: nada se mueve; todo queda en su estado final.
import { reduce, gsapListo } from './movimiento.js';

const g = gsapListo();
const movimiento = Boolean(g) && !reduce.matches;
const punteroFino = matchMedia('(hover: hover) and (pointer: fine)').matches;

// --- Cabecera: compacta al bajar y barra de progreso de lectura (siempre, es información) ---
const cabecera = document.getElementById('top');
const progreso = cabecera?.querySelector('.md-head-progress span');
let pendiente = false;
function alDesplazar() {
  pendiente = false;
  cabecera?.classList.toggle('is-compact', window.scrollY > 80);
  if (progreso) {
    const total = document.documentElement.scrollHeight - innerHeight;
    progreso.style.transform = `scaleX(${total > 0 ? Math.min(1, scrollY / total) : 0})`;
  }
}
window.addEventListener('scroll', () => { if (!pendiente) { pendiente = true; requestAnimationFrame(alDesplazar); } }, { passive: true });
alDesplazar();

if (movimiento) {
  const { gsap, ScrollTrigger } = g;

  // --- Botones magnéticos (solo ratón) --------------------------------------------------------
  if (punteroFino) {
    document.querySelectorAll('.btn').forEach((btn) => {
      const x = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3' });
      const y = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3' });
      btn.addEventListener('pointermove', (e) => {
        const b = btn.getBoundingClientRect();
        x(((e.clientX - b.left) / b.width - 0.5) * 12);
        y(((e.clientY - b.top) / b.height - 0.5) * 12);
      });
      btn.addEventListener('pointerleave', () => { x(0); y(0); });
    });

    // --- Cursor acompañante en las demos (no sustituye al del sistema) ---------------------------
    const cursor = document.createElement('div');
    cursor.className = 'cursor-demo';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = '<i></i><span></span>';
    document.body.append(cursor);
    const etiqueta = cursor.querySelector('span');
    const cx = gsap.quickTo(cursor, 'x', { duration: 0.25, ease: 'power3' });
    const cy = gsap.quickTo(cursor, 'y', { duration: 0.25, ease: 'power3' });
    const zonas = '#demo, .hero-picker, .serv-visual, .noche-board, .noche-picker';
    window.addEventListener('pointermove', (e) => {
      const zona = e.target.closest?.(zonas);
      cursor.classList.toggle('is-on', Boolean(zona));
      if (!zona) return;
      etiqueta.textContent = e.target.closest('[data-cursor]')?.dataset.cursor ?? '';
      cx(e.clientX); cy(e.clientY);
    }, { passive: true });
    document.addEventListener('pointerleave', () => cursor.classList.remove('is-on'));
  }

  // --- 02 · Ficha: la regla superior se traza y las filas se colocan --------------------------
  const ficha = document.querySelector('.ficha');
  if (ficha) {
    gsap.timeline({ scrollTrigger: { trigger: ficha, start: 'top 80%', once: true } })
      .fromTo(ficha, { '--trazo': 0 }, { '--trazo': 1, duration: 0.8, ease: 'power3.inOut' })
      .from(ficha.querySelectorAll('.ficha-val, .ficha-note'), { y: 18, opacity: 0, duration: 0.5, stagger: 0.06, ease: 'power3.out', clearProps: 'transform,opacity' }, '-=0.45');
  }

  // --- 08 · 7 días: la barra avanza con el scroll y enciende los hitos -------------------------
  const dias = document.querySelector('.dias');
  if (dias) {
    const barra = dias.querySelector('.dias-bar span');
    const hitos = [...dias.querySelectorAll('.dia')];
    gsap.fromTo(barra, { scaleX: 0 }, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: dias, start: 'top 80%', end: 'bottom 55%', scrub: 0.5,
        onUpdate: (self) => hitos.forEach((h, i) => h.classList.toggle('is-on', self.progress >= i / hitos.length + 0.05)),
      },
    });
  }

  // --- Revisión: la dirección se escribe y las mejoras sustituyen a los problemas ---------------
  const url = document.querySelector('.rev-url');
  const lista = document.querySelectorAll('.rev-list li');
  if (url) {
    const texto = url.textContent;
    url.textContent = '';
    ScrollTrigger.create({
      trigger: '.rev-demo', start: 'top 80%', once: true,
      onEnter: () => {
        let i = 0;
        const t = setInterval(() => { url.textContent = texto.slice(0, ++i); if (i >= texto.length) clearInterval(t); }, 60);
        gsap.from(lista, { y: 16, opacity: 0, duration: 0.45, stagger: 0.15, delay: texto.length * 0.06, ease: 'back.out(1.6)', clearProps: 'transform,opacity' });
      },
    });
  }
}
