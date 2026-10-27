import { readFile, readdir } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

const budgets = [
  { file: 'app.js', raw: 446_000, gzip: 127_000 },
  // The richer icon treatment and grouped navigation add a small amount of
  // source output; the gzip limits remain the user-facing transfer guard.
  { file: 'app.css', raw: 278_000, gzip: 50_000 },
  { file: 'ui.html', raw: 124_000, gzip: 28_000 },
  { file: 'index.html', raw: 10_000, gzip: 4_000 },
  // Allow the optional, dynamically loaded CKD-EPI clinical calculator while
  // keeping the separately enforced initial and complete-boot budgets intact.
  { directory: 'assets/runtime', label: 'production JS (all chunks including food/PDF review)', raw: 527_000, gzip: 176_000 },
  { file: 'gym-tools.js', raw: 52_000, gzip: 16_000 },
];

async function listCssFiles(directory) {
  const entries = await readdir(new URL(`../${directory}/`, import.meta.url), { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const child = `${directory}/${entry.name}`;
    if (entry.isDirectory()) return listCssFiles(child);
    return entry.isFile() && /\.(css|js)$/.test(entry.name) ? [child] : [];
  }));
  return nested.flat();
}

let failed = false;
const metrics=JSON.parse(await readFile(new URL('../assets/runtime-metrics.json',import.meta.url),'utf8'));
const initial=metrics.initialBytes<=480_000;
console.log(`${initial?'PASS':'FAIL'} initial static JS graph: ${metrics.initialBytes}/480000 B; optional food/report views remain lazy`);
if(!initial)failed=true;
const boot=Number.isFinite(metrics.bootBytes)&&metrics.bootBytes<=482_000;
console.log(`${boot?'PASS':'FAIL'} complete boot JS graph: ${metrics.bootBytes}/482000 B`);
if(!boot)failed=true;
for (const budget of budgets) {
  const label = budget.label || budget.file;
  const files = budget.directory ? await listCssFiles(budget.directory) : [budget.file];
  const buffers = await Promise.all(files.map(async (file) => {
    const bytes = await readFile(new URL(`../${file}`, import.meta.url));
    // The source bundle is checked out with CRLF on Windows and LF on CI. Count its
    // canonical text form so this source-only guard does not vary by checkout OS.
    return file === 'app.js' ? Buffer.from(bytes.toString('utf8').replace(/\r\n/g, '\n')) : bytes;
  }));
  const bytes = Buffer.concat(buffers);
  const raw = bytes.byteLength;
  const compressed = gzipSync(bytes, { level: 9 }).byteLength;
  const withinBudget = raw <= budget.raw && compressed <= budget.gzip;
  console.log(`${withinBudget ? 'PASS' : 'FAIL'} ${label}: ${raw}/${budget.raw} B raw, ${compressed}/${budget.gzip} B gzip`);
  if (!withinBudget) failed = true;
}

if (failed) process.exitCode = 1;
