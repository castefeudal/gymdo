import {readFile,writeFile} from 'node:fs/promises';
const raw=JSON.parse(await readFile('data/exercises-compact.json','utf8'));
const catalog={...raw,x:raw.x.map(row=>row.slice(0,9))};
const details=Object.fromEntries(raw.x.map(row=>[row[0],[row[9]||[],row[10]||[]]]));
await writeFile('data/exercise-catalog.json',JSON.stringify(catalog)+'\n');
await writeFile('data/exercise-details.json',JSON.stringify(details)+'\n');
console.log(`Exercise catalog split: ${catalog.x.length} unchanged records; instructions load on exercise/Run open.`);
