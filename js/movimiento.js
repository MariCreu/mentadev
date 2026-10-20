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
  }
  return { gsap, ScrollTrigger };
}

// Ejecuta la escena que toque según tamaño y preferencia de movimiento; GSAP deshace
// todo lo creado dentro de cada rama cuando deja de cumplirse su condición.
export function escenas(config) {
  const g = gsapListo();
  if (!g) return null;
  const mm = g.gsap.matchMedia();
  mm.add({
    escritorio: '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
    movil: '(max-width: 1023px) and (prefers-reduced-motion: no-preference)',
  }, (ctx) => {
    if (ctx.conditions.escritorio) return config.escritorio?.(ctx);
    if (ctx.conditions.movil) return config.movil?.(ctx);
    return undefined;
  });
  return mm;
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
