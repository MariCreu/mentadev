// Buscar y revisar: lo comparten la terminal (cli.mjs) y el panel local (panel.mjs).
import { analyzeSite, score } from './analyzer.mjs';
import { searchPlaces, toRecords } from './discovery.mjs';

// Revisa la portada de cada ficha y guarda el resultado. Pausa entre webs para no cargar a nadie.
export async function revisar(crm, ids, { pageSpeedKey = null, fetchImpl, pausa = 2000, alAvanzar = () => {} } = {}) {
  const resultados = [];
  for (const [i, id] of ids.entries()) {
    const lead = crm.lead(id);
    if (!lead) throw new Error(`No existe la ficha ${id}`);
    alAvanzar({ hecho: i, total: ids.length, nombre: lead.name });
    const result = lead.website
      ? await analyzeSite(lead.website, { pageSpeedKey, ...(fetchImpl && { fetchImpl }) })
      : { url: null, signals: { website: false } };
    crm.saveAnalysis(id, result, result.blocked ? null : score(result.signals));
    resultados.push({ id, lead, result });
    if (pausa && i < ids.length - 1) await new Promise((ok) => setTimeout(ok, pausa));
  }
  alAvanzar({ hecho: ids.length, total: ids.length });
  return resultados;
}

// Busca en Google Places e importa el lote en la fuente indicada.
export async function buscar(crm, { fuente = 'google-places', consulta, sector, clave, fetchImpl }) {
  const places = await searchPlaces(consulta, { key: clave, ...(fetchImpl && { fetchImpl }) });
  const { records, skipped } = toRecords(places, { sector, observedAt: crm.clock() });
  const ids = records.length ? crm.importBatch(fuente, records) : [];
  return { encontradas: places.length, ids, sinWeb: records.filter((r) => !r.website).length, descartadas: skipped };
}
