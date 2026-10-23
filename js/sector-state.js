// Estado del sector elegido en la home. Emite 'md:sector' en `target` al cambiar.
// sessionStorage puede estar bloqueado (navegación privada): entonces solo se pierde el recuerdo.
// La elección solo se recuerda al moverse por la propia web (ir a una guía y volver con un enlace o
// con «Atrás»). Al recargar o al entrar desde fuera, la home empieza siempre en el sector por defecto.
import { SECTOR_POR_DEFECTO, sectorPorId } from './sectores.js';

const CLAVE = 'md-sector';

const leer = (storage) => { try { return storage?.getItem(CLAVE) ?? null; } catch { return null; } };
const guardar = (storage, id) => { try { storage?.setItem(CLAVE, id); } catch { /* sin recuerdo */ } };
const olvidar = (storage) => { try { storage?.removeItem?.(CLAVE); } catch { /* sin recuerdo */ } };

// ¿Se recupera el sector guardado? `tipo` es el de PerformanceNavigationTiming
// ('navigate', 'reload', 'back_forward'); `referrer` y `origen`, los de la página.
export function debeRestaurar({ tipo = 'navigate', referrer = '', origen = '' } = {}) {
  if (tipo === 'reload') return false;
  if (tipo === 'back_forward') return true; // «Atrás» o «Adelante»: se vuelve a lo que se veía
  try { return Boolean(referrer) && new URL(referrer).origin === origen; } catch { return false; }
}

export function createSectorState({ storage, target, inicial = SECTOR_POR_DEFECTO, restaurar = true }) {
  if (!restaurar) olvidar(storage);
  const recordado = restaurar ? leer(storage) : null;
  let actual = sectorPorId(recordado) ? recordado : inicial;
  let porUsuario = Boolean(sectorPorId(recordado));

  return {
    get: () => actual,
    elegido: () => porUsuario,
    set(id, source = 'usuario') {
      if (!sectorPorId(id)) return false;
      if (source === 'usuario') { porUsuario = true; guardar(storage, id); }
      if (id === actual) return true;
      actual = id;
      target.dispatchEvent(new CustomEvent('md:sector', { detail: { id, source } }));
      return true;
    },
  };
}

function navegacionActual() {
  let tipo = 'navigate';
  try {
    const nav = performance.getEntriesByType?.('navigation')?.[0];
    if (nav?.type) tipo = nav.type;
    else if (performance.navigation) tipo = ['navigate', 'reload', 'back_forward'][performance.navigation.type] ?? 'navigate';
  } catch { /* sin datos: se trata como entrada nueva */ }
  return { tipo, referrer: document.referrer, origen: location.origin };
}

const storageSeguro = (() => { try { return window.sessionStorage; } catch { return null; } })();
export const sectorState = typeof document === 'undefined'
  ? null
  : createSectorState({ storage: storageSeguro, target: document, restaurar: debeRestaurar(navegacionActual()) });
