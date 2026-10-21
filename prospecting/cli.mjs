import { readFileSync } from 'node:fs';
import { CRM } from './crm.mjs';

const [database, command, ...args] = process.argv.slice(2);
if (!database || !['source','import','list','status'].includes(command)) {
  console.error('Usage: node prospecting/cli.mjs <private-db> source <json> | import <source-id> <json> | list | status <id> <qualified|rejected|suppressed> <actor>');
  process.exitCode = 1;
} else {
  let crm;
  try {
    crm = new CRM(database);
    if (command === 'source') crm.registerSource(JSON.parse(readFileSync(args[0], 'utf8')));
    if (command === 'import') console.log(JSON.stringify(crm.importBatch(args[0], JSON.parse(readFileSync(args[1], 'utf8')))));
    if (command === 'list') console.log(JSON.stringify(crm.list(), null, 2));
    if (command === 'status') crm.setStatus(Number(args[0]), args[1], args[2]);
  } catch { console.error('Operation failed; check input, source authorization and database path.'); process.exitCode = 1; }
  finally { crm?.close(); }
}
