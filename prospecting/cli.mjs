import { readFileSync } from 'node:fs';
import { CRM } from './crm.mjs';
import { analyzeSite, score, PROBLEMS } from './analyzer.mjs';
import { report } from './report.mjs';
import { searchPlaces, toRecords } from './discovery.mjs';

const USAGE = `Uso:
  node prospecting/cli.mjs check <url>                     Revisa una web sin guardar nada
  node prospecting/cli.mjs <db> source <json>              Registra o actualiza una fuente
  node prospecting/cli.mjs <db> import <fuente> <json>     Importa un lote de clínicas
  node prospecting/cli.mjs <db> discover <fuente> "<búsqueda>" <health_clinic|aesthetic_clinic>
                                                           Busca en Google Places e importa (máx. 60)
  node prospecting/cli.mjs <db> list                       Lista todas las fichas
  node prospecting/cli.mjs <db> analyze <id|all>           Revisa la web de una ficha o de todas las pendientes
  node prospecting/cli.mjs <db> ranking                    Fichas por llamar, de mejor a peor candidata
  node prospecting/cli.mjs <db> report <id>                Mejoras y guion de llamada de una ficha
  node prospecting/cli.mjs <db> status <id> <qualified|rejected|suppressed> <tu-nombre>
  node prospecting/cli.mjs <db> purge                      Borra los datos que han superado el plazo de su fuente

GOOGLE_MAPS_API_KEY es necesaria para discover; con ella, la velocidad se mide también con PageSpeed (móvil).`;

const googleKey = process.env.GOOGLE_MAPS_API_KEY || null;
const describe = (result) => {
  const site = result.url ?? 'sin web';
  if (result.blocked) return `${site}: no permite la revisión automática (robots.txt o acceso denegado)`;
  const { score: points, problems } = score(result.signals);
  return `${site}: ${points}/10 · ${problems.map(key => PROBLEMS[key].reason).join(', ') || 'sin problemas claros'}`;
};

async function analyze(crm, target) {
  const ids = target === 'all'
    ? crm.list().filter(lead => lead.status !== 'suppressed' && lead.status !== 'rejected').map(lead => lead.id)
    : [Number(target)];
  for (const id of ids) {
    const lead = crm.lead(id);
    if (!lead) throw new Error(`No existe la ficha ${target}`);
    const result = lead.website ? await analyzeSite(lead.website, { pageSpeedKey: googleKey }) : { url: null, signals: { website: false } };
    crm.saveAnalysis(id, result, result.blocked ? null : score(result.signals));
    console.log(`#${id} ${lead.name}: ${describe(result)}`);
    // Pausa entre webs para no cargar a nadie ni a la red.
    if (ids.length > 1) await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

const argv = process.argv.slice(2);
const commands = ['source', 'import', 'discover', 'list', 'analyze', 'ranking', 'report', 'status', 'purge'];
let crm;
try {
  if (argv[0] === 'check' && argv[1]) {
    console.log(describe(await analyzeSite(argv[1], { pageSpeedKey: googleKey })));
  } else if (argv[0] && commands.includes(argv[1])) {
    const [database, command, ...args] = argv;
    crm = new CRM(database);
    // Lo que una fuente no permite conservar se borra antes de cualquier otra cosa.
    if (command !== 'purge') {
      const { observations, leads, anonymized } = crm.purge();
      if (observations || leads || anonymized) console.error(`Borrado por plazo de conservación: ${observations} referencias, ${leads} fichas y ${anonymized} excluidas anonimizadas.`);
    }
    if (command === 'source') crm.registerSource(JSON.parse(readFileSync(args[0], 'utf8')));
    if (command === 'import') console.log(`Fichas: ${crm.importBatch(args[0], JSON.parse(readFileSync(args[1], 'utf8'))).join(', ')}`);
    if (command === 'discover') {
      const [source, query, sector] = args;
      if (!source || !query || !sector) throw new Error('Uso: discover <fuente> "<búsqueda>" <health_clinic|aesthetic_clinic>');
      const places = await searchPlaces(query, { key: googleKey });
      const { records, skipped } = toRecords(places, { sector, observedAt: new Date().toISOString() });
      const ids = records.length ? crm.importBatch(source, records) : [];
      console.log(`Encontradas ${places.length}, importadas ${ids.length} (${records.filter(r => !r.website).length} sin web), descartadas ${skipped.length}.`);
      for (const item of skipped) console.log(`  - ${item.name}: ${item.reason}`);
    }
    if (command === 'purge') {
      const { observations, leads, anonymized } = crm.purge();
      console.log(`Borradas ${observations} referencias caducadas y ${leads} fichas; ${anonymized} excluidas anonimizadas.`);
    }
    if (command === 'list') console.log(JSON.stringify(crm.list(), null, 2));
    if (command === 'analyze') await analyze(crm, args[0]);
    if (command === 'ranking') for (const row of crm.ranking()) console.log(`#${row.id}\t${row.score ?? '-'}/10\t${row.status}\t${row.name} (${row.municipality})`);
    if (command === 'report') {
      const lead = crm.lead(Number(args[0]));
      if (!lead) throw new Error(`No existe la ficha ${args[0]}`);
      console.log(report(lead, crm.latestAnalysis(lead.id)));
    }
    if (command === 'status') crm.setStatus(Number(args[0]), args[1], args[2]);
  } else {
    console.error(USAGE);
    process.exitCode = 1;
  }
} catch (error) {
  console.error(`No se ha podido completar: ${error.message}`);
  process.exitCode = 1;
} finally {
  crm?.close();
}
