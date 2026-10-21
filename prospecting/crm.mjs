// Base local: sin credenciales, sin envío de mensajes y sin nada que importe la web pública.
// La única red la usa analyzer.mjs para revisar la portada de cada clínica.
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { PROBLEMS } from './analyzer.mjs';

function text(value, max = 200) {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\x00-\x1f]/.test(value)) throw new Error('Texto vacío, demasiado largo o con caracteres no válidos');
  return value.trim();
}
function date(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T.*Z$/.test(value) || !Number.isFinite(Date.parse(value))) throw new Error('Fecha no válida: usa formato UTC, p. ej. 2026-10-21T09:00:00Z');
  return new Date(value).toISOString();
}
// Las webs de clínicas pueden ser http (justo las que más necesitan ayuda); las fuentes, solo https.
function url(value, protocols = ['https:']) {
  let parsed;
  try { parsed = new URL(text(value, 1000)); } catch { throw new Error('Dirección web no válida'); }
  if (!protocols.includes(parsed.protocol) || parsed.username || parsed.password) throw new Error(`La dirección debe empezar por ${protocols.map(p => p.replace(':', '://')).join(' o ')}`);
  return parsed;
}
// Solo se guardan estas señales: sí/no, números y el nombre del gestor de contenidos.
const SIGNALS = {
  reachable: 'boolean', https: 'boolean', viewport: 'boolean', title: 'boolean', description: 'boolean',
  booking: 'boolean', form: 'boolean', whatsapp: 'boolean', legal: 'boolean',
  copyrightYear: 'number', generator: 'string', ms: 'number', kb: 'number', pageSpeed: 'number',
};
function signals(value) {
  if (!value || typeof value !== 'object') throw new Error('Revisión sin señales');
  for (const [key, item] of Object.entries(value)) {
    if (!SIGNALS[key] || (item !== null && typeof item !== SIGNALS[key])) throw new Error(`Señal no admitida: ${key}`);
    if (typeof item === 'string' && item.length > 60) throw new Error(`Señal demasiado larga: ${key}`);
  }
  return JSON.stringify(value);
}
function normalized(value) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export class CRM {
  constructor(path = ':memory:', clock = () => new Date().toISOString()) {
    this.clock = clock;
    this.db = new DatabaseSync(path);
    this.db.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
  }
  close() { this.db.close(); }
  // Lo rellena a mano quien opera el CRM, nunca a partir de los datos importados.
  registerSource(source) {
    const values = [text(source.id), url(source.url).href, text(source.permissionRef, 1000), text(source.reviewedBy), date(source.expiresAt)];
    if (typeof source.enabled !== 'boolean') throw new Error('Falta "enabled": true o false');
    this.db.prepare(`INSERT INTO sources VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET url=excluded.url, permission_ref=excluded.permission_ref,
      reviewed_by=excluded.reviewed_by, expires_at=excluded.expires_at, enabled=excluded.enabled`).run(...values, Number(source.enabled));
  }
  importBatch(sourceId, records) {
    const now = date(this.clock());
    const source = this.db.prepare('SELECT * FROM sources WHERE id=?').get(sourceId);
    if (!source || !source.enabled || source.expires_at <= now) throw new Error('Fuente no autorizada, desactivada o caducada');
    if (!Array.isArray(records) || records.length > 100) throw new Error('Máximo 100 registros por lote');
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const ids = records.map(record => {
        const allowed = ['name','municipality','province','sector','website','sourceRecordId','observedAt'];
        if (!record || Object.keys(record).some(key => !allowed.includes(key))) throw new Error('El lote trae campos no admitidos');
        const name = text(record.name), municipality = text(record.municipality);
        if (record.province !== '03' || !['health_clinic','aesthetic_clinic'].includes(record.sector)) throw new Error('Fuera de alcance: solo clínicas de la provincia de Alicante (03)');
        const website = url(record.website, ['https:', 'http:']);
        website.search = ''; website.hash = '';
        const observed = date(record.observedAt);
        if (observed > now) throw new Error('La fecha de observación es futura');
        const recordId = text(record.sourceRecordId);
        // Coincidencia prudente: las sedes de una cadena en municipios distintos son fichas distintas.
        const identity = JSON.stringify([normalized(name), normalized(municipality)]);
        const prior = this.db.prepare('SELECT l.* FROM observations o JOIN leads l ON l.id=o.lead_id WHERE o.source_id=? AND o.source_record_id=?').get(sourceId, recordId);
        if (prior && prior.identity !== identity) throw new Error('Ese ID de la fuente ya era otra clínica: revísalo a mano');
        this.db.prepare('INSERT INTO leads(identity,name,municipality,province,sector,website,created_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(identity) DO NOTHING').run(identity,name,municipality,'03',record.sector,website.href,now);
        const lead = this.db.prepare('SELECT id FROM leads WHERE identity=?').get(identity);
        this.db.prepare('INSERT INTO observations VALUES(?,?,?,?) ON CONFLICT(source_id,source_record_id) DO UPDATE SET observed_at=max(observed_at,excluded.observed_at)').run(lead.id,sourceId,recordId,observed);
        return lead.id;
      });
      this.db.exec('COMMIT');
      return ids;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  list() { return this.db.prepare('SELECT * FROM leads ORDER BY id').all(); }
  lead(id) { return this.db.prepare('SELECT * FROM leads WHERE id=?').get(id); }
  saveAnalysis(id, result, outcome) {
    const lead = this.lead(id);
    if (!lead || lead.status === 'suppressed') throw new Error('La ficha no existe o está excluida');
    const blocked = result.blocked === true;
    if (!blocked && (!Number.isInteger(outcome?.score) || !outcome.problems.every(key => PROBLEMS[key]))) throw new Error('Puntuación no válida');
    this.db.prepare('INSERT INTO analyses(lead_id,analyzed_at,final_url,blocked,score,problems,signals) VALUES(?,?,?,?,?,?,?)').run(
      id, date(this.clock()), url(result.url, ['https:', 'http:']).href, Number(blocked),
      blocked ? null : outcome.score, JSON.stringify(blocked ? [] : outcome.problems), blocked ? '{}' : signals(result.signals));
  }
  latestAnalysis(id) {
    const row = this.db.prepare('SELECT * FROM analyses WHERE lead_id=? ORDER BY analyzed_at DESC, id DESC LIMIT 1').get(id);
    return row && { ...row, blocked: row.blocked === 1, problems: JSON.parse(row.problems), signals: JSON.parse(row.signals) };
  }
  // Fichas por llamar, de mejor a peor candidata. Las descartadas y excluidas no salen.
  ranking() {
    return this.db.prepare(`SELECT l.id, l.name, l.municipality, l.status, a.score, a.analyzed_at FROM leads l
      LEFT JOIN analyses a ON a.id = (SELECT id FROM analyses WHERE lead_id=l.id ORDER BY analyzed_at DESC, id DESC LIMIT 1)
      WHERE l.status IN ('new','qualified') ORDER BY a.score IS NULL, a.score DESC, l.id`).all();
  }
  setStatus(id, status, actor) {
    actor = text(actor);
    if (!['qualified','rejected','suppressed'].includes(status)) throw new Error('Estado no válido: qualified, rejected o suppressed');
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const lead = this.db.prepare('SELECT status FROM leads WHERE id=?').get(id);
      if (!lead || lead.status === 'suppressed') throw new Error('La ficha no existe o está excluida');
      this.db.prepare('UPDATE leads SET status=? WHERE id=?').run(status,id);
      this.db.prepare('INSERT INTO activities(lead_id,actor,status,created_at) VALUES(?,?,?,?)').run(id,actor,status,date(this.clock()));
      this.db.exec('COMMIT');
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
}
