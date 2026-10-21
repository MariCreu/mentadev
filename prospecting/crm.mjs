// Local-only foundation. No network, credentials, messaging or website imports.
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';

function text(value, max = 200) {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\x00-\x1f]/.test(value)) throw new Error('Invalid text');
  return value.trim();
}
function date(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T.*Z$/.test(value) || !Number.isFinite(Date.parse(value))) throw new Error('Invalid UTC timestamp');
  return new Date(value).toISOString();
}
function url(value) {
  const parsed = new URL(text(value, 1000));
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error('HTTPS URL required');
  return parsed;
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
  // This registry is operator-managed, never populated from imported lead data.
  registerSource(source) {
    const values = [text(source.id), url(source.url).href, text(source.permissionRef, 1000), text(source.reviewedBy), date(source.expiresAt)];
    if (typeof source.enabled !== 'boolean') throw new Error('Explicit enabled flag required');
    this.db.prepare(`INSERT INTO sources VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET url=excluded.url, permission_ref=excluded.permission_ref,
      reviewed_by=excluded.reviewed_by, expires_at=excluded.expires_at, enabled=excluded.enabled`).run(...values, Number(source.enabled));
  }
  importBatch(sourceId, records) {
    const now = date(this.clock());
    const source = this.db.prepare('SELECT * FROM sources WHERE id=?').get(sourceId);
    if (!source || !source.enabled || source.expires_at <= now) throw new Error('Source not authorized');
    if (!Array.isArray(records) || records.length > 100) throw new Error('Batch limit: 100');
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const ids = records.map(record => {
        const allowed = ['name','municipality','province','sector','website','sourceRecordId','observedAt'];
        if (!record || Object.keys(record).some(key => !allowed.includes(key))) throw new Error('Unsupported fields');
        const name = text(record.name), municipality = text(record.municipality);
        if (record.province !== '03' || !['health_clinic','aesthetic_clinic'].includes(record.sector)) throw new Error('Outside Alicante clinic scope');
        const website = url(record.website);
        website.search = ''; website.hash = '';
        const observed = date(record.observedAt);
        if (observed > now) throw new Error('Future observation');
        const recordId = text(record.sourceRecordId);
        // Conservative entity match: a chain's clinics in different towns remain separate.
        const identity = JSON.stringify([normalized(name), normalized(municipality)]);
        const prior = this.db.prepare('SELECT l.* FROM observations o JOIN leads l ON l.id=o.lead_id WHERE o.source_id=? AND o.source_record_id=?').get(sourceId, recordId);
        if (prior && prior.identity !== identity) throw new Error('Source record identity changed; manual review required');
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
  setStatus(id, status, actor) {
    actor = text(actor);
    if (!['qualified','rejected','suppressed'].includes(status)) throw new Error('Invalid status');
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const lead = this.db.prepare('SELECT status FROM leads WHERE id=?').get(id);
      if (!lead || lead.status === 'suppressed') throw new Error('Missing or suppressed lead');
      this.db.prepare('UPDATE leads SET status=? WHERE id=?').run(status,id);
      this.db.prepare('INSERT INTO activities(lead_id,actor,status,created_at) VALUES(?,?,?,?)').run(id,actor,status,date(this.clock()));
      this.db.exec('COMMIT');
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
}
