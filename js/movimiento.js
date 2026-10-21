// Utilidades comunes de animación. Con "reducir movimiento" o sin GSAP, las escenas
// se quedan en su estado final (el que pinta taller.css).
export const reduce = matchMedia('(prefers-reduced-motion: reduce)');
export const esEscritorio = () => matchMedia('(min-width: 1024px)').matches;

let registrado = false;
export function gsapListo() {
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger) return null;
  if (!registrado) {
    gsap.registerPlugin(ScrollTrigger);
    registrado = true;
    // Al recalcular, ScrollTrigger rehace los envoltorios de las escenas fijadas y el elemento
    // con el foco sale un instante del documento: el foco caería al body. Se guarda y se devuelve.
    let enfocado = null;
    ScrollTrigger.addEventListener('refreshInit', () => { enfocado = document.activeElement; });
    ScrollTrigger.addEventListener('refresh', () => {
      if (enfocado && enfocado !== document.body && document.activeElement !== enfocado && enfocado.isConnected) enfocado.focus({ preventScroll: true });
      enfocado = null;
    });
    // Al llegar con #ancla (p. ej. /?servicio=…#contacto), las escenas fijadas añaden su espacio después
    // del salto del navegador. Si la persona aún no ha tocado la página, se vuelve a colocar el destino.
    if (location.hash.length > 1) {
      let tocada = false;
      for (const ev of ['wheel', 'touchstart', 'keydown', 'pointerdown']) addEventListener(ev, () => { tocada = true; }, { once: true, passive: true });
      const colocar = () => {
        ScrollTrigger.removeEventListener('refresh', colocar);
        const destino = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (destino && !tocada) destino.scrollIntoView({ block: 'start' });
      };
      ScrollTrigger.addEventListener('refresh', colocar);
    }
  }
  return { gsap, ScrollTrigger };
}

// Al cruzar un punto de corte (girar la tablet) desaparece el espacio de una escena fijada y la
// página saltaría hacia abajo: si se estaba dentro, se vuelve a esa sección cuando ScrollTrigger recalcula.
export function volverTrasRecalcular(seccion) {
  const { ScrollTrigger } = window;
  if (!ScrollTrigger) return;
  const volver = () => { ScrollTrigger.removeEventListener('refresh', volver); seccion.scrollIntoView({ block: 'start' }); };
  ScrollTrigger.addEventListener('refresh', volver);
}

// Grupo de botones de opción (role="radio") con tabindex itinerante y flechas.
// onElegir(boton) se llama al hacer clic o al moverse con flechas, Inicio o Fin.
export function grupoDeOpciones(contenedor, onElegir) {
  const botones = [...contenedor.querySelectorAll('[role="radio"]')];
  const marcar = (id) => botones.forEach((b) => {
    const on = b.dataset.sector === id;
    b.setAttribute('aria-checked', String(on));
    b.tabIndex = on ? 0 : -1;
  });
  botones.forEach((b, i) => {
    b.addEventListener('click', () => onElegir(b));
    b.addEventListener('keydown', (e) => {
      const n = botones.length;
      const destino = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1 + n, ArrowUp: i - 1 + n, Home: 0, End: n - 1 }[e.key];
      if (destino === undefined) return;
      e.preventDefault();
      const b2 = botones[destino % n];
      b2.focus();
      onElegir(b2);
    });
  });
  return { marcar, botones };
}
