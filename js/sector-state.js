// Estado del sector elegido en la home. Emite 'md:sector' en `target` al cambiar.
// sessionStorage puede estar bloqueado (navegación privada): entonces solo se pierde el recuerdo.
import { SECTOR_POR_DEFECTO, sectorPorId } from './sectores.js';

const CLAVE = 'md-sector';

const leer = (storage) => { try { return storage?.getItem(CLAVE) ?? null; } catch { return null; } };
const guardar = (storage, id) => { try { storage?.setItem(CLAVE, id); } catch { /* sin recuerdo */ } };

export function createSectorState({ storage, target, inicial = SECTOR_POR_DEFECTO }) {
  const recordado = leer(storage);
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

const storageSeguro = (() => { try { return window.sessionStorage; } catch { return null; } })();
export const sectorState = typeof document === 'undefined'
  ? null
  : createSectorState({ storage: storageSeguro, target: document });
