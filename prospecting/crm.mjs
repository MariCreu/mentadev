// Base local: sin credenciales, sin envío de mensajes y sin nada que importe la web pública.
// La única red la usa analyzer.mjs para revisar la portada de cada clínica.
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
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
  website: 'boolean', reachable: 'boolean', https: 'boolean', viewport: 'boolean', title: 'boolean', description: 'boolean',
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
// Versión del esquema (PRAGMA user_version). Si cambia schema.sql, subirla y añadir el paso en migrate().
const SCHEMA_VERSION = 2;
// Huella de una ficha excluida: permite reconocerla al reimportarla sin guardar su nombre ni su municipio.
const fingerprint = identity => 'sha256:' + createHash('sha256').update(identity).digest('hex');
function normalized(value) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export class CRM {
  constructor(path = ':memory:', clock = () => new Date().toISOString()) {
    this.clock = clock;
    this.db = new DatabaseSync(path);
    this.migrate();
  }
  // Crea la base o la pone al día sin perder datos. Versión 1 (primera fase): sin plazo por fuente,
  // con la web obligatoria y sin revisiones; se detecta porque ya tiene tablas y user_version = 0.
  migrate() {
    const { user_version: version } = this.db.prepare('PRAGMA user_version').get();
    if (version > SCHEMA_VERSION) throw new Error('La base es de una versión más nueva del CRM');
    if (version === SCHEMA_VERSION) { this.db.exec('PRAGMA foreign_keys = ON'); return; }
    const v1 = version === 0 && Boolean(this.db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='sources'").get());
    this.db.exec('PRAGMA foreign_keys = OFF');
    this.db.exec('BEGIN IMMEDIATE');
    try {
      if (v1) {
        this.db.exec(`ALTER TABLE sources ADD COLUMN max_age_days INTEGER CHECK(max_age_days IS NULL OR max_age_days > 0);
          CREATE TABLE leads_v2 (
            id INTEGER PRIMARY KEY,
            identity TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            municipality TEXT NOT NULL,
            province TEXT NOT NULL CHECK(province = '03'),
            sector TEXT NOT NULL CHECK(sector IN ('health_clinic','aesthetic_clinic')),
            website TEXT,
            status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','qualified','rejected','suppressed')),
            created_at TEXT NOT NULL
          );
          INSERT INTO leads_v2 SELECT id, identity, name, municipality, province, sector, website, status, created_at FROM leads;
          DROP TABLE leads;
          ALTER TABLE leads_v2 RENAME TO leads;`);
      }
      this.db.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
      if (this.db.prepare('PRAGMA foreign_key_check').all().length) throw new Error('Referencias rotas al actualizar la base');
      this.db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
      this.db.exec('COMMIT');
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
    finally { this.db.exec('PRAGMA foreign_keys = ON'); }
  }
  close() { this.db.close(); }
  // Lo rellena a mano quien opera el CRM, nunca a partir de los datos importados.
  registerSource(source) {
    const values = [text(source.id), url(source.url).href, text(source.permissionRef, 1000), text(source.reviewedBy), date(source.expiresAt)];
    if (typeof source.enabled !== 'boolean') throw new Error('Falta "enabled": true o false');
    // Días que se pueden conservar los datos de esta fuente (p. ej. 30 para Google Places). Sin valor, sin límite.
    const maxAge = source.maxAgeDays ?? null;
    if (maxAge !== null && !(Number.isInteger(maxAge) && maxAge > 0)) throw new Error('"maxAgeDays" debe ser un número entero de días');
    this.db.prepare(`INSERT INTO sources(id,url,permission_ref,reviewed_by,expires_at,enabled,max_age_days) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET url=excluded.url, permission_ref=excluded.permission_ref,
      reviewed_by=excluded.reviewed_by, expires_at=excluded.expires_at, enabled=excluded.enabled, max_age_days=excluded.max_age_days`).run(...values, Number(source.enabled), maxAge);
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
        // Sin web es un dato válido: son las mejores candidatas.
        const website = record.website == null ? null : url(record.website, ['https:', 'http:']);
        if (website) { website.search = ''; website.hash = ''; }
        const observed = date(record.observedAt);
        if (observed > now) throw new Error('La fecha de observación es futura');
        const recordId = text(record.sourceRecordId);
        // Coincidencia prudente: las sedes de una cadena en municipios distintos son fichas distintas.
        const identity = JSON.stringify([normalized(name), normalized(municipality)]), hidden = fingerprint(identity);
        const prior = this.db.prepare('SELECT l.* FROM observations o JOIN leads l ON l.id=o.lead_id WHERE o.source_id=? AND o.source_record_id=?').get(sourceId, recordId);
        if (prior && prior.identity !== identity && prior.identity !== hidden) throw new Error('Ese ID de la fuente ya era otra clínica: revísalo a mano');
        // Una excluida ya anonimizada se reconoce por su huella y no recupera nombre ni web.
        let lead = this.db.prepare('SELECT id FROM leads WHERE identity=?').get(hidden);
        if (!lead) {
          this.db.prepare('INSERT INTO leads(identity,name,municipality,province,sector,website,created_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(identity) DO NOTHING').run(identity,name,municipality,'03',record.sector,website?.href ?? null,now);
          lead = this.db.prepare('SELECT id FROM leads WHERE identity=?').get(identity);
        }
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
      id, date(this.clock()), result.url == null ? null : url(result.url, ['https:', 'http:']).href, Number(blocked),
      blocked ? null : outcome.score, JSON.stringify(blocked ? [] : outcome.problems), blocked ? '{}' : signals(result.signals));
  }
  latestAnalysis(id) {
    const row = this.db.prepare('SELECT * FROM analyses WHERE lead_id=? ORDER BY analyzed_at DESC, id DESC LIMIT 1').get(id);
    return row && { ...row, blocked: row.blocked === 1, problems: JSON.parse(row.problems), signals: JSON.parse(row.signals) };
  }
  // Borra lo que una fuente con plazo (maxAgeDays) no permite conservar: observaciones caducadas y las
  // fichas que se quedan sin ninguna. Las excluidas se mantienen para respetar que no quieren contacto, pero
  // sin los datos caducados: solo su huella (para reconocerlas) y su estado; se borran nombre, municipio, web y revisiones.
  purge() {
    const now = Date.parse(date(this.clock()));
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const stale = this.db.prepare('SELECT o.lead_id, o.source_id, o.source_record_id, o.observed_at, s.max_age_days FROM observations o JOIN sources s ON s.id=o.source_id WHERE s.max_age_days IS NOT NULL').all()
        .filter(row => now - Date.parse(row.observed_at) > row.max_age_days * 86_400_000);
      const remove = this.db.prepare('DELETE FROM observations WHERE source_id=? AND source_record_id=?');
      for (const row of stale) remove.run(row.source_id, row.source_record_id);
      const hide = this.db.prepare("UPDATE leads SET identity=?, name='Clínica excluida', municipality='-', website=NULL WHERE id=?");
      const forget = this.db.prepare('DELETE FROM analyses WHERE lead_id=?');
      let anonymized = 0;
      for (const id of new Set(stale.map(row => row.lead_id))) {
        const lead = this.db.prepare('SELECT identity, status FROM leads WHERE id=?').get(id);
        if (lead?.status !== 'suppressed' || lead.identity.startsWith('sha256:')) continue;
        hide.run(fingerprint(lead.identity), id);
        forget.run(id);
        anonymized++;
      }
      const leads = this.db.prepare("DELETE FROM leads WHERE status <> 'suppressed' AND id NOT IN (SELECT lead_id FROM observations)").run().changes;
      this.db.exec('COMMIT');
      return { observations: stale.length, leads, anonymized };
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
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
