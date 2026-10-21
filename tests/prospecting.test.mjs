import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CRM } from '../prospecting/crm.mjs';

const now = '2026-10-21T10:00:00.000Z';
const source = { id: 'manual', url: 'https://example.com/dataset', permissionRef: 'Written permission fixture', reviewedBy: 'operator', expiresAt: '2026-11-01T00:00:00Z', enabled: true };
const record = { name: 'Clínica Ejemplo', municipality: 'Alacant', province: '03', sector: 'health_clinic', website: 'https://example.com/?tracking=1', sourceRecordId: '1', observedAt: now };
function fixture(t) {
  const crm = new CRM(':memory:', () => now);
  t.after(() => crm.close());
  crm.registerSource(source);
  return crm;
}
test('source authorization fails closed and expires', t => {
  const crm = fixture(t);
  assert.throws(() => crm.importBatch('unknown', [record]));
  for (const change of [{enabled:false}, {expiresAt:'2026-10-20T00:00:00Z'}]) {
    crm.registerSource({...source,...change});
    assert.throws(() => crm.importBatch('manual',[record]));
  }
  assert.throws(() => crm.registerSource({...source,permissionRef:''}));
});
test('deduplication preserves provenance, town boundaries and suppression', t => {
  const crm = fixture(t);
  const [id] = crm.importBatch('manual',[record]);
  crm.setStatus(id,'suppressed','operator');
  assert.deepEqual(crm.importBatch('manual',[{...record,name:' clinica ejemplo '}]),[id]);
  crm.registerSource({...source,id:'second'});
  assert.deepEqual(crm.importBatch('second',[record]),[id]);
  assert.equal(crm.db.prepare('SELECT count(*) AS n FROM observations').get().n,2);
  crm.importBatch('manual',[{...record,municipality:'Elche',sourceRecordId:'2'}]);
  assert.equal(crm.list().length,2);
  assert.equal(crm.list()[0].status,'suppressed');
  assert.equal(crm.list()[0].website,'https://example.com/');
  assert.throws(() => crm.setStatus(id,'qualified','operator'));
  assert.throws(() => crm.importBatch('manual',[{...record,name:'Different clinic'}]));
});
test('invalid batch rolls back all rows, restricts fields and scope', t => {
  const crm = fixture(t);
  for (const invalid of [{province:'46'}, {sector:'restaurant'}, {email:'private@example.com'}, {website:'javascript:alert(1)'}, {observedAt:'tomorrow'}, {observedAt:'2099-01-01T00:00:00Z'}]) {
    assert.throws(() => crm.importBatch('manual',[record,{...record,sourceRecordId:'2',...invalid}]));
    assert.equal(crm.list().length,0);
  }
  assert.throws(() => crm.importBatch('manual',Array(101).fill(record)));
});
test('CRM status writes audit record atomically', t => {
  const crm = fixture(t), [id] = crm.importBatch('manual',[record]);
  assert.throws(() => crm.setStatus(id,'qualified',''));
  assert.throws(() => crm.setStatus(id,'contacted','operator'));
  assert.throws(() => crm.setStatus(999,'qualified','operator'));
  crm.setStatus(id,'qualified','operator');
  assert.equal(crm.list()[0].status,'qualified');
  assert.equal(crm.db.prepare('SELECT actor FROM activities').get().actor,'operator');
});
test('database persists across reopen', t => {
  const directory = mkdtempSync(join(tmpdir(),'mentadev-crm-'));
  let second;
  t.after(() => { second?.close(); rmSync(directory,{recursive:true,force:true}); });
  const path = join(directory,'test.sqlite');
  const first = new CRM(path,() => now);
  first.registerSource(source); first.importBatch('manual',[record]); first.close();
  second = new CRM(path,() => now);
  assert.equal(second.list().length,1);
});
test('CRM code and private data are excluded from static assets', () => {
  const ignore = readFileSync(new URL('../.assetsignore',import.meta.url),'utf8').split(/\r?\n/);
  for (const entry of ['prospecting/**','private-data/**','.github/**']) assert.ok(ignore.includes(entry));
});
