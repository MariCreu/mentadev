// Escena 06 · Automatización ("Lo que pasa cuando no miras.").
// - Los 4 flujos cambian con el sector (selector propio, sincronizado con el del hero).
// - Con movimiento: las tareas empiezan "a mano" (desordenadas) y, según baja el tablero,
//   una línea las recorre y cada una pasa a "con la automatización". Al volver hacia arriba, se deshace.
// - Sin GSAP o con "reducir movimiento": todas en su estado final, como en el HTML.
import { sectorPorId } from './sectores.js';
import { sectorState } from './sector-state.js';
import { reduce, gsapListo, grupoDeOpciones } from './movimiento.js';
import { iconoSvg } from './iconos.js';

const seccion = document.querySelector('.esc-noche');
const tablero = seccion?.querySelector('.noche-board');
const tareas = seccion ? [...seccion.querySelectorAll('.task')] : [];
const picker = seccion?.querySelector('.noche-picker');
const linea = seccion?.querySelector('.noche-line path');
const calc = document.getElementById('calculadora');

function pintar(sector) {
  tareas.forEach((li, i) => {
    const f = sector.flujos[i];
    li.querySelector('.task-ico').innerHTML = iconoSvg(f.icono);
    li.querySelector('.task-from').textContent = f.desde;
    li.querySelector('.task-to').textContent = f.hasta;
  });
}

const grupo = picker && grupoDeOpciones(picker, (b) => sectorState.set(b.dataset.sector));
document.addEventListener('md:sector', ({ detail }) => {
  grupo?.marcar(detail.id);
  pintar(sectorPorId(detail.id));
});

// Los números de la calculadora "saltan" al cambiar (respuesta a la acción del usuario).
calc?.addEventListener('md:calc', () => {
  calc.querySelectorAll('.calc-num').forEach((n) => { n.classList.remove('bump'); void n.offsetWidth; n.classList.add('bump'); });
});

const DESORDEN = [{ x: -36, rotation: -4 }, { x: 28, rotation: 3 }, { x: -18, rotation: -2 }, { x: 42, rotation: 4 }];

function escenaEscritorio({ gsap }) {
  linea?.setAttribute('pathLength', '1');
  tareas.forEach((t, i) => { t.dataset.estado = 'mano'; gsap.set(t, DESORDEN[i]); });
  if (linea) gsap.set(linea, { strokeDashoffset: 1 });
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: tablero,
      start: 'top 75%',
      end: 'bottom 45%',
      scrub: 0.6,
      onUpdate(self) {
        tareas.forEach((t, i) => { t.dataset.estado = self.progress >= (i + 0.6) / tareas.length ? 'auto' : 'mano'; });
      },
    },
  });
  if (linea) tl.to(linea, { strokeDashoffset: 0, ease: 'none', duration: 1 }, 0);
  tareas.forEach((t, i) => tl.to(t, { x: 0, rotation: 0, ease: 'power2.out', duration: 0.35 }, (i + 0.25) / tareas.length));
  return () => {
    tareas.forEach((t) => { t.dataset.estado = 'auto'; gsap.set(t, { clearProps: 'transform' }); });
    if (linea) gsap.set(linea, { clearProps: 'strokeDashoffset' });
  };
}

function escenaMovil({ gsap, ScrollTrigger }) {
  const triggers = tareas.map((t, i) => {
    t.dataset.estado = 'mano';
    return ScrollTrigger.create({
      trigger: t,
      start: 'top 70%',
      once: true,
      onEnter: () => gsap.delayedCall(0.15 * (i % 2), () => { t.dataset.estado = 'auto'; }),
    });
  });
  return () => { triggers.forEach((st) => st.kill()); tareas.forEach((t) => { t.dataset.estado = 'auto'; }); };
}

if (seccion) {
  grupo?.marcar(sectorState.get());
  pintar(sectorPorId(sectorState.get()));
  const g = gsapListo();
  if (g && !reduce.matches) {
    const mm = g.gsap.matchMedia();
    mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => escenaEscritorio(g));
    mm.add('(max-width: 1023px) and (prefers-reduced-motion: no-preference)', () => escenaMovil(g));
  }
}
